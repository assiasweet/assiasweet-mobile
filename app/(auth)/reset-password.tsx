import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { resetPassword } from "@/lib/api";
import { ScreenContainer } from "@/components/screen-container";

const nav = router as unknown as { back: () => void };

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez saisir votre adresse email.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ email: email.trim() });
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      Alert.alert("Erreur", message);
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
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
          <TouchableOpacity onPress={() => nav.back()} style={{ padding: 8, marginRight: 8 }}>
            <Text style={{ fontSize: 24, color: "#1E1E1E" }}>←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Mot de passe oublié</Text>
        </View>

        <View style={{ padding: 24, gap: 20 }}>
          {!sent ? (
            <>
              <Text className="text-muted text-base">
                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </Text>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Adresse email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
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

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                  backgroundColor: "#E91E7B",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                    Envoyer le lien
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: "center", gap: 16, paddingTop: 40 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#FCE4F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>✉️</Text>
              </View>
              <Text className="text-xl font-bold text-foreground text-center">
                Email envoyé !
              </Text>
              <Text className="text-muted text-base text-center">
                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
              </Text>
              <TouchableOpacity
                onPress={() => nav.back()}
                style={{
                  backgroundColor: "#E91E7B",
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  marginTop: 16,
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
