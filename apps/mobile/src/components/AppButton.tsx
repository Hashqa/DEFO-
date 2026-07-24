import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../theme";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "soft";
  disabled?: boolean;
  loading?: boolean;
}

export function AppButton({ title, onPress, variant = "primary", disabled, loading }: Props) {
  const theme = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: isPrimary ? theme.accent : theme.accentSoft },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : theme.accent} />
      ) : (
        <Text style={[styles.text, { color: isPrimary ? "#fff" : theme.accent }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontWeight: "600", fontSize: 15 },
  disabled: { opacity: 0.55 },
});
