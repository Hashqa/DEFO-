import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeStats } from "../stats";

const mockPrisma = vi.hoisted(() => ({
  billingDocument: { findMany: vi.fn() },
}));

vi.mock("../../db", () => ({ prisma: mockPrisma }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("computeStats", () => {
  it("calcule le CA, les achats et la marge", async () => {
    mockPrisma.billingDocument.findMany
      .mockResolvedValueOnce([
        { clientId: "c1", totalExclVat: 100, totalInclVat: 121, client: { name: "Client A" } },
        { clientId: "c1", totalExclVat: 50, totalInclVat: 60.5, client: { name: "Client A" } },
      ])
      .mockResolvedValueOnce([{ totalExclVat: 30, totalInclVat: 36.3 }]);

    const stats = await computeStats("acc1");

    expect(stats.revenueExclVat).toBeCloseTo(150);
    expect(stats.purchasesExclVat).toBeCloseTo(30);
    expect(stats.margin).toBeCloseTo(120);
    expect(stats.invoiceCount).toBe(2);
  });

  it("regroupe le chiffre d'affaires par client pour le top clients", async () => {
    mockPrisma.billingDocument.findMany
      .mockResolvedValueOnce([
        { clientId: "c1", totalExclVat: 100, totalInclVat: 121, client: { name: "Petit client" } },
        { clientId: "c2", totalExclVat: 500, totalInclVat: 605, client: { name: "Gros client" } },
        { clientId: "c2", totalExclVat: 100, totalInclVat: 121, client: { name: "Gros client" } },
      ])
      .mockResolvedValueOnce([]);

    const stats = await computeStats("acc1");

    expect(stats.topClients[0]).toEqual({ clientId: "c2", name: "Gros client", totalInclVat: 726 });
    expect(stats.topClients[1].clientId).toBe("c1");
  });

  it("renvoie des totaux à zéro quand il n'y a aucune facture", async () => {
    mockPrisma.billingDocument.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const stats = await computeStats("acc1");
    expect(stats).toEqual({
      revenueExclVat: 0,
      purchasesExclVat: 0,
      margin: 0,
      invoiceCount: 0,
      topClients: [],
    });
  });
});
