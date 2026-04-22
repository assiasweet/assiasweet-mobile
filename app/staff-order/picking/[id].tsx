import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { BarcodeScannerLazy as BarcodeScanner } from "@/components/barcode-scanner-lazy";
import { getAdminOrder, updateOrderStatus, decrementProductStock } from "@/lib/api";
import type { Order, OrderItem } from "@/lib/types";

const nav = router as unknown as { back: () => void; push: (path: string) => void };

interface PickItem extends OrderItem {
  picked: boolean;
  pickCount: number; // combien d'unités ont été scannées
}

export default function PickingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<PickItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Charger la commande
  useEffect(() => {
    if (!id) return;
    getAdminOrder(id)
      .then((data) => {
        setOrder(data);
        const rawItems = (data as Order & { items?: OrderItem[] }).items ?? [];
        setItems(
          rawItems.map((item) => ({
            ...item,
            picked: false,
            pickCount: 0,
          }))
        );
      })
      .catch(() => Alert.alert("Erreur", "Commande introuvable"))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Animation de succès
  const showSuccessAnimation = useCallback(() => {
    setShowSuccess(true);
    successAnim.setValue(0);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));
  }, [successAnim]);

  // Gérer le scan d'un code-barres
  const handleBarcodeScan = useCallback((barcode: string) => {
    setShowScanner(false);
    setLastScanned(barcode);

    // Chercher l'article correspondant (par barcode exact, SKU exact, puis SKU partiel)
    // Priorité 1 : match exact sur le barcode du produit
    let matchIndex = items.findIndex((item) => {
      const productBarcode = item.product?.barcode ?? "";
      return productBarcode !== "" && productBarcode === barcode;
    });

    // Priorité 2 : match exact sur le SKU
    if (matchIndex === -1) {
      matchIndex = items.findIndex((item) => {
        const sku = (item as PickItem & { productSku?: string }).productSku ?? "";
        return sku !== "" && sku.toLowerCase() === barcode.toLowerCase();
      });
    }

    // Priorité 3 : match partiel sur le SKU (le code scanné contient le SKU ou inversement)
    if (matchIndex === -1) {
      matchIndex = items.findIndex((item) => {
        const sku = (item as PickItem & { productSku?: string }).productSku ?? "";
        if (sku === "") return false;
        const bc = barcode.toLowerCase();
        return sku.toLowerCase().includes(bc) || bc.includes(sku.toLowerCase());
      });
    }

    if (matchIndex === -1) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Produit non trouvé",
        `Code scanné : ${barcode}\n\nCe code ne correspond à aucun article de cette commande. Vérifiez que vous scannez le bon produit.`,
        [
          { text: "Réessayer", onPress: () => setShowScanner(true) },
          { text: "OK" },
        ]
      );
      return;
    }

    const item = items[matchIndex];

    if (item.picked) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Déjà prélevé", `"${item.productName}" est déjà coché comme prélevé.`);
      return;
    }

    // Cocher l'article
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccessAnimation();
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === matchIndex
          ? { ...it, pickCount: it.pickCount + 1, picked: it.pickCount + 1 >= it.quantity }
          : it
      )
    );
  }, [items, showSuccessAnimation]);

  // Cocher/décocher manuellement
  const toggleItem = useCallback((index: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === index
          ? { ...it, picked: !it.picked, pickCount: !it.picked ? it.quantity : 0 }
          : it
      )
    );
  }, []);

  // Compter les articles prélevés
  const pickedCount = items.filter((i) => i.picked).length;
  const totalCount = items.length;
  const allPicked = pickedCount === totalCount && totalCount > 0;
  const progress = totalCount > 0 ? pickedCount / totalCount : 0;

  // Valider la préparation
  const handleValidate = useCallback(async () => {
    if (!order || !allPicked) return;

    Alert.alert(
      "Valider la préparation ?",
      `La commande ${order.orderNumber} sera marquée comme "Prête à l'envoi" et les stocks seront mis à jour automatiquement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          style: "default",
          onPress: async () => {
            setIsValidating(true);
            try {
              // 1. Passer la commande en EN_PREPARATION puis EXPEDIEE
              await updateOrderStatus(order.id, "EXPEDIEE");

              // 2. Décrémenter le stock de chaque article
              const stockUpdates = items
                .filter((item) => item.productId && item.quantity > 0)
                .map((item) =>
                  decrementProductStock(item.productId, item.quantity).catch(() => {
                    console.warn(`Stock update failed for product ${item.productId}`);
                  })
                );
              await Promise.allSettled(stockUpdates);

              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                "✅ Commande prête à l'envoi !",
                `La commande ${order.orderNumber} est marquée comme expédiée. Les stocks ont été mis à jour.`,
                [
                  {
                    text: "Retour aux commandes",
                    onPress: () => nav.push(`/staff-order/${order.id}`),
                  },
                ]
              );
            } catch (err) {
              Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de valider");
            } finally {
              setIsValidating(false);
            }
          },
        },
      ]
    );
  }, [order, allPicked, items]);

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

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Préparation</Text>
          <Text style={styles.headerSub}>{order.orderNumber}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowScanner(true)}
          style={styles.scanBtn}
        >
          <Text style={styles.scanBtnText}>📷 Scanner</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {pickedCount} / {totalCount} articles prélevés
          </Text>
          <Text style={[styles.progressPct, allPicked && styles.progressPctDone]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%` as `${number}%` },
              allPicked && styles.progressFillDone,
            ]}
          />
        </View>
        {allPicked && (
          <Text style={styles.progressComplete}>
            ✅ Tous les articles sont prélevés — prêt à valider !
          </Text>
        )}
      </View>

      {/* Liste des articles */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <PickItemRow
            item={item}
            onToggle={() => toggleItem(index)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>📦</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E1E1E", marginTop: 12 }}>
              Aucun article dans cette commande
            </Text>
          </View>
        }
      />

      {/* Bouton de validation */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleValidate}
          disabled={!allPicked || isValidating}
          style={[
            styles.validateBtn,
            (!allPicked || isValidating) && styles.validateBtnDisabled,
          ]}
        >
          {isValidating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[styles.validateBtnText, (!allPicked) && styles.validateBtnTextDisabled]}>
              {allPicked ? "✅ Valider la préparation" : `Encore ${totalCount - pickedCount} article(s) à prélever`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Scanner modal */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
        <BarcodeScanner
          onScanned={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      {/* Feedback succès scan */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successToast,
            {
              opacity: successAnim,
              transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            },
          ]}
        >
          <Text style={styles.successToastText}>✅ Article prélevé !</Text>
        </Animated.View>
      )}
    </ScreenContainer>
  );
}

// Composant ligne article
function PickItemRow({ item, onToggle }: { item: PickItem; onToggle: () => void }) {
  const imageUri =
    (item as PickItem & { imageUrl?: string }).imageUrl ||
    item.product?.images?.[0] ||
    null;

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.itemRow, item.picked && styles.itemRowPicked]}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <View style={[styles.checkbox, item.picked && styles.checkboxChecked]}>
        {item.picked && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Image */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="contain" />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
          <Text style={{ fontSize: 20 }}>🍬</Text>
        </View>
      )}

      {/* Infos */}
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.itemName, item.picked && styles.itemNamePicked]}
          numberOfLines={2}
        >
          {item.productName}
        </Text>
        {(item as PickItem & { productSku?: string }).productSku ? (
          <Text style={styles.itemSku}>
            SKU : {(item as PickItem & { productSku?: string }).productSku}
          </Text>
        ) : null}
        {item.picked && item.quantity > 1 && (
          <Text style={styles.itemPickCount}>
            {item.pickCount}/{item.quantity} unités
          </Text>
        )}
      </View>

      {/* Quantité */}
      <View style={[styles.qtyBadge, item.picked && styles.qtyBadgePicked]}>
        <Text style={[styles.qtyText, item.picked && styles.qtyTextPicked]}>
          ×{item.quantity}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 18,
    color: "#1E1E1E",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1E1E",
  },
  headerSub: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 1,
  },
  scanBtn: {
    backgroundColor: "#E91E7B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  // Progression
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFF5FA",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FCE4F0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E1E1E",
  },
  progressPct: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E91E7B",
  },
  progressPctDone: {
    color: "#059669",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E91E7B",
    borderRadius: 4,
  },
  progressFillDone: {
    backgroundColor: "#059669",
  },
  progressComplete: {
    marginTop: 8,
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
  },
  // Article row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRowPicked: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  checkboxChecked: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  checkmark: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
  },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E1E1E",
    lineHeight: 20,
  },
  itemNamePicked: {
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
  itemSku: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  itemPickCount: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    marginTop: 2,
  },
  qtyBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 40,
    alignItems: "center",
  },
  qtyBadgePicked: {
    backgroundColor: "#D1FAE5",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  qtyTextPicked: {
    color: "#059669",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  validateBtn: {
    backgroundColor: "#E91E7B",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  validateBtnDisabled: {
    backgroundColor: "#F3F4F6",
  },
  validateBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  validateBtnTextDisabled: {
    color: "#9CA3AF",
  },
  // Toast succès
  successToast: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  successToastText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
});
