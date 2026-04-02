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
  Image,
  Platform,
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
      Alert.alert("Champs manquants", "Veuillez remplir votre email et mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      if (loginType === "customer") {
        await loginAsCustomer(email.trim().toLowerCase(), password);
        // Redirection explicite vers l'accueil client
        setTimeout(() => {
          router.replace("/(tabs)/index" as never);
        }, 50);
      } else {
        await loginAsStaff(email.trim().toLowerCase(), password);
        // Redirection explicite vers le dashboard staff
        setTimeout(() => {
          router.replace("/(staff)/dashboard" as never);
        }, 50);
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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & titre */}
          <View style={{ alignItems: "center", paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 }}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={{
                width: 120,
                height: 120,
                borderRadius: 28,
                marginBottom: 12,
                shadowColor: "#E91E7B",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
              }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
              Grossiste B2B en confiseries
            </Text>
          </View>

          {/* Sélecteur Espace Client / Espace Staff */}
          <View
            style={{
              marginHorizontal: 24,
              marginBottom: 28,
              flexDirection: "row",
              backgroundColor: "#F3F4F6",
              borderRadius: 14,
              padding: 4,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setLoginType("customer")}
              activeOpacity={0.8}
            >
              <View
                style={{
                  paddingVertical: 12,
                  borderRadius: 11,
                  alignItems: "center",
                  backgroundColor: loginType === "customer" ? "#E91E7B" : "transparent",
                  shadowColor: loginType === "customer" ? "#E91E7B" : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: loginType === "customer" ? 3 : 0,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: loginType === "customer" ? "white" : "#6B7280",
                  }}
                >
                  🛒 Espace Client
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setLoginType("staff")}
              activeOpacity={0.8}
            >
              <View
                style={{
                  paddingVertical: 12,
                  borderRadius: 11,
                  alignItems: "center",
                  backgroundColor: loginType === "staff" ? "#1E1E1E" : "transparent",
                  shadowColor: loginType === "staff" ? "#1E1E1E" : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: loginType === "staff" ? 3 : 0,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: loginType === "staff" ? "white" : "#6B7280",
                  }}
                >
                  ⚙️ Espace Staff
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Formulaire */}
          <View style={{ paddingHorizontal: 24, gap: 16 }}>
            {/* Email */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
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
                  borderWidth: 1.5,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#1E1E1E",
                  backgroundColor: "#FAFAFA",
                }}
              />
            </View>

            {/* Mot de passe */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
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
                    borderWidth: 1.5,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    paddingRight: 60,
                    fontSize: 16,
                    color: "#1E1E1E",
                    backgroundColor: "#FAFAFA",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 16, top: 15 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#6B7280", fontSize: 13, fontWeight: "500" }}>
                    {showPassword ? "Masquer" : "Afficher"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mot de passe oublié */}
            {loginType === "customer" && (
              <TouchableOpacity
                onPress={() => router.push("/(auth)/reset-password" as never)}
                activeOpacity={0.7}
                style={{ alignSelf: "flex-end" }}
              >
                <Text style={{ color: "#E91E7B", fontSize: 13, fontWeight: "600" }}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            )}

            {/* Bouton connexion */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={{
                backgroundColor: loginType === "customer" ? "#E91E7B" : "#1E1E1E",
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 4,
                opacity: isLoading ? 0.7 : 1,
                shadowColor: loginType === "customer" ? "#E91E7B" : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 }}>
                  {loginType === "customer" ? "Se connecter" : "Accès Staff"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Inscription */}
            {loginType === "customer" && (
              <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Pas encore de compte ? </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register" as never)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#E91E7B", fontWeight: "700", fontSize: 14 }}>
                    S'inscrire
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", marginTop: 32, paddingHorizontal: 24 }}>
            <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", lineHeight: 18 }}>
              Plateforme réservée aux professionnels{"\n"}(épiceries, forains, revendeurs)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
