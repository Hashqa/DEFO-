import { prisma } from "../db";

/**
 * Vérifie qu'un client appartient bien au compte appelant avant qu'on le
 * rattache à autre chose (devis/facture, chantier, mise à jour...) — sans
 * ce contrôle, un utilisateur pourrait référencer les données d'un autre
 * compte par son id.
 */
export async function findOwnedClient(accountId: string, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, accountId } });
}

/** Même contrôle que `findOwnedClient`, pour les chantiers/projets. */
export async function findOwnedProject(accountId: string, projectId: string) {
  return prisma.project.findFirst({ where: { id: projectId, accountId } });
}
