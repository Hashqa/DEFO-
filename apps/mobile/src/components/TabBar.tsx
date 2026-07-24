import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconAccount, IconClients, IconInvoice, IconQuote } from "./icons";
import { useTheme } from "../theme";

export type TabKey = "quotes" | "invoices" | "clients" | "account";

const TABS: { key: TabKey; label: string; Icon: typeof IconQuote }[] = [
  { key: "quotes", label: "Devis", Icon: IconQuote },
  { key: "invoices", label: "Factures", Icon: IconInvoice },
  { key: "clients", label: "Clients", Icon: IconClients },
  { key: "account", label: "Compte", Icon: IconAccount },
];

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function TabBar({ active, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        const color = isActive ? theme.accent : theme.muted;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={styles.tab}>
            <Icon color={color} size={22} />
            <Text style={[styles.label, { color, fontWeight: isActive ? "700" : "500" }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 2 },
  label: { fontSize: 11 },
});
