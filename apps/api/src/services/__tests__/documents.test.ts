import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDocument } from "../documents";

const mockPrisma = vi.hoisted(() => ({
  client: { findFirst: vi.fn() },
  project: { findFirst: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("../../db", () => ({ prisma: mockPrisma }));

const baseInput = {
  clientId: "client1",
  type: "INVOICE" as const,
  direction: "SALE" as const,
  billingKind: "SERVICE" as const,
  lines: [{ description: "Prestation", quantity: 1, unitPrice: 100, vatRate: 21 as const }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (callback) => {
    const tx = {
      billingDocument: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockImplementation(({ data }) => ({ id: "doc1", ...data })),
      },
    };
    return callback(tx as never);
  });
});

describe("createDocument — isolation multi-tenant (IDOR)", () => {
  it("refuse un clientId qui n'appartient pas au compte appelant", async () => {
    // Le client existe (ailleurs) mais findFirst scopé par accountId ne le trouve pas.
    mockPrisma.client.findFirst.mockResolvedValue(null);

    await expect(createDocument("acc-attaquant", baseInput)).rejects.toThrow("Client introuvable");

    expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: "client1", accountId: "acc-attaquant" },
    });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuse un projectId qui n'appartient pas au compte appelant", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "client1", accountId: "acc1" });
    mockPrisma.project.findFirst.mockResolvedValue(null);

    await expect(createDocument("acc1", { ...baseInput, projectId: "projet-etranger" })).rejects.toThrow(
      "Chantier/projet introuvable"
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("crée le document quand le client (et le projet) appartiennent bien au compte", async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: "client1", accountId: "acc1" });
    mockPrisma.project.findFirst.mockResolvedValue({ id: "projet1", accountId: "acc1" });

    const result = await createDocument("acc1", { ...baseInput, projectId: "projet1" });

    expect(result.accountId).toBe("acc1");
    expect(result.sequenceNumber).toBe(`INV-${new Date().getFullYear()}-0001`);
  });

  it("rejette un devis/facture sans ligne avant même de toucher la base", async () => {
    await expect(createDocument("acc1", { ...baseInput, lines: [] })).rejects.toThrow(
      "au moins une ligne"
    );
    expect(mockPrisma.client.findFirst).not.toHaveBeenCalled();
  });
});
