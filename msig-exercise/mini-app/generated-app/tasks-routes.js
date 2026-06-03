
const express = require("express");
const router = express.Router();

let items = [
    { id: 1, name: "Sample tasks", status: "active", createdAt: new Date() }
];
let nextId = 2;

// GET - List all
router.get("/tasks", (req, res) => {
    res.json({ count: items.length, data: items });
});

// POST - Create new
router.post("/tasks", (req, res) => {
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const item = { id: nextId++, name, status: status || "active", createdAt: new Date() };
    items.push(item);
    res.status(201).json(item);
});

// DELETE - Delete by id
router.delete("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: "not found" });
    items.splice(index, 1);
    res.json({ message: "deleted" });
});

module.exports = router;
