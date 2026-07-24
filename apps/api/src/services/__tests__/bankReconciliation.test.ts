import { beforeEach, describe, expect, it, vi } from "vitest";
import { reconcilePayments } from "../bankReconciliation";

const mockPrisma = vi.hoisted(() => ({
  billingDocument: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  payment: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../../db", () => ({ prisma: mockPrisma }));

const mockPonto = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  listTransactions: vi.fn(),
}));

vi.mock("../ponto", () => mockPonto);

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation((operations: unknown[]) => Promise.all(operations));
  mockPrisma.payment.create.mockImplementation(async () => ({}));
  mockPrisma.billingDocument.update.mockImplementation(async () => ({}));
});

describe("reconcilePayments", () => {
  it("rapproche une transaction dont la communication contient le n° de facture et le montant exact", async () => {
    mockPonto.listAccounts.mockResolvedValue([{ id: "ponto-acc1" }]);
    mockPonto.listTransactions.mockResolvedValue([
      {
        id: "txn1",
        amount: 121,
        valueDate: "2026-07-01",
        remittanceInformation: "Paiement facture INV-2026-0001 merci",
      },
    ]);
    mockPrisma.billingDocument.findMany.mockResolvedValue([
      { id: "doc1", sequenceNumber: "INV-2026-0001", totalInclVat: 121 },
    ]);
    mockPrisma.payment.findMany.mockResolvedValue([]);

    const result = await reconcilePayments("acc1");

    expect(result).toEqual({ matchedCount: 1, transactionsScanned: 1 });
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ documentId: "doc1", accountId: "acc1", externalTransactionId: "txn1" }),
      })
    );
    expect(mockPrisma.billingDocument.update).toHaveBeenCalledWith({
      where: { id: "doc1" },
      data: { status: "PAID" },
    });
  });

  it("ignore une transaction dont le montant ne correspond à aucune facture ouverte", async () => {
    mockPonto.listAccounts.mockResolvedValue([{ id: "ponto-acc1" }]);
    mockPonto.listTransactions.mockResolvedValue([
      { id: "txn1", amount: 999, valueDate: "2026-07-01", remittanceInformation: "INV-2026-0001" },
    ]);
    mockPrisma.billingDocument.findMany.mockResolvedValue([
      { id: "doc1", sequenceNumber: "INV-2026-0001", totalInclVat: 121 },
    ]);
    mockPrisma.payment.findMany.mockResolvedValue([]);

    const result = await reconcilePayments("acc1");

    expect(result.matchedCount).toBe(0);
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it("ne rapproche pas deux fois la même transaction bancaire", async () => {
    mockPonto.listAccounts.mockResolvedValue([{ id: "ponto-acc1" }]);
    mockPonto.listTransactions.mockResolvedValue([
      { id: "txn1", amount: 121, valueDate: "2026-07-01", remittanceInformation: "INV-2026-0001" },
    ]);
    mockPrisma.billingDocument.findMany.mockResolvedValue([
      { id: "doc1", sequenceNumber: "INV-2026-0001", totalInclVat: 121 },
    ]);
    // Un Payment existe déjà pour cette transaction (déjà rapprochée lors d'un run précédent).
    mockPrisma.payment.findMany.mockResolvedValue([{ externalTransactionId: "txn1" }]);

    const result = await reconcilePayments("acc1");

    expect(result.matchedCount).toBe(0);
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it("ignore les transactions négatives (débits, pas des paiements reçus)", async () => {
    mockPonto.listAccounts.mockResolvedValue([{ id: "ponto-acc1" }]);
    mockPonto.listTransactions.mockResolvedValue([
      { id: "txn1", amount: -121, valueDate: "2026-07-01", remittanceInformation: "INV-2026-0001" },
    ]);
    mockPrisma.billingDocument.findMany.mockResolvedValue([
      { id: "doc1", sequenceNumber: "INV-2026-0001", totalInclVat: 121 },
    ]);
    mockPrisma.payment.findMany.mockResolvedValue([]);

    const result = await reconcilePayments("acc1");
    expect(result.matchedCount).toBe(0);
  });
});
