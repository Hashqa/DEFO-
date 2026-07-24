import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { apiFetch, setToken } from "../lib/api";
import { useTheme } from "../theme";

interface Props {
  onLoggedIn: () => void;
}

export default function LoginScreen({ onLoggedIn }: Props) {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await setToken(result.token);
      onLoggedIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
        <Text style={styles.brandLetter}>D</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>DEFA</Text>

      <Card style={{ gap: 12 }}>
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.text }]}
          placeholder="Email"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.pageBg, color: theme.text }]}
          placeholder="Mot de passe"
          placeholderTextColor={theme.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={{ color: theme.danger }}>{error}</Text>}
        <AppButton title={loading ? "Connexion…" : "Se connecter"} onPress={handleLogin} loading={loading} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  brandLetter: { color: "#fff", fontWeight: "800", fontSize: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 10, padding: 12 },
});
