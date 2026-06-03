// ============================================================
// EXERCISE 2 - SAMPLE CODE: Agentic Development Demo
// ============================================================
// This demonstrates your UNDERSTANDING by building a mini
// agent-driven workflow similar to Nebula's approach
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// MINI AGENT FRAMEWORK (inspired by nebula-agents)
// ============================================================

class AgentFramework {
    constructor(productRoot) {
        this.productRoot = productRoot;
        this.agents = new Map();
        this.actions = new Map();
        this.gates = [];
    }

    // Register an agent role
    registerAgent(role, config) {
        this.agents.set(role, {
            ...config,
            role,
            execute: config.execute || (() => ({}))
        });
        return this;
    }

    // Register an action (composition of agents)
    registerAction(name, config) {
        this.actions.set(name, config);
        return this;
    }

    // Execute an action
    async executeAction(actionName, context) {
        const action = this.actions.get(actionName);
        if (!action) throw new Error(`Action '${actionName}' not found`);

        console.log(`\n${"═".repeat(60)}`);
        console.log(`ACTION: ${actionName.toUpperCase()}`);
        console.log(`${"═".repeat(60)}`);

        const results = {};

        for (const step of action.steps) {
            const agent = this.agents.get(step.agent);
            if (!agent) throw new Error(`Agent '${step.agent}' not registered`);

            // Check if step is conditional
            if (step.condition && !step.condition(context)) {
                console.log(`  ⏭️  Skipping ${step.agent} (condition not met)`);
                continue;
            }

            console.log(`\n  🤖 Agent: ${agent.role.toUpperCase()}`);
            console.log(`     Scope: ${agent.responsibility}`);

            // Execute agent work
            const output = await agent.execute(context, results);
            results[step.agent] = output;

            console.log(`     Output: ${JSON.stringify(output.artifacts || [])}`);

            // Check gate
            if (step.gate) {
                const passed = await this.checkGate(step.gate, output, context);
                if (!passed) {
                    console.log(`  ⛔ GATE FAILED: ${step.gate}`);
                    return { success: false, failedAt: step.agent, gate: step.gate };
                }
                console.log(`  ✅ GATE PASSED: ${step.gate}`);
            }
        }

        console.log(`\n${"═".repeat(60)}`);
        console.log(`✅ ACTION '${actionName}' COMPLETE`);
        console.log(`${"═".repeat(60)}\n`);
        return { success: true, results };
    }

    async checkGate(gateName, output, context) {
        // Simulate gate validation
        const gateChecks = {
            "user-approval": () => true, // In real: wait for human approval
            "ontology-sync": () => output.artifacts && output.artifacts.length > 0,
            "tests-pass": () => output.testsPassed === true,
            "review-approval": () => output.reviewPassed === true
        };
        return gateChecks[gateName] ? gateChecks[gateName]() : true;
    }
}

// ============================================================
// DEFINE AGENTS (mini version of nebula-agents SKILL.md)
// ============================================================

const framework = new AgentFramework("./sample-product");

// Product Manager Agent
framework.registerAgent("product-manager", {
    responsibility: "Define WHAT to build, translate business needs into requirements",
    inScope: ["PRD", "Stories", "Acceptance criteria", "Screen responsibilities"],
    outOfScope: ["Architecture", "Code", "Database schema"],
    execute: async (context) => {
        const feature = context.feature;
        console.log(`     Working on: ${feature.name}`);
        console.log(`     Producing: PRD, ${feature.stories.length} stories, acceptance criteria`);
        
        return {
            artifacts: [`PRD-${feature.id}.md`, ...feature.stories.map(s => `${s.id}.md`)],
            prd: {
                vision: feature.name,
                personas: feature.personas,
                stories: feature.stories,
                nonGoals: feature.nonGoals || []
            }
        };
    }
});

// Architect Agent
framework.registerAgent("architect", {
    responsibility: "Design HOW to build it - patterns, data model, API contracts",
    inScope: ["Solution patterns", "API design", "Data model", "ADRs"],
    outOfScope: ["Business requirements", "Code implementation"],
    execute: async (context, previousResults) => {
        const pmOutput = previousResults["product-manager"];
        console.log(`     Reading PM artifacts: ${pmOutput.artifacts.length} files`);
        console.log(`     Producing: API contract, Data model, ADR`);
        
        return {
            artifacts: ["api-contract.yaml", "data-model.md", "ADR-001.md"],
            apiEndpoints: context.feature.stories.map(s => ({
                method: "GET",
                path: `/api/${context.feature.id.toLowerCase()}/${s.id}`,
                description: s.title
            }))
        };
    }
});

// Backend Developer Agent
framework.registerAgent("backend-developer", {
    responsibility: "Implement backend APIs and domain logic",
    inScope: ["API endpoints", "Services", "Data access"],
    outOfScope: ["UI code", "Architecture decisions"],
    execute: async (context, previousResults) => {
        const archOutput = previousResults["architect"];
        console.log(`     Implementing ${archOutput.apiEndpoints.length} endpoints`);
        
        return {
            artifacts: ["controllers/", "services/", "models/"],
            endpoints: archOutput.apiEndpoints
        };
    }
});

// Frontend Developer Agent
framework.registerAgent("frontend-developer", {
    responsibility: "Implement UI components and client state",
    inScope: ["React components", "Forms", "State management"],
    outOfScope: ["Backend APIs", "Database"],
    execute: async (context) => {
        console.log(`     Building UI for: ${context.feature.name}`);
        return {
            artifacts: ["components/", "pages/", "hooks/"]
        };
    }
});

// Quality Engineer Agent
framework.registerAgent("quality-engineer", {
    responsibility: "Validate through testing",
    inScope: ["Unit tests", "Integration tests", "E2E tests"],
    outOfScope: ["Implementation code"],
    execute: async (context, previousResults) => {
        const backendArtifacts = previousResults["backend-developer"]?.artifacts || [];
        const frontendArtifacts = previousResults["frontend-developer"]?.artifacts || [];
        console.log(`     Testing: ${backendArtifacts.length + frontendArtifacts.length} artifact groups`);
        
        return {
            artifacts: ["tests/unit/", "tests/integration/", "tests/e2e/"],
            testsPassed: true,
            coverage: "87%"
        };
    }
});

// Code Reviewer Agent
framework.registerAgent("code-reviewer", {
    responsibility: "Review code quality, standards, patterns",
    inScope: ["Code quality", "Best practices", "Pattern adherence"],
    outOfScope: ["Architecture decisions", "Requirements"],
    execute: async (context, previousResults) => {
        console.log(`     Reviewing all implementation artifacts`);
        return {
            artifacts: ["review-report.md"],
            reviewPassed: true,
            findings: ["Minor: Consider extracting shared validation logic"]
        };
    }
});

// ============================================================
// DEFINE ACTIONS (compositions of agents)
// ============================================================

// Plan Action
framework.registerAction("plan", {
    description: "Phase A (PM) → Phase B (Architect) with gates",
    steps: [
        { agent: "product-manager", gate: "user-approval" },
        { agent: "architect", gate: "ontology-sync" }
    ]
});

// Build Action
framework.registerAction("build", {
    description: "Backend + Frontend + QA + Review",
    steps: [
        { agent: "backend-developer" },
        { agent: "frontend-developer" },
        { agent: "quality-engineer", gate: "tests-pass" },
        { agent: "code-reviewer", gate: "review-approval" }
    ]
});

// Feature Action (vertical slice: plan + build)
framework.registerAction("feature", {
    description: "Complete vertical slice: Plan → Build → Review",
    steps: [
        { agent: "product-manager", gate: "user-approval" },
        { agent: "architect", gate: "ontology-sync" },
        { agent: "backend-developer" },
        { agent: "frontend-developer" },
        { agent: "quality-engineer", gate: "tests-pass" },
        { agent: "code-reviewer", gate: "review-approval" }
    ]
});

// ============================================================
// EXECUTE: Simulate building a feature
// ============================================================

async function main() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  MINI AGENT FRAMEWORK DEMO                                  ║");
    console.log("║  (Inspired by nebula-agents architecture)                   ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");

    // Define a feature to build
    const featureContext = {
        feature: {
            id: "F0001",
            name: "Customer Dashboard",
            personas: ["Broker", "Account Manager"],
            stories: [
                { id: "S001", title: "View customer summary" },
                { id: "S002", title: "Filter customers by status" },
                { id: "S003", title: "Export customer list" }
            ],
            nonGoals: ["Real-time notifications", "Mobile app"]
        }
    };

    // Execute the full feature action
    const result = await framework.executeAction("feature", featureContext);
    
    if (result.success) {
        console.log("\n📊 EXECUTION SUMMARY:");
        console.log("   Feature:", featureContext.feature.name);
        console.log("   Stories:", featureContext.feature.stories.length);
        console.log("   Agents used:", Object.keys(result.results).length);
        console.log("   All gates: PASSED");
        console.log("   Status: Ready for deployment");
    }

    // Show the key insight
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  KEY INSIGHT FOR INTERVIEW                                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  This demo shows the PATTERN, not the full framework.        ║
║                                                              ║
║  In Nebula:                                                  ║
║  • Agents are markdown SKILL.md files, not code classes      ║
║  • Actions are markdown contracts, not function calls        ║
║  • The AI tool (Claude/Codex) IS the runtime                 ║
║  • Validation is Python scripts checking artifact integrity  ║
║  • The framework is tool-agnostic (works with any AI)        ║
║                                                              ║
║  The value is:                                               ║
║  • Repeatable workflows (not one-off prompts)                ║
║  • Clear ownership (who does what)                           ║
║  • Quality gates (prevent drift)                             ║
║  • Versioned contracts (improve over time)                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
