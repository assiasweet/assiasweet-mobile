import { View, Text, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import type { CartItem } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void };
const MIN_ORDER_HT = 100;

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const lineHT = item.unitPriceHT * item.quantity;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <View style={{ width: 80, height: 80, backgroundColor: "#F9FAFB" }}>
        {item.productImage ? (
          <Image
            source={{ uri: item.productImage }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 30 }}>🍬</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 10 }}>
        {item.brand && (
          <Text style={{ color: "#9CA3AF", fontSize: 11 }} numberOfLines={1}>{item.brand}</Text>
        )}
        <Text style={{ color: "#1E1E1E", fontSize: 13, fontWeight: "600", lineHeight: 18 }} numberOfLines={2}>
          {item.productName}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          {/* Sélecteur quantité */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
            >
              <Text style={{ fontSize: 18, color: "#1E1E1E", fontWeight: "600" }}>−</Text>
            </TouchableOpacity>
            <Text style={{ width: 32, textAlign: "center", fontSize: 15, fontWeight: "700", color: "#1E1E1E" }}>
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
            >
              <Text style={{ fontSize: 18, color: "#E91E7B", fontWeight: "600" }}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "#E91E7B", fontSize: 15, fontWeight: "800" }}>
              {lineHT.toFixed(2)} € HT
            </Text>
            <TouchableOpacity onPress={() => removeItem(item.productId)} style={{ marginTop: 2 }}>
              <Text style={{ color: "#EF4444", fontSize: 12 }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function LoginPromptCart() {
  return (
    <ScreenContainer className="items-center justify-center px-8">
      <Text style={{ fontSize: 50, marginBottom: 16 }}>🛒</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E", textAlign: "center" }}>
        Mon panier
      </Text>
      <Text style={{ color: "#9CA3AF", fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
        Connectez-vous pour accéder à votre panier et passer commande.
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

export default function CartScreen() {
  const auth = useAuthStore((s) => s.auth);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotalHT = useCartStore((s) => s.getSubtotalHT);
  const getTotalTVA = useCartStore((s) => s.getTotalTVA);
  const getTotalTTC = useCartStore((s) => s.getTotalTTC);

  const subtotalHT = getSubtotalHT();
  const totalTVA = getTotalTVA();
  const totalTTC = getTotalTTC();
  const isMinimumReached = subtotalHT >= MIN_ORDER_HT;

  if (auth.status !== "customer") {
    return <LoginPromptCart />;
  }
  const remaining = MIN_ORDER_HT - subtotalHT;

  const handleOrder = () => {
    if (!isMinimumReached) {
      Alert.alert(
        "Commande minimum",
        `Il vous manque ${remaining.toFixed(2)} € HT pour atteindre le minimum de commande (100€ HT).`
      );
      return;
    }
    nav.push("/checkout");
  };

  const handleClearCart = () => {
    Alert.alert(
      "Vider le panier",
      "Êtes-vous sûr de vouloir supprimer tous les articles ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Vider", style: "destructive", onPress: clearCart },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🛒</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E", textAlign: "center" }}>
          Votre panier est vide
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
          Parcourez notre catalogue et ajoutez des produits à votre panier.
        </Text>
        <TouchableOpacity
          onPress={() => nav.push("/(tabs)/catalog")}
          style={{
            backgroundColor: "#E91E7B",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 32,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
            Voir le catalogue
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>
          Mon panier ({items.length} article{items.length > 1 ? "s" : ""})
        </Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={{ color: "#EF4444", fontSize: 14 }}>Vider</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        renderItem={({ item }) => <CartItemRow item={item} />}
        ListFooterComponent={
          <View style={{ marginTop: 8 }}>
            {/* Barre de progression minimum */}
            {!isMinimumReached && (
              <View
                style={{
                  backgroundColor: "#FFF0F7",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "rgba(233,30,123,0.12)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#E91E7B" }}>Minimum de commande</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#E91E7B" }}>{subtotalHT.toFixed(2)} € / 100 € HT</Text>
                </View>
                <View style={{ height: 6, backgroundColor: "rgba(233,30,123,0.15)", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ height: 6, width: `${Math.min((subtotalHT / 100) * 100, 100)}%` as any, backgroundColor: "#E91E7B", borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                  Encore <Text style={{ fontWeight: "700", color: "#E91E7B" }}>{remaining.toFixed(2)} € HT</Text> pour valider la commande
                </Text>
              </View>
            )}

            {/* Récapitulatif */}
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                padding: 16,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 4 }}>
                Récapitulatif
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Sous-total HT</Text>
                <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "600" }}>
                  {subtotalHT.toFixed(2)} €
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>TVA</Text>
                <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "600" }}>
                  {totalTVA.toFixed(2)} €
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Frais de port</Text>
                <Text style={{ color: "#9CA3AF", fontSize: 12, fontStyle: "italic" }}>Calculés ensuite</Text>
              </View>
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#F3F4F6",
                  paddingTop: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#1E1E1E", fontSize: 16, fontWeight: "800" }}>Total TTC</Text>
                <Text style={{ color: "#E91E7B", fontSize: 18, fontWeight: "800" }}>
                  {totalTTC.toFixed(2)} €
                </Text>
              </View>
            </View>
          </View>
        }
      />

      {/* Bouton commander fixe en bas */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
        }}
      >
        <TouchableOpacity
          onPress={handleOrder}
          style={{
            backgroundColor: isMinimumReached ? "#E91E7B" : "#F3F4F6",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            borderWidth: isMinimumReached ? 0 : 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ color: isMinimumReached ? "white" : "#9CA3AF", fontSize: 16, fontWeight: "700" }}>
            {isMinimumReached
              ? `Commander — ${totalTTC.toFixed(2)} € TTC`
              : `Il manque ${remaining.toFixed(2)} € HT pour commander`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
