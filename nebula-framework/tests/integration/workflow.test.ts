import { orchestrator } from '../../src/engine/orchestrator';
import { WORKFLOWS } from '../../src/config/workflows';
import { WorkflowStatus, StepStatus } from '../../src/types';

// Set mock provider for tests
process.env.LLM_PROVIDER = 'mock';

describe('WorkflowOrchestrator - Integration', () => {
  describe('feature workflow', () => {
    it('should execute full feature pipeline successfully', async () => {
      const workflow = WORKFLOWS.feature;
      const execution = await orchestrator.execute(workflow, { featureName: 'policies' });

      expect(execution.status).toBe(WorkflowStatus.COMPLETED);
      expect(execution.error).toBeNull();
      expect(execution.completedAt).not.toBeNull();
    }, 30000);

    it('should pass all gates in sequence', async () => {
      const workflow = WORKFLOWS.feature;
      const execution = await orchestrator.execute(workflow, { featureName: 'claims' });

      for (const [stepId, step] of Object.entries(execution.steps)) {
        expect(step.status).toBe(StepStatus.PASSED);
        expect(step.gateResult).not.toBeNull();
        expect(step.gateResult!.passed).toBe(true);
      }
    }, 30000);

    it('should accumulate artifacts from each agent', async () => {
      const workflow = WORKFLOWS.feature;
      const execution = await orchestrator.execute(workflow, { featureName: 'quotes' });

      expect(execution.context.artifacts['product-manager']).toBeDefined();
      expect(execution.context.artifacts['architect']).toBeDefined();
      expect(execution.context.artifacts['backend-developer']).toBeDefined();
      expect(execution.context.artifacts['qa-engineer']).toBeDefined();
    }, 30000);

    it('should record LLM calls for each step', async () => {
      const workflow = WORKFLOWS.feature;
      const execution = await orchestrator.execute(workflow, { featureName: 'documents' });

      for (const step of Object.values(execution.steps)) {
        expect(step.llmCalls.length).toBeGreaterThan(0);
        expect(step.llmCalls[0].provider).toBe('mock');
        expect(step.llmCalls[0].durationMs).toBeGreaterThan(0);
      }
    }, 30000);

    it('should track execution context history', async () => {
      const workflow = WORKFLOWS.feature;
      const execution = await orchestrator.execute(workflow, { featureName: 'users' });

      expect(execution.context.history.length).toBeGreaterThanOrEqual(4);
      expect(execution.context.history[0].agent).toBe('product-manager');
    }, 30000);
  });

  describe('plan workflow', () => {
    it('should execute only PM and Architect steps', async () => {
      const workflow = WORKFLOWS.plan;
      const execution = await orchestrator.execute(workflow, { featureName: 'notifications' });

      expect(execution.status).toBe(WorkflowStatus.COMPLETED);
      expect(Object.keys(execution.steps)).toHaveLength(2);
      expect(execution.steps['requirements'].status).toBe(StepStatus.PASSED);
      expect(execution.steps['architecture'].status).toBe(StepStatus.PASSED);
    }, 15000);
  });
});
