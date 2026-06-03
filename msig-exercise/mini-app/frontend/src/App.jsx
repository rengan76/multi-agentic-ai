import { useState } from 'react'
import RulebookView from './components/RulebookView'
import TasksManager from './components/TasksManager'
import BuildSummary from './components/BuildSummary'

function App() {
  const [activeTab, setActiveTab] = useState('rulebook')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Workflow Viewer</h1>
        <p>Multi-Agent System: Rulebook, Pipeline & Generated App</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'rulebook' ? 'active' : ''}`}
          onClick={() => setActiveTab('rulebook')}
        >
          Rulebook & Workflow
        </button>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks Manager (Live)
        </button>
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Build Summary
        </button>
      </div>

      {activeTab === 'rulebook' && <RulebookView />}
      {activeTab === 'tasks' && <TasksManager />}
      {activeTab === 'summary' && <BuildSummary />}
    </div>
  )
}

export default App
