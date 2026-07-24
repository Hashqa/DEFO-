import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";
import { cacheClients, getCachedClients, type CachedClient } from "../lib/db";
import { isOnline } from "../lib/sync";
import { useTheme } from "../theme";

export default function ClientsScreen() {
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <Text style={[styles.title, { color: theme.text }]}>Clients</Text>
      {error && <Text style={{ color: theme.danger, marginBottom: 8 }}>{error} (cache local affiché)</Text>}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Card style={{ gap: 2 }}>
            <Text style={{ color: theme.text, fontWeight: "600" }}>{item.name}</Text>
            {item.vatNumber && <Text style={{ color: theme.muted, fontSize: 12 }}>TVA {item.vatNumber}</Text>}
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: theme.muted }}>Aucun client en cache.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
});
