import { describe, expect, it, vi } from "vitest";
import { nextSequenceNumber } from "../documentNumbering";

function fakeTx(count: number) {
  return { billingDocument: { count: vi.fn().mockResolvedValue(count) } } as never;
}

describe("nextSequenceNumber", () => {
  it("commence à 0001 pour le premier document du type", async () => {
    const number = await nextSequenceNumber(fakeTx(0), "acc1", "INVOICE");
    expect(number).toBe(`INV-${new Date().getFullYear()}-0001`);
  });

  it("incrémente en fonction du nombre existant", async () => {
    const number = await nextSequenceNumber(fakeTx(41), "acc1", "INVOICE");
    expect(number).toBe(`INV-${new Date().getFullYear()}-0042`);
  });

  it("utilise un préfixe distinct pour les devis", async () => {
    const number = await nextSequenceNumber(fakeTx(0), "acc1", "QUOTE");
    expect(number.startsWith("QUO-")).toBe(true);
  });
});
