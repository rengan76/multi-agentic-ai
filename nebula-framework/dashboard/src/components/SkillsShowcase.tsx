import { useState } from 'react'

const SKILLS_DATA = {
  summary: `My experience level in AI Agentic Development and tech skills encompasses designing, building, and operating a production-grade multi-agent orchestration framework — from prompt engineering and LLM provider chains, through gate-based quality control, to full-stack dashboards that make agent pipelines visible and actionable.`,

  // What the person has BUILT / demonstrated
  demonstrated: [
    {
      category: 'Multi-Agent Orchestration',
      level: 'Advanced',
      evidence: [
        'Built sequential pipeline engine (Orchestrator) with automatic step progression',
        'Implemented 5 specialized agent roles with distinct system prompts and schemas',
        'Designed gate-based validation between pipeline steps (format + semantic checks)',
        'Created retry logic with violation feedback loop for self-correction',
        'Understood 11-agent framework (nebula-agents) with parallel + sequential phases',
      ],
    },
    {
      category: 'LLM Integration & Provider Management',
      level: 'Advanced',
      evidence: [
        'Implemented provider chain pattern: Azure OpenAI → OpenAI → Mock (graceful fallback)',
        'Structured prompts with role context, task instructions, and JSON output schemas',
        'Temperature tuning per agent role (creative vs analytical)',
        'Token-aware response parsing with retry on malformed JSON',
        'Understanding of model routing (Claude/GPT/Ollama for different task types)',
      ],
    },
    {
      category: 'Quality Gates & Validation',
      level: 'Intermediate-Advanced',
      evidence: [
        'Built gate engine with 5 validator types: required, minItems, minLength, matches, custom',
        'Understood 9 gate types from nebula-agents (approval, self-review, quality, readiness, signoff, tracker-sync, ontology-sync, done-review, editorial)',
        'Evidence-based validation with structured violation reporting',
        'Stage-aware gate progression (different evidence required per lifecycle stage)',
      ],
    },
    {
      category: 'Event-Driven Architecture',
      level: 'Intermediate-Advanced',
      evidence: [
        'Built event bus with typed events (workflow:started, step:completed, gate:passed, etc.)',
        'Server-Sent Events (SSE) for real-time dashboard streaming',
        'Event history with filtering (executionId, event type, limit)',
        'Decoupled persistence via event hooks (save on workflow:completed)',
      ],
    },
    {
      category: 'Full-Stack Dashboard Development',
      level: 'Advanced',
      evidence: [
        'React + Vite dashboard with multiple views (Execute, Admin, Events, Agents, Tasks)',
        'Visual workflow selector with radio cards and pipeline preview',
        'Multi-mode task input (Quick Start, JIRA, CSV, Manual)',
        'Admin panel with CRUD for workflows, gates, JIRA config, execution history',
        'Real-time event stream visualization',
      ],
    },
    {
      category: 'API Design & Backend Architecture',
      level: 'Advanced',
      evidence: [
        'RESTful Express API with proper error handling and logging (Pino)',
        'Clean separation: engine, agents, gates, events, LLM, DB layers',
        'Repository pattern with pluggable DB drivers (SQLite, PostgreSQL, MongoDB, In-Memory)',
        'Task provider integration pattern (JIRA, manual, external sources)',
        'CORS, middleware chain, request logging',
      ],
    },
    {
      category: 'Knowledge Graph & Semantic Architecture',
      level: 'Intermediate',
      evidence: [
        'Understanding of canonical-nodes, code-index, solution-ontology, symbol-index, coverage-report',
        'Knowledge of how KG enables impact analysis and drift detection',
        'Familiarity with validate.py scripts for graph reconciliation',
        'Concept of ownership model (architect owns semantic layer)',
      ],
    },
    {
      category: 'MCP (Model Context Protocol)',
      level: 'Beginner-Intermediate',
      evidence: [
        'Understanding of MCP server architecture (FastAPI, tools, prompts)',
        'Knowledge of tool categories: data tools, API tools, analysis tools',
        'Awareness of MCP as integration point between LLMs and domain applications',
        'Understanding of MCP server as secondary interface (not source of truth)',
      ],
    },
    {
      category: 'DevOps & Containerization',
      level: 'Intermediate',
      evidence: [
        'Docker + Docker Compose for service orchestration',
        'Multi-service setup (backend, dashboard, DB)',
        'Environment variable management and configuration',
        'Understanding of CI gate workflows and validation scripts',
      ],
    },
  ],

  // Gaps identified
  gaps: [
    {
      area: 'Real LLM Integration (Production)',
      severity: 'High',
      current: 'Using mock provider — all responses are hardcoded',
      fix: 'Configure Azure OpenAI or direct OpenAI API keys, test with real prompts, implement token budget management, add cost tracking',
      resources: ['OpenAI Cookbook', 'Azure OpenAI Quickstart', 'LangChain JS/TS docs'],
    },
    {
      area: 'Agent-to-Agent Communication',
      severity: 'High',
      current: 'Agents run sequentially with no inter-agent messaging',
      fix: 'Implement message passing between steps (artifacts as context), allow agents to query previous outputs, add parallel execution support',
      resources: ['CrewAI framework', 'AutoGen patterns', 'nebula-agents parallel execution model'],
    },
    {
      area: 'MCP Server Implementation',
      severity: 'Medium-High',
      current: 'Theoretical understanding only, no working MCP server',
      fix: 'Build a FastAPI MCP server with tool registration, implement data tools that query real DB, add prompt templates with few-shot examples',
      resources: ['Anthropic MCP docs', 'nebula-insurance-crm neuron/ scaffold', 'modelcontextprotocol.io'],
    },
    {
      area: 'Knowledge Graph Operations',
      severity: 'Medium',
      current: 'Conceptual understanding from reading nebula-agents docs',
      fix: 'Implement canonical-nodes.yaml binding, build validate.py equivalent in TypeScript, add drift detection between expected and actual code paths',
      resources: ['nebula-agents/scripts/kg/', 'Neo4j/GraphDB tutorials', 'AST parsing for symbol extraction'],
    },
    {
      area: 'Temporal/Durable Workflows',
      severity: 'Medium',
      current: 'Pipeline is synchronous single-request — no durable state or retry after crash',
      fix: 'Add Temporal.io or BullMQ for long-running workflows, implement workflow persistence that survives server restarts, add timeout and cancellation',
      resources: ['Temporal TypeScript SDK', 'BullMQ docs', 'nebula-insurance-crm ADR-010'],
    },
    {
      area: 'Human-in-the-Loop Gates',
      severity: 'Medium',
      current: 'All gates are automated format checks — no human approval workflow',
      fix: 'Add approval gate type that pauses pipeline and waits for human decision, implement WebSocket notification for pending approvals, add dashboard approval UI',
      resources: ['nebula-agents approval gate pattern', 'Slack/Teams webhook integration'],
    },
    {
      area: 'RAG (Retrieval Augmented Generation)',
      severity: 'Medium',
      current: 'No vector store or document retrieval for grounding prompts',
      fix: 'Add embeddings generation, implement vector search (pgvector/Pinecone/ChromaDB), build context injection from relevant docs into prompts',
      resources: ['LangChain RAG tutorial', 'ChromaDB docs', 'OpenAI embeddings API'],
    },
    {
      area: 'Agent Evaluation & Observability',
      severity: 'Low-Medium',
      current: 'No metrics on agent output quality, no A/B testing, basic logging only',
      fix: 'Add LLM call tracing (Langfuse/LangSmith), implement output quality scoring, track token usage/costs per execution, add evaluation datasets',
      resources: ['Langfuse docs', 'LangSmith', 'Braintrust eval framework'],
    },
    {
      area: 'Security Hardening',
      severity: 'Low-Medium',
      current: 'No auth on API endpoints, no input sanitization before LLM calls',
      fix: 'Add JWT/API key auth, implement prompt injection detection, add rate limiting, sanitize LLM outputs before storing/displaying',
      resources: ['OWASP LLM Top 10', 'Rebuff prompt injection detection'],
    },
  ],

  // Tech skills matrix
  techStack: {
    strong: ['TypeScript', 'Node.js/Express', 'React', 'REST API Design', 'Event-Driven Patterns', 'Git'],
    working: ['Docker', 'LLM APIs (OpenAI/Azure)', 'SSE/WebSocket', 'Vite', 'Jest Testing', 'Pino Logging'],
    learning: ['MCP Protocol', 'Knowledge Graphs', 'Temporal.io', 'Vector Databases', 'Python FastAPI', 'C# .NET'],
  },
}

// The component
export function SkillsShowcase() {
  const [activeTab, setActiveTab] = useState<'skills' | 'gaps' | 'code'>('skills')
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null)

  const levelColor = (level: string) => {
    if (level.includes('Advanced')) return 'var(--accent-green)'
    if (level.includes('Intermediate')) return 'var(--accent-yellow)'
    return 'var(--accent)'
  }

  const severityColor = (sev: string) => {
    if (sev === 'High') return 'var(--accent-red)'
    if (sev.includes('Medium')) return 'var(--accent-yellow)'
    return 'var(--accent)'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🧠 AI Agentic Development — Skills & Experience</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Based on building this framework + studying nebula-agents & nebula-insurance-crm codebases
        </p>
      </div>

      {/* Summary Card */}
      <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, marginBottom: 6 }}>MY EXPERIENCE LEVEL</div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{SKILLS_DATA.summary}</p>
      </div>

      {/* Tech Stack Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', letterSpacing: 1, marginBottom: 6 }}>STRONG</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SKILLS_DATA.techStack.strong.map(s => <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 3, background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>{s}</span>)}
          </div>
        </div>
        <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-yellow)', letterSpacing: 1, marginBottom: 6 }}>WORKING KNOWLEDGE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SKILLS_DATA.techStack.working.map(s => <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 3, background: 'rgba(245,158,11,0.1)', color: 'var(--accent-yellow)' }}>{s}</span>)}
          </div>
        </div>
        <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, marginBottom: 6 }}>LEARNING / EXPLORING</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SKILLS_DATA.techStack.learning.map(s => <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}>{s}</span>)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        {(['skills', 'gaps', 'code'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', background: activeTab === tab ? 'var(--accent)' : 'transparent', border: activeTab === tab ? 'none' : '1px solid var(--border)', borderRadius: 6, color: activeTab === tab ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {tab === 'skills' && '✓ Demonstrated Skills'}
            {tab === 'gaps' && '⚠ Gaps & Remediation'}
            {tab === 'code' && '📂 Code Evidence'}
          </button>
        ))}
      </div>

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SKILLS_DATA.demonstrated.map((skill, i) => (
            <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}
              onClick={() => setExpandedSkill(expandedSkill === i ? null : i)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{skill.category}</span>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: `${levelColor(skill.level)}20`, color: levelColor(skill.level), fontWeight: 600 }}>
                  {skill.level}
                </span>
              </div>
              {expandedSkill === i && (
                <ul style={{ marginTop: 10, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {skill.evidence.map((e, j) => <li key={j}>{e}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Gaps Tab */}
      {activeTab === 'gaps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SKILLS_DATA.gaps.map((gap, i) => (
            <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{gap.area}</span>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, fontWeight: 700, background: `${severityColor(gap.severity)}15`, color: severityColor(gap.severity) }}>
                  {gap.severity} Priority
                </span>
              </div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Current: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{gap.current}</span>
              </div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--accent-green)' }}>Fix: </span>
                <span style={{ color: 'var(--text-primary)' }}>{gap.fix}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {gap.resources.map((r, j) => (
                  <span key={j} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>📚 {r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Evidence Tab */}
      {activeTab === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>📁 nebula-framework/ (What I Built)</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><code>src/engine/orchestrator.ts</code> — Sequential pipeline with gate validation & retry</div>
              <div><code>src/agents/registry.ts</code> — 5 agent roles with contracts, schemas, boundaries</div>
              <div><code>src/gates/gate-engine.ts</code> — Validator engine (required, minItems, minLength, matches, custom)</div>
              <div><code>src/llm/</code> — Provider chain (Azure → OpenAI → Mock) with structured output</div>
              <div><code>src/events/event-bus.ts</code> — Typed event system with SSE streaming</div>
              <div><code>src/api/server.ts</code> — REST API with CRUD, admin, JIRA integration</div>
              <div><code>dashboard/</code> — React UI with workflow execution, admin panel, events</div>
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>📁 nebula-agents/ (Framework I Studied & Leveraged)</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><code>agents/agent-map.yaml</code> — 13 roles with read/write boundaries</div>
              <div><code>agents/actions/</code> — 12 orchestrated workflows (plan, build, feature, review...)</div>
              <div><code>agents/*/SKILL.md</code> — Agent identity, scope, responsibilities per role</div>
              <div><code>agents/scripts/kg/</code> — Knowledge graph validation & drift detection</div>
              <div><code>CONSUMER-CONTRACT.md</code> — How downstream products consume the framework</div>
              <div><code>lifecycle-stage.yaml</code> — Stage-aware gate matrix</div>
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-yellow)', marginBottom: 8 }}>📁 nebula-insurance-crm/ (Real Product Built by the Framework)</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><code>engine/</code> — C# .NET Clean Architecture (API → Application → Domain → Infrastructure)</div>
              <div><code>experience/</code> — React + TypeScript + Tailwind frontend</div>
              <div><code>neuron/</code> — Python AI layer with 3 CRM agents (underwriter, broker, renewal)</div>
              <div><code>planning-mds/BLUEPRINT.md</code> — Single source of truth for all agents</div>
              <div><code>neuron/tools/</code> — MCP tool categories (data, API, analysis)</div>
              <div><code>neuron/config/models.yaml</code> — Model routing (Claude/Ollama)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
