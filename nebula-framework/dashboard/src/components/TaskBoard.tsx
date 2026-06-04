import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'backlog' | 'ready' | 'in-progress' | 'executing' | 'done' | 'failed'
  source: 'manual' | 'jira' | 'github' | 'azure-devops'
  externalId: string | null
  externalUrl: string | null
  assignedWorkflow: string | null
  executionId: string | null
  labels: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface Workflow {
  id: string
  name: string
  agents: string[]
}

interface Integration {
  source: string
  name: string
  connected: boolean
  status: string
}

const PRIORITY_CONFIG = {
  critical: { icon: '🔴', color: '#ef4444' },
  high: { icon: '🟠', color: '#f97316' },
  medium: { icon: '🟡', color: '#eab308' },
  low: { icon: '🟢', color: '#22c55e' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  backlog: { label: 'Backlog', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  ready: { label: 'Ready', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  'in-progress': { label: 'In Progress', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  executing: { label: 'Executing...', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  done: { label: 'Done', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  failed: { label: 'Failed', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [executingTask, setExecutingTask] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [newWorkflow, setNewWorkflow] = useState('')
  const [newLabels, setNewLabels] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    Promise.all([
      fetch('/api/admin/tasks').then(r => r.json()),
      fetch('/api/workflows').then(r => r.json()),
      fetch('/api/admin/integrations').then(r => r.json()),
    ]).then(([taskData, wfData, intData]) => {
      setTasks(taskData.tasks || [])
      setWorkflows(wfData.workflows || [])
      setIntegrations(intData.integrations || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const createTask = async () => {
    if (!newTitle.trim()) return
    const resp = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        assignedWorkflow: newWorkflow || null,
        labels: newLabels ? newLabels.split(',').map(l => l.trim()) : [],
      }),
    })
    if (resp.ok) {
      setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewWorkflow(''); setNewLabels('')
      setShowCreateForm(false)
      loadData()
    }
  }

  const updateTaskStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadData()
  }

  const assignWorkflow = async (id: string, workflowId: string) => {
    await fetch(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedWorkflow: workflowId }),
    })
    loadData()
  }

  const executeTask = async (id: string) => {
    setExecutingTask(id)
    try {
      const resp = await fetch(`/api/admin/tasks/${id}/execute`, { method: 'POST' })
      const data = await resp.json()
      if (!resp.ok) {
        alert(data.error || 'Execution failed')
      }
    } catch {
      alert('Failed to execute task')
    } finally {
      setExecutingTask(null)
      loadData()
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
    loadData()
  }

  if (loading) return <div className="loading">Loading task board...</div>

  const columns: Record<string, Task[]> = {
    backlog: tasks.filter(t => t.status === 'backlog'),
    ready: tasks.filter(t => t.status === 'ready'),
    'in-progress': tasks.filter(t => ['in-progress', 'executing'].includes(t.status)),
    done: tasks.filter(t => ['done', 'failed'].includes(t.status)),
  }

  return (
    <div>
      {/* Header with integrations status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>📋 Task Board</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Create tasks manually or connect to Jira / GitHub to sync
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}
        >
          + New Task
        </button>
      </div>

      {/* Integration Status Badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {integrations.map(int => (
          <div key={int.source} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6,
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text-secondary)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: int.connected ? '#34d399' : '#64748b',
            }} />
            {int.name}
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {int.connected ? 'connected' : 'not configured'}
            </span>
          </div>
        ))}
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div style={{
          padding: 16, marginBottom: 20, borderRadius: 10,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>Create New Task</strong>
            <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <input
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Task title (e.g., 'Add user authentication')"
              style={inputStyle}
            />
            <textarea
              value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Description - what needs to be done..."
              rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} style={inputStyle}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assign Workflow</label>
                <select value={newWorkflow} onChange={e => setNewWorkflow(e.target.value)} style={inputStyle}>
                  <option value="">-- Select Pipeline --</option>
                  {workflows.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.agents.length} agents)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Labels (comma-sep)</label>
                <input value={newLabels} onChange={e => setNewLabels(e.target.value)} placeholder="frontend, auth" style={inputStyle} />
              </div>
            </div>

            {/* Pipeline preview */}
            {newWorkflow && (
              <div style={{ padding: 10, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>EXECUTION PIPELINE</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {workflows.find(w => w.id === newWorkflow)?.agents.map((agent, i, arr) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: 11, fontWeight: 500 }}>
                        {agent}
                      </span>
                      {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={createTask} disabled={!newTitle.trim()} style={{
              background: newTitle.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#374151',
              border: 'none', borderRadius: 8, padding: '10px', color: 'white',
              cursor: newTitle.trim() ? 'pointer' : 'not-allowed', fontWeight: 600,
            }}>
              Create Task
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(columns).map(([colKey, colTasks]) => (
          <div key={colKey} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_CONFIG[colKey]?.color || 'var(--text-primary)' }}>
                {colKey === 'in-progress' ? 'In Progress' : colKey.charAt(0).toUpperCase() + colKey.slice(1)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4 }}>
                {colTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  workflows={workflows}
                  executing={executingTask === task.id}
                  onStatusChange={(s) => updateTaskStatus(task.id, s)}
                  onAssignWorkflow={(wf) => assignWorkflow(task.id, wf)}
                  onExecute={() => executeTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
              {colTasks.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && !showCreateForm && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No tasks yet</div>
          <div style={{ fontSize: 12, marginBottom: 16 }}>Create tasks manually or connect Jira to sync your stories</div>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, padding: '10px 20px', color: 'white', cursor: 'pointer', fontWeight: 600 }}
          >
            Create Your First Task
          </button>
        </div>
      )}
    </div>
  )
}

// ── Task Card Component ──────────────────────────────────

function TaskCard({ task, workflows, executing, onStatusChange, onAssignWorkflow, onExecute, onDelete }: {
  task: Task
  workflows: Workflow[]
  executing: boolean
  onStatusChange: (status: string) => void
  onAssignWorkflow: (wf: string) => void
  onExecute: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const prio = PRIORITY_CONFIG[task.priority]
  const statusConf = STATUS_CONFIG[task.status]
  const assignedWf = workflows.find(w => w.id === task.assignedWorkflow)

  return (
    <div style={{
      background: 'var(--bg-primary)', borderRadius: 8, padding: 10,
      border: '1px solid var(--border)', cursor: 'pointer',
      transition: 'border-color 0.2s',
    }} onClick={() => setExpanded(!expanded)}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {task.title}
        </span>
        <span style={{ fontSize: 10, flexShrink: 0 }}>{prio.icon}</span>
      </div>

      {/* Source badge */}
      {task.source !== 'manual' && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {task.source}{task.externalId ? `: ${task.externalId}` : ''}
          </span>
        </div>
      )}

      {/* Workflow badge */}
      {assignedWf && (
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
          ⚙️ {assignedWf.name} ({assignedWf.agents.length} steps)
        </div>
      )}

      {/* Status badge */}
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 4,
          background: statusConf?.bg, color: statusConf?.color, fontWeight: 500,
        }}>
          {statusConf?.label}
        </span>
        {task.labels.length > 0 && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {task.labels.slice(0, 2).join(', ')}
          </span>
        )}
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
          {task.description && (
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.4 }}>
              {task.description}
            </p>
          )}

          {/* Assign workflow */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Pipeline</label>
            <select
              value={task.assignedWorkflow || ''}
              onChange={e => onAssignWorkflow(e.target.value)}
              style={{ ...inputStyle, fontSize: 11, padding: '4px 8px' }}
            >
              <option value="">-- None --</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Pipeline preview */}
          {assignedWf && (
            <div style={{ marginBottom: 8, padding: 6, background: 'var(--bg-secondary)', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>WILL EXECUTE:</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                {assignedWf.agents.map((agent, i, arr) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontSize: 9 }}>
                      {agent}
                    </span>
                    {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status change */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {task.status === 'backlog' && <MiniBtn label="Mark Ready" onClick={() => onStatusChange('ready')} color="#60a5fa" />}
            {task.status === 'ready' && <MiniBtn label="Start" onClick={() => onStatusChange('in-progress')} color="#a78bfa" />}
            {(task.status === 'ready' || task.status === 'in-progress') && task.assignedWorkflow && (
              <MiniBtn label={executing ? "Running..." : "▶ Execute"} onClick={onExecute} color="#34d399" disabled={executing} />
            )}
            {task.status === 'failed' && <MiniBtn label="Retry" onClick={() => onStatusChange('ready')} color="#fbbf24" />}
          </div>

          {/* External link */}
          {task.externalUrl && (
            <a href={task.externalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#60a5fa' }}>
              Open in {task.source} ↗
            </a>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 10, padding: '2px 4px' }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniBtn({ label, onClick, color, disabled }: { label: string; onClick: () => void; color: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '3px 8px', borderRadius: 4, border: `1px solid ${color}`,
      background: 'transparent', color, cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 10, fontWeight: 500, opacity: disabled ? 0.5 : 1,
    }}>
      {label}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--bg-primary)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'var(--text-muted)',
  marginBottom: 4, fontWeight: 500,
}
