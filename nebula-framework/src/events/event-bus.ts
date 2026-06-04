import EventEmitter from 'eventemitter3';
import { AgentRole, GateResult, StepStatus, WorkflowStatus } from '../types';

// ============================================================
// Event Bus - Pub/Sub for workflow orchestration
// Decouples agents from orchestrator, enables real-time UI
// ============================================================

export interface WorkflowEvents {
  'workflow:started': (data: { executionId: string; workflowId: string }) => void;
  'workflow:completed': (data: { executionId: string; duration: number }) => void;
  'workflow:failed': (data: { executionId: string; error: string }) => void;
  'workflow:status-changed': (data: { executionId: string; from: WorkflowStatus; to: WorkflowStatus }) => void;

  'step:started': (data: { executionId: string; stepId: string; agent: AgentRole }) => void;
  'step:completed': (data: { executionId: string; stepId: string; output: Record<string, unknown> }) => void;
  'step:failed': (data: { executionId: string; stepId: string; error: string; attempt: number }) => void;
  'step:retrying': (data: { executionId: string; stepId: string; attempt: number; maxRetries: number }) => void;
  'step:status-changed': (data: { executionId: string; stepId: string; from: StepStatus; to: StepStatus }) => void;

  'gate:evaluating': (data: { executionId: string; gateId: string }) => void;
  'gate:passed': (data: { executionId: string; gateId: string; result: GateResult }) => void;
  'gate:failed': (data: { executionId: string; gateId: string; result: GateResult }) => void;

  'llm:request': (data: { executionId: string; agent: AgentRole; model: string }) => void;
  'llm:response': (data: { executionId: string; agent: AgentRole; tokens: number; durationMs: number }) => void;
  'llm:error': (data: { executionId: string; agent: AgentRole; error: string }) => void;
}

export class EventBus {
  private emitter = new EventEmitter<WorkflowEvents>();
  private history: Array<{ event: string; data: unknown; timestamp: Date }> = [];
  private readonly maxHistory = 1000;

  emit<K extends keyof WorkflowEvents>(event: K, data: Parameters<WorkflowEvents[K]>[0]): void {
    this.history.push({ event, data, timestamp: new Date() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    (this.emitter as any).emit(event, data);
  }

  on<K extends keyof WorkflowEvents>(event: K, handler: WorkflowEvents[K]): void {
    this.emitter.on(event, handler as any);
  }

  off<K extends keyof WorkflowEvents>(event: K, handler: WorkflowEvents[K]): void {
    this.emitter.off(event, handler as any);
  }

  getHistory(filter?: { event?: string; executionId?: string; limit?: number }) {
    let results = [...this.history];
    if (filter?.event) {
      results = results.filter(h => h.event === filter.event);
    }
    if (filter?.executionId) {
      results = results.filter(h => {
        const data = h.data as Record<string, unknown>;
        return data?.executionId === filter.executionId;
      });
    }
    if (filter?.limit) {
      results = results.slice(-filter.limit);
    }
    return results;
  }

  clearHistory(): void {
    this.history = [];
  }
}

// Singleton for the application
export const eventBus = new EventBus();
