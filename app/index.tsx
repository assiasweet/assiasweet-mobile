import { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function IndexScreen() {
  const auth = useAuthStore((s) => s.auth);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (auth.status === "idle" || auth.status === "loading") return;
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    // Utiliser setTimeout pour s'assurer que le layout est monté
    setTimeout(() => {
      if (auth.status === "customer") {
        router.replace("/(tabs)/index" as never);
      } else if (auth.status === "staff") {
        router.replace("/(staff)/dashboard" as never);
      } else if (auth.status === "pending") {
        router.replace("/(auth)/pending" as never);
      } else {
        router.replace("/(auth)/login" as never);
      }
    }, 100);
  }, [auth.status]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#E91E7B" />
    </View>
  );
}
