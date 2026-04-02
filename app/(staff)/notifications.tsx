import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getAdminNotifications, markNotificationRead } from "@/lib/api";
import type { Notification } from "@/lib/types";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  NEW_ORDER: { icon: "🛒", color: "#1D4ED8", bg: "#DBEAFE" },
  LOW_STOCK: { icon: "⚠️", color: "#D97706", bg: "#FEF3C7" },
  NEW_CUSTOMER: { icon: "👤", color: "#7C3AED", bg: "#EDE9FE" },
  ORDER_STATUS: { icon: "📦", color: "#065F46", bg: "#D1FAE5" },
  PAYMENT: { icon: "💳", color: "#E91E7B", bg: "#FCE4F0" },
  default: { icon: "🔔", color: "#6B7280", bg: "#F3F4F6" },
};

export default function StaffNotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#E91E7B" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 13, color: "#E91E7B", marginTop: 1 }}>
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={{ backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: "#6B7280", fontSize: 13, fontWeight: "600" }}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E91E7B" />
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
              style={{
                backgroundColor: item.isRead ? "white" : "#FFF0F8",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: item.isRead ? "#F3F4F6" : "#F9A8D4",
                padding: 14,
                marginBottom: 8,
                flexDirection: "row",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: config.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 22 }}>{config.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 14, fontWeight: item.isRead ? "600" : "800", color: "#1E1E1E", flex: 1 }}>
                    {item.title}
                  </Text>
                  {!item.isRead && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E91E7B", marginLeft: 8, marginTop: 4 }} />
                  )}
                </View>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 3, lineHeight: 18 }}>
                  {item.message}
                </Text>
                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{date}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1E1E1E", marginTop: 16 }}>
              Aucune notification
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 6, textAlign: "center" }}>
              Les nouvelles commandes et alertes stock apparaîtront ici
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
