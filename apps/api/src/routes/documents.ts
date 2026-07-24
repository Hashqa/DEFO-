import { Router } from "express";
import multer from "multer";
import { requireAuth, requireOwner } from "../middleware/auth";
import {
  convertQuoteByOwnerDecision,
  createDocument,
  getDocument,
  listDocuments,
  requestClientValidation,
  sendDocumentViaPeppol,
} from "../services/documents";
import { generateDocumentPdf } from "../services/pdf";
import { sendPaymentReminders } from "../services/reminders";
import { reconcilePayments } from "../services/bankReconciliation";
import { scanInvoice } from "../services/mindee";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

documentsRouter.get("/", async (req, res) => {
  const accountId = req.accountId!;
  const { type, direction, clientId, projectId } = req.query;
  const documents = await listDocuments(accountId, {
    type: typeof type === "string" ? (type as "QUOTE" | "INVOICE") : undefined,
    direction: typeof direction === "string" ? (direction as "PURCHASE" | "SALE") : undefined,
    clientId: typeof clientId === "string" ? clientId : undefined,
    projectId: typeof projectId === "string" ? projectId : undefined,
  });
  res.json(documents);
});

documentsRouter.get("/:id", async (req, res) => {
  const accountId = req.accountId!;
  const document = await getDocument(accountId, req.params.id);
  if (!document) {
    res.status(404).json({ error: "Devis/facture introuvable" });
    return;
  }
  res.json(document);
});

documentsRouter.post("/", async (req, res) => {
  const accountId = req.accountId!;
  try {
    const document = await createDocument(accountId, req.body);
    res.status(201).json(document);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

documentsRouter.get("/:id/pdf", async (req, res) => {
  const accountId = req.accountId!;
  const document = await getDocument(accountId, req.params.id);
  if (!document) {
    res.status(404).json({ error: "Devis/facture introuvable" });
    return;
  }
  const pdf = await generateDocumentPdf(document);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${document.sequenceNumber}.pdf"`);
  res.send(pdf);
});

/** Décision seule de l'indépendant : conversion immédiate. */
documentsRouter.post("/:id/convert", async (req, res) => {
  const accountId = req.accountId!;
  try {
    const invoice = await convertQuoteByOwnerDecision(accountId, req.params.id);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/** Déclenche manuellement les relances de paiement pour ce compte (utile pour tester ; en production, un cron appelle le script `reminders:run`). */
documentsRouter.post("/reminders/run", requireOwner, async (req, res) => {
  const accountId = req.accountId!;
  const result = await sendPaymentReminders(undefined, accountId);
  res.json(result);
});

/** Rapproche les transactions bancaires Ponto avec les factures de vente en attente de paiement. */
documentsRouter.post("/reconcile-payments", requireOwner, async (req, res) => {
  const accountId = req.accountId!;
  try {
    const result = await reconcilePayments(accountId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/** Scan d'une facture fournisseur (section 3.2) : extraction via Mindee, à vérifier/compléter manuellement. */
documentsRouter.post("/scan-invoice", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Fichier manquant (champ 'file')" });
    return;
  }
  try {
    const extracted = await scanInvoice(req.file.buffer, req.file.originalname);
    res.json(extracted);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/** Envoie une facture de vente via Peppol (Recommand). */
documentsRouter.post("/:id/send-peppol", async (req, res) => {
  const accountId = req.accountId!;
  try {
    const result = await sendDocumentViaPeppol(accountId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/** Génère le lien de validation en ligne à envoyer au client. */
documentsRouter.post("/:id/request-client-validation", async (req, res) => {
  const accountId = req.accountId!;
  try {
    const quote = await requestClientValidation(accountId, req.params.id);
    res.json({
      quote,
      validationUrl: `${process.env.PUBLIC_APP_URL ?? "http://localhost:3000"}/devis/${quote.acceptanceToken}`,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
