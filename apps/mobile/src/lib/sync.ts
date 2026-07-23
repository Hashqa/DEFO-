import * as Network from "expo-network";
import { apiFetch } from "./api";
import { getPendingDocuments, markDocumentSynced } from "./db";

export async function isOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export interface SyncResult {
  synced: number;
  remaining: number;
}

/**
 * Pousse vers l'API les devis/factures créés hors-ligne. À appeler au retour
 * réseau (voir App.tsx) — section 3.8 du cahier des charges.
 */
export async function syncPendingDocuments(): Promise<SyncResult> {
  const pending = await getPendingDocuments();
  if (pending.length === 0) {
    return { synced: 0, remaining: 0 };
  }
  if (!(await isOnline())) {
    return { synced: 0, remaining: pending.length };
  }

  let synced = 0;
  for (const item of pending) {
    try {
      const serverDocument = await apiFetch<{ id: string }>("/documents", {
        method: "POST",
        body: JSON.stringify(item.data),
      });
      await markDocumentSynced(item.id, serverDocument);
      synced++;
    } catch {
      // Réseau instable ou erreur serveur : reste en attente, on retentera plus tard.
    }
  }

  const remaining = (await getPendingDocuments()).length;
  return { synced, remaining };
}
