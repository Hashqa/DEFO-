import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";
import { getCachedClients, saveDocumentLocal, type CachedClient } from "../lib/db";
import { isOnline } from "../lib/sync";
import { useTheme } from "../theme";

interface Props {
  initialType: "QUOTE" | "INVOICE";
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
export default function NewDocumentScreen({ initialType, onDone }: Props) {
  const theme = useTheme();
  const [clients, setClients] = useState<CachedClient[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [type, setType] = useState<"QUOTE" | "INVOICE">(initialType);
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

  function optionStyle(selected: boolean) {
    return [
      styles.option,
      { borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.accentSoft : theme.cardBg },
    ];
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {type === "QUOTE" ? "Nouveau devis" : "Nouvelle facture"}
      </Text>

      <Card style={{ gap: 16 }}>
        <View>
          <Text style={[styles.label, { color: theme.muted }]}>Type</Text>
          <View style={styles.row}>
            <Pressable onPress={() => setType("QUOTE")} style={optionStyle(type === "QUOTE")}>
              <Text style={{ color: theme.text }}>Devis</Text>
            </Pressable>
            <Pressable onPress={() => setType("INVOICE")} style={optionStyle(type === "INVOICE")}>
              <Text style={{ color: theme.text }}>Facture</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={[styles.label, { color: theme.muted }]}>Client</Text>
          {clients.map((c) => (
            <Pressable key={c.id} onPress={() => setClientId(c.id)} style={[optionStyle(clientId === c.id), { marginBottom: 6 }]}>
              <Text style={{ color: theme.text }}>{c.name}</Text>
            </Pressable>
          ))}
          {clients.length === 0 && (
            <Text style={{ color: theme.muted }}>Aucun client en cache — connectez-vous au réseau au moins une fois.</Text>
          )}
        </View>

        <View>
          <Text style={[styles.label, { color: theme.muted }]}>Lignes</Text>
          {lines.map((line, i) => (
            <View key={i} style={[styles.lineBlock, { borderBottomColor: theme.borderLight }]}>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Description"
                placeholderTextColor={theme.muted}
                value={line.description}
                onChangeText={(v) => updateLine(i, "description", v)}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Qté"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
                value={line.quantity}
                onChangeText={(v) => updateLine(i, "quantity", v)}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="PU HT"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
                value={line.unitPrice}
                onChangeText={(v) => updateLine(i, "unitPrice", v)}
              />
            </View>
          ))}
          <AppButton title="+ Ligne" onPress={addLine} variant="soft" />
        </View>

        {error && <Text style={{ color: theme.danger }}>{error}</Text>}
        <View style={styles.actions}>
          <AppButton title="Créer" onPress={handleSubmit} />
          <AppButton title="Annuler" onPress={onDone} variant="soft" />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 6, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, padding: 9, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  option: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  lineBlock: { marginBottom: 8, borderBottomWidth: 1, paddingBottom: 8 },
  actions: { gap: 8 },
});
