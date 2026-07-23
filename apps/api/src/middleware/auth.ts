import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      /** Renseigné par `requireAccount`. */
      accountId?: string;
    }
  }
}

/**
 * Authentification temporaire le temps qu'un vrai système (JWT/session) soit
 * en place : le compte est déterminé par l'en-tête `X-Account-Id`. À
 * remplacer avant tout déploiement au-delà du développement local.
 */
export function requireAccount(req: Request, res: Response, next: NextFunction) {
  const accountId = req.header("X-Account-Id");
  if (!accountId) {
    res.status(401).json({ error: "En-tête X-Account-Id manquant" });
    return;
  }
  req.accountId = accountId;
  next();
}
