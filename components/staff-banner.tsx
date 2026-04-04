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
      <Text style={styles.text}>⚙️  MODE STAFF  —  AssiaSweet Staff</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1A5C2A",
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
