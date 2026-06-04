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

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/config').then(r => r.json()),
      fetch('/api/admin/executions?limit=10').then(r => r.json()),
    ]).then(([statsData, configData, execData]) => {
      setStats(statsData.stats)
      setConfig(configData.config)
      setExecutions(execData.executions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

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
