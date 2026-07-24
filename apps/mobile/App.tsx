import { useCallback, useEffect, useState } from "react";
import { AppState, SafeAreaView, StyleSheet } from "react-native";
import { TabBar, type TabKey } from "./src/components/TabBar";
import { clearToken, getToken } from "./src/lib/api";
import { initDb } from "./src/lib/db";
import { syncPendingDocuments } from "./src/lib/sync";
import AccountScreen from "./src/screens/AccountScreen";
import ClientsScreen from "./src/screens/ClientsScreen";
import InvoicesScreen from "./src/screens/InvoicesScreen";
import LoginScreen from "./src/screens/LoginScreen";
import NewDocumentScreen from "./src/screens/NewDocumentScreen";
import QuotesScreen from "./src/screens/QuotesScreen";
import { useTheme } from "./src/theme";

type Screen = "login" | "tabs" | "newDocument";

/**
 * Pas de librairie de navigation : la barre d'onglets (TabBar) + un switch
 * d'état suffisent pour ce nombre d'écrans, donc pas de dépendance de plus.
 */
export default function App() {
  const theme = useTheme();
  const [screen, setScreen] = useState<Screen>("login");
  const [tab, setTab] = useState<TabKey>("quotes");
  const [newDocumentType, setNewDocumentType] = useState<"QUOTE" | "INVOICE">("QUOTE");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDb();
      const token = await getToken();
      setScreen(token ? "tabs" : "login");
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

  function openNewDocument(type: "QUOTE" | "INVOICE") {
    setNewDocumentType(type);
    setScreen("newDocument");
  }

  if (!ready) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.pageBg }]}>
      {screen === "login" && <LoginScreen onLoggedIn={() => setScreen("tabs")} />}

      {screen === "newDocument" && (
        <NewDocumentScreen initialType={newDocumentType} onDone={() => setScreen("tabs")} />
      )}

      {screen === "tabs" && (
        <>
          {tab === "quotes" && <QuotesScreen onNewDocument={() => openNewDocument("QUOTE")} />}
          {tab === "invoices" && <InvoicesScreen onNewDocument={() => openNewDocument("INVOICE")} />}
          {tab === "clients" && <ClientsScreen />}
          {tab === "account" && <AccountScreen onLogout={handleLogout} />}
          <TabBar active={tab} onChange={setTab} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
