export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/** Utilisé en dev quand RESEND_API_KEY n'est pas configuré. */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email] à ${message.to} — ${message.subject}\n${message.body}`);
  }
}

/** Envoie réellement les emails via Resend. */
export class ResendEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? "DEFA <onboarding@resend.dev>";
    if (!apiKey) {
      throw new Error("RESEND_API_KEY non configuré");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.body,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `Erreur Resend ${res.status}`);
    }
  }
}

/** Choisit l'implémentation selon la configuration disponible. */
export function getDefaultEmailSender(): EmailSender {
  return process.env.RESEND_API_KEY ? new ResendEmailSender() : new ConsoleEmailSender();
}
