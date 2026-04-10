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
SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore si déjà caché
});

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
  const hasInitialized = useRef(false);

  // showSplash : true tant que l'animation n'est pas terminée
  // Uniquement pour l'app client (pas staff, pas web)
  const [showSplash, setShowSplash] = useState(!isStaffApp);

  // Lancer l'initialisation une seule fois
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    initialize();
  }, [initialize]);

  // Cacher le splash natif dès que l'auth est résolue
  const onLayoutRootView = useCallback(async () => {
    if (auth.status !== "idle" && auth.status !== "loading") {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // ignore — peut arriver si déjà caché
      }
    }
  }, [auth.status]);

  const isReady = auth.status !== "idle" && auth.status !== "loading";

  // Callback quand l'animation splash est terminée
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style={showSplash ? "dark" : "auto"} />
        <StaffBanner />

        {/* Contenu principal */}
        {!isReady ? (
          // Fond blanc pendant la vérification auth (recouvert par le splash natif ou SplashAnimation)
          <View style={styles.loadingContainer} />
        ) : (
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
        )}

        {/* Animation splash par-dessus tout — uniquement sur mobile et lors du premier lancement */}
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
});
