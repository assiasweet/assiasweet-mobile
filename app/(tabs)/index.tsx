import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthStore } from "@/store/auth";
import { getSliders, getCategories, getProducts } from "@/lib/api";
import type { Slider, Category, Product } from "@/lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_HEIGHT = 200;

const nav = router as unknown as {
  push: (path: string, params?: object) => void;
  replace: (path: string) => void;
};

function SliderBanner({ sliders }: { sliders: Slider[] }) {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      const next = (current + 1) % sliders.length;
      setCurrent(next);
      flatRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4000);
    return () => clearInterval(timer);
  }, [current, sliders.length]);

  if (!sliders.length) {
    return (
      <View
        style={{
          height: SLIDER_HEIGHT,
          backgroundColor: "#FCE4F0",
          alignItems: "center",
          justifyContent: "center",
          marginHorizontal: 16,
          borderRadius: 16,
        }}
      >
        <Text style={{ color: "#E91E7B", fontSize: 18, fontWeight: "700" }}>
          🍬 Bienvenue sur AssiaSweet
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 4 }}>
          Grossiste B2B en confiseries
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginHorizontal: 16 }}>
      <FlatList
        ref={flatRef}
        data={sliders}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrent(index);
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width: SCREEN_WIDTH - 32,
              height: SLIDER_HEIGHT,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#FCE4F0",
            }}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : null}
            {(item.title || item.subtitle) && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                  backgroundColor: "rgba(0,0,0,0.4)",
                }}
              >
                {item.title && (
                  <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
                    {item.title}
                  </Text>
                )}
                {item.subtitle && (
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      />
      {sliders.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8, gap: 6 }}>
          {sliders.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === current ? "#E91E7B" : "#E5E7EB",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <TouchableOpacity
      onPress={() => nav.push(`/product/${product.id}`)}
      style={{
        width: 160,
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ height: 130, backgroundColor: "#F9FAFB", position: "relative" }}>
        {product.images?.[0] ? (
          <Image
            source={{ uri: product.images[0] }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 40 }}>🍬</Text>
          </View>
        )}
        <View style={{ position: "absolute", top: 6, left: 6, flexDirection: "row", gap: 4 }}>
          {product.isHalal && (
            <View style={{ backgroundColor: "#22C55E", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>HALAL</Text>
            </View>
          )}
          {product.isNew && (
            <View style={{ backgroundColor: "#3B82F6", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>NOUVEAU</Text>
            </View>
          )}
          {product.isPromo && (
            <View style={{ backgroundColor: "#F59E0B", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>PROMO</Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ padding: 10 }}>
        {product.brand && (
          <Text style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 2 }} numberOfLines={1}>
            {product.brand.name}
          </Text>
        )}
        <Text style={{ color: "#1E1E1E", fontSize: 13, fontWeight: "600", lineHeight: 18 }} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={{ color: "#E91E7B", fontSize: 15, fontWeight: "800", marginTop: 6 }}>
          {product.price.toFixed(2)} € HT
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <TouchableOpacity
      onPress={() => nav.push("/(tabs)/catalog", { categoryId: category.id })}
      style={{
        width: 90,
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 20,
          backgroundColor: "#FCE4F0",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {category.image ? (
          <Image
            source={{ uri: category.image }}
            style={{ width: 50, height: 50 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 28 }}>🍭</Text>
        )}
      </View>
      <Text
        style={{
          fontSize: 11,
          color: "#1E1E1E",
          fontWeight: "600",
          textAlign: "center",
          lineHeight: 14,
        }}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ color: "#E91E7B", fontSize: 14, fontWeight: "600" }}>Voir tout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const auth = useAuthStore((s) => s.auth);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const customerName =
    auth.status === "customer" ? auth.customer.firstName : "";

  const loadData = async () => {
    try {
      const [slidersData, categoriesData, bestData, newData, promoData] =
        await Promise.all([
          getSliders().catch(() => []),
          getCategories().catch(() => []),
          getProducts({ limit: 10, sort: "name_asc" }).catch(() => ({ products: [] })),
          getProducts({ new: true, limit: 10 }).catch(() => ({ products: [] })),
          getProducts({ promo: true, limit: 10 }).catch(() => ({ products: [] })),
        ]);

      setSliders(slidersData);
      setCategories(categoriesData.filter((c) => c.isActive).slice(0, 12));
      setBestSellers(bestData.products.slice(0, 10));
      setNewProducts(newData.products.slice(0, 10));
      setPromoProducts(promoData.products.slice(0, 10));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    if (search.trim()) {
      nav.push("/(tabs)/catalog", { search: search.trim() });
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#E91E7B" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E91E7B" />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ fontSize: 13, color: "#9CA3AF" }}>Bonjour{customerName ? ` ${customerName}` : ""} 👋</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E", marginTop: 2 }}>
            AssiaSweet
          </Text>
        </View>

        {/* Barre de recherche */}
        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18, color: "#9CA3AF" }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un produit, une marque..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              style={{ flex: 1, fontSize: 15, color: "#1E1E1E" }}
            />
          </View>
        </View>

        {/* Sliders */}
        <View style={{ marginBottom: 24 }}>
          <SliderBanner sliders={sliders} />
        </View>

        {/* Catégories */}
        {categories.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="Catégories"
              onSeeAll={() => nav.push("/(tabs)/catalog")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Best-sellers */}
        {bestSellers.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="⭐ Best-sellers"
              onSeeAll={() => nav.push("/(tabs)/catalog")}
            />
            <FlatList
              data={bestSellers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <ProductCard product={item} />}
            />
          </View>
        )}

        {/* Nouveautés */}
        {newProducts.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="🆕 Nouveautés"
              onSeeAll={() => nav.push("/(tabs)/catalog", { filter: "new" })}
            />
            <FlatList
              data={newProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <ProductCard product={item} />}
            />
          </View>
        )}

        {/* Promotions */}
        {promoProducts.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="🏷️ Promotions"
              onSeeAll={() => nav.push("/(tabs)/catalog", { filter: "promo" })}
            />
            <FlatList
              data={promoProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <ProductCard product={item} />}
            />
          </View>
        )}

        {/* Footer info */}
        <View
          style={{
            margin: 16,
            padding: 16,
            backgroundColor: "#FCE4F0",
            borderRadius: 16,
            marginBottom: 32,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#E91E7B", marginBottom: 4 }}>
            📦 Commande minimum : 100€ HT
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280" }}>
            Livraison GLS 24-48h · Retrait à Roissy-en-France
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
