import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth";

declare global {
  namespace Express {
    interface Request {
      /** Renseignés par `requireAuth` à partir du JWT. */
      accountId?: string;
      userId?: string;
      userRole?: "OWNER" | "ASSISTANT";
    }
  }
}

/** Vérifie le JWT `Authorization: Bearer <token>` et attache le compte/utilisateur à la requête. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    res.status(401).json({ error: "En-tête Authorization: Bearer <token> manquant" });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.accountId = payload.accountId;
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

/** À poser après `requireAuth` pour restreindre une route au rôle OWNER. */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "OWNER") {
    res.status(403).json({ error: "Réservé au titulaire du compte" });
    return;
  }
  next();
}
