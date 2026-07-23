import PDFDocument from "pdfkit";
import type { Account, BillingDocument, Client, DocumentLine } from "@prisma/client";
import { buildEpcQrPayload, generateEpcQrPng } from "./epcQr";

type FullDocument = BillingDocument & {
  lines: DocumentLine[];
  client: Client;
  account: Account;
};

const DOCUMENT_TITLES: Record<FullDocument["type"], string> = {
  QUOTE: "Devis",
  INVOICE: "Facture",
};

/**
 * Génère le PDF légal d'un devis/facture : mentions obligatoires belges
 * (n° BCE, TVA, numérotation séquentielle, détail des taux de TVA) — voir
 * section 3.3 du cahier des charges. Conservé pour la facturation B2C ;
 * la facturation B2B passe par Peppol en plus de ce PDF. Inclut le QR de
 * paiement EPC (section 3.4) si le compte a renseigné son IBAN.
 */
export async function generateDocumentPdf(document: FullDocument): Promise<Buffer> {
  let paymentQrPng: Buffer | null = null;
  if (document.type === "INVOICE" && document.account.iban) {
    const payload = buildEpcQrPayload({
      beneficiaryName: document.account.companyName,
      iban: document.account.iban,
      bic: document.account.bic ?? undefined,
      amount: Number(document.totalInclVat),
      remittanceInfo: document.sequenceNumber,
    });
    paymentQrPng = await generateEpcQrPng(payload);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const title = DOCUMENT_TITLES[document.type];

    doc.fontSize(20).text(document.account.companyName, { continued: false });
    doc.fontSize(9)
      .text(`TVA ${document.account.vatNumber} — BCE ${document.account.bceNumber}`)
      .moveDown(1.5);

    doc.fontSize(16).text(`${title} ${document.sequenceNumber}`);
    doc.fontSize(10)
      .text(`Date d'émission : ${document.issuedAt.toLocaleDateString("fr-BE")}`)
      .text(document.dueAt ? `Échéance : ${document.dueAt.toLocaleDateString("fr-BE")}` : "")
      .moveDown(1);

    doc.fontSize(12).text("Client", { underline: true });
    doc.fontSize(10).text(document.client.name);
    if (document.client.vatNumber) doc.text(`TVA ${document.client.vatNumber}`);
    if (document.client.address) doc.text(document.client.address);
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const columns = { description: 50, quantity: 280, unitPrice: 350, vatRate: 430, total: 480 };
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Description", columns.description, tableTop);
    doc.text("Qté", columns.quantity, tableTop);
    doc.text("PU HT", columns.unitPrice, tableTop);
    doc.text("TVA", columns.vatRate, tableTop);
    doc.text("Total HT", columns.total, tableTop);
    doc.font("Helvetica").moveDown(0.5);

    for (const line of document.lines) {
      const y = doc.y;
      const lineTotal = Number(line.quantity) * Number(line.unitPrice);
      doc.text(line.description, columns.description, y, { width: 220 });
      doc.text(String(line.quantity), columns.quantity, y);
      doc.text(`${Number(line.unitPrice).toFixed(2)} €`, columns.unitPrice, y);
      doc.text(`${line.vatRate}%`, columns.vatRate, y);
      doc.text(`${lineTotal.toFixed(2)} €`, columns.total, y);
      doc.moveDown(0.8);
    }

    doc.moveDown(1);
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`Total HT : ${Number(document.totalExclVat).toFixed(2)} €`, { align: "right" });
    doc.text(`Total TVAC : ${Number(document.totalInclVat).toFixed(2)} €`, { align: "right" });
    doc.font("Helvetica");

    if (paymentQrPng) {
      doc.moveDown(1.5);
      doc.fontSize(10).fillColor("black").text("Scannez pour payer (QR EPC / virement SEPA)", { align: "center" });
      doc.image(paymentQrPng, (doc.page.width - 150) / 2, doc.y + 5, { width: 150 });
      doc.moveDown(10);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("gray").text(
      "Numérotation séquentielle sans trou — document conservé conformément à la réglementation belge.",
      { align: "center" }
    );

    doc.end();
  });
}
