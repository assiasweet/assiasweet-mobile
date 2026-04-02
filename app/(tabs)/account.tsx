import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthStore } from "@/store/auth";

const nav = router as unknown as { push: (path: string) => void };

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F9FAFB",
        gap: 14,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: danger ? "#FEE2E2" : "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: danger ? "#EF4444" : "#1E1E1E",
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>
      <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const auth = useAuthStore((s) => s.auth);
  const logout = useAuthStore((s) => s.logout);

  const customer = auth.status === "customer" ? auth.customer : null;

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await logout();
          (router as unknown as { replace: (p: string) => void }).replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header profil */}
        <View
          style={{
            padding: 20,
            backgroundColor: "#E91E7B",
            marginBottom: 0,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 28, color: "white" }}>🏪</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "white" }}>
            {customer?.companyName || "Mon compte"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 2 }}>
            {customer?.email}
          </Text>
          {customer?.priceList && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                Tarif {customer.priceList}
              </Text>
            </View>
          )}
        </View>

        {/* Menu */}
        <View style={{ backgroundColor: "white", marginTop: 16, borderRadius: 16, marginHorizontal: 16, overflow: "hidden", borderWidth: 1, borderColor: "#F3F4F6" }}>
          <MenuItem
            icon="📦"
            label="Mes commandes"
            subtitle="Suivre et gérer vos commandes"
            onPress={() => nav.push("/(tabs)/orders")}
          />
          <MenuItem
            icon="🧾"
            label="Mes factures"
            subtitle="Télécharger vos factures PDF"
            onPress={() => nav.push("/invoices")}
          />
          <MenuItem
            icon="📍"
            label="Mes adresses"
            subtitle="Gérer vos adresses de livraison"
            onPress={() => nav.push("/addresses")}
          />
          <MenuItem
            icon="👤"
            label="Mon profil"
            subtitle="Modifier vos coordonnées"
            onPress={() => nav.push("/profile")}
          />
        </View>

        {/* Informations utiles */}
        <View
          style={{
            margin: 16,
            padding: 16,
            backgroundColor: "#F9FAFB",
            borderRadius: 16,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1E1E" }}>
            Informations utiles
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 16 }}>📞</Text>
            <Text style={{ color: "#6B7280", fontSize: 13 }}>07 62 77 50 94</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 16 }}>✉️</Text>
            <Text style={{ color: "#6B7280", fontSize: 13 }}>assiasweet@ymail.com</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 16 }}>🏪</Text>
            <Text style={{ color: "#6B7280", fontSize: 13 }}>
              161 rue Belle Étoile, Roissy-en-France
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 16 }}>📦</Text>
            <Text style={{ color: "#6B7280", fontSize: 13 }}>
              Commande minimum : 100€ HT
            </Text>
          </View>
        </View>

        {/* Déconnexion */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 32,
            backgroundColor: "white",
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#F3F4F6",
          }}
        >
          <MenuItem
            icon="🚪"
            label="Se déconnecter"
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
