import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/store/auth";
import { ScreenContainer } from "@/components/screen-container";

export default function PendingScreen() {
  const logout = useAuthStore((s) => s.logout);
  const auth = useAuthStore((s) => s.auth);

  const companyName =
    auth.status === "pending" ? auth.customer.companyName : "";

  return (
    <ScreenContainer
      containerClassName="bg-white"
      edges={["top", "left", "right", "bottom"]}
      className="items-center justify-center px-8"
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: "#FCE4F0",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 44 }}>⏳</Text>
      </View>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: "#1E1E1E",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Compte en cours de validation
      </Text>

      {companyName ? (
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Bonjour <Text style={{ fontWeight: "600", color: "#1E1E1E" }}>{companyName}</Text>
        </Text>
      ) : null}

      <Text
        style={{
          fontSize: 15,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 24,
          marginBottom: 32,
        }}
      >
        Votre compte est en cours d'examen par notre équipe. Vous recevrez un email de confirmation dès que votre compte sera activé.
      </Text>

      <View
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          marginBottom: 32,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 20 }}>📧</Text>
          <Text style={{ color: "#6B7280", fontSize: 14, flex: 1 }}>
            Un email de confirmation vous a été envoyé
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 20 }}>⏱️</Text>
          <Text style={{ color: "#6B7280", fontSize: 14, flex: 1 }}>
            Délai de validation : 24 à 48 heures ouvrées
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 20 }}>📞</Text>
          <Text style={{ color: "#6B7280", fontSize: 14, flex: 1 }}>
            Contact : 07 62 77 50 94 ou assiasweet@ymail.com
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={logout}
        style={{
          borderWidth: 1.5,
          borderColor: "#E5E7EB",
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ color: "#6B7280", fontSize: 15, fontWeight: "600" }}>
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
