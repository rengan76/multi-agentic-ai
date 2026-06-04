import { v4 as uuid } from 'uuid';
import {
  AgentRole, AgentContract, WorkflowDefinition, WorkflowExecution, WorkflowStatus,
  StepExecution, StepStatus, ExecutionContext, LLMCallRecord,
} from '../types';
import { AGENT_CONTRACTS, GATE_DEFINITIONS } from '../agents/registry';
import { gateEngine } from '../gates/gate-engine';
import { llmService } from '../llm';
import { eventBus } from '../events/event-bus';
import { logger } from '../utils/logger';

// ============================================================
// Workflow Orchestrator
// State machine that drives agents through the pipeline
// Handles: sequencing, gate validation, retries, context passing
// ============================================================

export class WorkflowOrchestrator {
  private executions: Map<string, WorkflowExecution> = new Map();

  async execute(workflow: WorkflowDefinition, input: Record<string, unknown>): Promise<WorkflowExecution> {
    const execution = this.createExecution(workflow, input);
    this.executions.set(execution.id, execution);

    this.updateStatus(execution, WorkflowStatus.RUNNING);
    eventBus.emit('workflow:started', { executionId: execution.id, workflowId: workflow.id });

    try {
      for (const step of workflow.steps) {
        // Check dependencies are met
        const depsReady = step.dependsOn.every(depId => {
          const depExec = execution.steps[depId];
          return depExec && depExec.status === StepStatus.PASSED;
        });

        if (!depsReady) {
          logger.warn({ stepId: step.id, deps: step.dependsOn }, 'Dependencies not met, skipping step');
          execution.steps[step.id].status = StepStatus.SKIPPED;
          continue;
        }

        execution.currentStep = step.id;
        await this.executeStep(execution, step.id, workflow);
      }

      this.updateStatus(execution, WorkflowStatus.COMPLETED);
      execution.completedAt = new Date();
      eventBus.emit('workflow:completed', {
        executionId: execution.id,
        duration: execution.completedAt.getTime() - execution.startedAt.getTime(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      execution.error = message;
      this.updateStatus(execution, WorkflowStatus.FAILED);
      eventBus.emit('workflow:failed', { executionId: execution.id, error: message });
    }

    return execution;
  }

  private async executeStep(
    execution: WorkflowExecution,
    stepId: string,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in workflow`);

    const stepExec = execution.steps[stepId];
    const contract = AGENT_CONTRACTS[step.agent];
    const maxRetries = step.config.retries;

    this.updateStepStatus(execution, stepId, StepStatus.IN_PROGRESS);
    eventBus.emit('step:started', { executionId: execution.id, stepId, agent: step.agent });
    stepExec.startedAt = new Date();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      stepExec.attempts = attempt;

      try {
        // Build prompt with context from previous steps
        const prompt = this.buildPrompt(execution, step.agent, contract);

        // Call LLM
        eventBus.emit('llm:request', { executionId: execution.id, agent: step.agent, model: 'configured' });
        const startTime = Date.now();

        const response = await llmService.complete({
          systemPrompt: contract.systemPrompt,
          userPrompt: prompt,
          temperature: contract.temperature,
          maxTokens: 4000,
          responseFormat: 'json',
        });

        // Record LLM call
        const callRecord: LLMCallRecord = {
          id: uuid(),
          provider: llmService.getActiveProvider(),
          model: response.model,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          durationMs: response.durationMs,
          timestamp: new Date(),
        };
        stepExec.llmCalls.push(callRecord);
        eventBus.emit('llm:response', {
          executionId: execution.id,
          agent: step.agent,
          tokens: response.usage.totalTokens,
          durationMs: response.durationMs,
        });

        // Parse output
        const output = JSON.parse(response.content);
        stepExec.output = output;

        // Run gate validation
        const gateId = step.gate;
        const gateDef = workflow.gates[gateId] || GATE_DEFINITIONS[gateId];

        if (gateDef) {
          eventBus.emit('gate:evaluating', { executionId: execution.id, gateId });
          const gateResult = gateEngine.evaluate(gateDef, output);
          stepExec.gateResult = gateResult;

          if (!gateResult.passed) {
            eventBus.emit('gate:failed', { executionId: execution.id, gateId, result: gateResult });

            if (attempt <= maxRetries) {
              eventBus.emit('step:retrying', { executionId: execution.id, stepId, attempt, maxRetries });
              logger.info({ stepId, attempt, violations: gateResult.violations }, 'Gate failed, retrying');
              await this.delay(step.config.retryDelay);
              continue;
            }

            throw new Error(`Gate ${gateId} failed after ${attempt} attempts: ${gateResult.violations.map(v => v.message).join(', ')}`);
          }

          eventBus.emit('gate:passed', { executionId: execution.id, gateId, result: gateResult });
        }

        // Store artifacts in context for next agents
        execution.context.artifacts[step.agent] = output;
        execution.context.history.push({
          timestamp: new Date(),
          agent: step.agent,
          action: `Completed step: ${stepId}`,
          summary: `Produced output with ${Object.keys(output).length} fields`,
        });

        stepExec.completedAt = new Date();
        this.updateStepStatus(execution, stepId, StepStatus.PASSED);
        eventBus.emit('step:completed', { executionId: execution.id, stepId, output });
        return;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt <= maxRetries) {
          eventBus.emit('step:retrying', { executionId: execution.id, stepId, attempt, maxRetries });
          await this.delay(step.config.retryDelay);
        }
      }
    }

    // All retries exhausted
    stepExec.error = lastError?.message || 'Unknown error';
    this.updateStepStatus(execution, stepId, StepStatus.FAILED);
    eventBus.emit('step:failed', {
      executionId: execution.id,
      stepId,
      error: lastError?.message || 'Unknown error',
      attempt: stepExec.attempts,
    });
    throw lastError || new Error(`Step ${stepId} failed`);
  }

  private buildPrompt(execution: WorkflowExecution, agent: AgentRole, contract: AgentContract): string {
    const context = execution.context;
    const parts: string[] = [];

    parts.push(`Feature: ${context.featureName}`);
    parts.push('');

    // Include relevant context from previous agents
    if (agent === AgentRole.ARCHITECT && context.artifacts[AgentRole.PRODUCT_MANAGER]) {
      parts.push('REQUIREMENTS FROM PRODUCT MANAGER:');
      parts.push(JSON.stringify(context.artifacts[AgentRole.PRODUCT_MANAGER], null, 2));
    }

    if (agent === AgentRole.BACKEND_DEVELOPER) {
      if (context.artifacts[AgentRole.PRODUCT_MANAGER]) {
        parts.push('REQUIREMENTS:');
        parts.push(JSON.stringify(context.artifacts[AgentRole.PRODUCT_MANAGER], null, 2));
      }
      if (context.artifacts[AgentRole.ARCHITECT]) {
        parts.push('\nARCHITECTURE DESIGN:');
        parts.push(JSON.stringify(context.artifacts[AgentRole.ARCHITECT], null, 2));
      }
    }

    if (agent === AgentRole.QA_ENGINEER) {
      if (context.artifacts[AgentRole.PRODUCT_MANAGER]) {
        parts.push('ACCEPTANCE CRITERIA:');
        const pm = context.artifacts[AgentRole.PRODUCT_MANAGER] as Record<string, unknown>;
        parts.push(JSON.stringify(pm.stories || pm, null, 2));
      }
      if (context.artifacts[AgentRole.ARCHITECT]) {
        parts.push('\nAPI DESIGN:');
        const arch = context.artifacts[AgentRole.ARCHITECT] as Record<string, unknown>;
        parts.push(JSON.stringify(arch.endpoints || arch, null, 2));
      }
      if (context.artifacts[AgentRole.BACKEND_DEVELOPER]) {
        parts.push('\nIMPLEMENTATION:');
        parts.push(JSON.stringify(context.artifacts[AgentRole.BACKEND_DEVELOPER], null, 2));
      }
    }

    if (agent === AgentRole.CODE_REVIEWER && context.artifacts[AgentRole.BACKEND_DEVELOPER]) {
      parts.push('CODE TO REVIEW:');
      parts.push(JSON.stringify(context.artifacts[AgentRole.BACKEND_DEVELOPER], null, 2));
    }

    parts.push('\nProduce your output as valid JSON following your role specification.');

    return parts.join('\n');
  }

  private createExecution(workflow: WorkflowDefinition, input: Record<string, unknown>): WorkflowExecution {
    const executionId = uuid();
    const steps: Record<string, StepExecution> = {};

    for (const step of workflow.steps) {
      steps[step.id] = {
        stepId: step.id,
        status: StepStatus.PENDING,
        agent: step.agent,
        input: {},
        output: null,
        gateResult: null,
        attempts: 0,
        startedAt: null,
        completedAt: null,
        llmCalls: [],
        error: null,
      };
    }

    return {
      id: executionId,
      workflowId: workflow.id,
      status: WorkflowStatus.IDLE,
      currentStep: null,
      input,
      context: {
        featureName: (input.featureName as string) || 'unknown',
        artifacts: {},
        history: [],
      },
      steps,
      startedAt: new Date(),
      completedAt: null,
      error: null,
    };
  }

  private updateStatus(execution: WorkflowExecution, newStatus: WorkflowStatus): void {
    const from = execution.status;
    execution.status = newStatus;
    eventBus.emit('workflow:status-changed', { executionId: execution.id, from, to: newStatus });
  }

  private updateStepStatus(execution: WorkflowExecution, stepId: string, newStatus: StepStatus): void {
    const stepExec = execution.steps[stepId];
    const from = stepExec.status;
    stepExec.status = newStatus;
    eventBus.emit('step:status-changed', { executionId: execution.id, stepId, from, to: newStatus });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API for querying state
  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  getExecutionsByStatus(status: WorkflowStatus): WorkflowExecution[] {
    return this.getAllExecutions().filter(e => e.status === status);
  }
}

export const orchestrator = new WorkflowOrchestrator();
