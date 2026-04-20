import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { getProductImage, getProductPrice } from "@/lib/types";
import type { Product, Category } from "@/lib/types";

const { width: W } = Dimensions.get("window");

// ─── Constantes de design ────────────────────────────────────────────────────
const PINK = "#E91E7B";
const PURPLE = "#9C27B0";
const H_PAD = 16;

// ─── Marques statiques ───────────────────────────────────────────────────────
const BRANDS = [
  { name: "Haribo", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/vMuufDhOVPBalpKm.png" },
  { name: "Damel", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/iqKIxdeIUgsvkUvi.png" },
  { name: "Fini", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/DvdvUlBvCLLSCrDA.png" },
  { name: "Chupa Chups", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/djeWwovMSskIMIIm.png" },
  { name: "Mentos", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/YaTOjNWakinjHOpY.png" },
  { name: "Malabar", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/UMqwlaTTZHIJnhBt.png" },
  { name: "Hollywood", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/KoUFYhsLCadKdGjS.png" },
  { name: "Astra", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/lyYNLzJkriREnfdp.png" },
  { name: "Trolli", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/WSsPGYeqoPLKRJwb.png" },
  { name: "Hitschler", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/AsYbosVNaTfQNilh.png" },
  { name: "Carambar", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/PhkHlUXiBIIdrNhH.png" },
  { name: "Cerdán", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/vZZkqpLTQbrZIybM.png" },
  { name: "Dulceplus", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/UdtoJzPMdSeHvacc.png" },
  { name: "Têtes Brûlées", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/mTMKbjzHrIxzrdUv.png" },
  { name: "Josfrit", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/LctbMVlaNXojYbzr.png" },
  { name: "King Regal", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/KkMvNqyMwAnBdLwV.png" },
  { name: "Zed", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/tAZaPXEWqXDkTJGj.png" },
  { name: "Johnny's", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/LcBPrdMRfbZjeiZb.png" },
  { name: "Nom", logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/qkWGvqtFwtWjZVhy.png" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type Fete = {
  id: string;
  titre: string;
  emoji: string;
  dateLabel: string;
  image: string;
  isFeatured: boolean;
  actif: boolean;
  ordre: number;
};

type Slider = {
  id: number | string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  image_url?: string;
};

// ─── Composant : En-tête de section ─────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.seeAll}>Voir tout ›</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Composant : Carte produit horizontale ───────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const img = getProductImage(product);
  const price = getProductPrice(product);
  return (
    <Pressable
      style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/(tabs)/product/${product.id}` as never)}
    >
      <Image
        source={{ uri: img }}
        style={styles.productImg}
        contentFit="cover"
        transition={200}
      />
      {product.isNew && (
        <View style={styles.badgeNew}>
          <Text style={styles.badgeText}>Nouveau</Text>
        </View>
      )}
      {product.isPromo && (
        <View style={styles.badgePromo}>
          <Text style={styles.badgeText}>Promo</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {price !== null && (
          <Text style={styles.productPrice}>{price.toFixed(2)} € HT</Text>
        )}
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.75 }]}
          onPress={() => onAdd(product)}
        >
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Composant : Carte fête/occasion ─────────────────────────────────────────
function FeteCard({ fete }: { fete: Fete }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.feteCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/(tabs)/catalog?fete=${encodeURIComponent(fete.titre)}` as never)}
    >
      <Image
        source={{ uri: fete.image }}
        style={styles.feteImg}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.feteOverlay}>
        <Text style={styles.feteEmoji}>{fete.emoji}</Text>
        <Text style={styles.feteTitre} numberOfLines={2}>{fete.titre}</Text>
        {fete.dateLabel ? (
          <Text style={styles.feteDate}>{fete.dateLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Composant : Carte catégorie ─────────────────────────────────────────────
function CategoryCard({ cat }: { cat: Category & { imageUrl?: string } }) {
  const CATEGORY_ICONS: Record<string, string> = {
    "bonbon-en-vrac": "https://www.assiasweet.pro/bonbon_en_vrac.png",
    "sucettes": "https://www.assiasweet.pro/sucettes.png",
    "chewing-gum": "https://www.assiasweet.pro/chewing_gum.png",
    "jumbos-ceintures": "https://www.assiasweet.pro/jumbos_et_ceintures.png",
    "snacking": "https://www.assiasweet.pro/snacking.png",
    "gadgets-sprays": "https://www.assiasweet.pro/gadjets.png",
    "tubos-presentoirs": "https://www.assiasweet.pro/presentoirs.png",
    "destockage": "https://www.assiasweet.pro/destock.png",
    "promotions": "https://www.assiasweet.pro/destock.png",
  };
  const img = cat.imageUrl ?? CATEGORY_ICONS[cat.slug] ?? null;
  return (
    <Pressable
      style={({ pressed }) => [styles.catCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/(tabs)/catalog?category=${cat.id}` as never)}
    >
      {img ? (
        <Image source={{ uri: img }} style={styles.catImg} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.catImg, { backgroundColor: "#F3E5F5", alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ fontSize: 32 }}>🍬</Text>
        </View>
      )}
      <View style={styles.catOverlay}>
        <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
      </View>
    </Pressable>
  );
}

// ─── Composant : Bannière slider ─────────────────────────────────────────────
function SliderCard({ slider, width }: { slider: Slider; width: number }) {
  return (
    <Pressable
      style={[styles.sliderCard, { width }]}
      onPress={() => router.push("/(tabs)/catalog" as never)}
    >
      {slider.image_url ? (
        <Image
          source={{ uri: slider.image_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PINK }]} />
      )}
      <View style={styles.sliderGradient}>
        {slider.title ? (
          <Text style={styles.sliderTitle} numberOfLines={2}>{slider.title}</Text>
        ) : null}
        {slider.subtitle ? (
          <Text style={styles.sliderSubtitle} numberOfLines={2}>{slider.subtitle}</Text>
        ) : null}
        <View style={styles.sliderCta}>
          <Text style={styles.sliderCtaText}>{slider.cta_text ?? "Découvrir"} →</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const auth = useAuthStore((s) => s.auth);
  const customer = auth.status === "customer" ? auth.customer : null;
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [youLikeProducts, setYouLikeProducts] = useState<Product[]>([]);
  const [fetes, setFetes] = useState<Fete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sliderIdx, setSliderIdx] = useState(0);
  const sliderRef = useRef<FlatList>(null);
  const autoSlide = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Phase 1 : données prioritaires
      const [slidersRes, catRes] = await Promise.all([
        fetch("https://www.assiasweet.pro/api/sliders/generate").then((r) => r.json()).catch(() => ({ sliders: [] })),
        fetch("https://www.assiasweet.pro/api/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
      ]);
      if (catRes?.categories) setCategories(catRes.categories);
      const rawSliders: Slider[] = slidersRes?.sliders ?? [];
      setSliders(rawSliders);
      setIsLoading(false);

      // Phase 2 : données secondaires
      const [prodRes, featuredRes, fetesRes] = await Promise.all([
        fetch("https://www.assiasweet.pro/api/produits?limit=20").then((r) => r.json()).catch(() => ({})),
        fetch("https://www.assiasweet.pro/api/produits?featured=true&limit=10").then((r) => r.json()).catch(() => ({})),
        fetch("https://www.assiasweet.pro/api/fetes").then((r) => r.json()).catch(() => ({ fetes: [] })),
      ]);
      const all: Product[] = prodRes?.products ?? prodRes?.data ?? (Array.isArray(prodRes) ? prodRes : []);
      if (all.length > 0) {
        const featured = all.filter((p) => p.isFeatured);
        setBestsellers(featured.length >= 4 ? featured.slice(0, 10) : all.slice(0, 10));
        const news = all.filter((p) => p.isNew);
        setNewProducts(news.length >= 4 ? news.slice(0, 10) : all.slice(10, 20));
      }
      const featuredAll: Product[] = featuredRes?.products ?? featuredRes?.data ?? (Array.isArray(featuredRes) ? featuredRes : []);
      setYouLikeProducts(featuredAll.filter((p) => p.image && p.priceHT).slice(0, 10));
      const rawFetes: Fete[] = fetesRes?.fetes ?? [];
      setFetes(rawFetes.filter((f) => f.actif).sort((a, b) => a.ordre - b.ordre));
    } catch {
      setIsLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-défilement bannière
  useEffect(() => {
    if (sliders.length === 0) return;
    autoSlide.current = setInterval(() => {
      setSliderIdx((prev) => {
        const next = (prev + 1) % sliders.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => { if (autoSlide.current) clearInterval(autoSlide.current); };
  }, [sliders.length]);

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  const SLIDER_W = W - H_PAD * 2;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/assiasweet-logo.png")}
          style={styles.headerLogo}
          contentFit="contain"
        />
        <Pressable
          style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/(tabs)/cart" as never)}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Barre de recherche ─────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push("/(tabs)/catalog" as never)}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              if (search.trim()) router.push(`/(tabs)/catalog?q=${encodeURIComponent(search.trim())}` as never);
            }}
            returnKeyType="search"
          />
        </Pressable>
      </View>

      {/* ── Contenu scrollable ─────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PINK} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={PINK}
            />
          }
        >
          {/* ── 1. Bannière slider ──────────────────────────────────────── */}
          {sliders.length > 0 && (
            <View style={styles.section}>
              <FlatList
                ref={sliderRef}
                data={sliders}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <SliderCard slider={item} width={SLIDER_W} />}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDER_W);
                  setSliderIdx(idx);
                }}
                snapToInterval={SLIDER_W}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              />
              {/* Indicateurs */}
              {sliders.length > 1 && (
                <View style={styles.dots}>
                  {sliders.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === sliderIdx && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── 2. Bannière livraison ───────────────────────────────────── */}
          <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
            <Pressable
              style={({ pressed }) => [styles.deliveryBanner, pressed && { opacity: 0.9 }]}
              onPress={() => router.push("/(tabs)/catalog" as never)}
            >
              <View style={styles.deliveryLeft}>
                <Text style={styles.deliveryTitle}>🚚 Livraison 24/48h</Text>
                <Text style={styles.deliveryDesc}>France & Europe · Gratuite dès 500 € HT</Text>
                <Text style={styles.deliveryDesc}>📍 Retrait gratuit à Roissy · Lun–Sam 9h–15h</Text>
              </View>
              <Text style={styles.deliveryArrow}>›</Text>
            </Pressable>
          </View>

          {/* ── 3. Fêtes & Occasions ────────────────────────────────────── */}
          {fetes.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Fêtes & Occasions"
                onSeeAll={() => router.push("/(tabs)/catalog" as never)}
              />
              <FlatList
                data={fetes}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <FeteCard fete={item} />}
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              />
            </View>
          )}

          {/* ── 4. Par univers (catégories) ─────────────────────────────── */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Par univers"
                onSeeAll={() => router.push("/(tabs)/catalog" as never)}
              />
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CategoryCard cat={item as Category & { imageUrl?: string }} />}
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              />
            </View>
          )}

          {/* ── 5. Nouveautés ───────────────────────────────────────────── */}
          {newProducts.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Nouveautés"
                onSeeAll={() => router.push("/(tabs)/catalog?filter=new" as never)}
              />
              <FlatList
                data={newProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ProductCard product={item} onAdd={handleAddToCart} />}
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              />
            </View>
          )}

          {/* ── 6. Best-sellers ─────────────────────────────────────────── */}
          {bestsellers.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Best-sellers"
                onSeeAll={() => router.push("/(tabs)/catalog?filter=featured" as never)}
              />
              <FlatList
                data={bestsellers}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ProductCard product={item} onAdd={handleAddToCart} />}
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              />
            </View>
          )}

          {/* ── 7. Vous aimerez aussi ────────────────────────────────────── */}
          {youLikeProducts.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Vous aimerez aussi"
                onSeeAll={() => router.push("/(tabs)/catalog" as never)}
              />
              <FlatList
                data={youLikeProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ProductCard product={item} onAdd={handleAddToCart} />}
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              />
            </View>
          )}

          {/* ── 8. Nos marques ──────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader title="Nos marques" />
            <FlatList
              data={BRANDS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.brandCard, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push(`/(tabs)/catalog?brand=${encodeURIComponent(item.name)}` as never)}
                >
                  <Image
                    source={{ uri: item.logo }}
                    style={styles.brandLogo}
                    contentFit="contain"
                    transition={200}
                  />
                  <Text style={styles.brandName} numberOfLines={1}>{item.name}</Text>
                </Pressable>
              )}
              contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 10 }}
            />
          </View>

          {/* ── Pied de page ────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>AssiaSweet — Grossiste confiseries B2B</Text>
            <Text style={styles.footerSub}>161 rue Belle Étoile, Roissy-en-France</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  cartBtn: {
    position: "relative",
    padding: 6,
  },
  cartIcon: {
    fontSize: 26,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: PINK,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  // Recherche
  searchRow: {
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#212121",
    padding: 0,
  },
  // Chargement
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#9E9E9E",
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212121",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 15,
    color: PINK,
    fontWeight: "600",
  },
  // Slider
  sliderCard: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: PINK,
  },
  sliderGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  sliderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sliderSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 8,
  },
  sliderCta: {
    alignSelf: "flex-start",
    backgroundColor: PINK,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sliderCtaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
  },
  dotActive: {
    backgroundColor: PINK,
    width: 18,
  },
  // Bannière livraison
  deliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F7",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FCE4EC",
  },
  deliveryLeft: {
    flex: 1,
    gap: 4,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  deliveryDesc: {
    fontSize: 13,
    color: "#616161",
    lineHeight: 18,
  },
  deliveryArrow: {
    fontSize: 24,
    color: PINK,
    fontWeight: "700",
    marginLeft: 8,
  },
  // Fêtes
  feteCard: {
    width: 160,
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F3E5F5",
  },
  feteImg: {
    width: "100%",
    height: "100%",
  },
  feteOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  feteEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  feteTitre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  feteDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  // Catégories
  catCard: {
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F3E5F5",
  },
  catImg: {
    width: "100%",
    height: "100%",
  },
  catOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  catName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  // Produits
  productCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  productImg: {
    width: "100%",
    height: 140,
    backgroundColor: "#F5F5F5",
  },
  badgeNew: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgePromo: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: PINK,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  productInfo: {
    padding: 10,
    gap: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: PINK,
  },
  addBtn: {
    marginTop: 6,
    backgroundColor: PINK,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  // Marques
  brandCard: {
    width: 90,
    alignItems: "center",
    gap: 6,
  },
  brandLogo: {
    width: 80,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  brandName: {
    fontSize: 11,
    color: "#616161",
    textAlign: "center",
    fontWeight: "500",
  },
  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: H_PAD,
    gap: 4,
    borderTopWidth: 0.5,
    borderTopColor: "#F0F0F0",
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  footerSub: {
    fontSize: 12,
    color: "#BDBDBD",
  },
});
