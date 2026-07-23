import express from "express";
import { clientsRouter } from "./routes/clients";
import { documentsRouter } from "./routes/documents";
import { projectsRouter } from "./routes/projects";
import { publicRouter } from "./routes/public";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/clients", clientsRouter);
app.use("/projects", projectsRouter);
app.use("/documents", documentsRouter);
app.use("/public", publicRouter);

app.listen(port, () => {
  console.log(`API DEFA à l'écoute sur le port ${port}`);
});
