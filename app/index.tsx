import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";
export default function IndexScreen() {
  const auth = useAuthStore((s) => s.auth);

  useEffect(() => {
    if (auth.status === "idle" || auth.status === "loading") return;

    const replace = (router as unknown as { replace: (path: string) => void }).replace;
    if (auth.status === "customer") {
      replace("/(tabs)");
    } else if (auth.status === "staff") {
      replace("/(staff)");
    } else if (auth.status === "pending") {
      replace("/(auth)/pending");
    } else {
      replace("/(auth)/login");
    }
  }, [auth.status]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#E91E7B" />
    </View>
  );
}
