import { useColorScheme } from "react-native";

const light = {
  pageBg: "#f4f6f7",
  cardBg: "#ffffff",
  text: "#1a2027",
  muted: "#6b7280",
  border: "#e5e8eb",
  borderLight: "#f0f2f4",
  accent: "#0e9f6e",
  accentSoft: "#e3f6ef",
  danger: "#b3261e",
  dangerBg: "#fdecea",
  status: {
    DRAFT: { bg: "#eef0f2", text: "#4b5563" },
    SENT: { bg: "#e5eefc", text: "#1d5fc9" },
    ACCEPTED: { bg: "#e3f6ef", text: "#0e9f6e" },
    REFUSED: { bg: "#fdecea", text: "#b3261e" },
    PAID: { bg: "#0e9f6e", text: "#ffffff" },
    OVERDUE: { bg: "#fef1e0", text: "#b5620a" },
  },
};

const dark = {
  pageBg: "#101314",
  cardBg: "#191d1f",
  text: "#eceff1",
  muted: "#98a1a8",
  border: "#2a3033",
  borderLight: "#22272a",
  accent: "#34d399",
  accentSoft: "rgba(52, 211, 153, 0.14)",
  danger: "#ff8c85",
  dangerBg: "#3a1f1d",
  status: {
    DRAFT: { bg: "#23282b", text: "#b7bec4" },
    SENT: { bg: "#1c2c40", text: "#7fb1f5" },
    ACCEPTED: { bg: "rgba(52, 211, 153, 0.14)", text: "#34d399" },
    REFUSED: { bg: "#3a1f1d", text: "#ff8c85" },
    PAID: { bg: "#1a6b4c", text: "#eafff5" },
    OVERDUE: { bg: "#3a2a12", text: "#f0a94e" },
  },
};

export type Theme = typeof light;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? dark : light;
}
