/**
 * Bandeau "MODE STAFF" affiché en permanence dans l'app staff.
 * Visible en haut de chaque écran pour éviter toute confusion avec l'app client.
 */
import { View, Text, StyleSheet } from "react-native";
import { isStaffApp } from "@/lib/app-variant";

export function StaffBanner() {
  if (!isStaffApp) return null;
  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <Text style={styles.text}>STAFF · AssiaSweet</Text>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1A5C2A",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  text: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
