// ============================================================
// EXERCISE 1: Understanding Nebula - "The Bet Behind Nebula"
// ============================================================
// Article: https://helloinsurance.substack.com/p/the-bet-behind-nebula-when-the-prompt
// Author: Gajapathi Kannan
// ============================================================

/*
KEY CONCEPTS TO EXPLAIN IN INTERVIEW:

1. THE CORE BET:
   "A prompt can become a tool when it is durable, versioned, reviewable,
    and connected to real artifacts."
   
   Traditional AI use: You prompt → get output → forget prompt → re-prompt next time
   Nebula approach: Prompts become versioned contracts that can be reused, inspected, and improved

2. MAP VS TERRITORY (Alfred Korzybski):
   - Maps: prompts, specs, agent roles, validators, stories, screen contracts
   - Territory: actual code, failing tests, real workflows, authorization rules, audit trails
   - The framework makes the map durable enough to inspect, version, reuse, and CORRECT
     when the territory proves it wrong

3. THE PAIN POINT:
   Every AI session follows the same pattern:
   Plan → Push back → Design → Push back → Build → Review → Fix → Verify → Ship
   
   This pattern was being REPEATED manually every session.
   The workflow lived in the developer's HEAD, not in a system.
   That's fragile. Nebula makes it durable.

4. THE FRAMEWORK STRUCTURE (nebula-agents):
   - Roles: WHO owns a type of judgment (11 agents)
   - Actions: HOW work moves forward (9 actions)  
   - Templates: WHAT good output looks like
   - Validators: WHAT must be true before work moves on

5. THE SPLIT (why 2 repos):
   - nebula-agents: the REUSABLE framework (roles, actions, templates, gates)
   - nebula-insurance-crm: the PRODUCT that stress-tests the framework
   - They are sibling repos, no SDK, no submodule, just plain markdown contracts

6. WHERE THINGS BREAK (key interview talking point):
   NOT syntax errors. COORDINATION failures:
   - Endpoint exists but schema doesn't match
   - UI renders but role boundary is wrong
   - Tests pass but domain invariant not represented
   - Feature works but audit trail/authorization missing

7. THE BET STATED PLAINLY:
   "The only honest way to validate a framework is to make it build
    real product work in a domain opinionated enough to expose its gaps."
*/

// ============================================================
// SAMPLE CODE: Demonstrating Agentic Development Concepts
// ============================================================

// This demonstrates HOW the framework concepts translate to code.
// In the interview, show you understand the philosophy + implementation.

// --- CONCEPT: Role-Based Agent Definition ---
const agentRoles = {
    "product-manager": {
        responsibility: "Define WHAT to build, not HOW",
        inScope: ["Vision", "Personas", "Stories", "Acceptance criteria", "Screen responsibilities"],
        outOfScope: ["Architecture", "Tech stack", "Database schema", "API design", "Code"],
        artifacts: ["PRD", "Feature folder", "Story files", "REGISTRY.md", "ROADMAP.md"]
    },
    "architect": {
        responsibility: "Design HOW to build it",
        inScope: ["Solution patterns", "Data model", "API contracts", "ADRs", "Security model"],
        outOfScope: ["Business requirements", "Story writing", "Implementation code"],
        artifacts: ["SOLUTION-PATTERNS.md", "ADRs", "API spec (OpenAPI)", "Schema definitions"]
    },
    "backend-developer": {
        responsibility: "Implement backend APIs and domain logic",
        inScope: ["API endpoints", "Domain services", "Data access", "Migrations"],
        outOfScope: ["UI code", "Architecture decisions", "Product requirements"],
        artifacts: ["Controllers", "Services", "Repositories", "Tests"]
    },
    "frontend-developer": {
        responsibility: "Implement UI components and client state",
        inScope: ["React components", "Forms", "Client state", "Routing"],
        outOfScope: ["Backend APIs", "Database schema", "Security rules"],
        artifacts: ["Components", "Pages", "Hooks", "UI tests"]
    },
    "quality-engineer": {
        responsibility: "Validate through testing",
        inScope: ["Unit tests", "Integration tests", "E2E tests", "Test strategy"],
        outOfScope: ["Implementation code", "Architecture", "Requirements"],
        artifacts: ["Test files", "Coverage reports", "QA evidence"]
    }
};

// --- CONCEPT: Action Flow (Plan Action) ---
const planAction = {
    name: "plan",
    description: "Phase A (PM) → Phase B (Architect) with approval gates",
    flow: [
        { agent: "product-manager", phase: "A", gate: "USER_APPROVAL" },
        { agent: "architect", phase: "B", gate: "ONTOLOGY_SYNC + USER_APPROVAL" }
    ],
    execute: async function(feature) {
        console.log(`\n=== PLAN ACTION: ${feature.id} - ${feature.name} ===\n`);
        
        // Phase A: Product Manager
        console.log("Phase A: Product Manager");
        console.log("  → Reading BLUEPRINT.md...");
        console.log("  → Inspecting feature folder...");
        console.log("  → Producing: PRD, Stories, Screen responsibilities");
        console.log("  → Updating: REGISTRY.md, ROADMAP.md, STORY-INDEX.md");
        console.log("  ⛔ GATE: Waiting for user approval before architecture...\n");
        
        // Phase B: Architect
        console.log("Phase B: Architect");
        console.log("  → Reading approved PM artifacts...");
        console.log("  → Producing: Solution patterns, ADRs, API contracts, Schemas");
        console.log("  → Updating: Knowledge graph, Canonical nodes");
        console.log("  ⛔ GATE: Ontology sync + User approval before build...\n");
        
        console.log("✅ Planning complete. Ready for BUILD action.");
    }
};

// --- CONCEPT: Build Action ---
const buildAction = {
    name: "build",
    description: "Backend + Frontend + AI + QA + DevOps → Review",
    flow: [
        { agent: "backend-developer", parallel: true },
        { agent: "frontend-developer", parallel: true },
        { agent: "ai-engineer", conditional: "if AI/LLM/MCP scope" },
        { agent: "quality-engineer", after: ["backend", "frontend"] },
        { agent: "devops", after: ["quality-engineer"] },
        { agent: "code-reviewer", gate: "REVIEW_APPROVAL" },
        { agent: "security", gate: "SECURITY_APPROVAL" }
    ],
    execute: async function(feature) {
        console.log(`\n=== BUILD ACTION: ${feature.id} ===\n`);
        console.log("  [Parallel] Backend Developer: APIs, domain logic");
        console.log("  [Parallel] Frontend Developer: UI components, forms");
        console.log("  [Sequential] Quality Engineer: Tests after implementation");
        console.log("  [Sequential] DevOps: Container + compose updates");
        console.log("  ⛔ GATE: Code Review + Security approval");
        console.log("\n✅ Build complete.");
    }
};

// --- CONCEPT: Validation Gates ---
const validationGates = {
    genericness: {
        description: "Ensures framework has no domain-specific terms",
        script: "agents/scripts/validate-genericness.py",
        example: "Rejects if 'insurance', 'policy', 'broker' appear in framework files"
    },
    knowledgeGraphSync: {
        description: "Ensures canonical nodes match implementation",
        script: "scripts/kg/validate.py"
    },
    solutionContract: {
        description: "Validates API spec matches implementation",
        script: "planning-mds/testing/validate-nebula-api-contract.py"
    },
    frontendQuality: {
        description: "Validates frontend quality standards",
        script: "planning-mds/testing/validate-frontend-quality-gate.py"
    }
};

// --- CONCEPT: Sibling Repo Consumption Model ---
const workspaceLayout = `
WORKSPACE_ROOT/
├── nebula-agents/              ← Framework (session working directory)
│   ├── agents/
│   │   ├── <role>/SKILL.md     → Role contracts
│   │   ├── actions/*.md        → Action flows
│   │   ├── templates/prompts/  → Prompt templates
│   │   └── scripts/            → Framework validators
│   ├── BOUNDARY-POLICY.md
│   ├── CONSUMER-CONTRACT.md
│   └── lifecycle-stage.yaml
│
└── nebula-insurance-crm/       ← Product ({PRODUCT_ROOT})
    ├── planning-mds/
    │   ├── BLUEPRINT.md         → Single source of truth
    │   ├── domain/glossary.md
    │   ├── api/nebula-api.yaml  → OpenAPI contract
    │   ├── features/
    │   │   ├── REGISTRY.md
    │   │   ├── ROADMAP.md
    │   │   └── F0018-policy-lifecycle/
    │   ├── architecture/
    │   └── knowledge-graph/
    ├── engine/                  → C# .NET backend
    ├── experience/              → React + TypeScript frontend
    ├── neuron/                  → Python AI layer
    ├── docker/
    └── scripts/kg/
`;

// --- CONCEPT: How a Prompt Becomes a Tool ---
const promptEvolution = {
    disposablePrompt: `"Help me plan this feature."`,
    
    durablePrompt: `
"Run the plan action for F0018 Policy Lifecycle and Policy 360.
Use nebula-insurance-crm as {PRODUCT_ROOT}.
Start with Product Manager Phase A:
- read the existing BLUEPRINT
- inspect the feature folder if it exists
- update PRD, stories, screen responsibilities, trackers, and feature mappings
- stop at the Phase A approval gate before moving to architecture
Do not make architecture, API, database, or implementation decisions in Phase A.
If business rules are unclear, ask instead of inventing them."`,
    
    difference: [
        "Disposable: lives in chat, forgotten next session",
        "Durable: checked into repo, versioned, reviewable, reusable",
        "Durable: references artifacts, gates, roles, and failure conditions",
        "Durable: the REPO carries intent, not just the prompt"
    ]
};

// --- RUN DEMO ---
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  EXERCISE 1: Nebula Agent-Driven Development Concepts      ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

console.log("\n📋 AGENT ROLES (11 total, showing 5):");
Object.entries(agentRoles).forEach(([role, info]) => {
    console.log(`\n  ${role.toUpperCase()}`);
    console.log(`    Responsibility: ${info.responsibility}`);
    console.log(`    Artifacts: ${info.artifacts.join(", ")}`);
});

// Execute plan action demo
planAction.execute({ id: "F0018", name: "Policy Lifecycle" });

console.log("\n📂 WORKSPACE LAYOUT:");
console.log(workspaceLayout);

console.log("\n🔄 PROMPT EVOLUTION:");
console.log("\n  BEFORE (disposable):", promptEvolution.disposablePrompt);
console.log("\n  AFTER (durable):", promptEvolution.durablePrompt);
console.log("\n  KEY DIFFERENCES:");
promptEvolution.difference.forEach(d => console.log(`    • ${d}`));

console.log("\n🔒 VALIDATION GATES:");
Object.entries(validationGates).forEach(([name, gate]) => {
    console.log(`  ${name}: ${gate.description}`);
});

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  KEY INTERVIEW TALKING POINTS                               ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`
1. "Nebula turns disposable prompts into durable, versioned tools"
2. "Framework and product are separate - framework tells tool HOW to work,
    product gives it WHAT to work against"
3. "11 agents with clear ownership boundaries prevent coordination failures"
4. "Gates enforce discipline - no silent drift between planning and implementation"  
5. "The insurance CRM is the proving ground - complex enough to expose weak assumptions"
6. "Most AI failures are NOT syntax errors, they're COORDINATION failures"
7. "Plain markdown contracts - no SDK, no runtime dependency, works with ANY AI tool"
`);
