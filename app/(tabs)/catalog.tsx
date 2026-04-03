import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getProducts, getCategories } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import type { Product, Category, ProductFilters } from "@/lib/types";
import { getProductImage, getProductPrice, getProductBrand, isProductHalal } from "@/lib/types";

const nav = router as unknown as { push: (path: string) => void };

function ProductListCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <TouchableOpacity
      onPress={() => nav.push(`/product/${product.id}`)}
      style={{
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        overflow: "hidden",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View style={{ width: 100, height: 100, backgroundColor: "#F9FAFB" }}>
        {getProductImage(product) ? (
          <Image
            source={{ uri: getProductImage(product) }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 36 }}>🍬</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 12, justifyContent: "space-between" }}>
        <View>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
            {isProductHalal(product) && (
              <View style={{ backgroundColor: "#DCFCE7", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ color: "#16A34A", fontSize: 9, fontWeight: "700" }}>HALAL</Text>
              </View>
            )}
            {product.isNew && (
              <View style={{ backgroundColor: "#DBEAFE", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ color: "#2563EB", fontSize: 9, fontWeight: "700" }}>NOUVEAU</Text>
              </View>
            )}
            {(product.isPromo || (product.discount && product.discount > 0)) && (
              <View style={{ backgroundColor: "#FEF3C7", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ color: "#D97706", fontSize: 9, fontWeight: "700" }}>PROMO</Text>
              </View>
            )}
          </View>
          {getProductBrand(product) && (
            <Text style={{ color: "#9CA3AF", fontSize: 11 }} numberOfLines={1}>
              {getProductBrand(product)}
            </Text>
          )}
          <Text style={{ color: "#1E1E1E", fontSize: 14, fontWeight: "600", lineHeight: 19 }} numberOfLines={2}>
            {product.name}
          </Text>
          {product.sku && (
            <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 2 }}>
              Réf: {product.sku}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <View>
            <Text style={{ color: "#E91E7B", fontSize: 16, fontWeight: "800" }}>
              {getProductPrice(product).toFixed(2)} € HT
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 11 }}>
              {(getProductPrice(product) * (1 + (product.tva ?? 5.5) / 100)).toFixed(2)} € TTC
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              addItem(product, 1);
            }}
            style={{
              backgroundColor: "#E91E7B",
              borderRadius: 10,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 22, fontWeight: "700", lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; search?: string; filter?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filtres
  const [search, setSearch] = useState(params.search || "");
  const [selectedCategory, setSelectedCategory] = useState(params.categoryId || "");
  const [filterHalal, setFilterHalal] = useState(false);
  const [filterNew, setFilterNew] = useState(params.filter === "new");
  const [filterPromo, setFilterPromo] = useState(params.filter === "promo");
  const [sortBy, setSortBy] = useState<"" | "price_asc" | "price_desc" | "name_asc">("");

  const buildFilters = (): ProductFilters => ({
    search: search || undefined,
    category: selectedCategory || undefined,
    halal: filterHalal || undefined,
    new: filterNew || undefined,
    promo: filterPromo || undefined,
    sort: sortBy || undefined,
    page: 1,
    limit: 20,
  });

  const loadProducts = useCallback(async (reset = true) => {
    if (reset) {
      setIsLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const currentPage = reset ? 1 : page + 1;
      const filters = { ...buildFilters(), page: currentPage };
      const result = await getProducts(filters);
      if (reset) {
        setProducts(result.products);
      } else {
        setProducts((prev) => [...prev, ...result.products]);
        setPage(currentPage);
      }
      setTotalPages(result.totalPages || 1);
    } catch {
      if (reset) setProducts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, selectedCategory, filterHalal, filterNew, filterPromo, sortBy, page]);

  useEffect(() => {
    getCategories()
      .then((resp) => {
        // L'API retourne { categories: [...] }
        const cats = resp.categories ?? (Array.isArray(resp) ? resp : []);
        const active = cats.filter((c) => c.isActive !== false);
        setCategories(active);
      })
      .catch(() => setCategories([]));
    loadProducts(true);
  }, []);

  const handleSearch = () => loadProducts(true);
  const handleRefresh = () => { setRefreshing(true); loadProducts(true); };
  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) loadProducts(false);
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadProducts(true);
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setFilterHalal(false);
    setFilterNew(false);
    setFilterPromo(false);
    setSortBy("");
  };

  const activeFiltersCount = [
    selectedCategory,
    filterHalal,
    filterNew,
    filterPromo,
    sortBy,
  ].filter(Boolean).length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Catalogue</Text>
      </View>

      {/* Barre de recherche + filtres */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", gap: 10 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 16 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            style={{ flex: 1, fontSize: 15, color: "#1E1E1E" }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); loadProducts(true); }}>
              <Text style={{ color: "#9CA3AF", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={{
            backgroundColor: activeFiltersCount > 0 ? "#E91E7B" : "#F3F4F6",
            borderRadius: 12,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Icône filtre */}
          <View style={{ gap: 3, alignItems: "center" }}>
            <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: activeFiltersCount > 0 ? "#fff" : "#E91E7B" }} />
            <View style={{ width: 13, height: 2, borderRadius: 1, backgroundColor: activeFiltersCount > 0 ? "#fff" : "#E91E7B" }} />
            <View style={{ width: 8, height: 2, borderRadius: 1, backgroundColor: activeFiltersCount > 0 ? "#fff" : "#E91E7B" }} />
          </View>
          {activeFiltersCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "white",
                borderRadius: 8,
                width: 16,
                height: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E91E7B",
              }}
            >
              <Text style={{ color: "#E91E7B", fontSize: 9, fontWeight: "700" }}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste produits */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#E91E7B" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => <ProductListCard product={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E91E7B" />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#E91E7B" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ color: "#1E1E1E", fontSize: 16, fontWeight: "600", marginTop: 12 }}>
                Aucun produit trouvé
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 4 }}>
                Essayez d'autres termes de recherche
              </Text>
            </View>
          }
        />
      )}

      {/* Modal filtres */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>Filtres</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={{ color: "#9CA3AF", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
            {/* Catégories */}
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1E1E", marginBottom: 10 }}>
                Catégorie
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory("")}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: !selectedCategory ? "#E91E7B" : "#E5E7EB",
                    backgroundColor: !selectedCategory ? "#FCE4F0" : "white",
                  }}
                >
                  <Text style={{ color: !selectedCategory ? "#E91E7B" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: selectedCategory === cat.id ? "#E91E7B" : "#E5E7EB",
                      backgroundColor: selectedCategory === cat.id ? "#FCE4F0" : "white",
                    }}
                  >
                    <Text style={{ color: selectedCategory === cat.id ? "#E91E7B" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Caractéristiques */}
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1E1E", marginBottom: 10 }}>
                Caractéristiques
              </Text>
              {[
                { label: "🟢 Halal uniquement", value: filterHalal, set: setFilterHalal },
                { label: "🆕 Nouveautés", value: filterNew, set: setFilterNew },
                { label: "🏷️ Promotions", value: filterPromo, set: setFilterPromo },
              ].map(({ label, value, set }) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => set(!value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F9FAFB",
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#1E1E1E" }}>{label}</Text>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: value ? "#E91E7B" : "#E5E7EB",
                      backgroundColor: value ? "#E91E7B" : "white",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {value && <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tri */}
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1E1E", marginBottom: 10 }}>
                Trier par
              </Text>
              {[
                { label: "Pertinence", value: "" },
                { label: "Prix croissant", value: "price_asc" },
                { label: "Prix décroissant", value: "price_desc" },
                { label: "Nom A-Z", value: "name_asc" },
              ].map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setSortBy(value as typeof sortBy)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F9FAFB",
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#1E1E1E" }}>{label}</Text>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: sortBy === value ? "#E91E7B" : "#E5E7EB",
                      backgroundColor: sortBy === value ? "#E91E7B" : "white",
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ padding: 16, flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={resetFilters}
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: "#E5E7EB",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#6B7280", fontWeight: "600" }}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyFilters}
              style={{
                flex: 2,
                backgroundColor: "#E91E7B",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                Appliquer les filtres
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
