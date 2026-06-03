import { useState, useEffect } from 'react'

function TasksManager() {
  const [tasks, setTasks] = useState([])
  const [name, setName] = useState('')
  const [status, setStatus] = useState('active')
  const [error, setError] = useState('')

  const fetchTasks = () => {
    fetch('/tasks')
      .then(res => res.json())
      .then(data => setTasks(data.data || []))
      .catch(() => setError('Cannot connect to backend. Is server.js running on port 4000?'))
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const addTask = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), status })
    })
      .then(res => res.json())
      .then(() => {
        setName('')
        fetchTasks()
      })
      .catch(() => setError('Failed to add task'))
  }

  const deleteTask = (id) => {
    if (!confirm('Delete this task?')) return

    fetch(`/tasks/${id}`, { method: 'DELETE' })
      .then(() => fetchTasks())
      .catch(() => setError('Failed to delete task'))
  }

  return (
    <div>
      <div className="card">
        <h2>Tasks Manager</h2>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
          Live CRUD against the generated Express API (port 4000)
        </p>

        {error && (
          <div style={{ color: '#e57373', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form className="task-form" onSubmit={addTask}>
          <input
            type="text"
            placeholder="Task name..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit">Add Task</button>
        </form>

        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className="task-item">
              <div className="task-info">
                <span className="task-name">{task.name}</span>
                <span className={`task-status ${task.status}`}>{task.status}</span>
              </div>
              <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                Delete
              </button>
            </li>
          ))}
          {tasks.length === 0 && !error && (
            <li style={{ color: '#888', padding: '1rem', textAlign: 'center' }}>
              No tasks yet. Add one above!
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default TasksManager
