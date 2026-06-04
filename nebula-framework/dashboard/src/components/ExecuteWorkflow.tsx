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

  // Input modes: quick (natural language), jira, csv, manual
  const [inputMode, setInputMode] = useState<'quick' | 'jira' | 'csv' | 'manual'>('quick')
  const [quickInput, setQuickInput] = useState('')
  const [jiraId, setJiraId] = useState('')
  const [jiraStories, setJiraStories] = useState<any[]>([])
  const [selectedStory, setSelectedStory] = useState<any>(null)
  const [jiraLoading, setJiraLoading] = useState(false)
  const [csvTasks, setCsvTasks] = useState<any[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [manualInput, setManualInput] = useState({
    title: '',
    description: '',
    acceptanceCriteria: [''],
    constraints: [''],
    storyId: '',
  })
  // Quick input suggestions
  const [suggestions] = useState([
    { label: 'User Login', text: 'User authentication - users can login with email/password, invalid creds show error, session expires in 30 min' },
    { label: 'CRUD Policies', text: 'Policy management - create, read, update, delete insurance policies with audit logging' },
    { label: 'Claims Submit', text: 'Claims submission - users upload documents, system validates against policy, email notification on submit' },
    { label: 'Payment', text: 'Payment integration with Stripe - pay premium online, retry failed payments, generate receipts' },
  ])

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

  // Auto-load JIRA stories on mount
  useEffect(() => {
    fetch('/api/jira/search?query=')
      .then(r => r.json())
      .then(d => { if (d.stories) setJiraStories(d.stories) })
      .catch(() => {})
  }, [])

  // JIRA search with debounce
  useEffect(() => {
    if (inputMode !== 'jira') return
    const timer = setTimeout(() => {
      fetch(`/api/jira/search?query=${encodeURIComponent(jiraId.trim())}`)
        .then(r => r.json())
        .then(d => { if (d.stories) setJiraStories(d.stories) })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [jiraId, inputMode])

  const selectStory = (story: any) => {
    setSelectedStory(story)
    setFeatureName(story.title)
  }

  // CSV upload handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const tasks = lines.slice(1).map(line => {
        const values = parseCsvLine(line)
        const task: any = {}
        headers.forEach((h, i) => { task[h] = values[i]?.trim() || '' })
        // Normalize field names
        task.title = task.title || task.story || task.feature || task.name || ''
        task.description = task.description || task.desc || ''
        task.acceptanceCriteria = (task.acceptance_criteria || task.criteria || task.ac || '')
          .split(';').map((s: string) => s.trim()).filter(Boolean)
        task.constraints = (task.constraints || task.constraint || '')
          .split(';').map((s: string) => s.trim()).filter(Boolean)
        task.id = task.id || task.story_id || task.jira_id || ''
        task.priority = task.priority || 'medium'
        return task
      }).filter(t => t.title)
      setCsvTasks(tasks)
    }
    reader.readAsText(file)
  }

  // Parse CSV line (handles quoted values with commas)
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { result.push(current); current = '' }
      else { current += char }
    }
    result.push(current)
    return result
  }

  // Manual input helpers
  const addCriteria = () => setManualInput(p => ({ ...p, acceptanceCriteria: [...p.acceptanceCriteria, ''] }))
  const updateCriteria = (i: number, val: string) => setManualInput(p => ({ ...p, acceptanceCriteria: p.acceptanceCriteria.map((c, idx) => idx === i ? val : c) }))
  const removeCriteria = (i: number) => setManualInput(p => ({ ...p, acceptanceCriteria: p.acceptanceCriteria.filter((_, idx) => idx !== i) }))
  const addConstraint = () => setManualInput(p => ({ ...p, constraints: [...p.constraints, ''] }))
  const updateConstraint = (i: number, val: string) => setManualInput(p => ({ ...p, constraints: p.constraints.map((c, idx) => idx === i ? val : c) }))
  const removeConstraint = (i: number) => setManualInput(p => ({ ...p, constraints: p.constraints.filter((_, idx) => idx !== i) }))

  const getExecutePayload = () => {
    if (inputMode === 'quick') {
      return {
        workflow: selectedWorkflow,
        featureName: quickInput.split('-')[0]?.trim() || quickInput.slice(0, 50),
        context: {
          description: quickInput,
          acceptanceCriteria: quickInput.split(',').map(s => s.trim()).filter(s => s.length > 5),
          source: 'quick',
        }
      }
    }
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
    if (inputMode === 'csv' && csvTasks.length > 0) {
      const task = csvTasks[0] // Execute first task (batch later)
      return {
        workflow: selectedWorkflow,
        featureName: task.title,
        context: {
          storyId: task.id,
          description: task.description,
          acceptanceCriteria: task.acceptanceCriteria,
          constraints: task.constraints,
          source: 'csv',
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
    if (inputMode === 'quick') return quickInput.trim().length > 5
    if (inputMode === 'jira') return !!selectedStory
    if (inputMode === 'csv') return csvTasks.length > 0
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
      {/* Workflow Selector — visual cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
        {workflows.map(w => (
          <div
            key={w.id}
            onClick={() => setSelectedWorkflow(w.id)}
            style={{
              padding: '12px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              background: selectedWorkflow === w.id ? 'rgba(59,130,246,0.12)' : 'var(--bg-tertiary)',
              border: selectedWorkflow === w.id ? '2px solid var(--accent)' : '2px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', border: selectedWorkflow === w.id ? '5px solid var(--accent)' : '2px solid var(--text-muted)',
                background: selectedWorkflow === w.id ? 'white' : 'transparent', flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: selectedWorkflow === w.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{w.name}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 24 }}>
              {w.stepCount} steps • {w.agents?.map(a => a.split('-')[0]).join(' → ')}
            </div>
          </div>
        ))}
      </div>

      {/* Input Mode Tabs — 4 modes */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        {[
          { id: 'quick' as const, icon: '⚡', label: 'Quick Start' },
          { id: 'jira' as const, icon: '📋', label: 'From JIRA' },
          { id: 'csv' as const, icon: '📁', label: 'Upload CSV' },
          { id: 'manual' as const, icon: '✏️', label: 'Detailed' },
        ].map((mode, i, arr) => (
          <button
            key={mode.id}
            onClick={() => setInputMode(mode.id)}
            style={{
              padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid var(--border)',
              borderLeft: i === 0 ? '1px solid var(--border)' : 'none',
              borderRadius: i === 0 ? '6px 0 0 6px' : i === arr.length - 1 ? '0 6px 6px 0' : '0',
              background: inputMode === mode.id ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: inputMode === mode.id ? 'white' : 'var(--text-secondary)',
            }}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* ═══ QUICK START MODE ═══ */}
      {inputMode === 'quick' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Just describe what you want to build in plain English. One line is enough.
          </div>
          <textarea
            placeholder="e.g. User login with email/password, show error on invalid creds, expire session after 30 min..."
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && canExecute()) { e.preventDefault(); execute() } }}
            rows={3}
            style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
          />
          {/* Quick suggestions — one click to fill */}
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: '26px' }}>Try:</span>
            {suggestions.map(s => (
              <button
                key={s.label}
                onClick={() => setQuickInput(s.text)}
                style={{ padding: '4px 10px', fontSize: 11, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ JIRA MODE ═══ */}
      {inputMode === 'jira' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 Type to filter stories (by ID, title, or keyword)..."
            value={jiraId}
            onChange={e => setJiraId(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, marginBottom: 12 }}
          />

          {/* Story list — instant click to select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
            {jiraStories.map(story => (
              <div
                key={story.id}
                onClick={() => selectStory(story)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: selectedStory?.id === story.id ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                  border: selectedStory?.id === story.id ? '1px solid var(--accent)' : '1px solid transparent',
                  transition: 'all 0.1s',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap' }}>{story.id}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{story.title}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: story.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: story.priority === 'high' ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>{story.priority}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{story.acceptanceCriteria?.length || 0} AC</span>
              </div>
            ))}
          </div>

          {/* Selected story preview — compact */}
          {selectedStory && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>{selectedStory.id} — Ready to execute</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{selectedStory.description}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedStory.acceptanceCriteria?.map((ac: string, i: number) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>✓ {ac}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CSV UPLOAD MODE ═══ */}
      {inputMode === 'csv' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Upload a CSV file with your tasks. Column headers should include: <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>title</code>, <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>description</code>, <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>acceptance_criteria</code> (semicolon-separated)
          </div>

          {/* Upload area */}
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px', border: '2px dashed var(--border)', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-primary)', transition: 'all 0.2s', marginBottom: 12,
          }}>
            <span style={{ fontSize: 24, marginBottom: 6 }}>📁</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {csvFileName ? `✓ ${csvFileName} (${csvTasks.length} tasks)` : 'Click to upload CSV or drag & drop'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Supports .csv files</span>
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
          </label>

          {/* Sample CSV format */}
          {!csvFileName && (
            <div style={{ padding: 10, background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>SAMPLE CSV FORMAT:</div>
              <pre style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, overflow: 'auto', lineHeight: 1.6 }}>
{`title,description,acceptance_criteria,constraints,priority
User Login,Auth with email/pwd,User can login;Invalid creds show error;Session expires 30min,Must use bcrypt,high
Policy CRUD,Manage policies,Create policy;View details;Delete policy,PostgreSQL only,medium`}
              </pre>
            </div>
          )}

          {/* CSV parsed results */}
          {csvTasks.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--accent-green)', marginBottom: 8, fontWeight: 600 }}>✓ {csvTasks.length} tasks loaded — will execute sequentially</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {csvTasks.map((task, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: i === 0 ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)', border: i === 0 ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text-muted)', width: 20 }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{task.title}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{task.acceptanceCriteria?.length || 0} AC</span>
                    {i === 0 && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>NEXT →</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ DETAILED MANUAL MODE ═══ */}
      {inputMode === 'manual' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>STORY ID</label>
                <input type="text" placeholder="PROJ-1234" value={manualInput.storyId} onChange={e => setManualInput(p => ({ ...p, storyId: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TITLE *</label>
                <input type="text" placeholder="User authentication with email and password" value={manualInput.title} onChange={e => setManualInput(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <textarea placeholder="Business context or user need..." value={manualInput.description} onChange={e => setManualInput(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ACCEPTANCE CRITERIA *</label>
              {manualInput.acceptanceCriteria.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent-green)', lineHeight: '30px', fontSize: 12 }}>✓</span>
                  <input type="text" placeholder={['User can login with email/password', 'Invalid credentials show error', 'Session expires after 30 min'][i] || 'Add criteria...'} value={c} onChange={e => updateCriteria(i, e.target.value)} style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 12 }} />
                  {manualInput.acceptanceCriteria.length > 1 && <button onClick={() => removeCriteria(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 14 }}>×</button>}
                </div>
              ))}
              <button onClick={addCriteria} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CONSTRAINTS</label>
              {manualInput.constraints.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent-yellow)', lineHeight: '30px', fontSize: 12 }}>⚠</span>
                  <input type="text" placeholder={['Must use existing auth service', 'PostgreSQL only'][i] || 'Add constraint...'} value={c} onChange={e => updateConstraint(i, e.target.value)} style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 12 }} />
                  {manualInput.constraints.length > 1 && <button onClick={() => removeConstraint(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 14 }}>×</button>}
                </div>
              ))}
              <button onClick={addConstraint} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
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

          {/* Framework Source Indicator */}
          <div style={{ padding: '8px 12px', marginBottom: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Powered by nebula-agents framework</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              — System prompts loaded from nebula-agents/agents/*/SKILL.md at runtime
            </span>
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
                        <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                          📂 nebula-agents/agents/{step.agent}/SKILL.md
                        </div>
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
