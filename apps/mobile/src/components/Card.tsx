import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme";

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
