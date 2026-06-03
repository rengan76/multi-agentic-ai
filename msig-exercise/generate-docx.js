const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType } = require("docx");
const fs = require("fs");

async function generateDoc() {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({ text: "Multi-Agentic AI System", bold: true, size: 56, color: "1a1a2e" }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [
                        new TextRun({ text: "MSIG Exercise - Project Summary", size: 28, color: "667eea" }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [
                        new TextRun({ text: "Repository: ", size: 22 }),
                        new TextRun({ text: "github.com/rengan76/multi-agentic-ai", size: 22, color: "667eea" }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [
                        new TextRun({ text: "Date: June 3, 2026", size: 22, color: "666666" }),
                    ],
                }),

                // Section 1: Overview
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "1. Project Overview" })] }),
                new Paragraph({
                    spacing: { after: 200 },
                    children: [
                        new TextRun({ text: "We built a " }),
                        new TextRun({ text: "multi-agent AI workflow system", bold: true }),
                        new TextRun({ text: " that demonstrates how AI agents can collaborate following a structured rulebook to automatically generate full-stack applications. The system showcases the concept behind MSIG's \"Nebula\" framework — where AI agents take on specific roles (Product Manager, Architect, Developer, QA) and follow a gated pipeline to produce software." }),
                    ],
                }),
                new Paragraph({
                    spacing: { after: 200 },
                    shading: { type: ShadingType.CLEAR, fill: "FFF3CD" },
                    children: [
                        new TextRun({ text: "Key Concept: ", bold: true }),
                        new TextRun({ text: "Instead of manually guiding AI through the same workflow every session, we define the workflow ONCE as code. Agents follow rules, produce artifacts, and pass quality gates before the next step begins." }),
                    ],
                }),

                // Section 2: What We Built
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "2. What We Built" })] }),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.1 Agent Workflow Engine" })] }),
                new Paragraph({
                    spacing: { after: 200 },
                    children: [new TextRun({ text: "A Node.js/Express system with 4 AI agents working in sequence:" })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 },
                    shading: { type: ShadingType.CLEAR, fill: "F0F0FF" },
                    children: [
                        new TextRun({ text: "Product Manager", bold: true }),
                        new TextRun({ text: "  →  🚪 Gate  →  " }),
                        new TextRun({ text: "Architect", bold: true }),
                        new TextRun({ text: "  →  🚪 Gate  →  " }),
                        new TextRun({ text: "Developer", bold: true }),
                        new TextRun({ text: "  →  🚪 Gate  →  " }),
                        new TextRun({ text: "QA", bold: true }),
                        new TextRun({ text: "  →  ✅ Done" }),
                    ],
                }),

                // Agent Roles Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Agent Role", bold: true, color: "FFFFFF" })] })], shading: { fill: "667eea" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Responsibility", bold: true, color: "FFFFFF" })] })], shading: { fill: "667eea" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Produces", bold: true, color: "FFFFFF" })] })], shading: { fill: "667eea" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cannot Do", bold: true, color: "FFFFFF" })] })], shading: { fill: "667eea" } }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Product Manager")] }),
                                new TableCell({ children: [new Paragraph("Define WHAT to build")] }),
                                new TableCell({ children: [new Paragraph("requirements.json, stories.json")] }),
                                new TableCell({ children: [new Paragraph("Write code, pick technology")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Architect")] }),
                                new TableCell({ children: [new Paragraph("Design HOW to build it")] }),
                                new TableCell({ children: [new Paragraph("api-design.json, data-model.json")] }),
                                new TableCell({ children: [new Paragraph("Change requirements, write code")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Developer")] }),
                                new TableCell({ children: [new Paragraph("Write the actual code")] }),
                                new TableCell({ children: [new Paragraph("routes, controllers, models")] }),
                                new TableCell({ children: [new Paragraph("Change requirements/architecture")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("QA")] }),
                                new TableCell({ children: [new Paragraph("Test everything works")] }),
                                new TableCell({ children: [new Paragraph("test-results.json")] }),
                                new TableCell({ children: [new Paragraph("Change code or requirements")] }),
                            ],
                        }),
                    ],
                }),

                new Paragraph({ spacing: { after: 200 }, children: [] }),

                // 2.2 Rulebook
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.2 The Rulebook" })] }),
                new Paragraph({ children: [new TextRun({ text: "A configuration file that defines:" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Roles", bold: true }), new TextRun({ text: " — What each agent can and cannot do" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Workflow", bold: true }), new TextRun({ text: " — The ordered steps (1→2→3→4)" })] }),
                new Paragraph({ bullet: { level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Gates", bold: true }), new TextRun({ text: " — Quality checkpoints between each step" })] }),

                // 2.3 Generated App
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.3 Generated Application" })] }),
                new Paragraph({ children: [new TextRun({ text: "When the agent pipeline runs, it automatically generates:" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "tasks-routes.js", bold: true }), new TextRun({ text: " — A fully functional Express REST API (GET, POST, DELETE)" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "server.js", bold: true }), new TextRun({ text: " — Express server with CORS and API endpoints" })] }),
                new Paragraph({ bullet: { level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "build-summary.json", bold: true }), new TextRun({ text: " — Metadata showing what was built and why" })] }),

                // 2.4 React Frontend
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "2.4 React Frontend (Viewer UI)" })] }),
                new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "A React + Vite frontend with 3 tabs:" })] }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tab", bold: true, color: "FFFFFF" })] })], shading: { fill: "667eea" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Purpose", bold: true, color: "FFFFFF" })] })], shading: { fill: "667eea" } }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Rulebook & Workflow")] }),
                                new TableCell({ children: [new Paragraph("Visual pipeline diagram, agent roles, gates")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Tasks Manager (Live)")] }),
                                new TableCell({ children: [new Paragraph("Live CRUD interface against the Express API")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Build Summary")] }),
                                new TableCell({ children: [new Paragraph("User stories, endpoints, generated files, test results")] }),
                            ],
                        }),
                    ],
                }),

                new Paragraph({ spacing: { after: 200 }, children: [] }),

                // Section 3: Architecture
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "3. Project Architecture" })] }),
                new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: "msig-exercise/", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "├── mini-app/", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│   ├── rulebook.js          ← Agent roles, workflow, gates", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│   ├── agents.js            ← Agent implementations", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│   ├── run.js               ← Workflow runner", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│   ├── frontend/            ← React + Vite UI", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│   │   └── src/components/  ← RulebookView, TasksManager, BuildSummary", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│   └── generated-app/       ← Output from agent pipeline", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│       ├── server.js", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "│       ├── tasks-routes.js", font: "Consolas", size: 20 })] }),
                new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "│       └── build-summary.json", font: "Consolas", size: 20 })] }),

                // Section 4: Screenshots
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "4. Screenshots" })] }),
                new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "(Insert your screenshots below each heading)", italics: true, color: "888888" })] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "4.1 Rulebook & Workflow View" })] }),
                new Paragraph({
                    spacing: { after: 400 },
                    shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "\n\n[ INSERT SCREENSHOT HERE: Rulebook tab ]\n\n", color: "999999", size: 24 })],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "4.2 Tasks Manager (Live CRUD)" })] }),
                new Paragraph({
                    spacing: { after: 400 },
                    shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "\n\n[ INSERT SCREENSHOT HERE: Tasks Manager tab ]\n\n", color: "999999", size: 24 })],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "4.3 Build Summary" })] }),
                new Paragraph({
                    spacing: { after: 400 },
                    shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "\n\n[ INSERT SCREENSHOT HERE: Build Summary tab ]\n\n", color: "999999", size: 24 })],
                }),

                // Section 5: How to Run
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "5. How to Run" })] }),
                new Paragraph({ children: [new TextRun({ text: "# 1. Clone the repo", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "git clone https://github.com/rengan76/multi-agentic-ai.git", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "cd multi-agentic-ai/msig-exercise/mini-app", font: "Consolas", size: 20 })] }),
                new Paragraph({ spacing: { after: 100 }, children: [] }),
                new Paragraph({ children: [new TextRun({ text: "# 2. Run the agent pipeline", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "node run.js", font: "Consolas", size: 20 })] }),
                new Paragraph({ spacing: { after: 100 }, children: [] }),
                new Paragraph({ children: [new TextRun({ text: "# 3. Start the backend", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "cd generated-app && node server.js  # → http://localhost:4000", font: "Consolas", size: 20 })] }),
                new Paragraph({ spacing: { after: 100 }, children: [] }),
                new Paragraph({ children: [new TextRun({ text: "# 4. Start the frontend (new terminal)", font: "Consolas", size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: "cd ../frontend && npm install && npx vite  # → http://localhost:3000", font: "Consolas", size: 20 })] }),
                new Paragraph({ spacing: { after: 200 }, children: [] }),

                // Section 6: Key Takeaways
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "6. Key Takeaways" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Why agents? ", bold: true }), new TextRun({ text: "Eliminates repetitive AI sessions; workflow is codified once and reused" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Why gates? ", bold: true }), new TextRun({ text: "Prevents coordination failures (code that compiles but doesn't match the spec)" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Why role boundaries? ", bold: true }), new TextRun({ text: "Each agent can ONLY do its job — ensures separation of concerns" })] }),
                new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Real-world basis: ", bold: true }), new TextRun({ text: "Based on MSIG's Nebula framework for enterprise software delivery" })] }),

                new Paragraph({ spacing: { after: 200 }, children: [] }),

                // Section 7: Technologies
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "7. Technologies Used" })] }),
                new Paragraph({ children: [new TextRun({ text: "Node.js  •  Express  •  React 18  •  Vite  •  JavaScript" })] }),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync("c:\\Users\\346183\\multi-agentic-ai\\msig-exercise\\project-summary.docx", buffer);
    console.log("✅ project-summary.docx created successfully!");
}

generateDoc().catch(console.error);
