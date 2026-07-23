import { useCallback, useEffect, useState } from "react";
import { AppState, SafeAreaView, StyleSheet } from "react-native";
import { clearToken, getToken } from "./src/lib/api";
import { initDb } from "./src/lib/db";
import { syncPendingDocuments } from "./src/lib/sync";
import ClientsScreen from "./src/screens/ClientsScreen";
import DocumentsScreen from "./src/screens/DocumentsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import NewDocumentScreen from "./src/screens/NewDocumentScreen";

type Screen = "login" | "documents" | "newDocument" | "clients";

/**
 * Pas de librairie de navigation : l'app reste volontairement simple
 * (4 écrans), donc un switch d'état suffit et évite une dépendance de plus.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDb();
      const token = await getToken();
      setScreen(token ? "documents" : "login");
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncPendingDocuments();
      }
    });
    return () => subscription.remove();
  }, []);

  const handleLogout = useCallback(async () => {
    await clearToken();
    setScreen("login");
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {screen === "login" && <LoginScreen onLoggedIn={() => setScreen("documents")} />}
      {screen === "documents" && (
        <DocumentsScreen
          onNewDocument={() => setScreen("newDocument")}
          onClients={() => setScreen("clients")}
          onLogout={handleLogout}
        />
      )}
      {screen === "newDocument" && <NewDocumentScreen onDone={() => setScreen("documents")} />}
      {screen === "clients" && <ClientsScreen onBack={() => setScreen("documents")} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
