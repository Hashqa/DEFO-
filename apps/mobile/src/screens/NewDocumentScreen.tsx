import { useEffect, useState } from "react";
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch } from "../lib/api";
import { getCachedClients, saveDocumentLocal, type CachedClient } from "../lib/db";
import { isOnline } from "../lib/sync";

interface Props {
  onDone: () => void;
}

interface LineInput {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: "0" | "6" | "12" | "21";
}

const EMPTY_LINE: LineInput = { description: "", quantity: "1", unitPrice: "0", vatRate: "21" };

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Formulaire simplifié pour mobile : vente/service par défaut (le cas le
 * plus courant en déplacement). Le web couvre les cas achat/matière+MO.
 */
export default function NewDocumentScreen({ onDone }: Props) {
  const [clients, setClients] = useState<CachedClient[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [type, setType] = useState<"QUOTE" | "INVOICE">("QUOTE");
  const [lines, setLines] = useState<LineInput[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCachedClients().then(setClients);
  }, []);

  function updateLine(index: number, field: keyof LineInput, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  async function handleSubmit() {
    if (!clientId) {
      setError("Choisissez un client");
      return;
    }
    setError(null);

    const payload = {
      clientId,
      type,
      direction: "SALE" as const,
      billingKind: "SERVICE" as const,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate),
      })),
    };

    try {
      if (await isOnline()) {
        const document = await apiFetch<{ id: string }>("/documents", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await saveDocumentLocal(document.id, document as unknown as Record<string, unknown>, false);
      } else {
        await saveDocumentLocal(generateLocalId(), payload, true);
      }
    } catch {
      // Échec réseau au moment de l'envoi : conservé en local, synchronisé plus tard.
      await saveDocumentLocal(generateLocalId(), payload, true);
    }
    onDone();
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nouveau devis/facture</Text>

      <Text style={styles.label}>Client</Text>
      {clients.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => setClientId(c.id)}
          style={[styles.option, clientId === c.id && styles.optionSelected]}
        >
          <Text>{c.name}</Text>
        </Pressable>
      ))}
      {clients.length === 0 && (
        <Text style={styles.muted}>Aucun client en cache — connectez-vous au réseau au moins une fois.</Text>
      )}

      <Text style={styles.label}>Type</Text>
      <View style={styles.row}>
        <Pressable onPress={() => setType("QUOTE")} style={[styles.option, type === "QUOTE" && styles.optionSelected]}>
          <Text>Devis</Text>
        </Pressable>
        <Pressable
          onPress={() => setType("INVOICE")}
          style={[styles.option, type === "INVOICE" && styles.optionSelected]}
        >
          <Text>Facture</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Lignes</Text>
      {lines.map((line, i) => (
        <View key={i} style={styles.lineBlock}>
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={line.description}
            onChangeText={(v) => updateLine(i, "description", v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Qté"
            keyboardType="numeric"
            value={line.quantity}
            onChangeText={(v) => updateLine(i, "quantity", v)}
          />
          <TextInput
            style={styles.input}
            placeholder="PU HT"
            keyboardType="numeric"
            value={line.unitPrice}
            onChangeText={(v) => updateLine(i, "unitPrice", v)}
          />
        </View>
      ))}
      <Button title="+ Ligne" onPress={addLine} />

      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
        <Button title="Créer" onPress={handleSubmit} />
        <Button title="Annuler" onPress={onDone} color="#999" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  option: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 6 },
  optionSelected: { borderColor: "#333", backgroundColor: "#eee" },
  lineBlock: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 8 },
  error: { color: "red", marginVertical: 8 },
  muted: { color: "#666" },
  actions: { marginTop: 16, gap: 8 },
});
