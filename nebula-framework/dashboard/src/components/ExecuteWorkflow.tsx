import { useState, useEffect } from 'react'

interface Workflow {
  id: string
  name: string
  description: string
  stepCount: number
  agents: string[]
}

interface WorkflowDetail {
  id: string
  name: string
  description: string
  steps: Array<{
    id: string
    order: number
    agent: string
    gate: string
    dependsOn: string[]
    config: { timeout: number; retries: number; retryDelay: number }
  }>
  gates: Record<string, {
    id: string
    name: string
    description: string
    validators: Array<{ field: string; rule: string; value?: number; message: string }>
  }>
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
  const [workflowDetail, setWorkflowDetail] = useState<WorkflowDetail | null>(null)

  // Rich input state
  const [inputMode, setInputMode] = useState<'jira' | 'manual'>('jira')
  const [jiraId, setJiraId] = useState('')
  const [jiraStories, setJiraStories] = useState<any[]>([])
  const [selectedStory, setSelectedStory] = useState<any>(null)
  const [jiraLoading, setJiraLoading] = useState(false)
  const [manualInput, setManualInput] = useState({
    title: '',
    description: '',
    acceptanceCriteria: [''],
    constraints: [''],
    storyId: '',
  })

  useEffect(() => {
    fetch('/api/workflows')
      .then(r => r.json())
      .then(d => setWorkflows(d.workflows))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedWorkflow) {
      fetch(`/api/workflows/${selectedWorkflow}`)
        .then(r => r.json())
        .then(d => setWorkflowDetail(d))
        .catch(() => setWorkflowDetail(null))
    }
  }, [selectedWorkflow])

  // Fetch JIRA stories
  const searchJira = async () => {
    if (!jiraId.trim()) return
    setJiraLoading(true)
    try {
      const res = await fetch(`/api/jira/search?query=${encodeURIComponent(jiraId.trim())}`)
      const data = await res.json()
      if (data.stories) setJiraStories(data.stories)
    } catch (e) {
      setJiraStories([])
    } finally {
      setJiraLoading(false)
    }
  }

  const selectStory = (story: any) => {
    setSelectedStory(story)
    setFeatureName(story.title)
  }

  // Manual input helpers
  const addCriteria = () => setManualInput(p => ({ ...p, acceptanceCriteria: [...p.acceptanceCriteria, ''] }))
  const updateCriteria = (i: number, val: string) => setManualInput(p => ({ ...p, acceptanceCriteria: p.acceptanceCriteria.map((c, idx) => idx === i ? val : c) }))
  const removeCriteria = (i: number) => setManualInput(p => ({ ...p, acceptanceCriteria: p.acceptanceCriteria.filter((_, idx) => idx !== i) }))
  const addConstraint = () => setManualInput(p => ({ ...p, constraints: [...p.constraints, ''] }))
  const updateConstraint = (i: number, val: string) => setManualInput(p => ({ ...p, constraints: p.constraints.map((c, idx) => idx === i ? val : c) }))
  const removeConstraint = (i: number) => setManualInput(p => ({ ...p, constraints: p.constraints.filter((_, idx) => idx !== i) }))

  const getExecutePayload = () => {
    if (inputMode === 'jira' && selectedStory) {
      return {
        workflow: selectedWorkflow,
        featureName: selectedStory.title,
        context: {
          storyId: selectedStory.id,
          description: selectedStory.description,
          acceptanceCriteria: selectedStory.acceptanceCriteria,
          constraints: selectedStory.constraints || [],
          priority: selectedStory.priority,
          source: 'jira',
        }
      }
    }
    return {
      workflow: selectedWorkflow,
      featureName: manualInput.title.trim(),
      context: {
        storyId: manualInput.storyId || undefined,
        description: manualInput.description,
        acceptanceCriteria: manualInput.acceptanceCriteria.filter(c => c.trim()),
        constraints: manualInput.constraints.filter(c => c.trim()),
        source: 'manual',
      }
    }
  }

  const canExecute = () => {
    if (inputMode === 'jira') return !!selectedStory
    return manualInput.title.trim().length > 0 && manualInput.acceptanceCriteria.some(c => c.trim())
  }

  const execute = async () => {
    if (!canExecute()) return
    setLoading(true)
    setError('')
    setResult(null)
    setExpandedStep(null)

    try {
      const payload = getExecutePayload()
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      {/* Workflow Selector */}
      <div className="execute-panel" style={{ marginBottom: 16 }}>
        <select value={selectedWorkflow} onChange={e => setSelectedWorkflow(e.target.value)}>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.stepCount} steps)</option>
          ))}
        </select>
      </div>

      {/* Input Mode Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        <button
          onClick={() => setInputMode('jira')}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border)', borderRadius: '6px 0 0 6px',
            background: inputMode === 'jira' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: inputMode === 'jira' ? 'white' : 'var(--text-secondary)',
          }}
        >
          📋 From JIRA
        </button>
        <button
          onClick={() => setInputMode('manual')}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 6px 6px 0',
            background: inputMode === 'manual' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: inputMode === 'manual' ? 'white' : 'var(--text-secondary)',
          }}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {/* JIRA Mode */}
      {inputMode === 'jira' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
            Search for a JIRA story/task to execute
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Enter JIRA ID (e.g. PROJ-1234) or search by keyword..."
              value={jiraId}
              onChange={e => setJiraId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchJira()}
              style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
            />
            <button onClick={searchJira} disabled={jiraLoading || !jiraId.trim()} style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>
              {jiraLoading ? '...' : '🔍 Search'}
            </button>
          </div>

          {/* JIRA Results */}
          {jiraStories.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {jiraStories.map(story => (
                <div
                  key={story.id}
                  onClick={() => selectStory(story)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    background: selectedStory?.id === story.id ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                    border: selectedStory?.id === story.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: 4 }}>{story.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{story.title}</span>
                    <span style={{ fontSize: 11, marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, background: story.priority === 'high' ? 'rgba(239,68,68,0.1)' : story.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: story.priority === 'high' ? 'var(--accent-red)' : story.priority === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{story.priority}</span>
                  </div>
                  {story.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{story.description}</div>}
                  {story.acceptanceCriteria?.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {story.acceptanceCriteria.length} acceptance criteria • {story.storyPoints || '-'} pts
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected Story Detail */}
          {selectedStory && (
            <div style={{ marginTop: 12, padding: 14, borderRadius: 8, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>SELECTED: {selectedStory.id}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{selectedStory.title}</div>
              {selectedStory.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{selectedStory.description}</div>}
              {selectedStory.acceptanceCriteria?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>ACCEPTANCE CRITERIA:</div>
                  {selectedStory.acceptanceCriteria.map((ac: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '3px 0', paddingLeft: 12, borderLeft: '2px solid var(--accent-green)' }}>✓ {ac}</div>
                  ))}
                </div>
              )}
              {selectedStory.constraints?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>CONSTRAINTS:</div>
                  {selectedStory.constraints.map((c: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--accent-yellow)', padding: '2px 0' }}>⚠ {c}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {inputMode === 'manual' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Story ID (optional) */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>STORY/TASK ID (optional)</label>
              <input
                type="text"
                placeholder="e.g. PROJ-1234"
                value={manualInput.storyId}
                onChange={e => setManualInput(p => ({ ...p, storyId: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>FEATURE / STORY TITLE *</label>
              <input
                type="text"
                placeholder="e.g. User authentication with email and password"
                value={manualInput.title}
                onChange={e => setManualInput(p => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <textarea
                placeholder="Describe the feature, user need, or business context..."
                value={manualInput.description}
                onChange={e => setManualInput(p => ({ ...p, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            {/* Acceptance Criteria */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                ACCEPTANCE CRITERIA * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— what must be true for this to be "done"</span>
              </label>
              {manualInput.acceptanceCriteria.map((criteria, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: 'var(--accent-green)', lineHeight: '34px', fontSize: 13 }}>✓</span>
                  <input
                    type="text"
                    placeholder={`e.g. ${['User can login with email/password', 'Invalid credentials show error', 'Session expires after 30 minutes', 'Password must be hashed'][i] || 'Add criteria...'}`}
                    value={criteria}
                    onChange={e => updateCriteria(i, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
                  />
                  {manualInput.acceptanceCriteria.length > 1 && (
                    <button onClick={() => removeCriteria(i)} style={{ padding: '4px 8px', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 16 }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addCriteria} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>+ Add criteria</button>
            </div>

            {/* Constraints */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                CONSTRAINTS <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— limitations, existing systems, tech requirements</span>
              </label>
              {manualInput.constraints.map((constraint, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: 'var(--accent-yellow)', lineHeight: '34px', fontSize: 13 }}>⚠</span>
                  <input
                    type="text"
                    placeholder={`e.g. ${['Must use existing auth service', 'PostgreSQL database only', 'No external dependencies'][i] || 'Add constraint...'}`}
                    value={constraint}
                    onChange={e => updateConstraint(i, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
                  />
                  {manualInput.constraints.length > 1 && (
                    <button onClick={() => removeConstraint(i)} style={{ padding: '4px 8px', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 16 }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addConstraint} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>+ Add constraint</button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={execute} disabled={loading || !canExecute()} style={{
          width: '100%', padding: '14px 24px', fontSize: 14, fontWeight: 700,
          background: canExecute() ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
          color: canExecute() ? 'white' : 'var(--text-muted)',
          border: 'none', borderRadius: 8, cursor: canExecute() ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}>
          {loading ? <><span className="spinner"></span>Running Pipeline...</> : `Execute Pipeline → ${selectedWorkflow} (${workflowDetail?.steps.length || '?'} steps)`}
        </button>
      </div>

      {/* Pipeline Preview - Steps & Rules */}
      {workflowDetail && !result && !loading && (
        <div className="pipeline-preview" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pipeline Steps &amp; Quality Gates
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {workflowDetail.steps.length} steps • {Object.keys(workflowDetail.gates).length} gates
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {workflowDetail.steps.map((step, i) => {
              const gate = workflowDetail.gates[step.gate]
              return (
                <div key={step.id} style={{ display: 'flex', gap: 12 }}>
                  {/* Connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                      background: ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'][i % 8]
                    }}>
                      {step.order}
                    </div>
                    {i < workflowDetail.steps.length - 1 && (
                      <div style={{ width: 2, flexGrow: 1, minHeight: 12, background: 'var(--border, #334155)' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{
                    flex: 1, padding: '10px 14px', marginBottom: 8, borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border, #334155)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{getAgentIcon(step.agent)}</span>
                        <strong style={{ textTransform: 'capitalize', fontSize: 13 }}>
                          {step.agent.replace(/-/g, ' ')}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                          {step.config.retries} retries
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                          {step.config.timeout / 1000}s timeout
                        </span>
                      </div>
                    </div>
                    {gate && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--accent-yellow, #f59e0b)', fontWeight: 600, marginBottom: 4 }}>
                          🚧 {gate.name}: {gate.description}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {gate.validators.map((v, vi) => (
                            <span key={vi} style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 4,
                              background: 'rgba(245,158,11,0.1)', color: 'var(--text-secondary, #94a3b8)',
                              border: '1px solid rgba(245,158,11,0.2)'
                            }}>
                              {v.message}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {step.dependsOn.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        Depends on: {step.dependsOn.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
