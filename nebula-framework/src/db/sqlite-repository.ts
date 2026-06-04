import { IRepository, ExecutionRecord, WorkflowConfig, SystemConfig, TaskRecord, TaskStatus, TaskSource } from './repository';
import { logger } from '../utils/logger';

// ============================================================
// SQLite Repository - Zero-config local persistence
// Uses better-sqlite3 for synchronous, fast local storage
// Fallback: in-memory if SQLite not available
// ============================================================

export class SQLiteRepository implements IRepository {
  private db: any = null;
  private isMemory: boolean = false;

  constructor(private dbPath: string = './data/nebula.db') {}

  async initialize(): Promise<void> {
    try {
      const Database = require('better-sqlite3');
      const path = require('path');
      const fs = require('fs');

      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.createTables();
      logger.info({ path: this.dbPath }, 'SQLite database initialized');
    } catch (e) {
      logger.warn('SQLite not available, using in-memory store');
      this.isMemory = true;
      this.initMemoryStore();
    }
  }

  private memoryStore = {
    executions: new Map<string, ExecutionRecord>(),
    workflows: new Map<string, WorkflowConfig>(),
    config: new Map<string, SystemConfig>(),
    tasks: new Map<string, TaskRecord>(),
  };

  private initMemoryStore(): void {
    // Already initialized via field defaults
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        feature_name TEXT NOT NULL,
        status TEXT NOT NULL,
        steps TEXT NOT NULL,
        artifacts TEXT NOT NULL,
        duration INTEGER,
        error TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS workflow_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL,
        steps TEXT NOT NULL,
        gates TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'backlog',
        source TEXT NOT NULL DEFAULT 'manual',
        external_id TEXT,
        external_url TEXT,
        assigned_workflow TEXT,
        execution_id TEXT,
        labels TEXT NOT NULL DEFAULT '[]',
        created_by TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
      CREATE INDEX IF NOT EXISTS idx_executions_created ON executions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
    `);
  }

  // ── Executions ──────────────────────────────────────────

  async saveExecution(record: ExecutionRecord): Promise<void> {
    if (this.isMemory) {
      this.memoryStore.executions.set(record.id, record);
      return;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO executions (id, workflow_id, feature_name, status, steps, artifacts, duration, error, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.id,
      record.workflowId,
      record.featureName,
      record.status,
      JSON.stringify(record.steps),
      JSON.stringify(record.artifacts),
      record.duration,
      record.error,
      record.createdAt.toISOString(),
      record.completedAt?.toISOString() || null
    );
  }

  async getExecution(id: string): Promise<ExecutionRecord | null> {
    if (this.isMemory) {
      return this.memoryStore.executions.get(id) || null;
    }

    const row = this.db.prepare('SELECT * FROM executions WHERE id = ?').get(id);
    return row ? this.rowToExecution(row) : null;
  }

  async listExecutions(options?: { limit?: number; offset?: number; status?: string }): Promise<ExecutionRecord[]> {
    if (this.isMemory) {
      let records = Array.from(this.memoryStore.executions.values());
      if (options?.status) records = records.filter(r => r.status === options.status);
      records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const offset = options?.offset || 0;
      const limit = options?.limit || 50;
      return records.slice(offset, offset + limit);
    }

    let query = 'SELECT * FROM executions';
    const params: any[] = [];

    if (options?.status) {
      query += ' WHERE status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    return this.db.prepare(query).all(...params).map(this.rowToExecution);
  }

  async getExecutionCount(): Promise<number> {
    if (this.isMemory) return this.memoryStore.executions.size;
    return this.db.prepare('SELECT COUNT(*) as count FROM executions').get().count;
  }

  // ── Workflow Configs ────────────────────────────────────

  async saveWorkflowConfig(config: WorkflowConfig): Promise<void> {
    if (this.isMemory) {
      this.memoryStore.workflows.set(config.id, config);
      return;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO workflow_configs (id, name, description, version, steps, gates, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      config.id,
      config.name,
      config.description,
      config.version,
      JSON.stringify(config.steps),
      JSON.stringify(config.gates),
      config.isActive ? 1 : 0,
      config.createdAt.toISOString(),
      config.updatedAt.toISOString()
    );
  }

  async getWorkflowConfig(id: string): Promise<WorkflowConfig | null> {
    if (this.isMemory) return this.memoryStore.workflows.get(id) || null;
    const row = this.db.prepare('SELECT * FROM workflow_configs WHERE id = ?').get(id);
    return row ? this.rowToWorkflowConfig(row) : null;
  }

  async listWorkflowConfigs(): Promise<WorkflowConfig[]> {
    if (this.isMemory) return Array.from(this.memoryStore.workflows.values());
    return this.db.prepare('SELECT * FROM workflow_configs ORDER BY updated_at DESC').all().map(this.rowToWorkflowConfig);
  }

  async deleteWorkflowConfig(id: string): Promise<void> {
    if (this.isMemory) { this.memoryStore.workflows.delete(id); return; }
    this.db.prepare('DELETE FROM workflow_configs WHERE id = ?').run(id);
  }

  // ── System Config ──────────────────────────────────────

  async getConfig(key: string): Promise<string | null> {
    if (this.isMemory) return this.memoryStore.config.get(key)?.value || null;
    const row = this.db.prepare('SELECT value FROM system_config WHERE key = ?').get(key);
    return row?.value || null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    const now = new Date();
    if (this.isMemory) {
      this.memoryStore.config.set(key, { key, value, updatedAt: now });
      return;
    }
    this.db.prepare('INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?, ?, ?)').run(key, value, now.toISOString());
  }

  async getAllConfig(): Promise<SystemConfig[]> {
    if (this.isMemory) return Array.from(this.memoryStore.config.values());
    return this.db.prepare('SELECT * FROM system_config').all().map((row: any) => ({
      key: row.key,
      value: row.value,
      updatedAt: new Date(row.updated_at),
    }));
  }

  // ── Lifecycle ──────────────────────────────────────────

  async close(): Promise<void> {
    if (this.db) this.db.close();
  }

  // ── Helpers ────────────────────────────────────────────

  private rowToExecution(row: any): ExecutionRecord {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      featureName: row.feature_name,
      status: row.status,
      steps: JSON.parse(row.steps),
      artifacts: JSON.parse(row.artifacts),
      duration: row.duration,
      error: row.error,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    };
  }

  private rowToWorkflowConfig(row: any): WorkflowConfig {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      steps: JSON.parse(row.steps),
      gates: JSON.parse(row.gates),
      isActive: row.is_active === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // ── Tasks ──────────────────────────────────────────────

  async saveTask(task: TaskRecord): Promise<void> {
    if (this.isMemory) {
      this.memoryStore.tasks.set(task.id, task);
      return;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tasks (id, title, description, priority, status, source, external_id, external_url, assigned_workflow, execution_id, labels, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      task.id, task.title, task.description, task.priority, task.status,
      task.source, task.externalId, task.externalUrl, task.assignedWorkflow,
      task.executionId, JSON.stringify(task.labels), task.createdBy,
      task.createdAt.toISOString(), task.updatedAt.toISOString()
    );
  }

  async getTask(id: string): Promise<TaskRecord | null> {
    if (this.isMemory) return this.memoryStore.tasks.get(id) || null;
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? this.rowToTask(row) : null;
  }

  async listTasks(options?: { status?: TaskStatus; source?: TaskSource; limit?: number }): Promise<TaskRecord[]> {
    if (this.isMemory) {
      let records = Array.from(this.memoryStore.tasks.values());
      if (options?.status) records = records.filter(r => r.status === options.status);
      if (options?.source) records = records.filter(r => r.source === options.source);
      records.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return records.slice(0, options?.limit || 100);
    }

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    if (options?.status) { query += ' AND status = ?'; params.push(options.status); }
    if (options?.source) { query += ' AND source = ?'; params.push(options.source); }
    query += ' ORDER BY updated_at DESC';
    if (options?.limit) { query += ' LIMIT ?'; params.push(options.limit); }

    return this.db.prepare(query).all(...params).map((r: any) => this.rowToTask(r));
  }

  async updateTaskStatus(id: string, status: TaskStatus, executionId?: string): Promise<void> {
    const now = new Date();
    if (this.isMemory) {
      const task = this.memoryStore.tasks.get(id);
      if (task) {
        task.status = status;
        task.updatedAt = now;
        if (executionId) task.executionId = executionId;
      }
      return;
    }

    if (executionId) {
      this.db.prepare('UPDATE tasks SET status = ?, execution_id = ?, updated_at = ? WHERE id = ?')
        .run(status, executionId, now.toISOString(), id);
    } else {
      this.db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, now.toISOString(), id);
    }
  }

  async deleteTask(id: string): Promise<void> {
    if (this.isMemory) { this.memoryStore.tasks.delete(id); return; }
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  async getTaskCount(status?: TaskStatus): Promise<number> {
    if (this.isMemory) {
      if (!status) return this.memoryStore.tasks.size;
      return Array.from(this.memoryStore.tasks.values()).filter(t => t.status === status).length;
    }
    if (status) {
      return this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get(status).count;
    }
    return this.db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  }

  private rowToTask(row: any): TaskRecord {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      priority: row.priority,
      status: row.status,
      source: row.source,
      externalId: row.external_id,
      externalUrl: row.external_url,
      assignedWorkflow: row.assigned_workflow,
      executionId: row.execution_id,
      labels: JSON.parse(row.labels || '[]'),
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
