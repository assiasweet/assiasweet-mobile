import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getCustomerOrders } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Order, OrderStatus } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void };

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "#92400E", bg: "#FEF3C7" },
  EN_PREPARATION: { label: "En préparation", color: "#1D4ED8", bg: "#DBEAFE" },
  EXPEDIEE: { label: "Expédiée", color: "#6D28D9", bg: "#EDE9FE" },
  LIVREE: { label: "Livrée", color: "#065F46", bg: "#D1FAE5" },
  ANNULEE: { label: "Annulée", color: "#991B1B", bg: "#FEE2E2" },
};

function OrderCard({ order }: { order: Order }) {
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.EN_ATTENTE;
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      onPress={() => nav.push(`/order/${order.id}`)}
      style={{
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#1E1E1E" }}>
            {order.orderNumber}
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>{date}</Text>
        </View>
        <View
          style={{
            backgroundColor: status.bg,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: status.color, fontSize: 12, fontWeight: "700" }}>
            {status.label}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#F9FAFB",
        }}
      >
        <View>
          <Text style={{ color: "#6B7280", fontSize: 12 }}>
            {order.shippingMethod === "RETRAIT" ? "🏪 Retrait Roissy" : "🚚 Livraison GLS"}
          </Text>
          {order.trackingNumber && (
            <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 2 }}>
              Suivi : {order.trackingNumber}
            </Text>
          )}
        </View>
        <Text style={{ color: "#E91E7B", fontSize: 16, fontWeight: "800" }}>
          {Number(order.totalTTC).toFixed(2)} € TTC
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function LoginPrompt() {
  return (
    <ScreenContainer className="items-center justify-center px-8">
      <Text style={{ fontSize: 50, marginBottom: 16 }}>📦</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E", textAlign: "center" }}>
        Mes commandes
      </Text>
      <Text style={{ color: "#9CA3AF", fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
        Connectez-vous pour consulter l'historique de vos commandes.
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/login" as never)}
        style={{
          backgroundColor: "#E91E7B",
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 32,
          marginTop: 24,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Se connecter</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/register" as never)}
        style={{ marginTop: 12 }}
      >
        <Text style={{ color: "#E91E7B", fontSize: 14, fontWeight: "600" }}>Créer un compte</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

export default function OrdersScreen() {
  const auth = useAuthStore((s) => s.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  if (auth.status !== "customer") {
    return <LoginPrompt />;
  }

  const loadOrders = async () => {
    try {
      const data = await getCustomerOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadOrders(); };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#E91E7B" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Mes commandes</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => <OrderCard order={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E91E7B" />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 50 }}>📦</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1E1E1E", marginTop: 12 }}>
              Aucune commande
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 4, textAlign: "center" }}>
              Vos commandes apparaîtront ici
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
