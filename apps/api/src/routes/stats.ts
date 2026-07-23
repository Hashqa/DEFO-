import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { computeStats } from "../services/stats";

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get("/", async (req, res) => {
  const accountId = req.accountId!;
  const { from, to } = req.query;
  const stats = await computeStats(accountId, {
    from: typeof from === "string" ? new Date(from) : undefined,
    to: typeof to === "string" ? new Date(to) : undefined,
  });
  res.json(stats);
});
