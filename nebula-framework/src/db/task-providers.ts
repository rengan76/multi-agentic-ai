import { TaskRecord, TaskSource } from './repository';

// ============================================================
// Task Provider Interface - Extensible integration layer
// Allows pulling tasks from: Jira, GitHub Issues, Azure DevOps
// Or creating them manually through the admin UI
// ============================================================

export interface TaskProvider {
  readonly source: TaskSource;
  readonly name: string;
  readonly connected: boolean;

  // Sync tasks from external source
  sync(): Promise<TaskRecord[]>;

  // Push status updates back to external source
  updateExternal?(taskId: string, status: string): Promise<void>;

  // Test connection
  testConnection(): Promise<{ ok: boolean; message: string }>;
}

// ── Manual Provider (always available) ────────────────────

export class ManualTaskProvider implements TaskProvider {
  readonly source: TaskSource = 'manual';
  readonly name = 'Manual Entry';
  readonly connected = true;

  async sync(): Promise<TaskRecord[]> {
    // Manual tasks are already in DB, no sync needed
    return [];
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: 'Manual provider is always available' };
  }
}

// ── Jira Provider (extensible stub) ──────────────────────

export class JiraTaskProvider implements TaskProvider {
  readonly source: TaskSource = 'jira';
  readonly name = 'Jira';
  connected = false;

  constructor(
    private config: {
      baseUrl?: string;
      projectKey?: string;
      apiToken?: string;
      email?: string;
    } = {}
  ) {
    this.connected = !!(config.baseUrl && config.apiToken);
  }

  async sync(): Promise<TaskRecord[]> {
    if (!this.connected) return [];

    // TODO: Implement Jira REST API integration
    // GET /rest/api/3/search?jql=project={projectKey} AND status != Done
    // Map Jira issues → TaskRecord[]
    //
    // Example mapping:
    // {
    //   id: `jira-${issue.key}`,
    //   title: issue.fields.summary,
    //   description: issue.fields.description,
    //   priority: mapJiraPriority(issue.fields.priority),
    //   status: mapJiraStatus(issue.fields.status),
    //   source: 'jira',
    //   externalId: issue.key,      // e.g. "PROJ-123"
    //   externalUrl: `${baseUrl}/browse/${issue.key}`,
    //   assignedWorkflow: null,     // User maps in admin
    //   labels: issue.fields.labels,
    // }

    return [];
  }

  async updateExternal(taskId: string, status: string): Promise<void> {
    if (!this.connected) return;
    // TODO: PUT /rest/api/3/issue/{taskId}/transitions
    // Transition the Jira issue to the mapped status
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.config.baseUrl) {
      return { ok: false, message: 'Set JIRA_BASE_URL environment variable' };
    }
    if (!this.config.apiToken) {
      return { ok: false, message: 'Set JIRA_API_TOKEN environment variable' };
    }
    // TODO: GET /rest/api/3/myself to validate credentials
    return { ok: false, message: `Jira integration ready to connect to ${this.config.baseUrl}` };
  }
}

// ── GitHub Issues Provider (extensible stub) ─────────────

export class GitHubTaskProvider implements TaskProvider {
  readonly source: TaskSource = 'github';
  readonly name = 'GitHub Issues';
  connected = false;

  constructor(
    private config: {
      repo?: string;   // "owner/repo"
      token?: string;
    } = {}
  ) {
    this.connected = !!(config.repo && config.token);
  }

  async sync(): Promise<TaskRecord[]> {
    if (!this.connected) return [];
    // TODO: GET /repos/{owner}/{repo}/issues?state=open
    return [];
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.config.repo) return { ok: false, message: 'Set GITHUB_REPO (owner/repo)' };
    if (!this.config.token) return { ok: false, message: 'Set GITHUB_TOKEN' };
    return { ok: false, message: `GitHub integration ready for ${this.config.repo}` };
  }
}

// ── Provider Registry ────────────────────────────────────

export function createTaskProviders(): TaskProvider[] {
  return [
    new ManualTaskProvider(),
    new JiraTaskProvider({
      baseUrl: process.env.JIRA_BASE_URL,
      projectKey: process.env.JIRA_PROJECT_KEY,
      apiToken: process.env.JIRA_API_TOKEN,
      email: process.env.JIRA_EMAIL,
    }),
    new GitHubTaskProvider({
      repo: process.env.GITHUB_REPO,
      token: process.env.GITHUB_TOKEN,
    }),
  ];
}
