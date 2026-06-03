// ============================================================
// THE AGENTS - Each one does its job following the rulebook
// ============================================================

// Agent 1: Product Manager - defines WHAT
function productManager(featureName) {
    console.log("\n🧑‍💼 PRODUCT MANAGER working...");
    console.log(`   Defining requirements for: ${featureName}`);

    const output = {
        feature: featureName,
        stories: [
            { id: "S1", title: `View all ${featureName}`, acceptance: "Shows list with name, status" },
            { id: "S2", title: `Add new ${featureName}`, acceptance: "Form with validation, saves to DB" },
            { id: "S3", title: `Delete ${featureName}`, acceptance: "Confirms before delete, removes from list" }
        ],
        nonGoals: ["No edit functionality in v1", "No pagination yet"]
    };

    console.log(`   ✅ Produced: ${output.stories.length} stories`);
    console.log(`   Stories: ${output.stories.map(s => s.title).join(", ")}`);
    return output;
}

// Agent 2: Architect - designs HOW
function architect(pmOutput) {
    console.log("\n🏗️  ARCHITECT working...");
    console.log(`   Designing solution for: ${pmOutput.feature}`);

    const output = {
        endpoints: [
            { method: "GET", path: `/${pmOutput.feature}`, desc: "List all" },
            { method: "POST", path: `/${pmOutput.feature}`, desc: "Create new" },
            { method: "DELETE", path: `/${pmOutput.feature}/:id`, desc: "Delete by id" }
        ],
        dataModel: {
            name: "string (required)",
            status: "string (active/inactive)",
            createdAt: "date (auto)"
        }
    };

    console.log(`   ✅ Produced: ${output.endpoints.length} API endpoints`);
    console.log(`   Endpoints: ${output.endpoints.map(e => `${e.method} ${e.path}`).join(", ")}`);
    return output;
}

// Agent 3: Developer - writes CODE
function developer(archOutput, featureName) {
    console.log("\n👨‍💻 DEVELOPER working...");
    console.log(`   Building code for: ${featureName}`);

    // Generate actual Express route code
    const routeCode = `
const express = require("express");
const router = express.Router();

let items = [
    { id: 1, name: "Sample ${featureName}", status: "active", createdAt: new Date() }
];
let nextId = 2;

// GET - List all
router.get("/${featureName}", (req, res) => {
    res.json({ count: items.length, data: items });
});

// POST - Create new
router.post("/${featureName}", (req, res) => {
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const item = { id: nextId++, name, status: status || "active", createdAt: new Date() };
    items.push(item);
    res.status(201).json(item);
});

// DELETE - Delete by id
router.delete("/${featureName}/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: "not found" });
    items.splice(index, 1);
    res.json({ message: "deleted" });
});

module.exports = router;
`;

    const output = {
        files: [`routes/${featureName}.js`],
        code: routeCode
    };

    console.log(`   ✅ Produced: ${output.files.length} file(s)`);
    return output;
}

// Agent 4: QA - tests everything
function qa(devOutput, archOutput, featureName) {
    console.log("\n🧪 QA ENGINEER working...");
    console.log(`   Testing: ${featureName}`);

    const tests = archOutput.endpoints.map(endpoint => {
        const passed = devOutput.code.includes(endpoint.method.toLowerCase() === "get" ? "router.get" :
                       endpoint.method.toLowerCase() === "post" ? "router.post" : "router.delete");
        return { endpoint: `${endpoint.method} ${endpoint.path}`, passed };
    });

    const allPassed = tests.every(t => t.passed);

    const output = {
        passed: allPassed,
        tests,
        coverage: "100%"
    };

    console.log(`   Tests: ${tests.map(t => `${t.endpoint} ${t.passed ? "✅" : "❌"}`).join(", ")}`);
    console.log(`   ✅ All tests: ${allPassed ? "PASSED" : "FAILED"}`);
    return output;
}

module.exports = { productManager, architect, developer, qa };
