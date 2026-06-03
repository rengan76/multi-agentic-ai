// ============================================================
// EXERCISE 2: Repo Walkthrough + Gap Analysis
// ============================================================
// Repos:
//   https://github.com/gajakannan/nebula-agents
//   https://github.com/gajakannan/nebula-insurance-crm
// ============================================================

/*
EXERCISE 2 INSTRUCTIONS:
========================
You need to use the prompt below (with YOUR skills filled in) in an AI tool
(Claude, Codex, Copilot) and walk through the output during the interview.

STEP 1 PROMPT:
"Review these two repos http://github.com/gajakannan/nebula-agents/ and 
http://github.com/gajakannan/nebula-insurance-crm and walk me through the purpose.

MY EXPERIENCE LEVEL ABOUT AI AGENTIC DEVELOPMENT, TECH SKILLS ARE:
- 8+ years in enterprise software development (Python, Node.js, React, PHP)
- Experience with Azure OpenAI + Figma-based parser/automation at Centene
- Built AI-assisted BDD and test artifact generation pipelines
- Worked on LLM-driven automation (MCP, Azure OpenAI, agent-based workflows)
- Enterprise integration workflows using Python, Node.js, and cloud services
- Healthcare systems workflow automation at Northwell Health
- Familiar with polyglot development (Python, Node.js, React, C#)
- Understanding of agentic AI patterns and prompt engineering
- Experience reducing SDLC effort through AI automation"

STEP 2 PROMPT (follow-up):
"Identify the gaps and how do I fix them"
*/

// ============================================================
// REPO 1: nebula-agents (The Framework)
// ============================================================
const nebulaAgents = {
    purpose: "Tool-agnostic, orchestrator-agnostic agent-driven development framework",
    
    whatItIs: `
    A framework layer that provides:
    - Role definitions (WHO does what)
    - Action protocols (HOW work moves forward)
    - Prompt templates (WHAT output looks like)
    - Genericness enforcement (keeps framework domain-free)
    - Builder runtime (Docker-based orchestration)
    
    It has NO dependency on any specific AI tool, orchestrator, or problem domain.
    `,
    
    techStack: {
        languages: ["Python (91.4%)", "Shell (8.4%)", "Dockerfile (0.2%)"],
        structure: "Plain markdown contracts + Python validators"
    },
    
    agents: [
        // Planning Phase
        { role: "product-manager", phase: "Planning", scope: "Requirements, stories, acceptance criteria" },
        { role: "architect", phase: "Planning", scope: "Design, data model, API contracts, patterns" },
        // Implementation Phase
        { role: "backend-developer", phase: "Implementation", scope: "Backend APIs, domain logic" },
        { role: "frontend-developer", phase: "Implementation", scope: "UI components, forms, client state" },
        { role: "ai-engineer", phase: "Implementation", scope: "LLMs, agents, MCP, AI workflows" },
        { role: "quality-engineer", phase: "Implementation", scope: "Unit, integration, E2E tests" },
        { role: "devops", phase: "Implementation", scope: "Containers, compose, deployment" },
        // Quality & Documentation
        { role: "code-reviewer", phase: "Quality", scope: "Code quality, standards, patterns" },
        { role: "security", phase: "Quality", scope: "OWASP, auth/authz, vulnerabilities" },
        { role: "technical-writer", phase: "Quality", scope: "API docs, README, runbooks" },
        { role: "blogger", phase: "Quality", scope: "Dev logs, technical articles" }
    ],
    
    actions: [
        { name: "init", desc: "Bootstrap project structure" },
        { name: "plan", desc: "PM Phase A → Architect Phase B (2 approval gates)" },
        { name: "build", desc: "Backend + Frontend + AI + QA + DevOps → Review (2 gates)" },
        { name: "feature", desc: "Single vertical slice (all roles for one feature)" },
        { name: "review", desc: "Code Reviewer + Security (1 gate)" },
        { name: "validate", desc: "Architect + PM validation (read-only)" },
        { name: "test", desc: "Quality Engineer testing workflow" },
        { name: "document", desc: "Technical Writer documentation" },
        { name: "blog", desc: "Blogger dev logs & articles" }
    ],
    
    keyFiles: [
        "agents/<role>/SKILL.md - Role contracts",
        "agents/actions/*.md - Action flows",
        "agents/templates/prompts/ - Prompt templates",
        "agents/scripts/validate-genericness.py - Domain term denylist",
        "CONSUMER-CONTRACT.md - Ownership split",
        "BOUNDARY-POLICY.md - What framework owns vs product",
        "lifecycle-stage.yaml - Framework gates"
    ]
};

// ============================================================
// REPO 2: nebula-insurance-crm (The Product)
// ============================================================
const nebulaInsuranceCRM = {
    purpose: "Commercial P&C Insurance CRM - the proving ground for the framework",
    
    whatItIs: `
    A production-grade CRM covering broker/MGA workflows:
    - Producer hierarchies
    - Policy lifecycle
    - Submission/quoting/proposal
    - Document management
    - Communication capture
    - Claims tracking
    - Commissions & billing
    - Carrier relationships
    `,
    
    techStack: {
        backend: "C# .NET (46.8%) under engine/",
        frontend: "React + TypeScript (39.4%) under experience/",
        aiLayer: "Python (10.6%) under neuron/",
        database: "PostgreSQL (docker/postgres/)",
        identity: "Authentik (docker/authentik/)",
        knowledgeGraph: "Python under scripts/kg/",
        apiTests: "Bruno collections under bruno/",
        otherLangs: ["Shell (1.5%)", "JavaScript (1.1%)", "CSS (0.6%)"]
    },
    
    planningStructure: [
        "planning-mds/BLUEPRINT.md - Single source of truth",
        "planning-mds/domain/glossary.md - Domain vocabulary",
        "planning-mds/api/nebula-api.yaml - OpenAPI contract",
        "planning-mds/features/REGISTRY.md - Feature registry",
        "planning-mds/features/ROADMAP.md - Sequencing and status",
        "planning-mds/features/F{NNNN}-<slug>/ - Per-feature plans",
        "planning-mds/knowledge-graph/ - Canonical nodes, ontology",
        "planning-mds/architecture/ - ADRs, patterns",
        "planning-mds/security/ - Threat models"
    ],
    
    keyFeatures: [
        "F0018 - Policy Lifecycle and Policy 360 (stress-test feature)",
        "Broker management",
        "Authentication + role-based login",
        "Dashboard modernization",
        "Task center",
        "Submission intake",
        "Renewal pipeline",
        "Account 360"
    ]
};

// ============================================================
// THE RELATIONSHIP BETWEEN THE TWO REPOS
// ============================================================
const relationship = {
    consumptionModel: `
    ┌────────────────────────────────────┐
    │   nebula-agents (framework)        │ ← Session starts here
    │   Tells AI HOW to work             │
    │   (roles, actions, gates)          │
    └──────────────┬─────────────────────┘
                   │ sibling-repo contract
                   │ (plain markdown + {PRODUCT_ROOT})
                   ▼
    ┌────────────────────────────────────┐
    │   nebula-insurance-crm (product)   │ ← AI implements here
    │   Gives AI WHAT to work against    │
    │   (domain, code, features)         │
    └────────────────────────────────────┘
    `,
    
    howItWorks: [
        "1. Developer opens session in nebula-agents/",
        "2. AI reads framework: roles, actions, templates from markdown",
        "3. Product repo sits as sibling: ../nebula-insurance-crm/",
        "4. {PRODUCT_ROOT} resolves to the product directory",
        "5. AI follows action contract to plan/build/review in product",
        "6. Validation gates prevent work from moving forward until quality passes"
    ],
    
    noCoupling: "No SDK. No submodule. No build-time dependency. Just markdown."
};

// ============================================================
// GAP ANALYSIS (Exercise 2, Follow-up)
// ============================================================
const gapAnalysis = {
    title: "Gaps and How to Fix Them",
    
    possibleGaps: [
        {
            gap: "No hands-on experience with C# .NET backend",
            fix: "The framework is language-agnostic. Your Node.js/Python API experience maps directly. Study engine/ structure for patterns.",
            priority: "Medium"
        },
        {
            gap: "Limited experience with formal knowledge-graph tooling",
            fix: "Review scripts/kg/ in the product repo. KG here is just canonical-nodes + ontology in YAML/JSON - not a graph DB.",
            priority: "Low"
        },
        {
            gap: "No prior work with Authentik identity provider",
            fix: "Authentik is just the chosen IdP. Your OAuth/OIDC experience transfers. Review docker/authentik/ config.",
            priority: "Low"
        },
        {
            gap: "Haven't built a multi-agent framework from scratch",
            fix: "You've built AI pipelines and MCP workflows. nebula-agents is markdown contracts, not code. Study SKILL.md files for pattern.",
            priority: "High - focus here"
        },
        {
            gap: "Insurance domain knowledge",
            fix: "Review planning-mds/domain/glossary.md and BLUEPRINT.md. P&C concepts: policy lifecycle, endorsements, submissions.",
            priority: "Medium"
        }
    ],
    
    strengthsToHighlight: [
        "Azure OpenAI + Figma automation → proves AI-assisted workflow experience",
        "MCP experience → directly relevant to AI engineer agent role",
        "Polyglot (Python, Node.js, React) → matches multi-stack product",
        "BDD/test artifact generation → maps to quality-engineer agent",
        "Enterprise integration → matches CRM domain complexity",
        "SDLC optimization through AI → core value proposition of Nebula"
    ]
};

// ============================================================
// DEMO OUTPUT
// ============================================================
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  EXERCISE 2: Repo Walkthrough & Gap Analysis               ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

console.log("\n═══ REPO 1: nebula-agents ═══");
console.log("Purpose:", nebulaAgents.purpose);
console.log("\n11 Agent Roles:");
const phases = ["Planning", "Implementation", "Quality"];
phases.forEach(phase => {
    console.log(`\n  ${phase} Phase:`);
    nebulaAgents.agents
        .filter(a => a.phase === phase)
        .forEach(a => console.log(`    • ${a.role}: ${a.scope}`));
});

console.log("\n\n9 Actions:");
nebulaAgents.actions.forEach(a => console.log(`  • ${a.name}: ${a.desc}`));

console.log("\n\n═══ REPO 2: nebula-insurance-crm ═══");
console.log("Purpose:", nebulaInsuranceCRM.purpose);
console.log("\nTech Stack:");
Object.entries(nebulaInsuranceCRM.techStack).forEach(([key, val]) => {
    if (typeof val === "string") console.log(`  • ${key}: ${val}`);
});

console.log("\n\n═══ RELATIONSHIP ═══");
console.log(relationship.consumptionModel);
relationship.howItWorks.forEach(step => console.log(`  ${step}`));
console.log(`\n  ${relationship.noCoupling}`);

console.log("\n\n═══ GAP ANALYSIS ═══");
gapAnalysis.possibleGaps.forEach(g => {
    console.log(`\n  [${g.priority}] GAP: ${g.gap}`);
    console.log(`    FIX: ${g.fix}`);
});

console.log("\n\n═══ YOUR STRENGTHS TO HIGHLIGHT ═══");
gapAnalysis.strengthsToHighlight.forEach(s => console.log(`  ✓ ${s}`));

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  READY FOR INTERVIEW                                        ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
