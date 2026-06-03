
const express = require("express");
const app = express();
app.use(express.json());

const tasksRoutes = require("./tasks-routes");
app.use(tasksRoutes);

app.listen(4000, () => console.log("App running on http://localhost:4000"));
