import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { DocumentListView } from "../components/DocumentListView";
import { apiFetch } from "../lib/api";
import { getCachedDocuments, saveDocumentLocal, type CachedDocument } from "../lib/db";
import { isOnline, syncPendingDocuments } from "../lib/sync";
import { useTheme } from "../theme";

interface Props {
  onNewDocument: () => void;
}

export default function QuotesScreen({ onNewDocument }: Props) {
  const theme = useTheme();
  const [documents, setDocuments] = useState<CachedDocument[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (await isOnline()) {
        const fresh = await apiFetch<Record<string, unknown>[]>("/documents?type=QUOTE");
        for (const doc of fresh) {
          await saveDocumentLocal(doc.id as string, doc, false);
        }
      }
    } catch {
      // Hors-ligne ou API indisponible : on affiche simplement le cache local.
    }
    const cached = await getCachedDocuments();
    setDocuments(cached.filter((d) => d.data.type === "QUOTE"));
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
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <Text style={[styles.title, { color: theme.text }]}>Devis</Text>
      <View style={styles.actions}>
        <AppButton title="+ Nouveau devis" onPress={onNewDocument} />
        <AppButton title="Synchroniser" onPress={handleSync} variant="soft" />
      </View>
      {status && <Text style={{ color: theme.muted, marginBottom: 8 }}>{status}</Text>}
      <DocumentListView documents={documents} emptyLabel="Aucun devis pour l'instant." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 10 },
});
