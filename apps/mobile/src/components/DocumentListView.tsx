import { FlatList, StyleSheet, Text, View } from "react-native";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import type { CachedDocument } from "../lib/db";
import { useTheme } from "../theme";

interface Props {
  documents: CachedDocument[];
  emptyLabel: string;
}

export function DocumentListView({ documents, emptyLabel }: Props) {
  const theme = useTheme();

  return (
    <FlatList
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card style={styles.row}>
          <View style={styles.rowTop}>
            <Text style={[styles.sequence, { color: theme.text }]}>
              {(item.data.sequenceNumber as string | undefined) ?? "En attente de synchro"}
            </Text>
            <StatusBadge status={(item.data.status as string | undefined) ?? "DRAFT"} />
          </View>
          <Text style={{ color: theme.muted }}>{(item.data.client as { name?: string } | undefined)?.name ?? ""}</Text>
          <View style={styles.rowBottom}>
            <Text style={[styles.total, { color: theme.text }]}>
              {(item.data.totalInclVat as string | number | undefined) ?? "—"} €
            </Text>
            {item.pending && <Text style={[styles.pending, { color: theme.status.OVERDUE.text }]}>Non synchronisé</Text>}
          </View>
        </Card>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={<Text style={{ color: theme.muted }}>{emptyLabel}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 4 },
  row: { gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sequence: { fontWeight: "700" },
  total: { fontWeight: "600" },
  pending: { fontSize: 12, fontWeight: "600" },
});
