import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getAdminNotifications, markNotificationRead } from "@/lib/api";
import type { Notification } from "@/lib/types";

const GREEN = "#1A5C2A";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  NEW_ORDER: { icon: "🛒", color: "#1D4ED8", bg: "#DBEAFE", label: "Nouvelle commande" },
  LOW_STOCK: { icon: "⚠️", color: "#D97706", bg: "#FEF3C7", label: "Stock faible" },
  NEW_CUSTOMER: { icon: "👤", color: "#7C3AED", bg: "#EDE9FE", label: "Nouveau client" },
  ORDER_STATUS: { icon: "📦", color: "#065F46", bg: "#D1FAE5", label: "Statut commande" },
  PAYMENT: { icon: "💳", color: "#E91E7B", bg: "#FCE4F0", label: "Paiement" },
  default: { icon: "🔔", color: "#6B7280", bg: "#F3F4F6", label: "Notification" },
};

function SkeletonRow() {
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
    <Animated.View style={[styles.skeletonRow, { opacity: anim }]}>
      <View style={styles.skeletonIcon} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 14, backgroundColor: "#E5E7EB", borderRadius: 6, width: "70%" }} />
        <View style={{ height: 12, backgroundColor: "#E5E7EB", borderRadius: 6, width: "90%" }} />
        <View style={{ height: 10, backgroundColor: "#E5E7EB", borderRadius: 6, width: "40%" }} />
      </View>
    </Animated.View>
  );
}

type FilterType = "all" | "unread" | "NEW_ORDER" | "LOW_STOCK";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "unread", label: "Non lues" },
  { key: "NEW_ORDER", label: "Commandes" },
  { key: "LOW_STOCK", label: "Stocks" },
];

export default function StaffNotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const load = async () => {
    try {
      const data = await getAdminNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (notif: Notification) => {
    if (notif.isRead) return;
    try {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => markNotificationRead(n.id).catch(() => {})));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "NEW_ORDER") return n.type === "NEW_ORDER";
    if (filter === "LOW_STOCK") return n.type === "LOW_STOCK";
    return true;
  });

  return (
    <ScreenContainer containerClassName="bg-[#F3F4F6]">
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const count = f.key === "unread"
            ? notifications.filter((n) => !n.isRead).length
            : f.key !== "all"
            ? notifications.filter((n) => n.type === f.key).length
            : notifications.length;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}{count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={GREEN}
            />
          }
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.default;
            const date = new Date(item.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <TouchableOpacity
                onPress={() => handleMarkRead(item)}
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                activeOpacity={0.85}
              >
                <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                  <Text style={{ fontSize: 22 }}>{config.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <View style={{ backgroundColor: config.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: config.color }}>{config.label}</Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.notifTitle, !item.isRead && { fontWeight: "800" }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifMessage}>{item.message}</Text>
                  <Text style={styles.notifDate}>{date}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 52 }}>🔔</Text>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptySubtitle}>
                {filter !== "all"
                  ? "Aucune notification dans cette catégorie"
                  : "Les nouvelles commandes et alertes stock apparaîtront ici"}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1A1A1A" },
  unreadBadge: { fontSize: 13, color: GREEN, fontWeight: "600", marginTop: 2 },
  markAllBtn: { backgroundColor: "#D1FAE5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  markAllText: { color: GREEN, fontSize: 12, fontWeight: "700" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexWrap: "wrap" },
  filterChip: { backgroundColor: "white", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#E5E7EB" },
  filterChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  filterText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  filterTextActive: { color: "white" },
  skeletonRow: { backgroundColor: "white", borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, marginBottom: 8 },
  skeletonIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#E5E7EB" },
  notifCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  notifCardUnread: { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" },
  notifIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  notifMessage: { fontSize: 13, color: "#6B7280", marginTop: 3, lineHeight: 18 },
  notifDate: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginTop: 16 },
  emptySubtitle: { color: "#9CA3AF", fontSize: 14, marginTop: 6, textAlign: "center", lineHeight: 20 },
});
