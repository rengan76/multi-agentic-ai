import { useState, useEffect } from 'react'

interface Agent {
  role: string
  description: string
  capabilities: string[]
  boundaries: string[]
  temperature: number
  maxRetries: number
}

interface NebulaAgent {
  role: string
  name: string
  description: string
  version: string
  tags: string[]
  tools: string[]
  identity: string
  principles: string[]
  inScope: string[]
  outOfScope: string[]
}

interface NebulaAction {
  id: string
  name: string
  description: string
  agents: string[]
}

export function AgentContracts() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [gates, setGates] = useState<Record<string, any>>({})
  const [nebulaAgents, setNebulaAgents] = useState<NebulaAgent[]>([])
  const [nebulaActions, setNebulaActions] = useState<NebulaAction[]>([])
  const [nebulaAvailable, setNebulaAvailable] = useState(false)
  const [view, setView] = useState<'builtin' | 'nebula' | 'actions'>('nebula')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents)).catch(() => {})
    fetch('/api/gates').then(r => r.json()).then(d => setGates(d.gates)).catch(() => {})
    fetch('/api/nebula/agents').then(r => r.json()).then(d => {
      setNebulaAgents(d.agents || [])
      setNebulaAvailable(d.count > 0)
    }).catch(() => {})
    fetch('/api/nebula/actions').then(r => r.json()).then(d => {
      setNebulaActions(d.actions || [])
    }).catch(() => {})
  }, [])

  if (!agents.length && !nebulaAgents.length) return <div className="loading">Loading agent contracts...</div>

  return (
    <div>
      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}>
        {nebulaAvailable && (
          <>
            <button onClick={() => setView('nebula')} style={{ padding: '6px 14px', background: view === 'nebula' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--bg-secondary)', border: view === 'nebula' ? 'none' : '1px solid var(--border)', borderRadius: 6, color: view === 'nebula' ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              🌐 Nebula Framework Agents ({nebulaAgents.length})
            </button>
            <button onClick={() => setView('actions')} style={{ padding: '6px 14px', background: view === 'actions' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--bg-secondary)', border: view === 'actions' ? 'none' : '1px solid var(--border)', borderRadius: 6, color: view === 'actions' ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              ⚡ Actions ({nebulaActions.length})
            </button>
          </>
        )}
        <button onClick={() => setView('builtin')} style={{ padding: '6px 14px', background: view === 'builtin' ? 'var(--accent)' : 'var(--bg-secondary)', border: view === 'builtin' ? 'none' : '1px solid var(--border)', borderRadius: 6, color: view === 'builtin' ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          🔧 Built-in Agents ({agents.length})
        </button>
        {nebulaAvailable && <span style={{ fontSize: 10, color: 'var(--accent-green)', marginLeft: 8 }}>✓ nebula-agents repo connected</span>}
      </div>

      {/* Nebula Agents View */}
      {view === 'nebula' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              These are the <strong>real agent role definitions</strong> loaded from <code>nebula-agents/agents/*/SKILL.md</code>. Our orchestrator uses these to define what each specialist can do.
            </div>
          </div>
          {nebulaAgents.map(agent => (
            <div key={agent.role} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }} onClick={() => setExpandedAgent(expandedAgent === agent.role ? null : agent.role)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{agent.role}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}>v{agent.version}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {agent.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{t}</span>)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{agent.description.slice(0, 120)}{agent.description.length > 120 ? '...' : ''}</div>
              
              {expandedAgent === agent.role && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {agent.identity && <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 8, fontStyle: 'italic' }}>{agent.identity}</div>}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', letterSpacing: 1, marginBottom: 4 }}>IN SCOPE</div>
                      <ul style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 14, lineHeight: 1.7 }}>
                        {agent.inScope.slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-red)', letterSpacing: 1, marginBottom: 4 }}>OUT OF SCOPE</div>
                      <ul style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 14, lineHeight: 1.7 }}>
                        {agent.outOfScope.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  {agent.principles.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-yellow)', letterSpacing: 1, marginBottom: 4 }}>CORE PRINCIPLES</div>
                      <ul style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 14, lineHeight: 1.7 }}>
                        {agent.principles.slice(0, 5).map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>TOOLS:</span>
                    {agent.tools.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions View */}
      {view === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong>Actions</strong> are orchestrated workflows that compose multiple agents. Loaded from <code>nebula-agents/agents/actions/*.md</code>
            </div>
          </div>
          {nebulaActions.map(action => (
            <div key={action.id} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{action.name}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(245,158,11,0.1)', color: 'var(--accent-yellow)' }}>{action.id}</span>
              </div>
              {action.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{action.description}</div>}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {action.agents.map((a, i) => (
                  <span key={a} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{a}</span>
                    {i < action.agents.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Built-in View (original) */}
      {view === 'builtin' && (
        <>
          <div className="grid">
            {agents.map(agent => (
              <div key={agent.role} className="card agent-card">
                <h4>{agent.role.replace(/-/g, ' ')}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{agent.description}</p>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  temp: {agent.temperature} • retries: {agent.maxRetries}
                </div>
                <h3 style={{ fontSize: 11, marginBottom: 4 }}>CAPABILITIES</h3>
                <ul className="capabilities">
                  {agent.capabilities.map(c => <li key={c}>{c}</li>)}
                </ul>
                <h3 style={{ fontSize: 11, marginBottom: 4, marginTop: 8 }}>BOUNDARIES</h3>
                <ul className="boundaries">
                  {agent.boundaries.map(b => <li key={b}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: 12 }}>Gate Definitions</h3>
          <div className="grid">
            {Object.entries(gates).map(([id, gate]: [string, any]) => (
              <div key={id} className="card">
                <h4>{gate.name}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{gate.description}</p>
                <ul style={{ listStyle: 'none', fontSize: 13 }}>
                  {gate.validators?.map((v: any, i: number) => (
                    <li key={i} style={{ padding: '2px 0' }}>
                      <code style={{ color: 'var(--accent)' }}>{v.field}</code>
                      <span style={{ color: 'var(--text-secondary)' }}> — {v.rule}: </span>
                      <span>{v.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
