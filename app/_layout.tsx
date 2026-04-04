"use no memo";
import "@/global.css";
import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "@/components/animated-splash";
import { StaffBanner } from "@/components/staff-banner";
import { isStaffApp, PRIMARY_COLOR } from "@/lib/app-variant";

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

export const unstable_settings = { initialRouteName: "(tabs)" };

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={splashDone ? "auto" : "light"} />
        <StaffBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(staff)" />
          <Stack.Screen name="product/[id]" options={{ headerShown: true, title: "Produit", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="order/[id]" options={{ headerShown: true, title: "Commande", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="checkout" options={{ headerShown: true, title: "Finaliser la commande", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="staff-order/[id]" options={{ headerShown: true, title: "Commande", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="profile" options={{ headerShown: true, title: "Mon profil", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="addresses" options={{ headerShown: true, title: "Mes adresses", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="invoices" options={{ headerShown: true, title: "Mes factures", headerTintColor: "#E91E7B" }} />
          <Stack.Screen name="oauth/callback" />
        </Stack>
        {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
