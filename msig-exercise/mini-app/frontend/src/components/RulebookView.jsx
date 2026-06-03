import { useState, useEffect } from 'react'

function RulebookView() {
  const [rulebook, setRulebook] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rulebook')
      .then(res => res.json())
      .then(data => {
        setRulebook(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading rulebook...</div>
  if (!rulebook) return <div className="loading">Failed to load rulebook</div>

  return (
    <div>
      {/* Workflow Pipeline */}
      <div className="card">
        <h2>Workflow Pipeline</h2>
        <div className="pipeline">
          {rulebook.workflow.map((step, idx) => (
            <div key={step.step} className="pipeline-step">
              <div className="step-box">
                <div className="step-num">Step {step.step}</div>
                <div className="step-name">{step.agent}</div>
              </div>
              {idx < rulebook.workflow.length - 1 && (
                <span className="gate-arrow">→ 🚪 →</span>
              )}
            </div>
          ))}
        </div>
        <h3>Gates</h3>
        <p style={{ fontSize: '0.85rem', color: '#888' }}>
          {rulebook.gates.join(' → ')}
        </p>
      </div>

      {/* Agent Roles */}
      <div className="card">
        <h2>Agent Roles</h2>
        <div className="roles-grid">
          {Object.entries(rulebook.roles).map(([name, role]) => (
            <div key={name} className="role-card">
              <h4>{name.replace('-', ' ')}</h4>
              <div className="does">✅ {role.does}</div>
              <div className="produces">
                Produces: {role.produces.map(p => (
                  <span key={p}>{p}</span>
                ))}
              </div>
              <div className="cannot">
                ❌ Cannot: {role.cannotDo.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RulebookView
