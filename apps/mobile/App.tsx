import { StyleSheet, Text, View } from "react-native";

/**
 * Point d'entrée de l'app mobile. Le mode hors-ligne (scan + création de
 * devis/factures sans réseau, synchronisation ensuite) repose sur une base
 * SQLite locale (expo-sqlite) synchronisée avec l'API quand le réseau revient.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEFA</Text>
      <Text>Gestion de devis &amp; factures — en construction.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
