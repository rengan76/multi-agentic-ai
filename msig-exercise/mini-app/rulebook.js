// ============================================================
// THE RULEBOOK - Agent Definitions
// (This is what nebula-agents does with markdown files)
// ============================================================

const rules = {
    roles: {
        "product-manager": {
            does: "Define WHAT to build",
            produces: ["requirements.json", "stories.json"],
            cannotDo: ["write code", "pick technology", "design database"]
        },
        "architect": {
            does: "Design HOW to build it",
            produces: ["api-design.json", "data-model.json"],
            cannotDo: ["change requirements", "write implementation code"]
        },
        "developer": {
            does: "Write the actual code",
            produces: ["routes", "controllers", "models"],
            cannotDo: ["change requirements", "change architecture"]
        },
        "qa": {
            does: "Test everything works",
            produces: ["test-results.json"],
            cannotDo: ["change code", "change requirements"]
        }
    },

    workflow: [
        { step: 1, agent: "product-manager", gate: "requirements-complete" },
        { step: 2, agent: "architect", gate: "design-approved" },
        { step: 3, agent: "developer", gate: "code-complete" },
        { step: 4, agent: "qa", gate: "tests-pass" }
    ],

    gates: {
        "requirements-complete": (output) => output.stories && output.stories.length > 0,
        "design-approved": (output) => output.endpoints && output.endpoints.length > 0,
        "code-complete": (output) => output.files && output.files.length > 0,
        "tests-pass": (output) => output.passed === true
    }
};

module.exports = rules;
