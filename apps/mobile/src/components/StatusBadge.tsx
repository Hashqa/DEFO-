import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  PAID: "Payé",
  OVERDUE: "En retard",
};

export function StatusBadge({ status }: { status: string }) {
  const theme = useTheme();
  const colors = theme.status[status as keyof typeof theme.status];

  return (
    <View style={[styles.badge, { backgroundColor: colors?.bg ?? theme.borderLight }]}>
      <Text style={[styles.text, { color: colors?.text ?? theme.muted }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "600" },
});
