import { View, Text, FlatList, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import type { CartItem } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void };
const MIN_ORDER_HT = 150;
const FREE_SHIPPING_HT = 500;
const API_BASE = "https://www.assiasweet.pro";

async function validatePromoCode(code: string, subtotalHT: number): Promise<{ valid: boolean; discount?: number; discountAmount?: number; error?: string }> {
  const res = await fetch(`${API_BASE}/api/promo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotalHT }),
  });
  return res.json();
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const lineHT = item.unitPriceHT * item.quantity;
  return (
    <View style={{ flexDirection: "row", backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", marginBottom: 10, overflow: "hidden" }}>
      <View style={{ width: 80, height: 80, backgroundColor: "#F9FAFB" }}>
        {item.productImage ? (
          <Image source={{ uri: item.productImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 30 }}>🍬</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 10 }}>
        {item.brand && <Text style={{ color: "#9CA3AF", fontSize: 11 }} numberOfLines={1}>{item.brand}</Text>}
        <Text style={{ color: "#1E1E1E", fontSize: 13, fontWeight: "600", lineHeight: 18 }} numberOfLines={2}>{item.productName}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, overflow: "hidden" }}>
            <TouchableOpacity
              onPress={() => { if (item.quantity <= 1) removeItem(item.productId); else updateQuantity(item.productId, item.quantity - 1); }}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
            >
              <Text style={{ fontSize: 18, color: "#1E1E1E", fontWeight: "600" }}>−</Text>
            </TouchableOpacity>
            <Text style={{ width: 32, textAlign: "center", fontSize: 15, fontWeight: "700", color: "#1E1E1E" }}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
            >
              <Text style={{ fontSize: 18, color: "#E91E7B", fontWeight: "600" }}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "#E91E7B", fontSize: 15, fontWeight: "800" }}>{lineHT.toFixed(2)} € HT</Text>
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
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E", textAlign: "center" }}>Mon panier</Text>
      <Text style={{ color: "#9CA3AF", fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
        Connectez-vous pour accéder à votre panier et passer commande.
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/login" as never)}
        style={{ backgroundColor: "#E91E7B", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Se connecter</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/(auth)/register" as never)} style={{ marginTop: 12 }}>
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
  const remaining = MIN_ORDER_HT - subtotalHT;

  // Code promo
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const discountedSubtotalHT = subtotalHT - promoDiscountAmount;
  const discountedTTC = promoApplied && subtotalHT > 0
    ? totalTTC - promoDiscountAmount * (1 + totalTVA / subtotalHT)
    : totalTTC;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const result = await validatePromoCode(promoCode.trim().toUpperCase(), subtotalHT);
      if (result.valid) {
        setPromoApplied(true);
        setPromoDiscount(result.discount ?? 0);
        setPromoDiscountAmount(result.discountAmount ?? 0);
        setPromoError("");
      } else {
        setPromoApplied(false);
        setPromoDiscount(0);
        setPromoDiscountAmount(0);
        setPromoError(result.error ?? "Code promo invalide");
      }
    } catch {
      setPromoError("Impossible de vérifier le code promo");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoDiscountAmount(0);
    setPromoError("");
  };

  const handleClearCart = () => {
    Alert.alert("Vider le panier", "Êtes-vous sûr de vouloir supprimer tous les articles ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Vider", style: "destructive", onPress: clearCart },
    ]);
  };

  const handleOrder = () => {
    if (!isMinimumReached) {
      Alert.alert("Commande minimum", `Il vous manque ${remaining.toFixed(2)} € HT pour atteindre le minimum de commande (${MIN_ORDER_HT}€ HT).`);
      return;
    }
    nav.push("/checkout");
  };

  if (auth.status !== "customer") {
    return <LoginPromptCart />;
  }

  if (items.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🛒</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E", textAlign: "center" }}>Votre panier est vide</Text>
        <Text style={{ color: "#9CA3AF", fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
          Parcourez notre catalogue et ajoutez des produits à votre panier.
        </Text>
        <TouchableOpacity
          onPress={() => nav.push("/(tabs)/catalog")}
          style={{ backgroundColor: "#E91E7B", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Voir le catalogue</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 220 }}
        renderItem={({ item }) => <CartItemRow item={item} />}
        ListFooterComponent={
          <View style={{ marginTop: 8 }}>
            {/* Barre de progression minimum */}
            {!isMinimumReached && (
              <View style={{ backgroundColor: "#FFF0F7", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(233,30,123,0.12)" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#E91E7B" }}>Minimum de commande</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#E91E7B" }}>{subtotalHT.toFixed(2)} € / {MIN_ORDER_HT} € HT</Text>
                </View>
                <View style={{ height: 6, backgroundColor: "rgba(233,30,123,0.15)", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ height: 6, width: `${Math.min((subtotalHT / MIN_ORDER_HT) * 100, 100)}%` as any, backgroundColor: "#E91E7B", borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                  Encore <Text style={{ fontWeight: "700", color: "#E91E7B" }}>{remaining.toFixed(2)} € HT</Text> pour valider la commande
                </Text>
              </View>
            )}
            {/* Livraison gratuite */}
            {isMinimumReached && subtotalHT < FREE_SHIPPING_HT && (
              <View style={{ backgroundColor: "#F0FDF4", borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 18 }}>🚚</Text>
                <Text style={{ fontSize: 12, color: "#16A34A", flex: 1 }}>
                  Plus que <Text style={{ fontWeight: "700" }}>{(FREE_SHIPPING_HT - subtotalHT).toFixed(2)} € HT</Text> pour la livraison gratuite !
                </Text>
              </View>
            )}
            {isMinimumReached && subtotalHT >= FREE_SHIPPING_HT && (
              <View style={{ backgroundColor: "#F0FDF4", borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 18 }}>🎉</Text>
                <Text style={{ fontSize: 12, color: "#16A34A", fontWeight: "600" }}>Livraison gratuite débloquée !</Text>
              </View>
            )}
            {/* Code promo */}
            <View style={{ backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1E1E", marginBottom: 10 }}>Code promo</Text>
              {promoApplied ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 18 }}>🎟️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#16A34A" }}>Code "{promoCode.toUpperCase()}" appliqué</Text>
                      <Text style={{ fontSize: 12, color: "#16A34A" }}>-{promoDiscount}% — économie de {promoDiscountAmount.toFixed(2)} € HT</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemovePromo}>
                    <Text style={{ color: "#EF4444", fontSize: 13 }}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={promoCode}
                    onChangeText={(t) => { setPromoCode(t); setPromoError(""); }}
                    placeholder="Entrez votre code promo"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleApplyPromo}
                    style={{ flex: 1, borderWidth: 1, borderColor: promoError ? "#EF4444" : "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1E1E1E", backgroundColor: "#F9FAFB" }}
                  />
                  <TouchableOpacity
                    onPress={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    style={{ backgroundColor: promoCode.trim() ? "#E91E7B" : "#F3F4F6", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" }}
                  >
                    {promoLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ color: promoCode.trim() ? "white" : "#9CA3AF", fontSize: 13, fontWeight: "700" }}>Appliquer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {promoError ? <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{promoError}</Text> : null}
            </View>
            {/* Récapitulatif */}
            <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", padding: 16, gap: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E1E1E", marginBottom: 4 }}>Récapitulatif</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Sous-total HT</Text>
                <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "600" }}>{subtotalHT.toFixed(2)} €</Text>
              </View>
              {promoApplied && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#16A34A", fontSize: 14 }}>Réduction ({promoDiscount}%)</Text>
                  <Text style={{ color: "#16A34A", fontSize: 14, fontWeight: "600" }}>-{promoDiscountAmount.toFixed(2)} €</Text>
                </View>
              )}
              {promoApplied && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#6B7280", fontSize: 14 }}>Sous-total après remise</Text>
                  <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "700" }}>{discountedSubtotalHT.toFixed(2)} €</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>TVA</Text>
                <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "600" }}>{totalTVA.toFixed(2)} €</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Frais de port</Text>
                {subtotalHT >= FREE_SHIPPING_HT ? (
                  <Text style={{ color: "#16A34A", fontSize: 13, fontWeight: "600" }}>Gratuit</Text>
                ) : (
                  <Text style={{ color: "#9CA3AF", fontSize: 12, fontStyle: "italic" }}>Calculés ensuite</Text>
                )}
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#1E1E1E", fontSize: 16, fontWeight: "800" }}>Total TTC</Text>
                <Text style={{ color: "#E91E7B", fontSize: 18, fontWeight: "800" }}>{(promoApplied ? discountedTTC : totalTTC).toFixed(2)} €</Text>
              </View>
            </View>
          </View>
        }
      />
      {/* Bouton commander fixe en bas */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
        <TouchableOpacity
          onPress={handleOrder}
          style={{ backgroundColor: isMinimumReached ? "#E91E7B" : "#F3F4F6", borderRadius: 16, paddingVertical: 16, alignItems: "center", borderWidth: isMinimumReached ? 0 : 1, borderColor: "#E5E7EB" }}
        >
          <Text style={{ color: isMinimumReached ? "white" : "#9CA3AF", fontSize: 16, fontWeight: "700" }}>
            {isMinimumReached
              ? `Commander — ${(promoApplied ? discountedTTC : totalTTC).toFixed(2)} € TTC`
              : `Il manque ${remaining.toFixed(2)} € HT pour commander`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
