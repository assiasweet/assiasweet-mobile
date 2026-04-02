import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { getProductImage, getProductPrice, isProductHalal } from "@/lib/types";
import type { Product, Category } from "@/lib/types";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

// ─── Marques statiques avec logo emoji ───────────────────────────────────────
const BRANDS = [
  { name: "Haribo", color: "#FFF3CD", emoji: "🐻" },
  { name: "Damel", color: "#FCE4F0", emoji: "🍬" },
  { name: "Fini", color: "#E8F5E9", emoji: "🍭" },
  { name: "Dulceplus", color: "#E3F2FD", emoji: "☁️" },
  { name: "Trolli", color: "#F3E5F5", emoji: "🪱" },
  { name: "Malabar", color: "#FFF8E1", emoji: "🫧" },
  { name: "Carambar", color: "#FBE9E7", emoji: "🍫" },
  { name: "Lutti", color: "#E0F7FA", emoji: "🍡" },
];

// ─── Bannières slider ─────────────────────────────────────────────────────────
const BANNERS = [
  {
    id: "1",
    title: "Nouveautés Printemps 2026",
    subtitle: "Découvrez les nouvelles confiseries de saison",
    cta: "Voir les nouveautés",
    bg: ["#E91E7B", "#C2185B"],
    emoji: "🌸",
  },
  {
    id: "2",
    title: "Livraison 24-48h",
    subtitle: "Commandez avant 14h, expédié le jour même",
    cta: "Commander maintenant",
    bg: ["#9C27B0", "#7B1FA2"],
    emoji: "🚚",
  },
  {
    id: "3",
    title: "Retrait gratuit Roissy",
    subtitle: "Venez récupérer votre commande directement",
    cta: "En savoir plus",
    bg: ["#1565C0", "#0D47A1"],
    emoji: "📦",
  },
];

// ─── Composant Card Produit ───────────────────────────────────────────────────
function ProductCard({ item, onAdd }: { item: Product; onAdd: (p: Product) => void }) {
  const img = getProductImage(item);
  const price = getProductPrice(item);
  const halal = isProductHalal(item);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/product/${item.id}` as never)}
      activeOpacity={0.92}
    >
      {/* Image */}
      <View style={styles.cardImgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
            <Text style={{ fontSize: 40 }}>🍬</Text>
          </View>
        )}
        {/* Badge Halal */}
        {halal && (
          <View style={styles.halalBadge}>
            <Text style={styles.halalText}>Halal</Text>
          </View>
        )}
        {/* Badge Nouveau */}
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>Nouveau</Text>
          </View>
        )}
        {/* Bouton + */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={(e) => { e.stopPropagation(); onAdd(item); }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Infos */}
      <View style={styles.cardBody}>
        <Text style={styles.cardBrand} numberOfLines={1}>
          {typeof item.brand === "string" ? item.brand : item.brand?.name ?? ""}
        </Text>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardPrice}>{price.toFixed(2)} € HT</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Composant Section Header ─────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Voir tout →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const auth = useAuthStore((s) => s.auth);
  const customer = auth.status === "customer" ? auth.customer : null;
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  const [categories, setCategories] = useState<Category[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [search, setSearch] = useState("");

  const bannerRef = useRef<FlatList>(null);
  const autoSlide = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("https://assiasweet.vercel.app/api/categories").then((r) => r.json()),
        fetch("https://assiasweet.vercel.app/api/produits?limit=40").then((r) => r.json()),
      ]);

      if (catRes?.categories) setCategories(catRes.categories);

      const all: Product[] = prodRes?.products ?? prodRes?.data ?? (Array.isArray(prodRes) ? prodRes : []);
      if (all.length > 0) {
        // Best-sellers : isFeatured ou les 10 premiers
        const featured = all.filter((p) => p.isFeatured);
        setBestsellers(featured.length >= 4 ? featured.slice(0, 10) : all.slice(0, 10));
        // Nouveautés
        const news = all.filter((p) => p.isNew);
        setNewProducts(news.length >= 4 ? news.slice(0, 10) : all.slice(10, 20));
      }
    } catch {
      // Silencieux : pas de bandeau d'erreur
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-défilement bannière
  useEffect(() => {
    autoSlide.current = setInterval(() => {
      setBannerIdx((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => { if (autoSlide.current) clearInterval(autoSlide.current); };
  }, []);

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/(tabs)/catalog?q=${encodeURIComponent(search.trim())}` as never);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  const firstName = customer?.firstName ?? "vous";
  const company = customer?.companyName ?? "";

  return (
    <ScreenContainer containerClassName="bg-[#FAFAFA]" edges={["top", "left", "right"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerGreeting}>Bonjour {firstName} 👋</Text>
            {company ? (
              <Text style={styles.headerCompany}>{company}</Text>
            ) : (
              <Text style={styles.headerCompany}>AssiaSweet B2B</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/(tabs)/cart" as never)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#E91E7B" />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── BARRE DE RECHERCHE ── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un produit, une marque..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {/* ── SLIDER BANNIÈRES ── */}
        <View style={{ marginBottom: 24 }}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => b.id}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (W - 32));
              setBannerIdx(idx);
            }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item: b }) => (
              <View style={[styles.banner, { width: W - 32, backgroundColor: b.bg[0] }]}>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerEmoji}>{b.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    <Text style={styles.bannerSubtitle}>{b.subtitle}</Text>
                    <TouchableOpacity style={styles.bannerCta} activeOpacity={0.8}>
                      <Text style={[styles.bannerCtaText, { color: b.bg[0] }]}>{b.cta}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
          {/* Dots */}
          <View style={styles.dots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, i === bannerIdx && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── CATÉGORIES ── */}
        <View style={{ marginBottom: 28 }}>
          <SectionHeader
            title="Catégories"
            onSeeAll={() => router.push("/(tabs)/catalog" as never)}
          />
          {isLoading ? (
            <ActivityIndicator color="#E91E7B" style={{ marginTop: 12 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catItem}
                  onPress={() => router.push(`/(tabs)/catalog?cat=${cat.slug}` as never)}
                  activeOpacity={0.8}
                >
                  <View style={styles.catCircle}>
                    {cat.imageUrl ? (
                      <Image source={{ uri: cat.imageUrl }} style={styles.catImg} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 24 }}>🍬</Text>
                    )}
                  </View>
                  <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
              {/* Voir toutes */}
              <TouchableOpacity
                style={styles.catItem}
                onPress={() => router.push("/(tabs)/catalog" as never)}
                activeOpacity={0.8}
              >
                <View style={[styles.catCircle, { backgroundColor: "#FCE4F0" }]}>
                  <Text style={{ fontSize: 22 }}>⊞</Text>
                </View>
                <Text style={styles.catName}>Toutes{"\n"}les catégories</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ── BEST-SELLERS ── */}
        {bestsellers.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="Les plus commandés"
              onSeeAll={() => router.push("/(tabs)/catalog" as never)}
            />
            <FlatList
              data={bestsellers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View style={{ width: CARD_W }}>
                  <ProductCard item={item} onAdd={handleAddToCart} />
                </View>
              )}
            />
          </View>
        )}

        {/* ── MARQUES ── */}
        <View style={{ marginBottom: 28 }}>
          <SectionHeader title="Nos marques" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {BRANDS.map((b) => (
              <TouchableOpacity
                key={b.name}
                style={styles.catItem}
                onPress={() => router.push(`/(tabs)/catalog?brand=${encodeURIComponent(b.name)}` as never)}
                activeOpacity={0.8}
              >
                <View style={[styles.catCircle, { backgroundColor: b.color }]}>
                  <Text style={{ fontSize: 26 }}>{b.emoji}</Text>
                </View>
                <Text style={styles.catName}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── NOUVEAUTÉS ── */}
        {newProducts.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="Nouveautés"
              onSeeAll={() => router.push("/(tabs)/catalog?filter=new" as never)}
            />
            <FlatList
              data={newProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View style={{ width: CARD_W }}>
                  <ProductCard item={item} onAdd={handleAddToCart} />
                </View>
              )}
            />
          </View>
        )}

        {/* Loader initial */}
        {isLoading && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#E91E7B" />
            <Text style={{ color: "#9CA3AF", marginTop: 12, fontSize: 14 }}>Chargement du catalogue…</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 40, height: 40, borderRadius: 10 },
  headerGreeting: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  headerCompany: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  headerBadge: {
    position: "absolute", top: -2, right: -2,
    backgroundColor: "#E91E7B", borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#fff",
  },
  headerBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  // Recherche
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14, paddingHorizontal: 14,
    height: 48,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#1E1E1E" },

  // Bannière
  banner: {
    borderRadius: 16, overflow: "hidden",
    paddingHorizontal: 20, paddingVertical: 20,
    minHeight: 130,
    justifyContent: "center",
  },
  bannerContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  bannerEmoji: { fontSize: 48 },
  bannerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", lineHeight: 22 },
  bannerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4, lineHeight: 18 },
  bannerCta: {
    marginTop: 10, backgroundColor: "#fff",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: "flex-start",
  },
  bannerCtaText: { fontSize: 12, fontWeight: "700" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D1D5DB" },
  dotActive: { width: 18, backgroundColor: "#E91E7B" },

  // Section header
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1E1E1E" },
  seeAll: { fontSize: 13, fontWeight: "600", color: "#E91E7B" },

  // Catégories
  catScroll: { paddingHorizontal: 16, gap: 12 },
  catItem: { alignItems: "center", width: 72 },
  catCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  catImg: { width: 60, height: 60 },
  catName: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", marginTop: 6, lineHeight: 14 },

  // Card produit
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImgWrap: { position: "relative", width: "100%", aspectRatio: 1 },
  cardImg: { width: "100%", height: "100%" },
  cardImgPlaceholder: { backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  halalBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#27AE60", borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  halalText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  newBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "#2563EB", borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  newText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  addBtn: {
    position: "absolute", bottom: 8, right: 8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#E91E7B",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#E91E7B", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  addBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 24 },
  cardBody: { padding: 10 },
  cardBrand: { fontSize: 11, color: "#9CA3AF", fontWeight: "500", marginBottom: 2 },
  cardName: { fontSize: 13, fontWeight: "700", color: "#1E1E1E", lineHeight: 18, marginBottom: 4 },
  cardPrice: { fontSize: 15, fontWeight: "800", color: "#E91E7B" },
});
