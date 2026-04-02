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
} from "react-native";
import { router } from "expo-router";
import { updateCustomerProfile } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const nav = router as unknown as { back: () => void };

export default function ProfileScreen() {
  const auth = useAuthStore((s) => s.auth);
  const refreshCustomer = useAuthStore((s) => s.refreshCustomer);

  const customer = auth.status === "customer" ? auth.customer : null;

  const [firstName, setFirstName] = useState(customer?.firstName || "");
  const [lastName, setLastName] = useState(customer?.lastName || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCustomerProfile({ firstName, lastName, phone });
      await refreshCustomer();
      Alert.alert("Profil mis à jour", "Vos informations ont été enregistrées.", [
        { text: "OK", onPress: () => nav.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de mettre à jour");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Mon profil</Text>

          {/* Infos non modifiables */}
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 4 }}>
              INFORMATIONS ENTREPRISE
            </Text>
            <View>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>Raison sociale</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1E1E1E" }}>
                {customer?.companyName || "—"}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>SIRET</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1E1E1E" }}>
                {customer?.siret || "—"}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>Email</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1E1E1E" }}>
                {customer?.email || "—"}
              </Text>
            </View>
            {customer?.priceList && (
              <View>
                <Text style={{ fontSize: 12, color: "#9CA3AF" }}>Tarif appliqué</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#E91E7B" }}>
                  {customer.priceList}
                </Text>
              </View>
            )}
          </View>

          {/* Infos modifiables */}
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280" }}>
              COORDONNÉES DE CONTACT
            </Text>

            <View className="flex-row gap-3" style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Prénom</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={inputStyle}
                  placeholder="Jean"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Nom</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  style={inputStyle}
                  placeholder="Dupont"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View>
              <Text style={labelStyle}>Téléphone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={inputStyle}
                placeholder="06 12 34 56 78"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={{
              backgroundColor: "#E91E7B",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              opacity: isLoading ? 0.7 : 1,
              marginTop: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                Enregistrer les modifications
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const labelStyle = { fontSize: 13, fontWeight: "600" as const, color: "#1E1E1E", marginBottom: 6 };
const inputStyle = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
  color: "#1E1E1E",
  backgroundColor: "#F9FAFB",
};
