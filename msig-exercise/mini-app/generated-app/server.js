
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());

// CORS for React dev server
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// Import tasks routes
const tasksRoutes = require("./tasks-routes");
app.use(tasksRoutes);

// API: Get the rulebook
app.get("/api/rulebook", (req, res) => {
    const rules = require("../rulebook");
    const safeRules = {
        roles: rules.roles,
        workflow: rules.workflow,
        gates: Object.keys(rules.gates)
    };
    res.json(safeRules);
});

// API: Get the build summary
app.get("/api/build-summary", (req, res) => {
    const summaryPath = path.join(__dirname, "build-summary.json");
    if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
        res.json(summary);
    } else {
        res.status(404).json({ error: "No build summary found" });
    }
});

// Serve React build in production
const frontendBuild = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get("*", (req, res) => {
        res.sendFile(path.join(frontendBuild, "index.html"));
    });
}

app.listen(4000, () => console.log("App running on http://localhost:4000"));
