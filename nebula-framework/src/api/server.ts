import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { orchestrator } from '../engine/orchestrator';
import { WORKFLOWS } from '../config/workflows';
import { AGENT_CONTRACTS, GATE_DEFINITIONS } from '../agents/registry';
import { eventBus } from '../events/event-bus';
import { llmService } from '../llm';
import { logger } from '../utils/logger';
import { WorkflowStatus } from '../types';
import { IRepository, createRepository, executionToRecord, TaskRecord, TaskStatus } from '../db';
import { createTaskProviders, TaskProvider } from '../db/task-providers';

// ============================================================
// REST API - Exposes workflow engine via HTTP
// Supports: executing workflows, querying state, SSE for events
// ============================================================

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, path: req.path }, 'Request');
  next();
});

// In-memory store for custom workflows and gates (persists for server lifetime)
const customWorkflows: Record<string, any> = {};
const customGates: Record<string, any> = {};

// ── Health & Info ──────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    llmProvider: llmService.getActiveProvider(),
    providerChain: llmService.getProviderChain(),
    uptime: process.uptime(),
  });
});

// ── Workflow Definitions ───────────────────────────────────

app.get('/api/workflows', (_req: Request, res: Response) => {
  const builtIn = Object.entries(WORKFLOWS).map(([id, w]) => ({
    id,
    name: w.name,
    description: w.description,
    version: w.version,
    stepCount: w.steps.length,
    agents: w.steps.map(s => s.agent),
    source: 'builtin',
  }));
  const custom = Object.entries(customWorkflows).map(([id, w]) => ({
    id,
    name: w.name,
    description: w.description,
    version: w.version,
    stepCount: w.steps.length,
    agents: w.steps.map((s: any) => s.agent),
    source: 'custom',
  }));
  res.json({ workflows: [...builtIn, ...custom] });
});

app.get('/api/workflows/:id', (req: Request, res: Response) => {
  const workflow = WORKFLOWS[req.params.id];
  if (!workflow) {
    res.status(404).json({ error: `Workflow '${req.params.id}' not found` });
    return;
  }
  res.json(workflow);
});

// ── Agent Contracts ───────────────────────────────────────

app.get('/api/agents', (_req: Request, res: Response) => {
  const agents = Object.entries(AGENT_CONTRACTS).map(([role, contract]) => ({
    role,
    description: contract.description,
    capabilities: contract.capabilities,
    boundaries: contract.boundaries,
    temperature: contract.temperature,
    maxRetries: contract.maxRetries,
  }));
  res.json({ agents });
});

// ── Gate Definitions ──────────────────────────────────────

app.get('/api/gates', (_req: Request, res: Response) => {
  res.json({ gates: { ...GATE_DEFINITIONS, ...customGates } });
});

// ── JIRA Integration (Mock) ──────────────────────────────

const MOCK_JIRA_STORIES = [
  {
    id: 'PROJ-1001', title: 'User Authentication with Email/Password', description: 'Allow users to register and login with email and password credentials',
    acceptanceCriteria: ['User can register with email and password', 'User can login with valid credentials', 'Invalid credentials show error message', 'Session expires after 30 minutes', 'Password must be at least 8 characters'],
    constraints: ['Must use bcrypt for password hashing', 'JWT tokens for session management'], priority: 'high', storyPoints: 8, status: 'ready', sprint: 'Sprint 24',
  },
  {
    id: 'PROJ-1002', title: 'Policy CRUD Operations', description: 'Create, read, update, and delete insurance policies',
    acceptanceCriteria: ['User can create a new policy', 'User can view policy details', 'User can update policy terms', 'User can cancel a policy', 'Audit log tracks all changes'],
    constraints: ['Must validate against regulatory rules', 'PostgreSQL storage only'], priority: 'high', storyPoints: 13, status: 'ready', sprint: 'Sprint 24',
  },
  {
    id: 'PROJ-1003', title: 'Claims Submission Workflow', description: 'Allow policyholders to submit claims with supporting documents',
    acceptanceCriteria: ['User can submit a new claim', 'User can upload documents', 'System validates claim against policy', 'Email notification on submission', 'Status tracking for the claim'],
    constraints: ['Max file size 10MB', 'Supported formats: PDF, JPG, PNG'], priority: 'medium', storyPoints: 8, status: 'ready', sprint: 'Sprint 24',
  },
  {
    id: 'PROJ-1004', title: 'Payment Processing Integration', description: 'Integrate with payment gateway for premium collection',
    acceptanceCriteria: ['User can pay premium online', 'System retries failed payments', 'Receipt generated after payment', 'Webhook handles payment confirmations'],
    constraints: ['Must use Stripe API', 'PCI compliance required', 'No card data stored locally'], priority: 'high', storyPoints: 13, status: 'in-progress', sprint: 'Sprint 24',
  },
  {
    id: 'PROJ-1005', title: 'User Profile Management', description: 'Allow users to view and update their profile information',
    acceptanceCriteria: ['User can view profile details', 'User can update name and email', 'User can change password', 'Email verification on email change'],
    constraints: ['Must work with existing auth system'], priority: 'low', storyPoints: 5, status: 'ready', sprint: 'Sprint 25',
  },
  {
    id: 'PROJ-1006', title: 'Role-Based Access Control', description: 'Implement RBAC for admin, agent, and customer roles',
    acceptanceCriteria: ['Admin can manage all resources', 'Agent can manage policies and claims', 'Customer can only view own data', 'Unauthorized access returns 403'],
    constraints: ['Must integrate with JWT claims', 'Use middleware pattern'], priority: 'medium', storyPoints: 8, status: 'ready', sprint: 'Sprint 25',
  },
];

app.get('/api/jira/search', (req: Request, res: Response) => {
  const query = ((req.query.query as string) || '').toLowerCase().trim();
  if (!query) {
    res.json({ stories: MOCK_JIRA_STORIES });
    return;
  }

  const filtered = MOCK_JIRA_STORIES.filter(s =>
    s.id.toLowerCase().includes(query) ||
    s.title.toLowerCase().includes(query) ||
    s.description.toLowerCase().includes(query)
  );
  res.json({ stories: filtered });
});

// ── JIRA Config Management ───────────────────────────────

let jiraConfig: { url: string; email: string; token: string; project: string; connected: boolean } = {
  url: process.env.JIRA_URL || '',
  email: process.env.JIRA_EMAIL || '',
  token: process.env.JIRA_TOKEN || '',
  project: process.env.JIRA_PROJECT || '',
  connected: false,
};

app.get('/api/jira/config', (_req: Request, res: Response) => {
  res.json({
    config: {
      url: jiraConfig.url,
      email: jiraConfig.email,
      project: jiraConfig.project,
      tokenSet: !!jiraConfig.token,
      connected: jiraConfig.connected,
    }
  });
});

app.put('/api/jira/config', (req: Request, res: Response) => {
  const { url, email, token, project } = req.body;

  if (url !== undefined) jiraConfig.url = url;
  if (email !== undefined) jiraConfig.email = email;
  if (token !== undefined) jiraConfig.token = token;
  if (project !== undefined) jiraConfig.project = project;

  // Validate connection (mock validation - in real impl, call JIRA API)
  const isConfigured = !!(jiraConfig.url && jiraConfig.email && jiraConfig.token && jiraConfig.project);
  jiraConfig.connected = isConfigured;

  logger.info({ url: jiraConfig.url, project: jiraConfig.project, connected: jiraConfig.connected }, 'JIRA config updated');

  res.json({
    success: true,
    connected: jiraConfig.connected,
    message: isConfigured ? 'JIRA configuration saved. Connected successfully.' : 'Configuration saved but incomplete — fill all fields to connect.',
  });
});

app.get('/api/jira/test', async (_req: Request, res: Response) => {
  if (!jiraConfig.url || !jiraConfig.email || !jiraConfig.token) {
    res.json({ connected: false, error: 'JIRA not configured. Set URL, email, and token in Admin panel.' });
    return;
  }

  // In production, this would make a real JIRA API call:
  // GET {jiraConfig.url}/rest/api/3/myself
  // with Basic auth: base64(email:token)
  // For now, validate the config format
  const urlValid = jiraConfig.url.startsWith('https://') && jiraConfig.url.includes('atlassian.net');
  const emailValid = jiraConfig.email.includes('@');
  const tokenValid = jiraConfig.token.length > 10;

  const connected = urlValid && emailValid && tokenValid;
  jiraConfig.connected = connected;

  res.json({
    connected,
    message: connected ? 'Connection successful' : 'Connection failed — verify URL is https://*.atlassian.net and credentials are valid',
    checks: {
      url: urlValid ? 'valid' : 'invalid (must be https://*.atlassian.net)',
      email: emailValid ? 'valid' : 'invalid (must be an email)',
      token: tokenValid ? 'present' : 'missing or too short',
    }
  });
});

// ── Execute Workflow ──────────────────────────────────────

app.post('/api/execute', async (req: Request, res: Response) => {
  const { workflow: workflowId, featureName, context: inputContext } = req.body;

  if (!workflowId || !featureName) {
    res.status(400).json({ error: 'workflow and featureName are required' });
    return;
  }

  const workflow = WORKFLOWS[workflowId];
  if (!workflow) {
    res.status(400).json({ error: `Unknown workflow: ${workflowId}`, available: Object.keys(WORKFLOWS) });
    return;
  }

  logger.info({ workflowId, featureName }, 'Starting workflow execution');

  try {
    const execution = await orchestrator.execute(workflow, { featureName, context: inputContext });
    res.json({
      executionId: execution.id,
      status: execution.status,
      steps: Object.entries(execution.steps).map(([id, step]) => ({
        id,
        agent: step.agent,
        status: step.status,
        gateResult: step.gateResult ? { passed: step.gateResult.passed, violations: step.gateResult.violations } : null,
        llmCalls: step.llmCalls.length,
        duration: step.startedAt && step.completedAt
          ? step.completedAt.getTime() - step.startedAt.getTime()
          : null,
      })),
      artifacts: execution.context.artifacts,
      duration: execution.completedAt
        ? execution.completedAt.getTime() - execution.startedAt.getTime()
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ── Query Executions ─────────────────────────────────────

app.get('/api/executions', (req: Request, res: Response) => {
  const status = req.query.status as WorkflowStatus | undefined;
  const executions = status
    ? orchestrator.getExecutionsByStatus(status)
    : orchestrator.getAllExecutions();

  res.json({
    executions: executions.map(e => ({
      id: e.id,
      workflowId: e.workflowId,
      status: e.status,
      featureName: e.context.featureName,
      currentStep: e.currentStep,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
      error: e.error,
    })),
  });
});

app.get('/api/executions/:id', (req: Request, res: Response) => {
  const execution = orchestrator.getExecution(req.params.id);
  if (!execution) {
    res.status(404).json({ error: 'Execution not found' });
    return;
  }
  res.json(execution);
});

// ── Server-Sent Events (real-time updates) ───────────────

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to all workflow events
  const handlers = {
    'workflow:started': (d: unknown) => sendEvent('workflow:started', d),
    'workflow:completed': (d: unknown) => sendEvent('workflow:completed', d),
    'workflow:failed': (d: unknown) => sendEvent('workflow:failed', d),
    'step:started': (d: unknown) => sendEvent('step:started', d),
    'step:completed': (d: unknown) => sendEvent('step:completed', d),
    'step:failed': (d: unknown) => sendEvent('step:failed', d),
    'step:retrying': (d: unknown) => sendEvent('step:retrying', d),
    'gate:passed': (d: unknown) => sendEvent('gate:passed', d),
    'gate:failed': (d: unknown) => sendEvent('gate:failed', d),
    'llm:request': (d: unknown) => sendEvent('llm:request', d),
    'llm:response': (d: unknown) => sendEvent('llm:response', d),
  } as const;

  for (const [event, handler] of Object.entries(handlers)) {
    eventBus.on(event as keyof typeof handlers, handler as (...args: unknown[]) => void);
  }

  // Cleanup on disconnect
  req.on('close', () => {
    for (const [event, handler] of Object.entries(handlers)) {
      eventBus.off(event as keyof typeof handlers, handler as (...args: unknown[]) => void);
    }
  });
});

// ── Event History ────────────────────────────────────────

app.get('/api/events/history', (req: Request, res: Response) => {
  const { executionId, event, limit } = req.query;
  const history = eventBus.getHistory({
    executionId: executionId as string,
    event: event as string,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  res.json({ history });
});

// ── Database / Persistence ───────────────────────────────

let repository: IRepository | null = null;
let taskProviders: TaskProvider[] = [];

export async function initializeDatabase(): Promise<void> {
  repository = await createRepository();
  taskProviders = createTaskProviders();
}

// Hook: save executions to DB when completed
eventBus.on('workflow:completed', async (data: any) => {
  if (!repository) return;
  const execution = orchestrator.getExecution(data.executionId);
  if (execution) {
    await repository.saveExecution(executionToRecord(execution));
  }
});

eventBus.on('workflow:failed', async (data: any) => {
  if (!repository) return;
  const execution = orchestrator.getExecution(data.executionId);
  if (execution) {
    await repository.saveExecution(executionToRecord(execution));
  }
});

// ── Admin API ────────────────────────────────────────────

// Get persisted execution history
app.get('/api/admin/executions', async (_req: Request, res: Response) => {
  if (!repository) { res.json({ executions: [], total: 0 }); return; }
  const limit = parseInt(_req.query.limit as string) || 50;
  const offset = parseInt(_req.query.offset as string) || 0;
  const executions = await repository.listExecutions({ limit, offset });
  const total = await repository.getExecutionCount();
  res.json({ executions, total });
});

// System configuration
app.get('/api/admin/config', async (_req: Request, res: Response) => {
  if (!repository) {
    res.json({
      config: {
        llmProvider: process.env.LLM_PROVIDER || 'mock',
        dbDriver: process.env.DB_DRIVER || 'sqlite',
        logLevel: process.env.LOG_LEVEL || 'info',
        maxRetries: process.env.MAX_RETRIES || '2',
        retryDelay: process.env.RETRY_DELAY || '1000',
        gateStrictMode: process.env.GATE_STRICT_MODE || 'true',
      }
    });
    return;
  }
  const configs = await repository.getAllConfig();
  const configMap: Record<string, string> = {
    llmProvider: process.env.LLM_PROVIDER || 'mock',
    dbDriver: process.env.DB_DRIVER || 'sqlite',
    logLevel: process.env.LOG_LEVEL || 'info',
    maxRetries: '2',
    retryDelay: '1000',
    gateStrictMode: 'true',
  };
  configs.forEach(c => { configMap[c.key] = c.value; });
  res.json({ config: configMap });
});

app.put('/api/admin/config', async (req: Request, res: Response) => {
  if (!repository) { res.status(503).json({ error: 'Database not initialized' }); return; }
  const { key, value } = req.body;
  if (!key || value === undefined) { res.status(400).json({ error: 'key and value required' }); return; }
  await repository.setConfig(key, String(value));
  logger.info({ key, value }, 'Config updated');
  res.json({ success: true, key, value });
});

// Workflow management
app.get('/api/admin/workflows', async (_req: Request, res: Response) => {
  // Merge hardcoded + DB workflows
  const hardcoded = Object.entries(WORKFLOWS).map(([id, w]) => ({
    id, name: w.name, description: w.description, version: w.version,
    stepCount: w.steps.length, agents: w.steps.map(s => s.agent),
    source: 'builtin' as const, isActive: true,
  }));

  if (repository) {
    const dbWorkflows = await repository.listWorkflowConfigs();
    const custom = dbWorkflows.map(w => ({
      id: w.id, name: w.name, description: w.description, version: w.version,
      stepCount: w.steps.length, agents: w.steps.map((s: any) => s.agent),
      source: 'custom' as const, isActive: w.isActive,
    }));
    res.json({ workflows: [...hardcoded, ...custom] });
  } else {
    res.json({ workflows: hardcoded });
  }
});

// Stats/dashboard overview
app.get('/api/admin/stats', async (_req: Request, res: Response) => {
  const allExecutions = orchestrator.getAllExecutions();
  const completed = allExecutions.filter(e => e.status === WorkflowStatus.COMPLETED);
  const failed = allExecutions.filter(e => e.status === WorkflowStatus.FAILED);

  const totalLLMCalls = allExecutions.reduce((acc, exec) => {
    return acc + Object.values(exec.steps).reduce((s, step) => s + step.llmCalls.length, 0);
  }, 0);

  const avgDuration = completed.length > 0
    ? completed.reduce((acc, e) => acc + (e.completedAt!.getTime() - e.startedAt.getTime()), 0) / completed.length
    : 0;

  res.json({
    stats: {
      totalExecutions: allExecutions.length,
      completed: completed.length,
      failed: failed.length,
      running: allExecutions.filter(e => e.status === WorkflowStatus.RUNNING).length,
      totalLLMCalls,
      avgDurationMs: Math.round(avgDuration),
      agentCount: Object.keys(AGENT_CONTRACTS).length,
      gateCount: Object.keys(GATE_DEFINITIONS).length,
      workflowCount: Object.keys(WORKFLOWS).length,
      dbConnected: !!repository,
      uptime: process.uptime(),
    }
  });
});

// ── Task Board API ───────────────────────────────────────

// List all tasks
app.get('/api/admin/tasks', async (req: Request, res: Response) => {
  if (!repository) { res.json({ tasks: [], total: 0 }); return; }
  const status = req.query.status as TaskStatus | undefined;
  const tasks = await repository.listTasks({ status, limit: 100 });
  const total = await repository.getTaskCount();
  res.json({ tasks, total });
});

// Create a task
app.post('/api/admin/tasks', async (req: Request, res: Response) => {
  if (!repository) { res.status(503).json({ error: 'Database not initialized' }); return; }

  const { title, description, priority, assignedWorkflow, labels } = req.body;
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }

  const task: TaskRecord = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(title).slice(0, 200),
    description: String(description || '').slice(0, 2000),
    priority: ['critical', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium',
    status: 'backlog',
    source: 'manual',
    externalId: null,
    externalUrl: null,
    assignedWorkflow: assignedWorkflow || null,
    executionId: null,
    labels: Array.isArray(labels) ? labels.map((l: any) => String(l).slice(0, 50)) : [],
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await repository.saveTask(task);
  logger.info({ taskId: task.id, title: task.title }, 'Task created');
  res.status(201).json({ task });
});

// Update task status
app.patch('/api/admin/tasks/:id', async (req: Request, res: Response) => {
  if (!repository) { res.status(503).json({ error: 'Database not initialized' }); return; }

  const task = await repository.getTask(req.params.id);
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

  const { status, assignedWorkflow, title, description, priority } = req.body;

  // Allow updating individual fields
  if (status && ['backlog', 'ready', 'in-progress', 'executing', 'done', 'failed'].includes(status)) {
    task.status = status;
  }
  if (assignedWorkflow !== undefined) task.assignedWorkflow = assignedWorkflow;
  if (title) task.title = String(title).slice(0, 200);
  if (description !== undefined) task.description = String(description).slice(0, 2000);
  if (priority && ['critical', 'high', 'medium', 'low'].includes(priority)) task.priority = priority;
  task.updatedAt = new Date();

  await repository.saveTask(task);
  res.json({ task });
});

// Execute a task (run its assigned workflow)
app.post('/api/admin/tasks/:id/execute', async (req: Request, res: Response) => {
  if (!repository) { res.status(503).json({ error: 'Database not initialized' }); return; }

  const task = await repository.getTask(req.params.id);
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  if (!task.assignedWorkflow) { res.status(400).json({ error: 'Task has no assigned workflow. Assign a workflow first.' }); return; }

  const workflow = WORKFLOWS[task.assignedWorkflow];
  if (!workflow) { res.status(400).json({ error: `Workflow '${task.assignedWorkflow}' not found` }); return; }

  // Mark task as executing
  await repository.updateTaskStatus(task.id, 'executing');

  try {
    const execution = await orchestrator.execute(workflow, { featureName: task.title });
    await repository.updateTaskStatus(task.id, 'done', execution.id);

    res.json({
      task: { ...task, status: 'done', executionId: execution.id },
      execution: {
        id: execution.id,
        status: execution.status,
        steps: Object.entries(execution.steps).map(([id, step]) => ({
          id, agent: step.agent, status: step.status,
        })),
        artifacts: execution.context.artifacts,
      },
    });
  } catch (error) {
    await repository.updateTaskStatus(task.id, 'failed');
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message, task: { ...task, status: 'failed' } });
  }
});

// Delete a task
app.delete('/api/admin/tasks/:id', async (req: Request, res: Response) => {
  if (!repository) { res.status(503).json({ error: 'Database not initialized' }); return; }
  const task = await repository.getTask(req.params.id);
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  await repository.deleteTask(req.params.id);
  res.json({ success: true });
});

// Integration providers status
app.get('/api/admin/integrations', async (_req: Request, res: Response) => {
  const integrations = await Promise.all(
    taskProviders.map(async (provider) => {
      const status = await provider.testConnection();
      return {
        source: provider.source,
        name: provider.name,
        connected: provider.connected,
        status: status.message,
      };
    })
  );
  res.json({ integrations });
});

// ── Workflow & Gate Admin CRUD ────────────────────────────

// Create / update custom workflow
app.post('/api/admin/workflows', (req: Request, res: Response) => {
  const { id, name, description, steps } = req.body;
  if (!id || !name) { res.status(400).json({ error: 'id and name are required' }); return; }
  if (!steps || !Array.isArray(steps) || steps.length === 0) { res.status(400).json({ error: 'At least one step is required' }); return; }
  if (WORKFLOWS[id]) { res.status(400).json({ error: `Cannot overwrite built-in workflow '${id}'` }); return; }

  customWorkflows[id] = {
    id,
    name,
    description: description || '',
    version: '1.0.0',
    steps: steps.filter((s: any) => s.agent).map((s: any, i: number) => ({
      id: `step-${i + 1}`,
      name: `Step ${i + 1}`,
      agent: s.agent,
      gate: s.gate || null,
      dependsOn: i > 0 ? [`step-${i}`] : [],
    })),
    createdAt: new Date().toISOString(),
  };

  logger.info({ id, name, stepCount: steps.length }, 'Custom workflow created');
  res.json({ success: true, workflow: customWorkflows[id] });
});

// Delete custom workflow
app.delete('/api/admin/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (WORKFLOWS[id]) { res.status(400).json({ error: `Cannot delete built-in workflow '${id}'` }); return; }
  if (!customWorkflows[id]) { res.status(404).json({ error: 'Workflow not found' }); return; }
  delete customWorkflows[id];
  logger.info({ id }, 'Custom workflow deleted');
  res.json({ success: true });
});

// Create / update custom gate
app.post('/api/admin/gates', (req: Request, res: Response) => {
  const { id, name, description, validators } = req.body;
  if (!id || !name) { res.status(400).json({ error: 'id and name are required' }); return; }
  if (!validators || !Array.isArray(validators) || validators.length === 0) { res.status(400).json({ error: 'At least one validator is required' }); return; }
  if (GATE_DEFINITIONS[id]) { res.status(400).json({ error: `Cannot overwrite built-in gate '${id}'` }); return; }

  customGates[id] = {
    name,
    description: description || '',
    validators: validators.filter((v: any) => v.field && v.rule).map((v: any) => ({
      field: v.field,
      rule: v.rule,
      value: v.value || undefined,
      message: v.message || `${v.field} failed ${v.rule} check`,
    })),
    createdAt: new Date().toISOString(),
  };

  logger.info({ id, name, validatorCount: validators.length }, 'Custom gate created');
  res.json({ success: true, gate: customGates[id] });
});

// Delete custom gate
app.delete('/api/admin/gates/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (GATE_DEFINITIONS[id]) { res.status(400).json({ error: `Cannot delete built-in gate '${id}'` }); return; }
  if (!customGates[id]) { res.status(404).json({ error: 'Gate not found' }); return; }
  delete customGates[id];
  logger.info({ id }, 'Custom gate deleted');
  res.json({ success: true });
});

// ── Error handler ────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

export { app };
