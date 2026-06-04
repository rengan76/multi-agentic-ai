import { useState, useEffect } from 'react'

interface Stats {
  totalExecutions: number
  completed: number
  failed: number
  running: number
  totalLLMCalls: number
  avgDurationMs: number
  agentCount: number
  gateCount: number
  workflowCount: number
  dbConnected: boolean
  uptime: number
}

interface ConfigMap {
  [key: string]: string
}

interface ExecutionRecord {
  id: string
  workflowId: string
  featureName: string
  status: string
  duration: number | null
  createdAt: string
}

export function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [config, setConfig] = useState<ConfigMap>({})
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [loading, setLoading] = useState(true)

  // JIRA config state
  const [jiraUrl, setJiraUrl] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraToken, setJiraToken] = useState('')
  const [jiraProject, setJiraProject] = useState('')
  const [jiraSaving, setJiraSaving] = useState(false)
  const [jiraStatus, setJiraStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [jiraConnected, setJiraConnected] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/config').then(r => r.json()),
      fetch('/api/admin/executions?limit=10').then(r => r.json()),
      fetch('/api/jira/config').then(r => r.json()).catch(() => ({ config: {} })),
    ]).then(([statsData, configData, execData, jiraData]) => {
      setStats(statsData.stats)
      setConfig(configData.config)
      setExecutions(execData.executions || [])
      if (jiraData.config) {
        setJiraUrl(jiraData.config.url || '')
        setJiraEmail(jiraData.config.email || '')
        setJiraProject(jiraData.config.project || '')
        setJiraConnected(jiraData.config.connected || false)
        if (jiraData.config.tokenSet) setJiraToken('••••••••••••••••')
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const saveJiraConfig = async () => {
    setJiraSaving(true)
    setJiraStatus('idle')
    try {
      const res = await fetch('/api/jira/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: jiraUrl.trim(),
          email: jiraEmail.trim(),
          token: jiraToken.startsWith('••') ? undefined : jiraToken.trim(),
          project: jiraProject.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJiraStatus('success')
      setJiraConnected(data.connected || false)
      if (data.connected) setJiraToken('••••••••••••••••')
    } catch {
      setJiraStatus('error')
    } finally {
      setJiraSaving(false)
    }
  }

  const testJiraConnection = async () => {
    setJiraSaving(true)
    try {
      const res = await fetch('/api/jira/test')
      const data = await res.json()
      setJiraConnected(data.connected || false)
      setJiraStatus(data.connected ? 'success' : 'error')
    } catch {
      setJiraStatus('error')
      setJiraConnected(false)
    } finally {
      setJiraSaving(false)
    }
  }

  const refreshStats = () => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d.stats))
  }

  if (loading) return <div className="loading">Loading admin panel...</div>

  return (
    <div>
      {/* Overview Stats */}
      <div className="admin-section" style={{ marginBottom: 24 }}>
        <h3>📊 System Overview
          <button onClick={refreshStats} style={{ marginLeft: 'auto', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
            Refresh
          </button>
        </h3>
        {stats && (
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalExecutions}</div>
              <div className="stat-label">Total Executions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{stats.failed}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalLLMCalls}</div>
              <div className="stat-label">LLM Calls</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.avgDurationMs ? `${(stats.avgDurationMs / 1000).toFixed(1)}s` : '-'}</div>
              <div className="stat-label">Avg Duration</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Math.floor(stats.uptime / 60)}m</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        )}
      </div>

      <div className="admin-grid">
        {/* Configuration */}
        <div className="admin-section">
          <h3>⚙️ Configuration</h3>
          <div className="config-row">
            <span className="config-key">LLM Provider</span>
            <span className="config-value">{config.llmProvider || 'mock'}</span>
          </div>
          <div className="config-row">
            <span className="config-key">Database Driver</span>
            <span className="config-value">{config.dbDriver || 'sqlite'}</span>
          </div>
          <div className="config-row">
            <span className="config-key">Log Level</span>
            <span className="config-value">{config.logLevel || 'info'}</span>
          </div>
          <div className="config-row">
            <span className="config-key">Max Retries</span>
            <span className="config-value">{config.maxRetries || '2'}</span>
          </div>
          <div className="config-row">
            <span className="config-key">Retry Delay</span>
            <span className="config-value">{config.retryDelay || '1000'}ms</span>
          </div>
          <div className="config-row">
            <span className="config-key">Gate Strict Mode</span>
            <span className="config-value">{config.gateStrictMode || 'true'}</span>
          </div>
          <div className="config-row">
            <span className="config-key">DB Connected</span>
            <span className="config-value" style={{ color: stats?.dbConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {stats?.dbConnected ? '● Connected' : '○ Disconnected'}
            </span>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>SUPPORTED DATABASES</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              • <strong>SQLite</strong> — Zero-config local (default)<br/>
              • <strong>PostgreSQL</strong> — Production scale (set DB_POSTGRES_URL)<br/>
              • <strong>MongoDB</strong> — Document store (set DB_MONGO_URL)<br/>
              • <strong>Memory</strong> — Testing only (no persistence)
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="admin-section">
          <h3>🔧 Framework Resources</h3>
          <div className="config-row">
            <span className="config-key">Agent Roles</span>
            <span className="config-value">{stats?.agentCount || 0} registered</span>
          </div>
          <div className="config-row">
            <span className="config-key">Quality Gates</span>
            <span className="config-value">{stats?.gateCount || 0} defined</span>
          </div>
          <div className="config-row">
            <span className="config-key">Workflows</span>
            <span className="config-value">{stats?.workflowCount || 0} available</span>
          </div>
          <div className="config-row">
            <span className="config-key">LLM Provider Chain</span>
            <span className="config-value">Azure → OpenAI → Mock</span>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>ENVIRONMENT VARIABLES</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>
              LLM_PROVIDER=mock|openai|azure<br/>
              OPENAI_API_KEY=sk-...<br/>
              AZURE_OPENAI_ENDPOINT=https://...<br/>
              AZURE_OPENAI_KEY=...<br/>
              AZURE_OPENAI_DEPLOYMENT=gpt-4<br/>
              DB_DRIVER=sqlite|postgres|mongodb<br/>
              DB_PATH=./data/nebula.db<br/>
              DB_POSTGRES_URL=postgres://...<br/>
              DB_MONGO_URL=mongodb://...<br/>
              PORT=4000
            </div>
          </div>
        </div>
      </div>

      {/* JIRA Integration Config */}
      <div className="admin-section" style={{ marginTop: 24 }}>
        <h3>🔗 JIRA Integration
          <span style={{ marginLeft: 12, fontSize: 11, padding: '3px 8px', borderRadius: 4, background: jiraConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: jiraConnected ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
            {jiraConnected ? '● Connected' : '○ Not Connected'}
          </span>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Connect your JIRA instance to pull stories and tasks directly into the pipeline. Stories will appear in the "From JIRA" tab on Execute Workflow.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>JIRA BASE URL *</label>
            <input
              type="text"
              placeholder="https://your-org.atlassian.net"
              value={jiraUrl}
              onChange={e => setJiraUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PROJECT KEY *</label>
            <input
              type="text"
              placeholder="e.g. PROJ, INS, CLAIMS"
              value={jiraProject}
              onChange={e => setJiraProject(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>EMAIL ADDRESS *</label>
            <input
              type="email"
              placeholder="your-email@company.com"
              value={jiraEmail}
              onChange={e => setJiraEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>API TOKEN *</label>
            <input
              type="password"
              placeholder="Paste your JIRA API token"
              value={jiraToken}
              onChange={e => setJiraToken(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={saveJiraConfig}
            disabled={jiraSaving || !jiraUrl.trim() || !jiraEmail.trim() || !jiraProject.trim()}
            style={{ padding: '10px 20px', background: 'var(--gradient-primary)', border: 'none', borderRadius: 6, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: jiraSaving ? 0.6 : 1 }}
          >
            {jiraSaving ? 'Saving...' : '💾 Save & Connect'}
          </button>
          <button
            onClick={testJiraConnection}
            disabled={jiraSaving}
            style={{ padding: '10px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            🔌 Test Connection
          </button>
          {jiraStatus === 'success' && <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ Saved successfully</span>}
          {jiraStatus === 'error' && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>✗ Connection failed — check credentials</span>}
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>HOW TO GET YOUR JIRA API TOKEN</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            1. Go to <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>https://id.atlassian.net/manage-profile/security/api-tokens</span><br/>
            2. Click "Create API token"<br/>
            3. Give it a label (e.g. "Nebula Agent Framework")<br/>
            4. Copy the token and paste it above<br/>
            <span style={{ color: 'var(--accent-yellow)', fontSize: 11 }}>⚠ Token is stored server-side only and never exposed to the browser after saving.</span>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="admin-section" style={{ marginTop: 24 }}>
        <h3>📜 Execution History</h3>
        {executions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No persisted executions yet. Run a workflow and it will appear here.
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Workflow</th>
                <th>Feature</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {executions.map(exec => (
                <tr key={exec.id}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{exec.id.slice(0, 8)}</td>
                  <td>{exec.workflowId}</td>
                  <td>{exec.featureName}</td>
                  <td>
                    <span className={`badge ${exec.status === 'completed' ? 'badge-green' : exec.status === 'failed' ? 'badge-red' : 'badge-blue'}`}>
                      {exec.status}
                    </span>
                  </td>
                  <td>{exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '-'}</td>
                  <td>{new Date(exec.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
