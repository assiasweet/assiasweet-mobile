import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { getProducts, getCategories, getSliders } from "@/lib/api";
import { DEMO_PRODUCTS, DEMO_CATEGORIES, DEMO_SLIDERS } from "@/lib/demo-data";
import type { Product, Category, Slider } from "@/lib/types";

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);

  const loadData = async () => {
    try {
      // Load categories
      const catResp = await getCategories();
      const cats = catResp.categories ?? [];
      setCategories(cats.length > 0 ? cats : DEMO_CATEGORIES);

      // Load sliders
      try {
        const sliderResp = await getSliders();
        const sl = sliderResp.sliders ?? [];
        setSliders(sl.length > 0 ? sl : DEMO_SLIDERS);
      } catch {
        setSliders(DEMO_SLIDERS);
      }

      // Load products
      const prodResp = await getProducts({ page: 1, limit: 20 });
      const prods = prodResp.products ?? [];
      const t = prodResp.total ?? prods.length;
      if (prods.length > 0) {
        setProducts(prods);
        setFiltered(prods);
        setTotal(t);
        setIsDemo(false);
      } else {
        setProducts(DEMO_PRODUCTS);
        setFiltered(DEMO_PRODUCTS);
        setTotal(DEMO_PRODUCTS.length);
        setIsDemo(true);
      }
    } catch {
      // Fallback to demo data (e.g. CORS on web preview)
      setCategories(DEMO_CATEGORIES);
      setSliders(DEMO_SLIDERS);
      setProducts(DEMO_PRODUCTS);
      setFiltered(DEMO_PRODUCTS);
      setTotal(DEMO_PRODUCTS.length);
      setIsDemo(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (selectedCat) {
      result = result.filter((p) => p.category?.id === selectedCat || p.category?.name === selectedCat);
    }
    setFiltered(result);
  }, [search, selectedCat, products]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/product/${item.id}` as never)}
      activeOpacity={0.8}
    >
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ fontSize: 36 }}>🍬</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        {item.brand && <Text style={styles.brand}>{item.brand.name}</Text>}
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>{item.price?.toFixed(2)} € HT</Text>
        <View style={styles.badges}>
          {item.isHalal && <Text style={[styles.badge, { backgroundColor: "#22C55E" }]}>Halal</Text>}
          {item.isNew && <Text style={[styles.badge, { backgroundColor: "#E91E7B" }]}>Nouveau</Text>}
          {item.isPromo && <Text style={[styles.badge, { backgroundColor: "#F59E0B" }]}>Promo</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>AssiaSweet</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/(auth)/login" as never)}
        >
          <Text style={styles.loginBtnText}>Connexion</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Demo banner */}
      {isDemo && !loading && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            Mode aperçu — données de démonstration (API disponible sur mobile natif)
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E91E7B" />
          <Text style={styles.loadingText}>Chargement du catalogue...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E91E7B" />
          }
          ListHeaderComponent={
            <>
              {/* Sliders */}
              {sliders.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sliderScroll}
                  contentContainerStyle={styles.sliderContent}
                >
                  {sliders.map((s) => (
                    <View key={s.id} style={styles.sliderCard}>
                      <Image source={{ uri: s.image_url }} style={styles.sliderImage} resizeMode="cover" />
                      <View style={styles.sliderOverlay}>
                        <Text style={styles.sliderTitle}>{s.title}</Text>
                        {s.subtitle && <Text style={styles.sliderSub}>{s.subtitle}</Text>}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Categories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={styles.catContent}
              >
                <TouchableOpacity
                  style={[styles.catChip, !selectedCat && styles.catChipActive]}
                  onPress={() => setSelectedCat(null)}
                >
                  <Text style={[styles.catChipText, !selectedCat && styles.catChipTextActive]}>Tous</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
                    onPress={() => setSelectedCat(cat.id)}
                  >
                    <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Stats */}
              <Text style={styles.stats}>
                {filtered.length} produit{filtered.length > 1 ? "s" : ""} sur {total} au total
              </Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#687076", fontSize: 15 }}>Aucun produit trouvé</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#E91E7B",
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  loginBtn: {
    borderWidth: 1.5,
    borderColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    color: "#11181C",
  },
  demoBanner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  demoBannerText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
  },
  sliderScroll: {
    marginBottom: 12,
  },
  sliderContent: {
    paddingHorizontal: 8,
    gap: 10,
  },
  sliderCard: {
    width: 280,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  sliderImage: {
    width: "100%",
    height: "100%",
  },
  sliderOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 12,
  },
  sliderTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  sliderSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  catScroll: {
    marginBottom: 4,
  },
  catContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E91E7B",
    backgroundColor: "#fff",
  },
  catChipActive: {
    backgroundColor: "#E91E7B",
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E91E7B",
  },
  catChipTextActive: {
    color: "#fff",
  },
  stats: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontSize: 12,
    color: "#687076",
  },
  list: {
    padding: 8,
    paddingBottom: 100,
  },
  row2: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f9f9f9",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    padding: 10,
    gap: 3,
  },
  brand: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#11181C",
    lineHeight: 18,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E91E7B",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: "#687076",
    fontSize: 14,
  },
});
