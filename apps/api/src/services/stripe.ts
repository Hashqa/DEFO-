import Stripe from "stripe";
import { prisma } from "../db";

let stripeClient: Stripe | null = null;

/** Client Stripe créé au premier usage — échoue clairement si la clé manque, comme les autres intégrations (Peppol/Ponto/Mindee). */
function stripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY non configuré");
    }
    stripeClient = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  }
  return stripeClient;
}

/** Abonnement mensuel par utilisateur/entreprise — section 4 du cahier des charges. */
export async function createCheckoutSession(accountId: string, email: string) {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID non configuré");
  }
  const [account, seats] = await Promise.all([
    prisma.account.findUniqueOrThrow({ where: { id: accountId } }),
    prisma.user.count({ where: { accountId } }),
  ]);

  let customerId = account.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe().customers.create({ email, metadata: { accountId } });
    customerId = customer.id;
    await prisma.account.update({ where: { id: accountId }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
  return stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: seats }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { accountId },
  });
}

/**
 * Ajuste la quantité de l'abonnement Stripe sur le nombre d'utilisateurs
 * actuel du compte (tarif par utilisateur — section 4). Sans effet si le
 * compte n'a pas encore d'abonnement actif.
 */
export async function updateSubscriptionQuantity(accountId: string): Promise<void> {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.stripeSubscriptionId) return;

  const seats = await prisma.user.count({ where: { accountId } });
  const subscription = await stripe().subscriptions.retrieve(account.stripeSubscriptionId);
  const item = subscription.items.data[0];
  if (!item) return;

  await stripe().subscriptionItems.update(item.id, {
    quantity: seats,
    proration_behavior: "create_prorations",
  });
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET non configuré");
  }
  return stripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "PAST_DUE" | "CANCELED" | "NONE" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "NONE";
  }
}

/** Traite les événements Stripe reçus sur /billing/webhook pour garder le statut d'abonnement à jour. */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId;
      if (!accountId || !session.subscription) break;
      await prisma.account.update({
        where: { id: accountId },
        data: { stripeSubscriptionId: session.subscription as string, subscriptionStatus: "ACTIVE" },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const account = await prisma.account.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (!account) break;
      await prisma.account.update({
        where: { id: account.id },
        data: { subscriptionStatus: mapStripeStatus(subscription.status) },
      });
      break;
    }
    default:
      break;
  }
}
