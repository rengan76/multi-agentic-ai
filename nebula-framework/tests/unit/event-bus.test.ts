import { EventBus } from '../../src/events/event-bus';
import { AgentRole, WorkflowStatus, StepStatus } from '../../src/types';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should emit and receive events', (done) => {
    bus.on('workflow:started', (data) => {
      expect(data.executionId).toBe('exec-1');
      expect(data.workflowId).toBe('feature');
      done();
    });

    bus.emit('workflow:started', { executionId: 'exec-1', workflowId: 'feature' });
  });

  it('should record event history', () => {
    bus.emit('workflow:started', { executionId: 'exec-1', workflowId: 'feature' });
    bus.emit('step:started', { executionId: 'exec-1', stepId: 'step-1', agent: AgentRole.PRODUCT_MANAGER });
    bus.emit('step:completed', { executionId: 'exec-1', stepId: 'step-1', output: {} });

    const history = bus.getHistory();
    expect(history).toHaveLength(3);
    expect(history[0].event).toBe('workflow:started');
    expect(history[1].event).toBe('step:started');
  });

  it('should filter history by event type', () => {
    bus.emit('workflow:started', { executionId: 'exec-1', workflowId: 'feature' });
    bus.emit('step:started', { executionId: 'exec-1', stepId: 's1', agent: AgentRole.ARCHITECT });
    bus.emit('step:started', { executionId: 'exec-1', stepId: 's2', agent: AgentRole.BACKEND_DEVELOPER });

    const history = bus.getHistory({ event: 'step:started' });
    expect(history).toHaveLength(2);
  });

  it('should filter history by executionId', () => {
    bus.emit('workflow:started', { executionId: 'exec-1', workflowId: 'feature' });
    bus.emit('workflow:started', { executionId: 'exec-2', workflowId: 'plan' });

    const history = bus.getHistory({ executionId: 'exec-1' });
    expect(history).toHaveLength(1);
    expect((history[0].data as any).workflowId).toBe('feature');
  });

  it('should limit history results', () => {
    for (let i = 0; i < 10; i++) {
      bus.emit('workflow:started', { executionId: `exec-${i}`, workflowId: 'feature' });
    }

    const history = bus.getHistory({ limit: 3 });
    expect(history).toHaveLength(3);
  });

  it('should clear history', () => {
    bus.emit('workflow:started', { executionId: 'exec-1', workflowId: 'feature' });
    bus.clearHistory();

    expect(bus.getHistory()).toHaveLength(0);
  });

  it('should cap history at maxHistory', () => {
    // Emit more than the max (1000)
    for (let i = 0; i < 1005; i++) {
      bus.emit('workflow:started', { executionId: `exec-${i}`, workflowId: 'f' });
    }

    const history = bus.getHistory();
    expect(history.length).toBeLessThanOrEqual(1000);
  });
});
