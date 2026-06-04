import { useState, useEffect } from 'react'
import { AgentContracts } from './components/AgentContracts'
import { ExecuteWorkflow } from './components/ExecuteWorkflow'
import { EventStream } from './components/EventStream'
import { AdminPanel } from './components/AdminPanel'
import { TaskBoard } from './components/TaskBoard'
import { SkillsShowcase } from './components/SkillsShowcase'

interface HealthData {
  status: string
  version: string
  llmProvider: string
  providerChain: string[]
  uptime: number
}

type Tab = 'execute' | 'tasks' | 'agents' | 'history' | 'admin' | 'skills'

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('execute')

  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then(r => r.json())
        .then(setHealth)
        .catch(() => setHealth(null))
    }
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" stroke="url(#logo-grad)" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="16" r="4" fill="url(#logo-grad)"/>
            <circle cx="16" cy="6" r="2.5" fill="#3b82f6"/>
            <circle cx="24.5" cy="12" r="2.5" fill="#6366f1"/>
            <circle cx="24.5" cy="20" r="2.5" fill="#8b5cf6"/>
            <circle cx="16" cy="26" r="2.5" fill="#a855f7"/>
            <circle cx="7.5" cy="20" r="2.5" fill="#7c3aed"/>
            <circle cx="7.5" cy="12" r="2.5" fill="#4f46e5"/>
            <line x1="16" y1="6" x2="16" y2="12" stroke="#3b82f6" strokeWidth="1" opacity="0.5"/>
            <line x1="24.5" y1="12" x2="20" y2="14" stroke="#6366f1" strokeWidth="1" opacity="0.5"/>
            <line x1="24.5" y1="20" x2="20" y2="18" stroke="#8b5cf6" strokeWidth="1" opacity="0.5"/>
            <line x1="16" y1="26" x2="16" y2="20" stroke="#a855f7" strokeWidth="1" opacity="0.5"/>
            <line x1="7.5" y1="20" x2="12" y2="18" stroke="#7c3aed" strokeWidth="1" opacity="0.5"/>
            <line x1="7.5" y1="12" x2="12" y2="14" stroke="#4f46e5" strokeWidth="1" opacity="0.5"/>
          </svg>
          <h1>Nebula Agent Framework</h1>
        </div>
        <div className="health">
          <span className={`health-dot ${health ? '' : 'error'}`} />
          {health ? (
            <span>v{health.version} &bull; {health.llmProvider} provider &bull; {Math.floor(health.uptime)}s uptime</span>
          ) : (
            <span>Disconnected &mdash; start server on port 4000</span>
          )}
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'execute' ? 'active' : ''}`} onClick={() => setActiveTab('execute')}>
          Execute Workflow
        </button>
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          Task Board
        </button>
        <button className={`tab ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
          Agent Contracts
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Event Stream
        </button>
        <button className={`tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
          Admin
        </button>
        <button className={`tab ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')} style={{ background: activeTab === 'skills' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : undefined, color: activeTab === 'skills' ? 'white' : undefined }}>
          🧠 My Skills
        </button>
      </div>

      {activeTab === 'execute' && <ExecuteWorkflow />}
      {activeTab === 'tasks' && <TaskBoard />}
      {activeTab === 'agents' && <AgentContracts />}
      {activeTab === 'history' && <EventStream />}
      {activeTab === 'admin' && <AdminPanel />}
      {activeTab === 'skills' && <SkillsShowcase />}
    </div>
  )
}
