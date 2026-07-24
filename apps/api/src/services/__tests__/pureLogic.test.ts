import { describe, expect, it } from "vitest";
import { computeTotals } from "../documents";
import { buildEpcQrPayload, generateEpcQrPng } from "../epcQr";
import { buildInvoicePayload } from "../peppol";

describe("computeTotals", () => {
  it("calcule HT/TTC pour une seule ligne", () => {
    const result = computeTotals([{ description: "Prestation", quantity: 5, unitPrice: 20, vatRate: 21 }]);
    expect(result.totalExclVat).toBeCloseTo(100);
    expect(result.totalInclVat).toBeCloseTo(121);
  });

  it("additionne plusieurs lignes à des taux de TVA différents", () => {
    const result = computeTotals([
      { description: "Service", quantity: 1, unitPrice: 100, vatRate: 21 },
      { description: "Livre", quantity: 2, unitPrice: 10, vatRate: 6 },
      { description: "Export", quantity: 1, unitPrice: 50, vatRate: 0 },
    ]);
    // HT: 100 + 20 + 50 = 170 ; TVA: 21 + 1.2 + 0 = 22.2
    expect(result.totalExclVat).toBeCloseTo(170);
    expect(result.totalInclVat).toBeCloseTo(192.2);
  });

  it("renvoie zéro pour une liste vide", () => {
    const result = computeTotals([]);
    expect(result.totalExclVat).toBe(0);
    expect(result.totalInclVat).toBe(0);
  });
});

describe("buildEpcQrPayload", () => {
  it("produit les 11 champs du format EPC069-12 dans l'ordre", () => {
    const payload = buildEpcQrPayload({
      beneficiaryName: "Mon Entreprise SRL",
      iban: "BE68 5390 0754 7034",
      bic: "GKCCBEBB",
      amount: 121,
      remittanceInfo: "INV-2026-0001",
    });
    const lines = payload.split("\n");
    expect(lines).toEqual([
      "BCD",
      "002",
      "1",
      "SCT",
      "GKCCBEBB",
      "Mon Entreprise SRL",
      "BE68539007547034", // espaces retirés, majuscules
      "EUR121.00",
      "",
      "",
      "INV-2026-0001",
    ]);
  });

  it("tronque le nom du bénéficiaire et la communication aux limites de la norme", () => {
    const payload = buildEpcQrPayload({
      beneficiaryName: "A".repeat(100),
      iban: "BE68539007547034",
      amount: 10,
      remittanceInfo: "B".repeat(200),
    });
    const lines = payload.split("\n");
    expect(lines[5]).toHaveLength(70);
    expect(lines[10]).toHaveLength(140);
  });

  it("laisse le BIC vide quand non fourni", () => {
    const payload = buildEpcQrPayload({
      beneficiaryName: "Test",
      iban: "BE68539007547034",
      amount: 1,
      remittanceInfo: "ref",
    });
    expect(payload.split("\n")[4]).toBe("");
  });
});

describe("generateEpcQrPng", () => {
  it("génère une image PNG valide", async () => {
    const payload = buildEpcQrPayload({
      beneficiaryName: "Test",
      iban: "BE68539007547034",
      amount: 42,
      remittanceInfo: "ref",
    });
    const png = await generateEpcQrPng(payload);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); // signature PNG
  });
});

describe("buildInvoicePayload", () => {
  const baseDocument = {
    id: "doc1",
    accountId: "acc1",
    type: "INVOICE" as const,
    sequenceNumber: "INV-2026-0001",
    issuedAt: new Date("2026-07-01"),
    dueAt: new Date("2026-07-31"),
    totalExclVat: 100 as unknown as number,
    totalInclVat: 121 as unknown as number,
    client: {
      name: "Client Test",
      vatNumber: "BE0123456749",
      address: "Rue Test 1",
      city: "Bruxelles",
      postalCode: "1000",
      country: "BE",
      peppolAddress: "0208:0123456749",
    },
    account: {
      companyName: "Mon Entreprise SRL",
      vatNumber: "BE0987654321",
      street: "Rue Compte 1",
      city: "Liège",
      postalCode: "4000",
      country: "BE",
      iban: "BE68539007547034",
    },
    lines: [
      { description: "Prestation A", quantity: 2 as unknown as number, unitPrice: 50 as unknown as number, vatRate: 21 },
      { description: "Prestation B", quantity: 1 as unknown as number, unitPrice: 10 as unknown as number, vatRate: 6 },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it("mappe correctement l'acheteur, le vendeur et les lignes", () => {
    const payload = buildInvoicePayload(baseDocument);
    expect(payload.recipient).toBe("0208:0123456749");
    expect(payload.document.invoiceNumber).toBe("INV-2026-0001");
    expect(payload.document.buyer.name).toBe("Client Test");
    expect(payload.document.buyer.country).toBe("BE");
    expect(payload.document.seller.name).toBe("Mon Entreprise SRL");
    expect(payload.document.lines).toHaveLength(2);
    expect(payload.document.lines[0].netAmount).toBe("100.00");
  });

  it("regroupe les sous-totaux de TVA par taux distinct", () => {
    const payload = buildInvoicePayload(baseDocument);
    const percentages = payload.document.vat.subtotals.map((s) => s.percentage).sort();
    expect(percentages).toEqual(["21", "6"]);
    const at21 = payload.document.vat.subtotals.find((s) => s.percentage === "21")!;
    expect(at21.taxableAmount).toBe("100.00");
    expect(at21.vatAmount).toBe("21.00");
  });

  it("inclut les coordonnées de paiement quand l'IBAN est renseigné", () => {
    const payload = buildInvoicePayload(baseDocument);
    expect(payload.document.paymentMeans?.[0].iban).toBe("BE68539007547034");
  });

  it("omet les coordonnées de paiement quand l'IBAN est absent", () => {
    const payload = buildInvoicePayload({ ...baseDocument, account: { ...baseDocument.account, iban: undefined } });
    expect(payload.document.paymentMeans).toBeUndefined();
  });
});
