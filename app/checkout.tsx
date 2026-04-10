import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { getAddresses, calculateShipping, createOrder, createPayPalOrder } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import type { Address, ShippingOption } from "@/lib/types";

const RIB_INFO = `Bénéficiaire : AssiaSweet
IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX
BIC : XXXXXXXX
Banque : Revolut Business
Référence : [Votre numéro de commande]`;

type PaymentMethod = "PAYPAL" | "VIREMENT";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYPAL");
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [step, setStep] = useState<"address" | "shipping" | "payment">("address");

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

  // Paiement par virement : crée la commande directement
  const handleVirementOrder = async () => {
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
        "Commande enregistrée ! 🎉",
        `Votre commande ${order.orderNumber} a été enregistrée.\n\nMerci d'effectuer le virement bancaire avec la référence ${order.orderNumber}.`,
        [{ text: "Voir mes commandes", onPress: () => router.replace("/(tabs)/orders" as Parameters<typeof router.replace>[0]) }]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la commande";
      Alert.alert("Erreur", message);
    } finally {
      setIsOrdering(false);
    }
  };

  // Paiement PayPal : crée la commande + crée l'ordre PayPal + navigue vers WebView
  const handlePayPalOrder = async () => {
    setIsOrdering(true);
    try {
      // 1. Créer la commande en BDD (statut EN_ATTENTE, paiement PAYPAL)
      const order = await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId: selectedAddressId,
        shippingMethod: selectedShipping,
        paymentMethod: "PAYPAL",
        notes: notes.trim() || undefined,
      });

      // 2. Créer l'ordre PayPal avec le montant TTC
      const paypalOrder = await createPayPalOrder({
        amount: totalTTC,
        currency: "EUR",
        orderId: order.orderNumber,
        internalOrderId: order.id,
      });

      if (!paypalOrder.id) {
        throw new Error("Impossible de créer l'ordre PayPal");
      }

      // 3. Vider le panier et naviguer vers la WebView PayPal
      clearCart();
      router.push({
        pathname: "/paypal-payment",
        params: {
          paypalOrderId: paypalOrder.id,
          internalOrderId: order.id,
          amount: totalTTC.toFixed(2),
          orderNumber: order.orderNumber,
        },
      } as Parameters<typeof router.push>[0]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la commande";
      Alert.alert("Erreur", message);
    } finally {
      setIsOrdering(false);
    }
  };

  const handleConfirmOrder = () => {
    if (paymentMethod === "PAYPAL") {
      handlePayPalOrder();
    } else {
      handleVirementOrder();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E7B" />
      </View>
    );
  }

  const selectedOption = shippingOptions.find((o) => o.id === selectedShipping || o.method === selectedShipping);
  const totalHT = subtotalHT + shippingPrice;
  const totalTVA = items.reduce((s, i) => s + i.unitPriceHT * i.quantity * (i.tvaRate / 100), 0) + shippingPrice * 0.2;
  const totalTTC = totalHT + totalTVA;

  return (
    <View style={styles.container}>
      {/* Indicateur d'étapes */}
      <View style={styles.stepsRow}>
        {(["address", "shipping", "payment"] as const).map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                step === s && styles.stepCircleActive,
                ((step === "shipping" && s === "address") || (step === "payment" && s !== "payment")) && styles.stepCircleDone,
              ]}
            >
              <Text style={styles.stepCircleText}>
                {(step === "shipping" && s === "address") || (step === "payment" && s !== "payment") ? "✓" : String(i + 1)}
              </Text>
            </View>
            {i < 2 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Étape 1 — Adresse */}
        {step === "address" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>

            {addresses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📍</Text>
                <Text style={styles.emptyText}>
                  Aucune adresse de livraison enregistrée.{"\n"}Ajoutez une adresse dans votre compte.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/addresses" as Parameters<typeof router.replace>[0])}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>Ajouter une adresse</Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  onPress={() => setSelectedAddressId(addr.id)}
                  style={[styles.card, selectedAddressId === addr.id && styles.cardSelected]}
                >
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>
                      {addr.company || `${addr.firstName} ${addr.lastName}`}
                    </Text>
                    {selectedAddressId === addr.id && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.cardSubtext}>
                    {addr.street}{addr.complement ? `, ${addr.complement}` : ""}
                  </Text>
                  <Text style={styles.cardSubtext}>
                    {addr.postalCode} {addr.city}, {addr.country}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Étape 2 — Livraison */}
        {step === "shipping" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode de livraison</Text>

            {shippingOptions.map((option) => {
              const optId = option.id || option.method || "";
              const optPrice = option.shippingCostHT ?? option.price ?? 0;
              const isRetrait = optId === "retrait" || option.method === "RETRAIT";
              return (
                <TouchableOpacity
                  key={optId}
                  onPress={() => { setSelectedShipping(optId); setShippingPrice(optPrice); }}
                  style={[styles.card, styles.cardRow, selectedShipping === optId && styles.cardSelected]}
                >
                  <Text style={styles.shippingIcon}>
                    {isRetrait ? "🏦" : optId === "relais" ? "📦" : "🚚"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{option.label}</Text>
                    {option.description && (
                      <Text style={styles.cardSubtext}>{option.description}</Text>
                    )}
                    {isRetrait && (
                      <Text style={styles.cardSubtext}>161 rue Belle Étoile, Roissy-en-France</Text>
                    )}
                  </View>
                  <Text style={styles.shippingPrice}>
                    {option.isFree || optPrice === 0 ? "Gratuit" : `${optPrice.toFixed(2)} € HT`}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes (optionnel)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Instructions de livraison, commentaires..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                style={styles.notesInput}
              />
            </View>
          </View>
        )}

        {/* Étape 3 — Récapitulatif et paiement */}
        {step === "payment" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Récapitulatif et paiement</Text>

            {/* Articles */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>
                Votre commande ({items.length} article{items.length > 1 ? "s" : ""})
              </Text>
              {items.map((item) => (
                <View key={item.productId} style={styles.summaryRow}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {item.quantity}x {item.productName}
                  </Text>
                  <Text style={styles.summaryItemPrice}>
                    {(item.unitPriceHT * item.quantity).toFixed(2)} €
                  </Text>
                </View>
              ))}
            </View>

            {/* Totaux */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sous-total HT</Text>
                <Text style={styles.totalValue}>{subtotalHT.toFixed(2)} €</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Frais de port HT</Text>
                <Text style={styles.totalValue}>
                  {shippingPrice === 0 ? "Gratuit" : `${shippingPrice.toFixed(2)} €`}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA</Text>
                <Text style={styles.totalValue}>{totalTVA.toFixed(2)} €</Text>
              </View>
              <View style={styles.totalRowFinal}>
                <Text style={styles.totalFinalLabel}>Total TTC</Text>
                <Text style={styles.totalFinalValue}>{totalTTC.toFixed(2)} €</Text>
              </View>
            </View>

            {/* Livraison sélectionnée */}
            {selectedOption && (
              <View style={styles.selectedShippingBox}>
                <Text style={styles.shippingIcon}>
                  {selectedOption.id === "retrait" || selectedOption.method === "RETRAIT" ? "🏪" : "🚚"}
                </Text>
                <View>
                  <Text style={styles.cardTitle}>{selectedOption.label}</Text>
                  {selectedOption.delay && (
                    <Text style={styles.cardSubtext}>Délai : {selectedOption.delay}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Choix du mode de paiement */}
            <Text style={styles.paymentSectionTitle}>Mode de paiement</Text>

            {/* PayPal */}
            <TouchableOpacity
              onPress={() => setPaymentMethod("PAYPAL")}
              style={[styles.paymentOption, paymentMethod === "PAYPAL" && styles.paymentOptionSelected]}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentRadio, paymentMethod === "PAYPAL" && styles.paymentRadioSelected]}>
                  {paymentMethod === "PAYPAL" && <View style={styles.paymentRadioDot} />}
                </View>
                <View>
                  <View style={styles.paypalBadge}>
                    <Text style={styles.paypalBadgeText}>Pay</Text>
                    <Text style={[styles.paypalBadgeText, { color: "#009cde" }]}>Pal</Text>
                  </View>
                  <Text style={styles.paymentOptionDesc}>
                    Paiement sécurisé immédiat
                  </Text>
                </View>
              </View>
              {paymentMethod === "PAYPAL" && (
                <Text style={styles.paymentCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Virement bancaire */}
            <TouchableOpacity
              onPress={() => setPaymentMethod("VIREMENT")}
              style={[styles.paymentOption, paymentMethod === "VIREMENT" && styles.paymentOptionSelected]}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentRadio, paymentMethod === "VIREMENT" && styles.paymentRadioSelected]}>
                  {paymentMethod === "VIREMENT" && <View style={styles.paymentRadioDot} />}
                </View>
                <View>
                  <Text style={styles.paymentOptionTitle}>🏦 Virement bancaire</Text>
                  <Text style={styles.paymentOptionDesc}>
                    Commande traitée à réception
                  </Text>
                </View>
              </View>
              {paymentMethod === "VIREMENT" && (
                <Text style={styles.paymentCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Détails virement si sélectionné */}
            {paymentMethod === "VIREMENT" && (
              <View style={styles.ribBox}>
                <Text style={styles.ribTitle}>Coordonnées bancaires</Text>
                <Text style={styles.ribText}>{RIB_INFO}</Text>
                <Text style={styles.ribNote}>
                  Indiquez votre numéro de commande en référence du virement.
                </Text>
              </View>
            )}

            {/* Info PayPal si sélectionné */}
            {paymentMethod === "PAYPAL" && (
              <View style={styles.paypalInfoBox}>
                <Text style={styles.paypalInfoText}>
                  Vous serez redirigé vers PayPal pour finaliser le paiement de{" "}
                  <Text style={{ fontWeight: "800" }}>{totalTTC.toFixed(2)} €</Text>.
                  Votre commande sera confirmée immédiatement après le paiement.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bouton d'action fixe */}
      <View style={styles.actionBar}>
        {step === "address" && (
          <TouchableOpacity
            onPress={handleCalculateShipping}
            disabled={!selectedAddressId || isCalculatingShipping}
            style={[styles.actionButton, (!selectedAddressId || isCalculatingShipping) && styles.actionButtonDisabled]}
          >
            {isCalculatingShipping ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.actionButtonText}>Choisir la livraison →</Text>
            )}
          </TouchableOpacity>
        )}

        {step === "shipping" && (
          <TouchableOpacity
            onPress={() => setStep("payment")}
            disabled={!selectedShipping}
            style={[styles.actionButton, !selectedShipping && styles.actionButtonDisabled]}
          >
            <Text style={styles.actionButtonText}>Voir le récapitulatif →</Text>
          </TouchableOpacity>
        )}

        {step === "payment" && (
          <TouchableOpacity
            onPress={handleConfirmOrder}
            disabled={isOrdering}
            style={[
              styles.actionButton,
              paymentMethod === "PAYPAL" && styles.actionButtonPayPal,
              isOrdering && styles.actionButtonDisabled,
            ]}
          >
            {isOrdering ? (
              <ActivityIndicator color="white" />
            ) : paymentMethod === "PAYPAL" ? (
              <View style={styles.paypalButtonContent}>
                <Text style={styles.paypalButtonText}>Payer avec </Text>
                <Text style={[styles.paypalButtonText, { fontStyle: "italic" }]}>Pay</Text>
                <Text style={[styles.paypalButtonText, { fontStyle: "italic", color: "#009cde" }]}>Pal</Text>
              </View>
            ) : (
              <Text style={styles.actionButtonText}>Confirmer la commande ✓</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  stepsRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  stepItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: "#E91E7B" },
  stepCircleDone: { backgroundColor: "#22C55E" },
  stepCircleText: { color: "white", fontSize: 12, fontWeight: "700" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E5E7EB", marginHorizontal: 4 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1E1E1E" },
  emptyBox: { padding: 20, backgroundColor: "#FEF3C7", borderRadius: 14, alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 24 },
  emptyText: { color: "#92400E", fontSize: 14, textAlign: "center" },
  addButton: { backgroundColor: "#E91E7B", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  addButtonText: { color: "white", fontWeight: "700" },
  card: { borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 14, padding: 14, backgroundColor: "white" },
  cardSelected: { borderColor: "#E91E7B", backgroundColor: "#FCE4F0" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontWeight: "700", color: "#1E1E1E", fontSize: 14 },
  cardSubtext: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  checkmark: { color: "#E91E7B", fontWeight: "700" },
  shippingIcon: { fontSize: 28 },
  shippingPrice: { color: "#E91E7B", fontWeight: "800", fontSize: 15 },
  notesContainer: { gap: 6 },
  notesLabel: { fontSize: 14, fontWeight: "600", color: "#1E1E1E" },
  notesInput: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12,
    padding: 12, fontSize: 14, color: "#1E1E1E",
    backgroundColor: "#F9FAFB", minHeight: 80, textAlignVertical: "top",
  },
  summaryBox: { backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, gap: 8 },
  summaryTitle: { fontWeight: "700", color: "#1E1E1E", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItemName: { color: "#6B7280", fontSize: 13, flex: 1 },
  summaryItemPrice: { color: "#1E1E1E", fontSize: 13, fontWeight: "600" },
  totalsBox: { backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", padding: 16, gap: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: "#6B7280" },
  totalValue: { color: "#1E1E1E", fontWeight: "600" },
  totalRowFinal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10 },
  totalFinalLabel: { color: "#1E1E1E", fontSize: 16, fontWeight: "800" },
  totalFinalValue: { color: "#E91E7B", fontSize: 18, fontWeight: "800" },
  selectedShippingBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12 },
  paymentSectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E1E1E", marginTop: 4 },
  paymentOption: {
    borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "white",
  },
  paymentOptionSelected: { borderColor: "#E91E7B", backgroundColor: "#FCE4F0" },
  paymentOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  paymentRadioSelected: { borderColor: "#E91E7B" },
  paymentRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E91E7B" },
  paymentOptionTitle: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  paymentOptionDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  paymentCheckmark: { color: "#E91E7B", fontWeight: "700", fontSize: 16 },
  paypalBadge: { flexDirection: "row", alignItems: "center" },
  paypalBadgeText: { fontSize: 16, fontWeight: "800", color: "#003087", fontStyle: "italic" },
  ribBox: { backgroundColor: "#F0FDF4", borderRadius: 14, borderWidth: 1, borderColor: "#BBF7D0", padding: 16, gap: 8 },
  ribTitle: { fontSize: 14, fontWeight: "700", color: "#065F46" },
  ribText: { color: "#047857", fontSize: 13, lineHeight: 22 },
  ribNote: { color: "#6B7280", fontSize: 12, lineHeight: 18 },
  paypalInfoBox: { backgroundColor: "#EFF6FF", borderRadius: 14, borderWidth: 1, borderColor: "#BFDBFE", padding: 14 },
  paypalInfoText: { color: "#1D4ED8", fontSize: 13, lineHeight: 20 },
  actionBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: "white",
    borderTopWidth: 1, borderTopColor: "#F3F4F6",
  },
  actionButton: { backgroundColor: "#E91E7B", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  actionButtonPayPal: { backgroundColor: "#003087" },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  paypalButtonContent: { flexDirection: "row", alignItems: "center" },
  paypalButtonText: { color: "white", fontSize: 16, fontWeight: "800" },
});
