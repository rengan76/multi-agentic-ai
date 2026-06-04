import { useState, useEffect } from 'react'

interface Agent {
  role: string
  description: string
  capabilities: string[]
  boundaries: string[]
  temperature: number
  maxRetries: number
}

export function AgentContracts() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [gates, setGates] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents)).catch(() => {})
    fetch('/api/gates').then(r => r.json()).then(d => setGates(d.gates)).catch(() => {})
  }, [])

  if (!agents.length) return <div className="loading">Loading agent contracts...</div>

  return (
    <div>
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
    </div>
  )
}
