import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "../lib/api";
import { cacheClients, getCachedClients, type CachedClient } from "../lib/db";
import { isOnline } from "../lib/sync";

interface Props {
  onBack: () => void;
}

export default function ClientsScreen({ onBack }: Props) {
  const [clients, setClients] = useState<CachedClient[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      if (await isOnline()) {
        const fresh = await apiFetch<CachedClient[]>("/clients");
        await cacheClients(fresh);
        setClients(fresh);
        return;
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setClients(await getCachedClients());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Button title="← Retour" onPress={onBack} />
      <Text style={styles.title}>Clients</Text>
      {error && <Text style={styles.error}>{error} (cache local affiché)</Text>}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{item.name}</Text>
            {item.vatNumber && <Text style={styles.muted}>TVA {item.vatNumber}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>Aucun client en cache.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 12 },
  error: { color: "orange", marginBottom: 8 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  muted: { color: "#666", fontSize: 12 },
});
