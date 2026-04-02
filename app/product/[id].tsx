import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getProduct, getProducts } from "@/lib/api";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const nav = router as unknown as { push: (path: string) => void; back: () => void };

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "ingredients" | "nutrition">("description");

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getProduct(id)
      .then(async (p) => {
        setProduct(p);
        if (p.category?.id) {
          const sim = await getProducts({ category: p.category.id, limit: 6 }).catch(() => ({ products: DEMO_PRODUCTS.filter(d => d.category?.id === p.category?.id), total: 0, page: 1, totalPages: 1 }));
          setSimilar(sim.products.filter((s) => s.id !== p.id).slice(0, 5));
        }
      })
      .catch(() => {
        // Fallback démo : chercher le produit dans les données démo
        const demoProduct = DEMO_PRODUCTS.find((p) => p.id === id) || DEMO_PRODUCTS[0];
        setProduct(demoProduct);
        setSimilar(DEMO_PRODUCTS.filter((p) => p.id !== demoProduct.id).slice(0, 4));
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    Alert.alert(
      "Ajouté au panier ✓",
      `${quantity}x ${product.name} ajouté(s) au panier.`,
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color="#E91E7B" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <Text style={{ color: "#6B7280" }}>Produit introuvable</Text>
      </View>
    );
  }

  const priceTTC = product.price * (1 + product.tva / 100);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galerie images */}
        <View style={{ height: 300, backgroundColor: "#F9FAFB" }}>
          {product.images && product.images.length > 0 ? (
            <>
              <FlatList
                data={product.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImage(index);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: SCREEN_WIDTH, height: 300 }}
                    resizeMode="contain"
                  />
                )}
              />
              {product.images.length > 1 && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {product.images.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === currentImage ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === currentImage ? "#E91E7B" : "rgba(0,0,0,0.2)",
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 80 }}>🍬</Text>
            </View>
          )}
        </View>

        {/* Badges */}
        <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 16, flexWrap: "wrap" }}>
          {product.isHalal && (
            <View style={{ backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#16A34A", fontSize: 12, fontWeight: "700" }}>✓ HALAL</Text>
            </View>
          )}
          {product.isVegan && (
            <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#065F46", fontSize: 12, fontWeight: "700" }}>🌱 VEGAN</Text>
            </View>
          )}
          {product.isSugarFree && (
            <View style={{ backgroundColor: "#E0F2FE", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#0369A1", fontSize: 12, fontWeight: "700" }}>SANS SUCRE</Text>
            </View>
          )}
          {product.isNew && (
            <View style={{ backgroundColor: "#DBEAFE", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#2563EB", fontSize: 12, fontWeight: "700" }}>NOUVEAU</Text>
            </View>
          )}
          {product.isPromo && (
            <View style={{ backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#D97706", fontSize: 12, fontWeight: "700" }}>PROMO</Text>
            </View>
          )}
        </View>

        {/* Infos produit */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {product.brand && (
            <Text style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 4 }}>
              {product.brand.name}
            </Text>
          )}
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E", lineHeight: 28 }}>
            {product.name}
          </Text>

          {product.sku && (
            <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
              Réf: {product.sku} {product.barcode ? `· EAN: ${product.barcode}` : ""}
            </Text>
          )}

          {/* Prix */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 12,
              marginTop: 16,
              padding: 16,
              backgroundColor: "#FCE4F0",
              borderRadius: 14,
            }}
          >
            <View>
              <Text style={{ color: "#E91E7B", fontSize: 28, fontWeight: "800" }}>
                {product.price.toFixed(2)} €
              </Text>
              <Text style={{ color: "#E91E7B", fontSize: 13, fontWeight: "600" }}>
                HT (TVA {product.tva}%)
              </Text>
            </View>
            <View>
              <Text style={{ color: "#6B7280", fontSize: 18, fontWeight: "600" }}>
                {priceTTC.toFixed(2)} €
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>TTC</Text>
            </View>
          </View>

          {/* Stock */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: product.stock > 0 ? "#22C55E" : "#EF4444",
              }}
            />
            <Text style={{ color: product.stock > 0 ? "#16A34A" : "#DC2626", fontSize: 13, fontWeight: "600" }}>
              {product.stock > 0 ? `En stock (${product.stock} unités)` : "Rupture de stock"}
            </Text>
          </View>
        </View>

        {/* Onglets description */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 16 }}>
            {(["description", "ingredients", "nutrition"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: activeTab === tab ? "white" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: activeTab === tab ? "#1E1E1E" : "#9CA3AF",
                  }}
                >
                  {tab === "description" ? "Description" : tab === "ingredients" ? "Ingrédients" : "Nutrition"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: "#6B7280", fontSize: 14, lineHeight: 22 }}>
            {activeTab === "description"
              ? product.description || "Aucune description disponible."
              : activeTab === "ingredients"
              ? "Informations sur les ingrédients non disponibles."
              : `TVA applicable : ${product.tva}%\nPoids : ${product.weight ? `${product.weight}g` : "Non renseigné"}`}
          </Text>
        </View>

        {/* Produits similaires */}
        {similar.length > 0 && (
          <View style={{ marginTop: 24, marginBottom: 120 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E", paddingHorizontal: 16, marginBottom: 12 }}>
              Produits similaires
            </Text>
            <FlatList
              data={similar}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => nav.push(`/product/${item.id}`)}
                  style={{
                    width: 140,
                    backgroundColor: "white",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ height: 100, backgroundColor: "#F9FAFB" }}>
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 30 }}>🍬</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ padding: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#1E1E1E" }} numberOfLines={2}>{item.name}</Text>
                    <Text style={{ color: "#E91E7B", fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                      {item.price.toFixed(2)} € HT
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </ScrollView>

      {/* Barre d'ajout au panier fixe */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          padding: 16,
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Sélecteur quantité */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{ width: 40, height: 48, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
          >
            <Text style={{ fontSize: 20, color: "#1E1E1E", fontWeight: "600" }}>−</Text>
          </TouchableOpacity>
          <Text style={{ width: 40, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#1E1E1E" }}>
            {quantity}
          </Text>
          <TouchableOpacity
            onPress={() => setQuantity((q) => q + 1)}
            style={{ width: 40, height: 48, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
          >
            <Text style={{ fontSize: 20, color: "#E91E7B", fontWeight: "600" }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton ajouter */}
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={product.stock === 0}
          style={{
            flex: 1,
            backgroundColor: product.stock > 0 ? "#E91E7B" : "#9CA3AF",
            borderRadius: 14,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
            {product.stock > 0
              ? `Ajouter au panier — ${(product.price * quantity).toFixed(2)} € HT`
              : "Rupture de stock"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
