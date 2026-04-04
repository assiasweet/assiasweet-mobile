import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getAdminOrder, updateOrderStatus } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const navRouter = router as unknown as { back: () => void; push: (path: string) => void };



const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: string; color: string; bg: string }[] = [
  { value: "EN_ATTENTE", label: "En attente", icon: "⏳", color: "#92400E", bg: "#FEF3C7" },
  { value: "EN_PREPARATION", label: "En préparation", icon: "📦", color: "#1D4ED8", bg: "#DBEAFE" },
  { value: "EXPEDIEE", label: "Expédiée", icon: "🚚", color: "#6D28D9", bg: "#EDE9FE" },
  { value: "LIVREE", label: "Livrée", icon: "✅", color: "#065F46", bg: "#D1FAE5" },
  { value: "ANNULEE", label: "Annulée", icon: "❌", color: "#991B1B", bg: "#FEE2E2" },
];

export default function StaffOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!id) return;
    getAdminOrder(id)
      .then((data) => {
        setOrder(data);
        setTrackingNumber(data.trackingNumber || "");
      })
      .catch(() => Alert.alert("Erreur", "Commande introuvable"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleStatusChange = (status: OrderStatus) => {
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!order || !selectedStatus) return;
    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(
        order.id,
        selectedStatus,
        selectedStatus === "EXPEDIEE" ? trackingNumber : undefined
      );
      setOrder(updated);
      setShowStatusModal(false);
      Alert.alert("Statut mis à jour", `Commande passée en : ${STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label}`);
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de mettre à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color="#E91E7B" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <Text style={{ color: "#6B7280" }}>Commande introuvable</Text>
      </View>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === order.status) ?? STATUS_OPTIONS[0];

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header avec bouton retour */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
        <TouchableOpacity onPress={() => navRouter.back()} style={{ marginRight: 12, padding: 4 }}>
          <Text style={{ fontSize: 22, color: "#E91E7B" }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#1E1E1E", flex: 1 }}>{order.orderNumber}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Statut actuel */}
        <View
          style={{
            backgroundColor: currentStatus.bg,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 32 }}>{currentStatus.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: currentStatus.color }}>
              {currentStatus.label}
            </Text>
            <Text style={{ color: currentStatus.color, fontSize: 13, opacity: 0.8, marginTop: 2 }}>
              {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowStatusModal(true)}
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: currentStatus.color, fontWeight: "700", fontSize: 13 }}>
              Changer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Infos client */}
        <View style={{ backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 8 }}>CLIENT</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E1E1E" }}>
            {order.customer?.companyName || "—"}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>
            {order.customer?.firstName} {order.customer?.lastName}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 13 }}>{order.customer?.email}</Text>
          {order.customer?.phone && (
            <Text style={{ color: "#6B7280", fontSize: 13 }}>{order.customer.phone}</Text>
          )}
        </View>

        {/* Numéro de suivi */}
        {order.status === "EXPEDIEE" && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E1E1E", marginBottom: 6 }}>
              Numéro de suivi
            </Text>
            <TextInput
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Ex: 1Z999AA10123456784"
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: "#1E1E1E",
                backgroundColor: "#F9FAFB",
              }}
            />
          </View>
        )}

        {/* Articles */}
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 12 }}>
          Articles ({order.items?.length ?? 0})
        </Text>
        {order.items?.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F9FAFB",
              gap: 12,
            }}
          >
            <View style={{ width: 52, height: 52, backgroundColor: "#F9FAFB", borderRadius: 10, overflow: "hidden" }}>
              {item.product?.images?.[0] ? (
                <Image source={{ uri: item.product.images[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 22 }}>🍬</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E1E1E" }} numberOfLines={2}>
                {item.product?.name || item.productName}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                {item.quantity} × {Number(item.unitPriceHT).toFixed(2)} € HT
              </Text>
              {item.product?.sku && (
                <Text style={{ color: "#9CA3AF", fontSize: 11 }}>SKU: {item.product.sku}</Text>
              )}
            </View>
            <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "700" }}>
              {(item.quantity * Number(item.unitPriceHT)).toFixed(2)} €
            </Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={{ marginTop: 16, backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B7280" }}>Sous-total HT</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>{Number(order.subtotalHT).toFixed(2)} €</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B7280" }}>Frais de port</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>
              {Number(order.shippingCost ?? order.shippingHT) === 0 ? "Gratuit" : `${Number(order.shippingCost ?? order.shippingHT).toFixed(2)} €`}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B7280" }}>TVA</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>{Number(order.totalTVA).toFixed(2)} €</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E1E1E" }}>Total TTC</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#E91E7B" }}>{Number(order.totalTTC).toFixed(2)} €</Text>
          </View>
        </View>

        {/* Bouton Commencer la préparation */}
        {(order.status === "EN_ATTENTE" || order.status === "EN_PREPARATION") && (
          <TouchableOpacity
            onPress={() => navRouter.push(`/staff-order/picking/${order.id}`)}
            style={{
              backgroundColor: "#E91E7B",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 20,
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 20 }}>📦</Text>
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              {order.status === "EN_PREPARATION" ? "Continuer la préparation" : "Commencer la préparation"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Notes */}
        {order.notes && (
          <View style={{ marginTop: 16, backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FDE68A" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400E", marginBottom: 4 }}>📝 Notes</Text>
            <Text style={{ color: "#92400E", fontSize: 13 }}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal changement de statut */}
      <Modal visible={showStatusModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowStatusModal(false)}>
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>Changer le statut</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Text style={{ color: "#9CA3AF", fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => handleStatusChange(s.value)}
                style={{
                  backgroundColor: selectedStatus === s.value ? s.bg : (order.status === s.value ? s.bg : "#F9FAFB"),
                  borderRadius: 14,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderWidth: 1.5,
                  borderColor: order.status === s.value ? s.color : (selectedStatus === s.value ? s.color : "#E5E7EB"),
                }}
              >
                <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: s.color }}>{s.label}</Text>
                  {order.status === s.value && (
                    <Text style={{ fontSize: 12, color: s.color, opacity: 0.7 }}>Statut actuel</Text>
                  )}
                </View>
                {order.status === s.value && <Text style={{ color: s.color, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}

            {selectedStatus === "EXPEDIEE" && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1E1E", marginBottom: 8 }}>
                  Numéro de suivi (optionnel)
                </Text>
                <TextInput
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="Ex: 1Z999AA10123456784"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: "#1E1E1E",
                    backgroundColor: "#F9FAFB",
                  }}
                />
              </View>
            )}
          </ScrollView>

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              onPress={confirmStatusChange}
              disabled={!selectedStatus || isUpdating}
              style={{
                backgroundColor: selectedStatus ? "#E91E7B" : "#E5E7EB",
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                opacity: isUpdating ? 0.7 : 1,
              }}
            >
              {isUpdating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: selectedStatus ? "white" : "#9CA3AF", fontWeight: "700", fontSize: 16 }}>
                  Confirmer le changement
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
