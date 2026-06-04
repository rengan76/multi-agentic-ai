# Nebula Agent Framework

A production-grade **multi-agent orchestration engine** built with TypeScript that demonstrates how AI agents collaborate through structured contracts, gated workflows, and LLM integration to generate software artifacts.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REST API (Express)                         │
│  POST /api/execute  │  GET /api/agents  │  SSE /api/events  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              WORKFLOW ORCHESTRATOR (State Machine)            │
│  • Sequences agents based on workflow definition             │
│  • Manages retries with exponential backoff                  │
│  • Passes context/artifacts between pipeline stages          │
│  • Emits events for real-time observability                  │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
┌───────▼───┐  ┌───────▼───┐  ┌──────▼────┐
│   AGENTS  │  │   GATES   │  │  EVENT    │
│ (Registry)│  │  (Engine) │  │   BUS     │
│           │  │           │  │           │
│ Contracts │  │ Validates │  │ Pub/Sub   │
│ Boundaries│  │ each step │  │ History   │
│ Schemas   │  │ before    │  │ SSE push  │
│ Prompts   │  │ advancing │  │           │
└───────┬───┘  └───────────┘  └───────────┘
        │
┌───────▼────────────────────────────────────────────────────┐
│              LLM SERVICE (Provider Chain)                    │
│  Azure OpenAI → OpenAI → Mock (fallback)                   │
│  • Strategy pattern for multiple providers                  │
│  • Automatic failover                                       │
│  • Token tracking & call recording                          │
└────────────────────────────────────────────────────────────┘
```

## Key Features

- **Agent Contracts** — Each role (PM, Architect, Developer, QA, Reviewer) has strict boundaries, capabilities, input/output schemas (Zod), and system prompts
- **Gated Pipeline** — Quality gates between each step validate outputs before advancing. Failed gates trigger retries
- **Workflow Engine** — State machine that drives agents through configurable pipelines with dependency resolution
- **LLM Abstraction** — Strategy pattern supporting Azure OpenAI, OpenAI, and mock providers with automatic fallback
- **Event-Driven** — Full event bus with SSE streaming for real-time UI updates
- **Observable** — Every LLM call, gate evaluation, and state transition is recorded and queryable
- **Type-Safe** — Strict TypeScript throughout with Zod schema validation on all I/O

## Project Structure

```
nebula-framework/
├── src/
│   ├── index.ts              # Entry point
│   ├── types/index.ts        # Core domain types & interfaces
│   ├── engine/
│   │   └── orchestrator.ts   # Workflow state machine
│   ├── agents/
│   │   └── registry.ts       # Agent contracts & gate definitions
│   ├── gates/
│   │   └── gate-engine.ts    # Output validation engine
│   ├── llm/
│   │   ├── index.ts          # LLM service factory
│   │   ├── provider.ts       # Provider interface
│   │   ├── azure-provider.ts # Azure OpenAI integration
│   │   ├── openai-provider.ts# Direct OpenAI integration
│   │   └── mock-provider.ts  # Mock with realistic responses
│   ├── events/
│   │   └── event-bus.ts      # Typed pub/sub + history
│   ├── api/
│   │   └── server.ts         # REST API + SSE endpoints
│   ├── config/
│   │   └── workflows.ts      # Predefined workflow definitions
│   └── utils/
│       └── logger.ts         # Structured logging (Pino)
├── tests/
│   ├── unit/
│   │   ├── gate-engine.test.ts
│   │   └── event-bus.test.ts
│   └── integration/
│       └── workflow.test.ts
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml
├── tsconfig.json
├── jest.config.js
└── package.json
```

## Quick Start

```bash
# Install
npm install

# Run with mock LLM (no API keys needed)
npm run dev

# Run with Azure OpenAI
cp .env.example .env
# Edit .env with your Azure OpenAI credentials
LLM_PROVIDER=azure npm run dev

# Run tests
npm test

# Build for production
npm run build
docker build -t nebula-framework .
```

## API Usage

### Execute a Full Feature Pipeline

```bash
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"workflow": "feature", "featureName": "policies"}'
```

Response includes the complete artifact chain from all 5 agents.

### Available Workflows

| Workflow | Steps | Description |
|----------|-------|-------------|
| `feature` | PM → Architect → Dev → QA → Review | Full vertical slice |
| `plan` | PM → Architect | Requirements + design only |
| `build` | Dev → QA → Review | Implementation from existing plan |
| `review` | Code Reviewer | Code quality & security review |

### Other Endpoints

```bash
GET /api/health           # Health check + provider info
GET /api/workflows        # List available workflows
GET /api/agents           # List agent contracts & boundaries
GET /api/gates            # List gate definitions & validators
GET /api/executions       # List past executions
GET /api/executions/:id   # Get full execution detail
GET /api/events           # SSE stream (real-time events)
GET /api/events/history   # Query event history
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| TypeScript + Zod | Type safety at compile time AND runtime validation |
| Event-driven architecture | Decouples agents from orchestrator, enables real-time UI |
| Strategy pattern for LLM | Swap providers without changing business logic |
| Gate engine with validators | Prevents coordination drift between pipeline stages |
| Mock provider with realistic data | Enables testing and demo without API keys |
| Pino structured logging | Production-ready observability |
| Multi-stage Docker build | Minimal production image (~150MB) |

## How This Maps to Nebula

| This Framework | Nebula |
|----------------|--------|
| `agents/registry.ts` | `agents/<role>/SKILL.md` |
| `config/workflows.ts` | `agents/actions/*.md` |
| `gates/gate-engine.ts` | Validation scripts |
| `engine/orchestrator.ts` | AI tool runtime (Claude/Codex) |
| Agent contracts + boundaries | `CONSUMER-CONTRACT.md` + `BOUNDARY-POLICY.md` |

## Testing

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode for development
npm run typecheck     # Type-check without emitting
npm run lint          # ESLint
```

**Test Results:**
- 3 test suites, 21 tests
- Unit tests: Gate engine, Event bus
- Integration tests: Full workflow execution (feature, plan pipelines)
