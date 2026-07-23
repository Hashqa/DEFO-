import { Router } from "express";
import { login, register } from "../services/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { companyName, vatNumber, bceNumber, email, password, fullName } = req.body;
  if (!companyName || !vatNumber || !bceNumber || !email || !password || !fullName) {
    res.status(400).json({
      error: "companyName, vatNumber, bceNumber, email, password et fullName sont requis",
    });
    return;
  }
  try {
    const result = await register({ companyName, vatNumber, bceNumber, email, password, fullName });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email et password sont requis" });
    return;
  }
  try {
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});
