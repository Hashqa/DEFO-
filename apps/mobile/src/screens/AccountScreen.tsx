import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme";

interface Props {
  onLogout: () => void;
}

interface AccountInfo {
  companyName: string;
  vatNumber: string;
}

export default function AccountScreen({ onLogout }: Props) {
  const theme = useTheme();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AccountInfo>("/account")
      .then(setAccount)
      .catch((err) => setError((err as Error).message));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mon compte</Text>

      <Card style={{ gap: 8 }}>
        {error && <Text style={{ color: theme.danger }}>{error}</Text>}
        {!account && !error && <Text style={{ color: theme.muted }}>Chargement…</Text>}
        {account && (
          <>
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16 }}>{account.companyName}</Text>
            <Text style={{ color: theme.muted }}>TVA {account.vatNumber}</Text>
          </>
        )}
      </Card>

      <Text style={[styles.hint, { color: theme.muted }]}>
        Pour le logo, l'IBAN ou l'abonnement, utilise le site web sur ordinateur.
      </Text>

      <AppButton title="Déconnexion" onPress={onLogout} variant="soft" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: "bold" },
  hint: { fontSize: 13 },
});
