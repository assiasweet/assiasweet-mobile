import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { ScreenContainer } from "@/components/screen-container";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"customer" | "staff">("customer");

  const loginAsCustomer = useAuthStore((s) => s.loginAsCustomer);
  const loginAsStaff = useAuthStore((s) => s.loginAsStaff);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);
    try {
      if (loginType === "customer") {
        await loginAsCustomer(email.trim(), password);
        (router as unknown as { replace: (p: string) => void }).replace("/(tabs)");
      } else {
        await loginAsStaff(email.trim(), password);
        (router as unknown as { replace: (p: string) => void }).replace("/(staff)");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de connexion";
      Alert.alert("Connexion échouée", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-white" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header avec logo */}
          <View className="items-center pt-12 pb-8 px-6">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: "#E91E7B",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>A</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground">AssiaSweet</Text>
            <Text className="text-muted mt-1 text-base">Grossiste B2B en confiseries</Text>
          </View>

          {/* Toggle Client / Staff */}
          <View className="mx-6 mb-6 flex-row bg-surface rounded-xl p-1">
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setLoginType("customer")}
            >
              <View
                style={{
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: loginType === "customer" ? "#E91E7B" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    color: loginType === "customer" ? "white" : "#6B7280",
                    fontSize: 14,
                  }}
                >
                  Espace Client
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setLoginType("staff")}
            >
              <View
                style={{
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: loginType === "staff" ? "#1E1E1E" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    color: loginType === "staff" ? "white" : "#6B7280",
                    fontSize: 14,
                  }}
                >
                  Espace Staff
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Formulaire */}
          <View className="px-6 gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Adresse email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#1E1E1E",
                  backgroundColor: "#F9FAFB",
                }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Mot de passe
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    paddingRight: 50,
                    fontSize: 16,
                    color: "#1E1E1E",
                    backgroundColor: "#F9FAFB",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: 14,
                  }}
                >
                  <Text style={{ color: "#6B7280", fontSize: 14 }}>
                    {showPassword ? "Masquer" : "Voir"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {loginType === "customer" && (
              <TouchableOpacity
                onPress={() =>
                  (router as unknown as { push: (p: string) => void }).push(
                    "/(auth)/reset-password"
                  )
                }
              >
                <Text
                  style={{
                    color: "#E91E7B",
                    fontSize: 14,
                    textAlign: "right",
                    fontWeight: "500",
                  }}
                >
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{
                backgroundColor: loginType === "customer" ? "#E91E7B" : "#1E1E1E",
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "700" }}
                >
                  Se connecter
                </Text>
              )}
            </TouchableOpacity>

            {loginType === "customer" && (
              <View className="flex-row justify-center mt-4">
                <Text className="text-muted">Pas encore de compte ? </Text>
                <TouchableOpacity
                  onPress={() =>
                    (router as unknown as { push: (p: string) => void }).push(
                      "/(auth)/register"
                    )
                  }
                >
                  <Text style={{ color: "#E91E7B", fontWeight: "600" }}>
                    S'inscrire
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer info */}
          <View className="items-center mt-8 mb-6 px-6">
            <Text className="text-muted text-xs text-center">
              Plateforme réservée aux professionnels (épiceries, forains, revendeurs)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
