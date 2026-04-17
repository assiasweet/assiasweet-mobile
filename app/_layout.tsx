"use no memo";
import "@/global.css";
import { useEffect, useRef, useCallback, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StaffBanner } from "@/components/staff-banner";
import { SplashAnimation } from "@/components/splash-animation";
import { isStaffApp, PRIMARY_COLOR } from "@/lib/app-variant";
import { useAuthStore } from "@/store/auth";

// Garder le splash natif visible jusqu'à ce qu'on soit prêt
SplashScreen.preventAutoHideAsync().catch(() => {});

// Apply theme CSS variables directly on web
if (typeof document !== "undefined") {
  const root = document.documentElement;
  root.dataset.theme = "light";
  const vars: Record<string, string> = {
    "--color-primary": isStaffApp ? "#1A5C2A" : "#E91E7B",
    "--color-background": "#ffffff",
    "--color-surface": "#f5f5f5",
    "--color-foreground": "#11181C",
    "--color-muted": "#687076",
    "--color-border": "#E5E7EB",
    "--color-success": "#22C55E",
    "--color-warning": "#F59E0B",
    "--color-error": "#EF4444",
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export const unstable_settings = { initialRouteName: isStaffApp ? "(staff)" : "(tabs)" };

export default function RootLayout() {
  const auth = useAuthStore((s) => s.auth);
  const initialize = useAuthStore((s) => s.initialize);
  const splashHidden = useRef(false);

  // Pour l'app client uniquement : afficher l'animation custom
  const [showSplash, setShowSplash] = useState(!isStaffApp);

  // authReady : vrai dès que l'état auth est connu (pas idle/loading)
  // Si auth est déjà résolue (relancement), on part directement à true
  const [authReady, setAuthReady] = useState(() => {
    const currentAuth = useAuthStore.getState().auth;
    return currentAuth.status !== "idle" && currentAuth.status !== "loading";
  });

  // Fonction utilitaire pour cacher le splash natif (une seule fois)
  const hideSplashNative = useCallback(async () => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    try {
      await SplashScreen.hideAsync();
    } catch {
      // ignore
    }
  }, []);

  // Lancer l'initialisation si nécessaire
  useEffect(() => {
    // Si auth déjà prête (relancement avec état en mémoire), cacher le splash immédiatement
    const currentAuth = useAuthStore.getState().auth;
    if (currentAuth.status !== "idle" && currentAuth.status !== "loading") {
      setAuthReady(true);
      hideSplashNative();
      return;
    }

    // Timeout de sécurité réduit à 3s (au lieu de 5s)
    const timeout = setTimeout(() => {
      setAuthReady(true);
      hideSplashNative();
    }, 3000);

    initialize().finally(() => {
      clearTimeout(timeout);
      setAuthReady(true);
      hideSplashNative();
    });

    return () => clearTimeout(timeout);
  }, [initialize, hideSplashNative]);

  // Surveiller les changements d'auth pour débloquer si initialize() finit
  useEffect(() => {
    if (auth.status !== "idle" && auth.status !== "loading") {
      setAuthReady(true);
      hideSplashNative();
    }
  }, [auth.status, hideSplashNative]);

  // Callback quand l'animation splash custom est terminée
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={showSplash ? "dark" : "auto"} />
        <StaffBanner />

        {/* Contenu principal — toujours rendu, même si auth pas encore prête */}
        {authReady ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(staff)" />
            <Stack.Screen
              name="product/[id]"
              options={{ headerShown: true, title: "Produit", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen
              name="order/[id]"
              options={{ headerShown: true, title: "Commande", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen
              name="checkout"
              options={{ headerShown: true, title: "Finaliser la commande", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen
              name="paypal-payment"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="staff-order/[id]"
              options={{ headerShown: true, title: "Commande", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen
              name="profile"
              options={{ headerShown: true, title: "Mon profil", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen
              name="addresses"
              options={{ headerShown: true, title: "Mes adresses", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen
              name="invoices"
              options={{ headerShown: true, title: "Mes factures", headerTintColor: PRIMARY_COLOR }}
            />
            <Stack.Screen name="oauth/callback" />
          </Stack>
        ) : (
          // Fond pendant la vérification auth (recouvert par le splash natif)
          <View style={[styles.loadingContainer, isStaffApp && styles.loadingStaff]} />
        )}

        {/* Animation splash custom par-dessus — uniquement app client */}
        {showSplash && (
          <SplashAnimation onFinish={handleSplashFinish} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FCE4F0",
  },
  loadingStaff: {
    backgroundColor: "#E8F5E9",
  },
});
