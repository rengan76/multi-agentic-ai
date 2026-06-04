import { useState, useEffect } from 'react'

interface Workflow {
  id: string
  name: string
  description: string
  stepCount: number
  agents: string[]
}

interface StepResult {
  id: string
  agent: string
  status: string
  gateResult: { passed: boolean; violations: Array<{ message: string }> } | null
  llmCalls: number
  duration: number | null
}

interface ExecutionResult {
  executionId: string
  status: string
  steps: StepResult[]
  artifacts: Record<string, any>
  duration: number | null
}

// Generates human-readable summary for each agent's output
function summarizeArtifact(agent: string, data: any): string[] {
  if (!data) return ['No output generated']

  switch (agent) {
    case 'product-manager':
      return [
        `Defined ${data.stories?.length || 0} user stories for "${data.feature}" feature`,
        ...(data.stories || []).slice(0, 3).map((s: any) => `• ${s.id}: ${s.title} (${s.priority} priority)`),
        `${data.nonFunctional?.length || 0} non-functional requirements specified`,
        `Scope boundaries: ${data.outOfScope?.length || 0} items explicitly excluded`,
      ]
    case 'architect':
      return [
        `Designed ${data.endpoints?.length || 0} API endpoints using ${data.architecture?.pattern || 'REST'}`,
        ...(data.endpoints || []).slice(0, 3).map((e: any) => `• ${e.method} ${e.path} — ${e.description}`),
        `Data model: "${data.dataModel?.tableName}" table with ${data.dataModel?.columns?.length || 0} columns`,
        `${data.decisions?.length || 0} architectural decisions documented`,
      ]
    case 'backend-developer':
      return [
        `Generated ${data.files?.length || 0} implementation files`,
        ...(data.files || []).map((f: any) => `• ${f.path} — ${f.description}`),
        `${data.migrations?.length || 0} database migration(s) created`,
      ]
    case 'qa-engineer':
      return [
        `Test plan: ${data.testPlan?.totalCases || 0} test cases across ${data.testPlan?.categories?.join(', ')}`,
        ...(data.results || []).map((r: any) => `• ${r.suite}: ${r.passed}/${r.tests} passed (${r.coverage} coverage)`),
        data.allPassed ? '✓ All tests passing — ready for deployment' : '✗ Some tests failed — needs attention',
      ]
    case 'code-reviewer':
      return [
        `Review result: ${data.reviewResult || 'pending'}`,
        `${data.findings?.length || 0} findings (${data.findings?.filter((f: any) => f.severity === 'error').length || 0} errors)`,
        ...(data.securityChecks || []).map((c: any) => `• ${c.check}: ${c.status === 'pass' ? '✓' : '✗'} ${c.note}`),
        data.approved ? '✓ Code approved for merge' : '✗ Changes requested',
      ]
    default:
      return [`Generated output with ${Object.keys(data).length} fields`]
  }
}

function getAgentIcon(agent: string): string {
  const icons: Record<string, string> = {
    'product-manager': '📋',
    'architect': '🏗️',
    'backend-developer': '💻',
    'frontend-developer': '🎨',
    'qa-engineer': '🧪',
    'code-reviewer': '🔍',
    'security': '🔒',
    'devops': '🚀',
  }
  return icons[agent] || '⚙️'
}

export function ExecuteWorkflow() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState('feature')
  const [featureName, setFeatureName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState('')
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workflows')
      .then(r => r.json())
      .then(d => setWorkflows(d.workflows))
      .catch(() => {})
  }, [])

  const execute = async () => {
    if (!featureName.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setExpandedStep(null)

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: selectedWorkflow, featureName: featureName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="execute-panel">
        <select value={selectedWorkflow} onChange={e => setSelectedWorkflow(e.target.value)}>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.stepCount} steps)</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Feature name (e.g. policies, claims, users)..."
          value={featureName}
          onChange={e => setFeatureName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && execute()}
        />
        <button onClick={execute} disabled={loading || !featureName.trim()}>
          {loading ? <><span className="spinner"></span>Running Pipeline...</> : 'Execute Pipeline'}
        </button>
      </div>

      {error && <div style={{ color: 'var(--accent-red)', marginBottom: 16, fontSize: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>⚠ {error}</div>}

      {loading && (
        <div className="pipeline">
          {workflows.find(w => w.id === selectedWorkflow)?.agents.map((agent, i, arr) => (
            <div key={agent} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="pipeline-node active">
                <span className="role">Step {i + 1}</span>
                <span className="agent">{getAgentIcon(agent)} {agent.replace(/-/g, ' ')}</span>
              </div>
              {i < arr.length - 1 && <span className="pipeline-arrow">→</span>}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="result">
          {/* Header */}
          <div className="result-header">
            <div>
              <h3 style={{ marginBottom: 4, fontSize: 18 }}>
                {result.status === 'completed' ? '✅' : '❌'} Pipeline {result.status === 'completed' ? 'Complete' : 'Failed'}
              </h3>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {result.executionId.slice(0, 8)} • {result.duration ? `${(result.duration / 1000).toFixed(1)}s total` : ''}
              </span>
            </div>
            <span className={`status ${result.status}`}>{result.status}</span>
          </div>

          {/* Metrics */}
          <div className="metrics">
            <div className="metric">
              <div className="value">{result.steps.length}</div>
              <div className="label">Pipeline Steps</div>
            </div>
            <div className="metric">
              <div className="value">{result.steps.filter(s => s.status === 'passed').length}</div>
              <div className="label">Gates Passed</div>
            </div>
            <div className="metric">
              <div className="value">{result.steps.reduce((acc, s) => acc + s.llmCalls, 0)}</div>
              <div className="label">LLM Calls</div>
            </div>
            <div className="metric">
              <div className="value">{result.duration ? `${(result.duration / 1000).toFixed(1)}s` : '-'}</div>
              <div className="label">Total Duration</div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="timeline">
            {result.steps.map((step, i) => (
              <div key={step.id} className={`timeline-step ${step.status}`}>
                <div className="timeline-connector">
                  <div className={`timeline-dot ${step.status}`} />
                  {i < result.steps.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content" onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}>
                  <div className="timeline-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{getAgentIcon(step.agent)}</span>
                      <div>
                        <strong style={{ textTransform: 'capitalize' }}>{step.agent.replace(/-/g, ' ')}</strong>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                          Step {i + 1} • {step.duration ? `${(step.duration / 1000).toFixed(1)}s` : ''} • {step.llmCalls} LLM call{step.llmCalls !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: step.gateResult?.passed ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                      {step.gateResult?.passed ? '✓ GATE PASSED' : step.gateResult ? '✗ GATE FAILED' : ''}
                    </span>
                  </div>

                  {/* Human-readable summary */}
                  <div className="timeline-summary">
                    {summarizeArtifact(step.agent, result.artifacts[step.agent]).map((line, j) => (
                      <div key={j} className="summary-line">{line}</div>
                    ))}
                  </div>

                  {/* Expandable raw output */}
                  {expandedStep === step.id && result.artifacts[step.agent] && (
                    <div className="timeline-raw">
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>RAW OUTPUT</div>
                      <pre>{JSON.stringify(result.artifacts[step.agent], null, 2)}</pre>
                    </div>
                  )}

                  {expandedStep !== step.id && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Click to {expandedStep === step.id ? 'collapse' : 'expand'} raw output →
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
