import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { isStaffApp } from "@/lib/app-variant";
import { useAuthStore } from "@/store/auth";

/**
 * Point d'entrée de l'application.
 * Attend que l'auth soit initialisée avant de rediriger.
 *
 * - Variante "staff"  → interface staff uniquement (/(staff))
 * - Variante "client" → interface client (/(tabs))
 *
 * Dans les deux cas, si l'utilisateur n'est pas authentifié,
 * la redirection vers /(auth)/login est gérée par le layout de chaque section.
 */
export default function Index() {
  const auth = useAuthStore((s) => s.auth);

  // Attendre la fin de l'initialisation de l'auth
  if (auth.status === "idle" || auth.status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={isStaffApp ? "#1A5C2A" : "#E91E7B"} />
      </View>
    );
  }

  // App staff : toujours vers l'interface staff
  if (isStaffApp) {
    if (auth.status === "unauthenticated") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <Redirect href={"/(auth)/login" as any} />;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={"/(staff)" as any} />;
  }

  // App client : toujours vers la page d'accueil vitrine
  // Les sections protégées (panier, commandes, compte) gèrent elles-mêmes la redirection vers login
  return <Redirect href="/(tabs)" />;
}
