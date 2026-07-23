import * as SQLite from "expo-sqlite";

export interface CachedClient {
  id: string;
  name: string;
  vatNumber?: string;
  email?: string;
}

export interface CachedDocument {
  /** Id local (`local-<uuid>`) tant que non synchronisé, sinon l'id serveur. */
  id: string;
  data: Record<string, unknown>;
  pending: boolean;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("defa.db");
  }
  return dbPromise;
}

/** Crée les tables locales si besoin — à appeler une fois au démarrage de l'app. */
export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vat_number TEXT,
      email TEXT
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      pending INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

/** Rafraîchit le cache local des clients (lecture hors-ligne, sélection dans un nouveau devis/facture). */
export async function cacheClients(clients: CachedClient[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const client of clients) {
      await db.runAsync(
        "INSERT OR REPLACE INTO clients (id, name, vat_number, email) VALUES (?, ?, ?, ?)",
        [client.id, client.name, client.vatNumber ?? null, client.email ?? null]
      );
    }
  });
}

export async function getCachedClients(): Promise<CachedClient[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; name: string; vat_number: string | null; email: string | null }>(
    "SELECT * FROM clients ORDER BY name"
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    vatNumber: row.vat_number ?? undefined,
    email: row.email ?? undefined,
  }));
}

/** Enregistre un devis/facture créé hors-ligne (pending=true) ou déjà synchronisé (pending=false). */
export async function saveDocumentLocal(localId: string, data: Record<string, unknown>, pending: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO documents (id, data, pending) VALUES (?, ?, ?)", [
    localId,
    JSON.stringify(data),
    pending ? 1 : 0,
  ]);
}

export async function getCachedDocuments(): Promise<CachedDocument[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; data: string; pending: number }>(
    "SELECT * FROM documents ORDER BY created_at DESC"
  );
  return rows.map((row) => ({ id: row.id, data: JSON.parse(row.data), pending: row.pending === 1 }));
}

export async function getPendingDocuments(): Promise<CachedDocument[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; data: string }>(
    "SELECT id, data FROM documents WHERE pending = 1"
  );
  return rows.map((row) => ({ id: row.id, data: JSON.parse(row.data), pending: true }));
}

/** Remplace l'entrée locale par la version serveur (id définitif, numéro séquentiel) une fois synchronisée. */
export async function markDocumentSynced(localId: string, serverDocument: { id: string }): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM documents WHERE id = ?", [localId]);
    await db.runAsync("INSERT OR REPLACE INTO documents (id, data, pending) VALUES (?, ?, 0)", [
      serverDocument.id,
      JSON.stringify(serverDocument),
    ]);
  });
}
