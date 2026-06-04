import { WorkflowExecution, WorkflowDefinition } from '../types';

// ============================================================
// Repository Interface - Abstract persistence layer
// Supports: SQLite (local), PostgreSQL (prod), MongoDB (doc-store)
// ============================================================

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  featureName: string;
  status: string;
  steps: Record<string, any>;
  artifacts: Record<string, any>;
  duration: number | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: any[];
  gates: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfig {
  key: string;
  value: string;
  updatedAt: Date;
}

export type TaskStatus = 'backlog' | 'ready' | 'in-progress' | 'executing' | 'done' | 'failed';
export type TaskSource = 'manual' | 'jira' | 'github' | 'azure-devops';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  externalId: string | null;       // Jira ticket ID, GitHub issue #, etc.
  externalUrl: string | null;      // Link back to source
  assignedWorkflow: string | null; // Which workflow pipeline to run
  executionId: string | null;      // Links to execution when run
  labels: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRepository {
  // Executions
  saveExecution(execution: ExecutionRecord): Promise<void>;
  getExecution(id: string): Promise<ExecutionRecord | null>;
  listExecutions(options?: { limit?: number; offset?: number; status?: string }): Promise<ExecutionRecord[]>;
  getExecutionCount(): Promise<number>;

  // Workflow configs (admin-managed)
  saveWorkflowConfig(config: WorkflowConfig): Promise<void>;
  getWorkflowConfig(id: string): Promise<WorkflowConfig | null>;
  listWorkflowConfigs(): Promise<WorkflowConfig[]>;
  deleteWorkflowConfig(id: string): Promise<void>;

  // Tasks (manual + external integrations)
  saveTask(task: TaskRecord): Promise<void>;
  getTask(id: string): Promise<TaskRecord | null>;
  listTasks(options?: { status?: TaskStatus; source?: TaskSource; limit?: number }): Promise<TaskRecord[]>;
  updateTaskStatus(id: string, status: TaskStatus, executionId?: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  getTaskCount(status?: TaskStatus): Promise<number>;

  // System config
  getConfig(key: string): Promise<string | null>;
  setConfig(key: string, value: string): Promise<void>;
  getAllConfig(): Promise<SystemConfig[]>;

  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}

export function executionToRecord(exec: WorkflowExecution): ExecutionRecord {
  return {
    id: exec.id,
    workflowId: exec.workflowId,
    featureName: exec.context.featureName,
    status: exec.status,
    steps: Object.fromEntries(
      Object.entries(exec.steps).map(([id, step]) => [id, {
        agent: step.agent,
        status: step.status,
        attempts: step.attempts,
        gateResult: step.gateResult ? { passed: step.gateResult.passed, violations: step.gateResult.violations } : null,
        llmCalls: step.llmCalls.length,
        duration: step.startedAt && step.completedAt
          ? step.completedAt.getTime() - step.startedAt.getTime()
          : null,
        output: step.output,
      }])
    ),
    artifacts: exec.context.artifacts,
    duration: exec.startedAt && exec.completedAt
      ? exec.completedAt.getTime() - exec.startedAt.getTime()
      : null,
    error: exec.error,
    createdAt: exec.startedAt,
    completedAt: exec.completedAt,
  };
}
