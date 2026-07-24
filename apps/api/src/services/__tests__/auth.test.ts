import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { inviteUser, login, register } from "../auth";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  account: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../../db", () => ({ prisma: mockPrisma }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register", () => {
  it("crée le compte et l'utilisateur OWNER, renvoie un token", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        account: { create: vi.fn().mockResolvedValue({ id: "acc1" }) },
        user: {
          create: vi.fn().mockResolvedValue({
            id: "user1",
            email: "jean@example.com",
            fullName: "Jean Test",
            role: "OWNER",
          }),
        },
      };
      return callback(tx);
    });

    const result = await register({
      companyName: "Test SRL",
      vatNumber: "BE0123456749",
      bceNumber: "0123.456.749",
      email: "jean@example.com",
      password: "hunter2hunter2",
      fullName: "Jean Test",
    });

    expect(result.token).toBeTruthy();
    expect(result.user.role).toBe("OWNER");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("refuse un email déjà utilisé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" });
    await expect(
      register({
        companyName: "Test SRL",
        vatNumber: "BE0123456749",
        bceNumber: "0123.456.749",
        email: "jean@example.com",
        password: "hunter2hunter2",
        fullName: "Jean Test",
      })
    ).rejects.toThrow("Un compte existe déjà");
  });
});

describe("login", () => {
  it("réussit avec le bon mot de passe", async () => {
    const passwordHash = await bcrypt.hash("hunter2hunter2", 10);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "jean@example.com",
      passwordHash,
      fullName: "Jean Test",
      role: "OWNER",
      accountId: "acc1",
    });

    const result = await login("jean@example.com", "hunter2hunter2");
    expect(result.token).toBeTruthy();
  });

  it("rejette un mauvais mot de passe", async () => {
    const passwordHash = await bcrypt.hash("hunter2hunter2", 10);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user1",
      email: "jean@example.com",
      passwordHash,
      fullName: "Jean Test",
      role: "OWNER",
      accountId: "acc1",
    });

    await expect(login("jean@example.com", "wrong-password")).rejects.toThrow("Identifiants invalides");
  });

  it("rejette un email inconnu avec le même message (pas d'énumération)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(login("inconnu@example.com", "peu-importe")).rejects.toThrow("Identifiants invalides");
  });

  it("compare quand même le mot de passe si l'email est inconnu (pas de raccourci de timing)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const compareSpy = vi.spyOn(bcrypt, "compare");
    await login("inconnu@example.com", "peu-importe").catch(() => {});
    expect(compareSpy).toHaveBeenCalled();
    compareSpy.mockRestore();
  });
});

describe("inviteUser", () => {
  it("crée un utilisateur avec le rôle ASSISTANT (jamais OWNER)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user2",
      email: "assistant@example.com",
      fullName: "Assistant Test",
      role: "ASSISTANT",
    });

    const result = await inviteUser("acc1", {
      email: "assistant@example.com",
      password: "hunter2hunter2",
      fullName: "Assistant Test",
    });

    expect(result.role).toBe("ASSISTANT");
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "ASSISTANT", accountId: "acc1" }) })
    );
  });
});
