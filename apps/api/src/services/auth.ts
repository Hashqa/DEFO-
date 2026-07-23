import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const TOKEN_TTL = "30d";

export interface AuthTokenPayload {
  userId: string;
  accountId: string;
  role: "OWNER" | "ASSISTANT";
}

function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export interface RegisterInput {
  companyName: string;
  vatNumber: string;
  bceNumber: string;
  email: string;
  password: string;
  fullName: string;
}

/** Inscription libre en ligne : crée le compte (tenant) et son premier utilisateur (OWNER). */
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("Un compte existe déjà avec cet email");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);

  const { account, user } = await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        companyName: input.companyName,
        vatNumber: input.vatNumber,
        bceNumber: input.bceNumber,
      },
    });
    const user = await tx.user.create({
      data: {
        accountId: account.id,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: "OWNER",
      },
    });
    return { account, user };
  });

  const token = signToken({ userId: user.id, accountId: account.id, role: user.role });
  return { token, account, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Identifiants invalides");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Identifiants invalides");
  }
  const token = signToken({ userId: user.id, accountId: user.accountId, role: user.role });
  return { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } };
}

/** Ajout d'un utilisateur (ex. assistant) au compte de l'appelant — multi-utilisateurs par compte. */
export async function inviteUser(
  accountId: string,
  input: { email: string; password: string; fullName: string }
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("Un compte existe déjà avec cet email");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      accountId,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: "ASSISTANT",
    },
  });
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}
