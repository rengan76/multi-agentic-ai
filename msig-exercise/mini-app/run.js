// ============================================================
// THE RUNNER - Executes the workflow following the rulebook
// This is what the AI tool does in real Nebula
// ============================================================

const rules = require("./rulebook");
const { productManager, architect, developer, qa } = require("./agents");
const fs = require("fs");
const path = require("path");

async function buildFeature(featureName) {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log(`║  BUILDING FEATURE: ${featureName.toUpperCase().padEnd(37)}║`);
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║  Following the RULEBOOK workflow:                        ║");
    console.log("║  PM → [GATE] → Architect → [GATE] → Dev → [GATE] → QA  ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    // STEP 1: Product Manager
    const step1 = rules.workflow[0];
    console.log(`\n── Step ${step1.step}: ${step1.agent} ──`);
    const pmOutput = productManager(featureName);

    // GATE CHECK
    if (!rules.gates[step1.gate](pmOutput)) {
        console.log(`\n⛔ GATE FAILED: ${step1.gate}`);
        return;
    }
    console.log(`   🚪 Gate [${step1.gate}]: PASSED`);

    // STEP 2: Architect
    const step2 = rules.workflow[1];
    console.log(`\n── Step ${step2.step}: ${step2.agent} ──`);
    const archOutput = architect(pmOutput);

    // GATE CHECK
    if (!rules.gates[step2.gate](archOutput)) {
        console.log(`\n⛔ GATE FAILED: ${step2.gate}`);
        return;
    }
    console.log(`   🚪 Gate [${step2.gate}]: PASSED`);

    // STEP 3: Developer
    const step3 = rules.workflow[2];
    console.log(`\n── Step ${step3.step}: ${step3.agent} ──`);
    const devOutput = developer(archOutput, featureName);

    // GATE CHECK
    if (!rules.gates[step3.gate](devOutput)) {
        console.log(`\n⛔ GATE FAILED: ${step3.gate}`);
        return;
    }
    console.log(`   🚪 Gate [${step3.gate}]: PASSED`);

    // STEP 4: QA
    const step4 = rules.workflow[3];
    console.log(`\n── Step ${step4.step}: ${step4.agent} ──`);
    const qaOutput = qa(devOutput, archOutput, featureName);

    // GATE CHECK
    if (!rules.gates[step4.gate](qaOutput)) {
        console.log(`\n⛔ GATE FAILED: ${step4.gate}`);
        return;
    }
    console.log(`   🚪 Gate [${step4.gate}]: PASSED`);

    // WRITE THE ACTUAL APP FILE
    const outputDir = path.join(__dirname, "generated-app");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Write the route file
    fs.writeFileSync(path.join(outputDir, `${featureName}-routes.js`), devOutput.code);

    // Write the server file
    const serverCode = `
const express = require("express");
const app = express();
app.use(express.json());

const ${featureName}Routes = require("./${featureName}-routes");
app.use(${featureName}Routes);

app.listen(4000, () => console.log("App running on http://localhost:4000"));
`;
    fs.writeFileSync(path.join(outputDir, "server.js"), serverCode);

    // Write a summary
    const summary = {
        feature: featureName,
        builtBy: "Agent workflow (PM → Architect → Developer → QA)",
        stories: pmOutput.stories,
        endpoints: archOutput.endpoints,
        files: devOutput.files,
        tests: qaOutput.tests,
        allGatesPassed: true
    };
    fs.writeFileSync(path.join(outputDir, "build-summary.json"), JSON.stringify(summary, null, 2));

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  ✅ FEATURE COMPLETE - All 4 gates passed!               ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║  Generated files in mini-app/generated-app/:             ║");
    console.log(`║    • ${featureName}-routes.js  (the actual API code)      `);
    console.log("║    • server.js            (Express server)               ║");
    console.log("║    • build-summary.json   (what was built and why)       ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║  To run the generated app:                               ║");
    console.log("║    cd generated-app && node server.js                    ║");
    console.log("║  Then test:                                              ║");
    console.log(`║    GET  http://localhost:4000/${featureName}              `);
    console.log(`║    POST http://localhost:4000/${featureName}              `);
    console.log("╚══════════════════════════════════════════════════════════╝");
}

// BUILD THE FEATURE
buildFeature("tasks");
