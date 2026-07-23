export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Implémentation par défaut en attendant le choix d'un vrai fournisseur
 * (ex. Resend, SendGrid, Postmark) — comme pour Peppol/Ponto, ce choix est
 * externe au code et reste à trancher.
 */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email] à ${message.to} — ${message.subject}\n${message.body}`);
  }
}
