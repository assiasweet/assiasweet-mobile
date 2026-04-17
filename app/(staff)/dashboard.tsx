import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getDashboard } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useKaching } from "@/hooks/use-kaching";
import type { DashboardKPIs } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void; replace: (p: string) => void };

const GREEN = "#1A5C2A";
const GREEN_MID = "#2E8B57";

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 10, backgroundColor: "#E5E7EB", opacity: anim }, style]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      <SkeletonBlock width="60%" height={22} />
      <SkeletonBlock width="40%" height={16} />
      <SkeletonBlock width="100%" height={100} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <SkeletonBlock width="48%" height={80} />
        <SkeletonBlock width="48%" height={80} />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <SkeletonBlock width="48%" height={80} />
        <SkeletonBlock width="48%" height={80} />
      </View>
    </View>
  );
}

// ─── Grande card CA ───────────────────────────────────────────────────────────
function CACard({ value, ordersMonth }: { value: number; ordersMonth: number }) {
  const ca = Number(value).toFixed(2);
  return (
    <TouchableOpacity
      style={styles.caCard}
      onPress={() => nav.push("/(staff)/orders")}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={styles.caLabel}>CA du mois</Text>
          <Text style={styles.caValue}>{ca} €</Text>
        </View>
        <View style={styles.caIconBox}>
          <Text style={{ fontSize: 26 }}>💰</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
        <View style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
            {ordersMonth} commande{ordersMonth !== 1 ? "s" : ""} ce mois
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Card KPI ─────────────────────────────────────────────────────────────────
function KPICard({
  icon,
  label,
  value,
  accent,
  onPress,
  urgent,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
  onPress?: () => void;
  urgent?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.kpiCard} activeOpacity={0.85}>
      <View style={[styles.kpiIconBox, { backgroundColor: `${accent}18` }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
        <Text style={styles.kpiValue}>{value}</Text>
        {urgent && Number(value) > 5 && (
          <View style={{ backgroundColor: "#FEE2E2", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ color: "#DC2626", fontSize: 10, fontWeight: "800" }}>!</Text>
          </View>
        )}
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Statuts commandes ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  EN_ATTENTE: { bg: "#FEF3C7", color: "#D97706", label: "En attente" },
  EN_PREPARATION: { bg: "#DBEAFE", color: "#1D4ED8", label: "En préparation" },
  EXPEDIEE: { bg: "#D1FAE5", color: "#065F46", label: "Expédiée" },
  LIVREE: { bg: "#D1FAE5", color: "#065F46", label: "Livrée" },
  ANNULEE: { bg: "#FEE2E2", color: "#DC2626", label: "Annulée" },
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const auth = useAuthStore((s) => s.auth);
  const logout = useAuthStore((s) => s.logout);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const staffName = auth.status === "staff" ? (auth.user.name?.split(" ")[0] ?? "Staff") : "Staff";
  const playKaching = useKaching();
  const prevOrdersCount = useRef<number | null>(null);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const load = async (silent = false) => {
    try {
      const data = await getDashboard();
      if (prevOrdersCount.current !== null && data.ordersMonth > prevOrdersCount.current) {
        playKaching();
      }
      prevOrdersCount.current = data.ordersMonth;
      setKpis(data);
    } catch {
      // ignore
    } finally {
      if (!silent) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => { setRefreshing(true); load(); };
  const handleLogout = async () => { await logout(); nav.replace("/(auth)/login"); };

  if (auth.status === "idle" || auth.status === "loading") {
    return (
      <ScreenContainer containerClassName="bg-[#F3F4F6]">
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }
  if (auth.status === "unauthenticated" || auth.status === "customer" || auth.status === "pending") {
    nav.replace("/(auth)/login");
    return null;
  }

  return (
    <ScreenContainer containerClassName="bg-[#F3F4F6]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={GREEN} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Bonjour {staffName} 👋</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text style={styles.headerDate}>{todayCapitalized}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {/* Grande card CA */}
            <CACard value={kpis?.caMonth ?? 0} ordersMonth={kpis?.ordersMonth ?? 0} />

            {/* Row 1 : En attente / En préparation */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <KPICard
                  icon="⏳"
                  label="En attente"
                  value={kpis?.pendingOrders ?? 0}
                  accent="#F59E0B"
                  urgent
                  onPress={() => nav.push("/(staff)/orders")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <KPICard
                  icon="🔧"
                  label="En préparation"
                  value={kpis?.preparingOrders ?? 0}
                  accent="#3B82F6"
                  urgent
                  onPress={() => nav.push("/(staff)/orders")}
                />
              </View>
            </View>

            {/* Row 2 : Clients / Panier moyen */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <KPICard
                  icon="👥"
                  label="Clients total"
                  value={kpis?.totalCustomers ?? kpis?.newCustomers ?? 0}
                  accent={GREEN}
                  onPress={() => nav.push("/(staff)/clients")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <KPICard
                  icon="🛒"
                  label="Panier moyen"
                  value={`${Number(kpis?.avgCart ?? 0).toFixed(0)} €`}
                  accent={GREEN_MID}
                />
              </View>
            </View>

            {/* Alerte stocks */}
            {((kpis?.lowStock ?? kpis?.lowStockCount ?? 0) + (kpis?.outOfStock ?? 0)) > 0 && (
              <TouchableOpacity
                onPress={() => nav.push("/(staff)/products")}
                style={styles.alertCard}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 24 }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {(kpis?.lowStock ?? kpis?.lowStockCount ?? 0)} produit{((kpis?.lowStock ?? kpis?.lowStockCount ?? 0)) > 1 ? "s" : ""} en stock faible
                    {(kpis?.outOfStock ?? 0) > 0 ? ` · ${kpis?.outOfStock} rupture${(kpis?.outOfStock ?? 0) > 1 ? "s" : ""}` : ""}
                  </Text>
                  <Text style={styles.alertSub}>Appuyer pour gérer les stocks</Text>
                </View>
                <Text style={{ color: "#92400E", fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            )}

            {/* Dernières commandes */}
            {(kpis?.recentOrders?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Dernières commandes</Text>
                  <TouchableOpacity onPress={() => nav.push("/(staff)/orders")}>
                    <Text style={styles.sectionLink}>Voir tout →</Text>
                  </TouchableOpacity>
                </View>
                {kpis?.recentOrders?.slice(0, 5).map((order) => {
                  const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.EN_ATTENTE;
                  return (
                    <TouchableOpacity
                      key={order.id}
                      onPress={() => nav.push(`/staff-order/${order.id}`)}
                      style={styles.orderRow}
                      activeOpacity={0.85}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                        <Text style={styles.orderClient}>{order.customerName || order.customer?.companyName || "Client"}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <View style={{ backgroundColor: sc.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                          <Text style={{ color: sc.color, fontSize: 11, fontWeight: "700" }}>{sc.label}</Text>
                        </View>
                        <Text style={styles.orderAmount}>{Number(order.total ?? order.totalTTC ?? 0).toFixed(0)} €</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Stocks faibles */}
            {(kpis?.lowStockProducts?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>⚠️ Stocks à réapprovisionner</Text>
                  <TouchableOpacity onPress={() => nav.push("/(staff)/products")}>
                    <Text style={styles.sectionLink}>Voir tout →</Text>
                  </TouchableOpacity>
                </View>
                {kpis?.lowStockProducts?.slice(0, 5).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => nav.push("/(staff)/products")}
                    style={styles.stockRow}
                    activeOpacity={0.85}
                  >
                    <View style={styles.stockImg}>
                      {product.images?.[0] ? (
                        <Image source={{ uri: product.images[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : (
                        <Text style={{ fontSize: 20 }}>🍬</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stockName} numberOfLines={1}>{product.name}</Text>
                      <Text style={{ fontSize: 12, color: product.stock === 0 ? "#DC2626" : "#D97706", marginTop: 1 }}>
                        {product.stock === 0 ? "Rupture de stock" : `${product.stock} unités restantes`}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: product.stock === 0 ? "#FEE2E2" : "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: product.stock === 0 ? "#DC2626" : "#D97706", fontWeight: "700", fontSize: 13 }}>
                        {product.stock}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerGreeting: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", marginTop: 2 },
  headerDate: { fontSize: 12, color: "#9CA3AF", textAlign: "right" },
  logoutBtn: { backgroundColor: "#FEE2E2", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  logoutText: { color: "#DC2626", fontSize: 12, fontWeight: "600" },
  caCard: {
    backgroundColor: GREEN,
    borderRadius: 16,
    padding: 20,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  caLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  caValue: { fontSize: 32, fontWeight: "800", color: "white", marginTop: 4 },
  caIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: 26, fontWeight: "800", color: "#1A1A1A" },
  kpiLabel: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  alertCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#92400E" },
  alertSub: { fontSize: 12, color: "#B45309", marginTop: 2 },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  sectionLink: { fontSize: 13, color: GREEN, fontWeight: "600" },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  orderNumber: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  orderClient: { fontSize: 13, color: "#6B7280", marginTop: 1 },
  orderAmount: { fontSize: 15, fontWeight: "800", color: GREEN },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  stockImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  stockName: { fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
});
