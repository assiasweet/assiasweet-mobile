import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getDashboard } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { DashboardKPIs } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void; replace: (p: string) => void };

function KPICard({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        minWidth: "45%",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${color}20`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#1E1E1E" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const auth = useAuthStore((s) => s.auth);
  const logout = useAuthStore((s) => s.logout);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const staffName = auth.status === "staff" ? auth.user.name : "Staff";

  const load = async () => {
    try {
      const data = await getDashboard();
      setKpis(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = async () => {
    await logout();
    nav.replace("/(auth)/login");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#E91E7B" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E91E7B" />
        }
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 13, color: "#9CA3AF" }}>Bonjour {staffName} 👋</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>
              Dashboard
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>Déco</Text>
          </TouchableOpacity>
        </View>

        {/* KPIs */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E1E1E", marginBottom: 12 }}>
            Aujourd'hui
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <KPICard
              icon="💰"
              label="Chiffre d'affaires"
              value={`${(kpis?.revenueToday ?? 0).toFixed(0)} €`}
              color="#E91E7B"
            />
            <KPICard
              icon="📦"
              label="Commandes du jour"
              value={kpis?.ordersToday ?? 0}
              color="#3B82F6"
              onPress={() => nav.push("/(staff)/orders")}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <KPICard
              icon="⏳"
              label="En attente"
              value={kpis?.pendingOrders ?? 0}
              color="#F59E0B"
              onPress={() => nav.push("/(staff)/orders")}
            />
            <KPICard
              icon="🔧"
              label="En préparation"
              value={kpis?.preparingOrders ?? 0}
              color="#8B5CF6"
              onPress={() => nav.push("/(staff)/orders")}
            />
          </View>
        </View>

        {/* Alertes stock */}
        {(kpis?.lowStockCount ?? 0) > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => nav.push("/(staff)/products")}
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 14,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <Text style={{ fontSize: 28 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#92400E" }}>
                  {kpis?.lowStockCount} produit{(kpis?.lowStockCount ?? 0) > 1 ? "s" : ""} en stock faible
                </Text>
                <Text style={{ fontSize: 13, color: "#B45309", marginTop: 2 }}>
                  Appuyez pour gérer les stocks
                </Text>
              </View>
              <Text style={{ color: "#92400E", fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dernières commandes */}
        {(kpis?.recentOrders?.length ?? 0) > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E1E1E" }}>
                Dernières commandes
              </Text>
              <TouchableOpacity onPress={() => nav.push("/(staff)/orders")}>
                <Text style={{ color: "#E91E7B", fontSize: 14, fontWeight: "600" }}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {kpis?.recentOrders?.slice(0, 5).map((order) => {
              const statusColors: Record<string, { bg: string; color: string }> = {
                EN_ATTENTE: { bg: "#FEF3C7", color: "#92400E" },
                EN_PREPARATION: { bg: "#DBEAFE", color: "#1D4ED8" },
                EXPEDIEE: { bg: "#EDE9FE", color: "#6D28D9" },
                LIVREE: { bg: "#D1FAE5", color: "#065F46" },
                ANNULEE: { bg: "#FEE2E2", color: "#991B1B" },
              };
              const sc = statusColors[order.status] ?? statusColors.EN_ATTENTE;

              return (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => nav.push(`/staff-order/${order.id}`)}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1E1E" }}>
                      {order.orderNumber}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
                      {order.customer?.companyName || "Client"}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: sc.color, fontSize: 10, fontWeight: "700" }}>
                      {order.status.replace("_", " ")}
                    </Text>
                  </View>
                  <Text style={{ color: "#E91E7B", fontSize: 14, fontWeight: "800" }}>
                    {Number(order.totalTTC).toFixed(0)} €
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Produits stock faible */}
        {(kpis?.lowStockProducts?.length ?? 0) > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E1E1E", marginBottom: 12 }}>
              ⚠️ Stocks à réapprovisionner
            </Text>
            {kpis?.lowStockProducts?.slice(0, 5).map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => nav.push(`/(staff)/products`)}
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                  padding: 12,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={{ width: 44, height: 44, backgroundColor: "#F9FAFB", borderRadius: 10, overflow: "hidden" }}>
                  {product.images?.[0] ? (
                    <Image source={{ uri: product.images[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 20 }}>🍬</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E1E1E" }} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: product.stock === 0 ? "#DC2626" : "#D97706", marginTop: 1 }}>
                    {product.stock === 0 ? "Rupture de stock" : `${product.stock} unités restantes`}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: product.stock === 0 ? "#FEE2E2" : "#FEF3C7",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: product.stock === 0 ? "#DC2626" : "#D97706", fontWeight: "700", fontSize: 13 }}>
                    {product.stock}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
