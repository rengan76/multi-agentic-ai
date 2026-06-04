import { z } from 'zod';

// ============================================================
// Core Domain Types for Agent Framework
// ============================================================

export enum AgentRole {
  PRODUCT_MANAGER = 'product-manager',
  ARCHITECT = 'architect',
  BACKEND_DEVELOPER = 'backend-developer',
  FRONTEND_DEVELOPER = 'frontend-developer',
  QA_ENGINEER = 'qa-engineer',
  CODE_REVIEWER = 'code-reviewer',
  SECURITY = 'security',
  DEVOPS = 'devops',
}

export enum WorkflowStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  GATE_PENDING = 'gate-pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  GATE_CHECK = 'gate-check',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface AgentContract {
  role: AgentRole;
  description: string;
  capabilities: string[];
  boundaries: string[];
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  systemPrompt: string;
  temperature: number;
  maxRetries: number;
}

export interface GateDefinition {
  id: string;
  name: string;
  description: string;
  validators: GateValidator[];
  requiresApproval: boolean;
}

export interface GateValidator {
  field: string;
  rule: 'required' | 'minLength' | 'minItems' | 'matches' | 'custom';
  value?: unknown;
  message: string;
  customFn?: (data: unknown) => boolean;
}

export interface GateResult {
  gateId: string;
  passed: boolean;
  timestamp: Date;
  violations: GateViolation[];
  metadata?: Record<string, unknown>;
}

export interface GateViolation {
  validator: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface WorkflowStep {
  id: string;
  order: number;
  agent: AgentRole;
  gate: string;
  dependsOn: string[];
  config: StepConfig;
}

export interface StepConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  allowPartialOutput: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  gates: Record<string, GateDefinition>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStep: string | null;
  input: Record<string, unknown>;
  context: ExecutionContext;
  steps: Record<string, StepExecution>;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
}

export interface StepExecution {
  stepId: string;
  status: StepStatus;
  agent: AgentRole;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  gateResult: GateResult | null;
  attempts: number;
  startedAt: Date | null;
  completedAt: Date | null;
  llmCalls: LLMCallRecord[];
  error: string | null;
}

export interface ExecutionContext {
  featureName: string;
  artifacts: Record<string, unknown>;
  history: ContextEvent[];
}

export interface ContextEvent {
  timestamp: Date;
  agent: AgentRole;
  action: string;
  summary: string;
}

export interface LLMCallRecord {
  id: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  timestamp: Date;
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json' | 'text';
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  durationMs: number;
}
