import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getOrder, downloadInvoice } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import type { Order, OrderStatus } from "@/lib/types";

const nav = router as unknown as { back: () => void };

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  EN_ATTENTE: { label: "En attente de paiement", color: "#92400E", bg: "#FEF3C7", icon: "⏳" },
  EN_PREPARATION: { label: "En préparation", color: "#1D4ED8", bg: "#DBEAFE", icon: "📦" },
  EXPEDIEE: { label: "Expédiée", color: "#6D28D9", bg: "#EDE9FE", icon: "🚚" },
  LIVREE: { label: "Livrée", color: "#065F46", bg: "#D1FAE5", icon: "✅" },
  ANNULEE: { label: "Annulée", color: "#991B1B", bg: "#FEE2E2", icon: "❌" },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(setOrder)
      .catch(() => Alert.alert("Erreur", "Commande introuvable"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const addItem = useCartStore((s) => s.addItem);

  const handleReorder = () => {
    if (!order?.items?.length) return;
    let added = 0;
    order.items.forEach((item) => {
      if (item.product) {
        addItem(item.product, item.quantity);
        added++;
      }
    });
    if (added > 0) {
      router.push("/(tabs)/cart");
    } else {
      Alert.alert("Erreur", "Impossible de retrouver les produits de cette commande.");
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      await downloadInvoice(order.id);
      Alert.alert("Facture", "La facture a été téléchargée.");
    } catch {
      Alert.alert("Erreur", "Impossible de télécharger la facture.");
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

  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.EN_ATTENTE;
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Statut */}
        <View
          style={{
            backgroundColor: status.bg,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 32 }}>{status.icon}</Text>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: status.color }}>
              {status.label}
            </Text>
            <Text style={{ color: status.color, fontSize: 13, opacity: 0.8, marginTop: 2 }}>
              Commande {order.orderNumber} · {date}
            </Text>
          </View>
        </View>

        {/* Suivi */}
        {order.trackingNumber && (
          <View
            style={{
              backgroundColor: "#EDE9FE",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 20 }}>🚚</Text>
            <View>
              <Text style={{ fontWeight: "700", color: "#6D28D9", fontSize: 13 }}>
                Numéro de suivi
              </Text>
              <Text style={{ color: "#6D28D9", fontSize: 14, fontWeight: "600" }}>
                {order.trackingNumber}
              </Text>
            </View>
          </View>
        )}

        {/* Informations de paiement */}
        {order.status === "EN_ATTENTE" && (
          <View
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#BBF7D0",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#065F46", marginBottom: 8 }}>
              💳 Paiement par virement bancaire
            </Text>
            <Text style={{ color: "#047857", fontSize: 13, lineHeight: 20 }}>
              Référence à indiquer : <Text style={{ fontWeight: "700" }}>{order.orderNumber}</Text>
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 4 }}>
              Votre commande sera préparée dès réception du virement.
            </Text>
          </View>
        )}

        {/* Articles */}
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 12 }}>
          Articles commandés
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
            <View style={{ width: 56, height: 56, backgroundColor: "#F9FAFB", borderRadius: 10, overflow: "hidden" }}>
              {item.product?.images?.[0] ? (
                <Image
                  source={{ uri: item.product.images[0] }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 24 }}>🍬</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E1E1E" }} numberOfLines={2}>
                {item.product?.name || "Produit"}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                {item.quantity} × {Number(item.unitPriceHT).toFixed(2)} € HT
              </Text>
            </View>
            <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "700" }}>
              {(item.quantity * Number(item.unitPriceHT)).toFixed(2)} €
            </Text>
          </View>
        ))}

        {/* Totaux */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: "#F9FAFB",
            borderRadius: 14,
            padding: 16,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B7280" }}>Sous-total HT</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>
              {Number(order.subtotalHT).toFixed(2)} €
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B7280" }}>Frais de port</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>
              {Number(order.shippingCost) === 0 ? "Gratuit" : `${Number(order.shippingCost).toFixed(2)} €`}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B7280" }}>TVA</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>
              {Number(order.totalTVA).toFixed(2)} €
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#E5E7EB",
              paddingTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E1E1E" }}>Total TTC</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#E91E7B" }}>
              {Number(order.totalTTC).toFixed(2)} €
            </Text>
          </View>
        </View>

        {/* Adresse de livraison */}
        {order.shippingAddress && typeof order.shippingAddress === "object" && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1E1E", marginBottom: 8 }}>
              Adresse de livraison
            </Text>
            <View style={{ backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12 }}>
              <Text style={{ color: "#6B7280", fontSize: 13, lineHeight: 20 }}>
                {(order.shippingAddress as { street: string; postalCode: string; city: string }).street}
                {"\n"}
                {(order.shippingAddress as { street: string; postalCode: string; city: string }).postalCode}{" "}
                {(order.shippingAddress as { street: string; postalCode: string; city: string }).city}
              </Text>
            </View>
          </View>
        )}

        {/* Bouton Recommander */}
        <TouchableOpacity
          onPress={handleReorder}
          style={{
            marginTop: 20,
            backgroundColor: "#E91E7B",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>{"\uD83D\uDD04"}</Text>
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
            Recommander cette commande
          </Text>
        </TouchableOpacity>

        {/* Bouton facture */}
        {(order.status === "LIVREE" || order.status === "EXPEDIEE") && (
          <TouchableOpacity
            onPress={handleDownloadInvoice}
            style={{
              marginTop: 20,
              backgroundColor: "#F3F4F6",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>🧾</Text>
            <Text style={{ color: "#1E1E1E", fontWeight: "700", fontSize: 15 }}>
              Télécharger la facture PDF
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
