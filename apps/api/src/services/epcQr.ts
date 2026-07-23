import QRCode from "qrcode";

export interface EpcQrInput {
  beneficiaryName: string;
  iban: string;
  bic?: string;
  amount: number;
  remittanceInfo: string;
}

/**
 * Construit le payload EPC (norme EPC069-12) pour un virement SEPA
 * pré-rempli — voir section 3.4 du cahier des charges. Le BIC peut rester
 * vide pour un IBAN de la zone SEPA (recommandé mais non obligatoire depuis
 * 2016).
 */
export function buildEpcQrPayload(input: EpcQrInput): string {
  const iban = input.iban.replace(/\s+/g, "").toUpperCase();
  const amount = `EUR${input.amount.toFixed(2)}`;
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    input.bic ?? "",
    input.beneficiaryName.slice(0, 70),
    iban,
    amount,
    "",
    "",
    input.remittanceInfo.slice(0, 140),
  ].join("\n");
}

/** Génère l'image PNG (en Buffer) du QR EPC à partir de son payload. */
export async function generateEpcQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { errorCorrectionLevel: "M", margin: 1, width: 300 });
}
