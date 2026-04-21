import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { isStaffApp } from "@/lib/app-variant";
import { useAuthStore } from "@/store/auth";
import { hasSeenWelcome } from "./welcome";

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
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (auth.status === "customer") {
      const customerId = (auth.customer as { id?: string | number })?.id ?? "guest";
      hasSeenWelcome(customerId).then((seen) => {
        setShowWelcome(!seen);
        setWelcomeChecked(true);
      });
    } else if (auth.status !== "idle" && auth.status !== "loading") {
      setWelcomeChecked(true);
    }
  }, [auth.status]);

  // Attendre la fin de l'initialisation de l'auth
  if (auth.status === "idle" || auth.status === "loading" || (auth.status === "customer" && !welcomeChecked)) {
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

  // Première connexion client → écran de bienvenue
  if (auth.status === "customer" && showWelcome) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={"/welcome" as any} />;
  }

  // App client : toujours vers la page d'accueil vitrine
  return <Redirect href="/(tabs)" />;
}
