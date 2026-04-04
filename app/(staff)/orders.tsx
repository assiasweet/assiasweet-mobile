import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getAdminOrders } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void };

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "#92400E", bg: "#FEF3C7" },
  EN_PREPARATION: { label: "En préparation", color: "#1D4ED8", bg: "#DBEAFE" },
  EXPEDIEE: { label: "Expédiée", color: "#6D28D9", bg: "#EDE9FE" },
  LIVREE: { label: "Livrée", color: "#065F46", bg: "#D1FAE5" },
  ANNULEE: { label: "Annulée", color: "#991B1B", bg: "#FEE2E2" },
};

const FILTERS: { label: string; value: string }[] = [
  { label: "Toutes", value: "" },
  { label: "⏳ Attente", value: "EN_ATTENTE" },
  { label: "🔧 Prép.", value: "EN_PREPARATION" },
  { label: "🚚 Expédiées", value: "EXPEDIEE" },
  { label: "✅ Livrées", value: "LIVREE" },
];

function OrderRow({ order }: { order: Order }) {
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.EN_ATTENTE;
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <TouchableOpacity
      onPress={() => nav.push(`/staff-order/${order.id}`)}
      style={{
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        padding: 14,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#1E1E1E" }}>
            {order.orderNumber}
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            {order.customer?.companyName || "Client inconnu"}
          </Text>
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{date}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View style={{ backgroundColor: status.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: status.color, fontSize: 11, fontWeight: "700" }}>
              {status.label}
            </Text>
          </View>
          <Text style={{ color: "#E91E7B", fontSize: 15, fontWeight: "800" }}>
            {Number(order.totalTTC).toFixed(2)} €
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F9FAFB", alignItems: "center" }}>
        <Text style={{ color: "#6B7280", fontSize: 12 }}>
          {order.shippingMethod === "RETRAIT" ? "🏪 Retrait" : "🚚 Livraison GLS"}
        </Text>
        {(order.status === "EN_ATTENTE" || order.status === "EN_PREPARATION") ? (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); nav.push(`/staff-order/picking/${order.id}`); }}
            style={{
              backgroundColor: "#E91E7B",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>
              {order.status === "EN_PREPARATION" ? "📦 Continuer" : "📦 Préparer"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
            {order.paymentMethod === "VIREMENT" ? "💳 Virement" : order.paymentMethod}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function StaffOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (reset = true) => {
    if (reset) { setIsLoading(true); setPage(1); }
    else setLoadingMore(true);

    try {
      const currentPage = reset ? 1 : page + 1;
      const result = await getAdminOrders({
        status: filterStatus || undefined,
        page: currentPage,
        limit: 20,
      });
      const list = Array.isArray(result) ? result : (result as { orders?: Order[] }).orders ?? [];
      if (reset) setOrders(list);
      else { setOrders((prev) => [...prev, ...list]); setPage(currentPage); }
      const total = (result as { totalPages?: number }).totalPages ?? 1;
      setTotalPages(total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filterStatus, page]);

  useEffect(() => { load(true); }, [filterStatus]);

  const filteredOrders = search.trim()
    ? orders.filter((o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customer?.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Commandes</Text>
      </View>

      {/* Recherche */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          <Text style={{ color: "#9CA3AF", fontSize: 16 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="N° commande, client..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14, color: "#1E1E1E" }}
          />
        </View>
      </View>

      {/* Filtres statut */}
      <View style={{ paddingLeft: 16, marginBottom: 12 }}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterStatus(item.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: filterStatus === item.value ? "#E91E7B" : "#E5E7EB",
                backgroundColor: filterStatus === item.value ? "#FCE4F0" : "white",
              }}
            >
              <Text style={{ color: filterStatus === item.value ? "#E91E7B" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#E91E7B" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => <OrderRow order={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#E91E7B" />
          }
          onEndReached={() => { if (!loadingMore && page < totalPages) load(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#E91E7B" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 40 }}>📦</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E1E1E", marginTop: 12 }}>
                Aucune commande
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
