import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendPaymentReminders } from "../reminders";
import type { EmailSender } from "../email";

const mockPrisma = vi.hoisted(() => ({
  billingDocument: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../db", () => ({ prisma: mockPrisma }));

function fakeSender(): EmailSender & { sent: { to: string; subject: string }[] } {
  const sent: { to: string; subject: string }[] = [];
  return {
    sent,
    async send(message) {
      sent.push({ to: message.to, subject: message.subject });
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendPaymentReminders", () => {
  it("relance uniquement les factures dont le client a un email", async () => {
    mockPrisma.billingDocument.findMany.mockResolvedValue([
      {
        id: "doc1",
        sequenceNumber: "INV-2026-0001",
        totalInclVat: 121,
        client: { name: "Client A", email: "a@example.com" },
        account: { companyName: "Mon Entreprise" },
      },
      {
        id: "doc2",
        sequenceNumber: "INV-2026-0002",
        totalInclVat: 50,
        client: { name: "Client B", email: null },
        account: { companyName: "Mon Entreprise" },
      },
    ]);
    mockPrisma.billingDocument.update.mockResolvedValue({});

    const sender = fakeSender();
    const result = await sendPaymentReminders(sender, "acc1");

    expect(result.total).toBe(2);
    expect(result.sentCount).toBe(1);
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].to).toBe("a@example.com");
    expect(sender.sent[0].subject).toContain("INV-2026-0001");
  });

  it("marque la facture OVERDUE et horodate la relance", async () => {
    mockPrisma.billingDocument.findMany.mockResolvedValue([
      {
        id: "doc1",
        sequenceNumber: "INV-2026-0001",
        totalInclVat: 121,
        client: { name: "Client A", email: "a@example.com" },
        account: { companyName: "Mon Entreprise" },
      },
    ]);
    mockPrisma.billingDocument.update.mockResolvedValue({});

    await sendPaymentReminders(fakeSender(), "acc1");

    expect(mockPrisma.billingDocument.update).toHaveBeenCalledWith({
      where: { id: "doc1" },
      data: { status: "OVERDUE", lastReminderSentAt: expect.any(Date) },
    });
  });

  it("ne relance rien s'il n'y a aucune facture en retard", async () => {
    mockPrisma.billingDocument.findMany.mockResolvedValue([]);
    const result = await sendPaymentReminders(fakeSender(), "acc1");
    expect(result).toEqual({ sentCount: 0, total: 0 });
  });
});
