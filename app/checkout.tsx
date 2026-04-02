import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { getAddresses, calculateShipping, createOrder } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import type { Address, ShippingOption } from "@/lib/types";

const nav = router as unknown as { back: () => void; replace: (p: string) => void };

const RIB_INFO = `
Bénéficiaire : AssiaSweet
IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX
BIC : XXXXXXXX
Banque : Revolut Business
Référence : [Votre numéro de commande]
`.trim();

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const getSubtotalHT = useCartStore((s) => s.getSubtotalHT);
  const clearCart = useCartStore((s) => s.clearCart);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>("");
  const [shippingPrice, setShippingPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [step, setStep] = useState<"address" | "shipping" | "payment" | "confirm">("address");

  const subtotalHT = getSubtotalHT();

  useEffect(() => {
    getAddresses()
      .then((addrs) => {
        const shipping = addrs.filter((a) => a.type === "shipping");
        setAddresses(shipping);
        if (shipping.length > 0) setSelectedAddressId(shipping[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleCalculateShipping = async () => {
    if (!selectedAddressId) {
      Alert.alert("Adresse requise", "Veuillez sélectionner une adresse de livraison.");
      return;
    }
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    setIsCalculatingShipping(true);
    try {
      const result = await calculateShipping({
        cartTotal: subtotalHT,
        country: selectedAddr?.country || "FR",
        postalCode: selectedAddr?.postalCode || "75000",
      });
      if (result.options?.length > 0) {
        setShippingOptions(result.options);
        setSelectedShipping(result.options[0].id);
        setShippingPrice(result.options[0].shippingCostHT);
      }
      setStep("shipping");
    } catch {
      const defaultOptions: ShippingOption[] = [
        { id: "retrait", label: "Retrait Roissy-en-France", shippingCostHT: 0, shippingTVA: 0, shippingTTC: 0, isFree: true },
      ];
      setShippingOptions(defaultOptions);
      setSelectedShipping("retrait");
      setShippingPrice(0);
      setStep("shipping");
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleConfirmOrder = async () => {
    setIsOrdering(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId: selectedAddressId,
        shippingMethod: selectedShipping,
        paymentMethod: "VIREMENT",
        notes: notes.trim() || undefined,
      });

      clearCart();
      Alert.alert(
        "Commande confirmée ! 🎉",
        `Votre commande ${order.orderNumber} a été enregistrée.\n\nMerci d'effectuer le virement bancaire avec la référence ${order.orderNumber}.`,
        [
          {
            text: "Voir mes commandes",
            onPress: () => nav.replace("/(tabs)/orders"),
          },
        ]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la commande";
      Alert.alert("Erreur", message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color="#E91E7B" />
      </View>
    );
  }

  const selectedOption = shippingOptions.find((o) => o.method === selectedShipping);
  const totalHT = subtotalHT + shippingPrice;
  const totalTVA = items.reduce((s, i) => s + i.unitPriceHT * i.quantity * (i.tvaRate / 100), 0) + shippingPrice * 0.2;
  const totalTTC = totalHT + totalTVA;

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Indicateur d'étapes */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 4 }}>
        {(["address", "shipping", "payment"] as const).map((s, i) => (
          <View key={s} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor:
                  step === s ? "#E91E7B" :
                  (step === "shipping" && s === "address") || (step === "payment" && s !== "payment") ? "#22C55E" :
                  "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                {(step === "shipping" && s === "address") || (step === "payment" && s !== "payment") ? "✓" : String(i + 1)}
              </Text>
            </View>
            {i < 2 && (
              <View style={{ flex: 1, height: 2, backgroundColor: "#E5E7EB", marginHorizontal: 4 }} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Étape 1 — Adresse */}
        {step === "address" && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E" }}>
              Adresse de livraison
            </Text>

            {addresses.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  backgroundColor: "#FEF3C7",
                  borderRadius: 14,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 24 }}>📍</Text>
                <Text style={{ color: "#92400E", fontSize: 14, textAlign: "center" }}>
                  Aucune adresse de livraison enregistrée.{"\n"}Ajoutez une adresse dans votre compte.
                </Text>
                <TouchableOpacity
                  onPress={() => nav.replace("/addresses")}
                  style={{
                    backgroundColor: "#E91E7B",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Ajouter une adresse</Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  onPress={() => setSelectedAddressId(addr.id)}
                  style={{
                    borderWidth: 2,
                    borderColor: selectedAddressId === addr.id ? "#E91E7B" : "#E5E7EB",
                    borderRadius: 14,
                    padding: 14,
                    backgroundColor: selectedAddressId === addr.id ? "#FCE4F0" : "white",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "700", color: "#1E1E1E", fontSize: 14 }}>
                      {addr.company || `${addr.firstName} ${addr.lastName}`}
                    </Text>
                    {selectedAddressId === addr.id && (
                      <Text style={{ color: "#E91E7B", fontWeight: "700" }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
                    {addr.street}
                    {addr.complement ? `, ${addr.complement}` : ""}
                  </Text>
                  <Text style={{ color: "#6B7280", fontSize: 13 }}>
                    {addr.postalCode} {addr.city}, {addr.country}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Étape 2 — Livraison */}
        {step === "shipping" && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E" }}>
              Mode de livraison
            </Text>

            {shippingOptions.map((option) => {
              const optId = option.id || option.method || "";
              const optPrice = option.shippingCostHT ?? option.price ?? 0;
              const isRetrait = optId === "retrait" || option.method === "RETRAIT";
              return (
                <TouchableOpacity
                  key={optId}
                  onPress={() => {
                    setSelectedShipping(optId);
                    setShippingPrice(optPrice);
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: selectedShipping === optId ? "#E91E7B" : "#E5E7EB",
                    borderRadius: 14,
                    padding: 16,
                    backgroundColor: selectedShipping === optId ? "#FCE4F0" : "white",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>
                    {isRetrait ? "🏦" : optId === "relais" ? "📦" : "🚚"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: "#1E1E1E", fontSize: 15 }}>
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                        {option.description}
                      </Text>
                    )}
                    {isRetrait && (
                      <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 1 }}>
                        161 rue Belle Étoile, Roissy-en-France
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: "#E91E7B", fontWeight: "800", fontSize: 15 }}>
                    {option.isFree || optPrice === 0 ? "Gratuit" : `${optPrice.toFixed(2)} € HT`}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#1E1E1E", marginBottom: 8 }}>
                Notes (optionnel)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Instructions de livraison, commentaires..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: "#1E1E1E",
                  backgroundColor: "#F9FAFB",
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </View>
        )}

        {/* Étape 3 — Paiement et récapitulatif */}
        {step === "payment" && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E1E1E" }}>
              Récapitulatif et paiement
            </Text>

            {/* Récapitulatif commande */}
            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 14,
                padding: 16,
                gap: 8,
              }}
            >
              <Text style={{ fontWeight: "700", color: "#1E1E1E", marginBottom: 4 }}>
                Votre commande ({items.length} article{items.length > 1 ? "s" : ""})
              </Text>
              {items.map((item) => (
                <View key={item.productId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#6B7280", fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {item.quantity}x {item.productName}
                  </Text>
                  <Text style={{ color: "#1E1E1E", fontSize: 13, fontWeight: "600" }}>
                    {(item.unitPriceHT * item.quantity).toFixed(2)} €
                  </Text>
                </View>
              ))}
            </View>

            {/* Totaux */}
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                padding: 16,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280" }}>Sous-total HT</Text>
                <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>{subtotalHT.toFixed(2)} €</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280" }}>Frais de port HT</Text>
                <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>
                  {shippingPrice === 0 ? "Gratuit" : `${shippingPrice.toFixed(2)} €`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B7280" }}>TVA</Text>
                <Text style={{ color: "#1E1E1E", fontWeight: "600" }}>{totalTVA.toFixed(2)} €</Text>
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

            {/* Paiement par virement */}
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#BBF7D0",
                padding: 16,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#065F46" }}>
                💳 Paiement par virement bancaire
              </Text>
              <Text style={{ color: "#047857", fontSize: 13, lineHeight: 20 }}>
                {RIB_INFO}
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, lineHeight: 18 }}>
                Votre commande sera traitée dès réception du virement. Indiquez votre numéro de commande en référence.
              </Text>
            </View>

            {/* Livraison sélectionnée */}
            {selectedOption && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 20 }}>{selectedOption.method === "RETRAIT" ? "🏪" : "🚚"}</Text>
                <View>
                  <Text style={{ fontWeight: "600", color: "#1E1E1E", fontSize: 14 }}>{selectedOption.label}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>Délai : {selectedOption.delay}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bouton d'action fixe */}
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
        {step === "address" && (
          <TouchableOpacity
            onPress={handleCalculateShipping}
            disabled={!selectedAddressId || isCalculatingShipping}
            style={{
              backgroundColor: selectedAddressId ? "#E91E7B" : "#9CA3AF",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            {isCalculatingShipping ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                Choisir la livraison →
              </Text>
            )}
          </TouchableOpacity>
        )}

        {step === "shipping" && (
          <TouchableOpacity
            onPress={() => setStep("payment")}
            disabled={!selectedShipping}
            style={{
              backgroundColor: selectedShipping ? "#E91E7B" : "#9CA3AF",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Voir le récapitulatif →
            </Text>
          </TouchableOpacity>
        )}

        {step === "payment" && (
          <TouchableOpacity
            onPress={handleConfirmOrder}
            disabled={isOrdering}
            style={{
              backgroundColor: "#E91E7B",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              opacity: isOrdering ? 0.7 : 1,
            }}
          >
            {isOrdering ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                Confirmer la commande ✓
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
