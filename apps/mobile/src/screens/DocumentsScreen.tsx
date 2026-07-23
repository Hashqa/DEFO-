import { useCallback, useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "../lib/api";
import { getCachedDocuments, saveDocumentLocal, type CachedDocument } from "../lib/db";
import { isOnline, syncPendingDocuments } from "../lib/sync";

interface Props {
  onNewDocument: () => void;
  onClients: () => void;
  onLogout: () => void;
}

export default function DocumentsScreen({ onNewDocument, onClients, onLogout }: Props) {
  const [documents, setDocuments] = useState<CachedDocument[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (await isOnline()) {
        const fresh = await apiFetch<Record<string, unknown>[]>("/documents");
        for (const doc of fresh) {
          await saveDocumentLocal(doc.id as string, doc, false);
        }
      }
    } catch {
      // Hors-ligne ou API indisponible : on affiche simplement le cache local.
    }
    setDocuments(await getCachedDocuments());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSync() {
    setStatus("Synchronisation…");
    const result = await syncPendingDocuments();
    setStatus(`${result.synced} synchronisé(s), ${result.remaining} en attente.`);
    await load();
  }

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Button title="Clients" onPress={onClients} />
        <Button title="+ Nouveau" onPress={onNewDocument} />
        <Button title="Déconnexion" onPress={onLogout} />
      </View>
      <Text style={styles.title}>Devis &amp; factures</Text>
      <Button title="Synchroniser" onPress={handleSync} />
      {status && <Text style={styles.status}>{status}</Text>}
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>
              {(item.data.sequenceNumber as string | undefined) ?? "(en attente de synchro)"} —{" "}
              {item.data.type === "QUOTE" ? "Devis" : "Facture"}
            </Text>
            {item.pending && <Text style={styles.pending}>En attente de synchronisation</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>Aucun devis/facture pour l'instant.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  nav: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  status: { marginVertical: 4 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  pending: { color: "orange", fontSize: 12 },
  muted: { color: "#666" },
});
