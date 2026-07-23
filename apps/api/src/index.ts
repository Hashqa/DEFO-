import cors from "cors";
import express from "express";
import { accountRouter } from "./routes/account";
import { authRouter } from "./routes/auth";
import { clientsRouter } from "./routes/clients";
import { documentsRouter } from "./routes/documents";
import { projectsRouter } from "./routes/projects";
import { publicRouter } from "./routes/public";
import { statsRouter } from "./routes/stats";
import { usersRouter } from "./routes/users";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.WEB_APP_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/account", accountRouter);
app.use("/users", usersRouter);
app.use("/clients", clientsRouter);
app.use("/projects", projectsRouter);
app.use("/documents", documentsRouter);
app.use("/stats", statsRouter);
app.use("/public", publicRouter);

app.listen(port, () => {
  console.log(`API DEFA à l'écoute sur le port ${port}`);
});
