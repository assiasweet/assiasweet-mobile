import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Image,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BarcodeScannerLazy as BarcodeScanner } from "@/components/barcode-scanner-lazy";
import { getAdminProducts, updateProductStock, getProductByBarcode } from "@/lib/api";
import { getProductImage } from "@/lib/types";
import type { Product } from "@/lib/types";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return (
    <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: "#DC2626", fontSize: 11, fontWeight: "700" }}>RUPTURE</Text>
    </View>
  );
  if (stock <= 10) return (
    <View style={{ backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: "#D97706", fontSize: 11, fontWeight: "700" }}>FAIBLE ({stock})</Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: "#065F46", fontSize: 11, fontWeight: "700" }}>EN STOCK ({stock})</Text>
    </View>
  );
}

export default function StaffProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [isScanSearching, setIsScanSearching] = useState(false);

  const handleBarcodeScanned = async (barcode: string) => {
    setShowScanner(false);
    setIsScanSearching(true);
    try {
      const product = await getProductByBarcode(barcode);
      if (product) {
        setEditingProduct(product);
        setNewStock(String(product.stock));
      } else {
        const match = products.find((p) => p.sku === barcode);
        if (match) {
          setEditingProduct(match);
          setNewStock(String(match.stock));
        } else {
          Alert.alert("Produit introuvable", `Aucun produit trouvé pour le code :\n${barcode}`);
        }
      }
    } catch {
      Alert.alert("Erreur", "Impossible de rechercher le produit.");
    } finally {
      setIsScanSearching(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const result = await getAdminProducts({ search: search || undefined });
      setProducts(result.products ?? []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
  }, [load]);

  const handleEditStock = (product: Product) => {
    setEditingProduct(product);
    setNewStock(String(product.stock));
  };

  const handleSaveStock = async () => {
    if (!editingProduct) return;
    const stockValue = parseInt(newStock, 10);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert("Erreur", "Veuillez entrer un nombre valide.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProductStock(editingProduct.id, stockValue);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(null);
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de mettre à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const displayedProducts = filterLowStock
    ? products.filter((p) => p.stock <= 10)
    : products;

  return (
    <ScreenContainer>
      {/* Header avec bouton scanner */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Produits</Text>
          <Text style={{ fontSize: 13, color: "#9CA3AF" }}>{products.length} articles</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowScanner(true)}
          disabled={isScanSearching}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E91E7B", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
        >
          {isScanSearching ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={{ fontSize: 18 }}>⬛</Text>
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Scanner</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          <Text style={{ color: "#9CA3AF", fontSize: 16 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, SKU, code-barres..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14, color: "#1E1E1E" }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: "#9CA3AF", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtre stock faible */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => setFilterLowStock(false)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: !filterLowStock ? "#E91E7B" : "#E5E7EB",
            backgroundColor: !filterLowStock ? "#FCE4F0" : "white",
          }}
        >
          <Text style={{ color: !filterLowStock ? "#E91E7B" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
            Tous ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterLowStock(true)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: filterLowStock ? "#D97706" : "#E5E7EB",
            backgroundColor: filterLowStock ? "#FEF3C7" : "white",
          }}
        >
          <Text style={{ color: filterLowStock ? "#D97706" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
            ⚠️ Stock faible ({products.filter((p) => p.stock <= 10).length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#E91E7B" />
        </View>
      ) : (
        <FlatList
          data={displayedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E91E7B" />
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: item.stock === 0 ? "#FECACA" : item.stock <= 10 ? "#FDE68A" : "#F3F4F6",
                padding: 12,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View style={{ width: 56, height: 56, backgroundColor: "#F9FAFB", borderRadius: 10, overflow: "hidden" }}>
                {getProductImage(item) ? (
                  <Image source={{ uri: getProductImage(item)! }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 26 }}>🍬</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E1E1E" }} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.sku && (
                  <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>SKU: {item.sku}</Text>
                )}
                <View style={{ marginTop: 4 }}>
                  <StockBadge stock={item.stock} />
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleEditStock(item)}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>Stock</Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>{item.stock}</Text>
                <Text style={{ fontSize: 11, color: "#E91E7B", fontWeight: "600" }}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 40 }}>📦</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E1E1E", marginTop: 12 }}>
                Aucun produit trouvé
              </Text>
            </View>
          }
        />
      )}

      {/* Modal modification stock */}
      <Modal visible={!!editingProduct} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setEditingProduct(null)}>
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>Modifier le stock</Text>
            <TouchableOpacity onPress={() => setEditingProduct(null)}>
              <Text style={{ color: "#9CA3AF", fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20, gap: 20 }}>
            {editingProduct && getProductImage(editingProduct) && (
              <Image
                source={{ uri: getProductImage(editingProduct!)! }}
                style={{ width: "100%", height: 160, borderRadius: 14 }}
                resizeMode="cover"
              />
            )}

            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E1E1E" }}>
                {editingProduct?.name}
              </Text>
              {editingProduct?.sku && (
                <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 2 }}>SKU: {editingProduct.sku}</Text>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setNewStock((v) => String(Math.max(0, parseInt(v || "0", 10) - 1)))}
                style={{ width: 48, height: 48, backgroundColor: "#F3F4F6", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 24, color: "#1E1E1E" }}>−</Text>
              </TouchableOpacity>

              <TextInput
                value={newStock}
                onChangeText={setNewStock}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor: "#E91E7B",
                  borderRadius: 14,
                  paddingVertical: 14,
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#1E1E1E",
                  textAlign: "center",
                  backgroundColor: "#FFF0F8",
                }}
              />

              <TouchableOpacity
                onPress={() => setNewStock((v) => String(parseInt(v || "0", 10) + 1))}
                style={{ width: 48, height: 48, backgroundColor: "#FCE4F0", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 24, color: "#E91E7B" }}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#9CA3AF", fontSize: 13, textAlign: "center" }}>
              Stock actuel : {editingProduct?.stock} unités
            </Text>

            {/* Presets rapides */}
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
              {[0, 10, 25, 50, 100].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setNewStock(String(preset))}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#F3F4F6", borderRadius: 10 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSaveStock}
              disabled={isSaving}
              style={{ backgroundColor: "#E91E7B", borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal scanner plein écran */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowScanner(false)}
      >
        <BarcodeScanner
          onScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </ScreenContainer>
  );
}
