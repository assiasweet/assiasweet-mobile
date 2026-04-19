import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { getProductImage, getProductPrice, isProductHalal } from "@/lib/types";
import type { Product, Category } from "@/lib/types";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

// ─── Marques statiques avec vrais logos ─────────────────────────────────────
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

// ─── Bannières slider depuis l'API /api/sliders/generate ────────────────────
type Banner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  imageUrl?: string;
  bg: string;
};
// Mapping slug catégorie → icône statique sur www.assiasweet.pro
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
// Labels courts pour les catégories (évite la troncature)
const CATEGORY_SHORT_LABELS: Record<string, string> = {
  "bonbon-en-vrac": "Vrac",
  "sucettes": "Sucettes",
  "chewing-gum": "Chewing",
  "jumbos-ceintures": "Jumbos",
  "snacking": "Snacking",
  "gadgets-sprays": "Gadgets",
  "tubos-presentoirs": "Tubos",
  "destockage": "Déstock",
  "promotions": "Promos",
};
// Convertit les sliders de l'API en bannières affichables
const SLIDER_COLORS = ["#E91E7B", "#9C27B0", "#E65100", "#1565C0", "#2E7D32"];
function buildBannersFromSliders(sliders: Array<{
  id: number | string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  image_url?: string;
}>): Banner[] {
  return sliders.map((s, i) => ({
    id: String(s.id),
    title: s.title ?? "AssiaSweet",
    subtitle: s.subtitle ?? "",
    cta: s.cta_text ?? "Voir les produits",
    imageUrl: s.image_url ?? undefined,
    bg: SLIDER_COLORS[i % SLIDER_COLORS.length],
  }));
}

//// ─── Composant FadeIn Section ───────────────────────────────────────────────
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
  }, []);
  return <Animated.View style={anim}>{children}</Animated.View>;
}

// ─── Composant Card Produit ───────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({ item, onAdd }: { item: Product; onAdd: (p: Product) => void }) {
  const img = getProductImage(item);
  const price = getProductPrice(item);
  const halal = isProductHalal(item);
  const scale = useSharedValue(1);
  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const brandName = typeof item.brand === "string" ? item.brand : item.brand?.name ?? "";
  return (
    <Animated.View style={[styles.card, cardAnim]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => router.push(`/product/${item.slug || item.id}` as never)}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
      >
        {/* Image */}
        <View style={styles.cardImgWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.cardImg} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
              <View style={styles.cardPlaceholderIcon}>
                <Text style={{ fontSize: 32, color: "#E91E7B" }}>A</Text>
              </View>
            </View>
          )}
          {/* Gradient overlay bas */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.08)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Badges */}
          <View style={styles.badgeRow}>
            {halal && (
              <View style={styles.halalBadge}>
                <Text style={styles.halalText}>Halal</Text>
              </View>
            )}
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newText}>Nouveau</Text>
              </View>
            )}
          </View>
          {/* Bouton + */}
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.92 }] }]}
            onPress={(e) => { e.stopPropagation(); onAdd(item); }}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
        {/* Infos */}
        <View style={styles.cardBody}>
          {brandName ? (
            <Text style={styles.cardBrand} numberOfLines={1}>{brandName.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.cardPrice}>{price.toFixed(2)} <Text style={styles.cardPriceUnit}>€ HT</Text></Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});
// ─── Composant Section Headerr ───────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.seeAll}>Voir tout</Text>
          <Text style={styles.seeAllArrow}>›</Text>
        </Pressable>
      )}
    </View>
  );
}// ─── Écran principal ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const auth = useAuthStore((s) => s.auth);
  const customer = auth.status === "customer" ? auth.customer : null;
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [youLikeProducts, setYouLikeProducts] = useState<Product[]>([]);
  const [fetes, setFetes] = useState<Array<{ id: string; titre: string; emoji: string; dateLabel: string; image: string; isFeatured: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [search, setSearch] = useState("");

  const bannerRef = useRef<FlatList>(null);
  const autoSlide = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      // PHASE 1 : Données prioritaires (sliders + catégories) — affichage immédiat
      const [slidersRes, catRes] = await Promise.all([
        fetch("https://www.assiasweet.pro/api/sliders/generate").then((r) => r.json()).catch(() => ({ sliders: [] })),
        fetch("https://www.assiasweet.pro/api/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
      ]);
      if (catRes?.categories) setCategories(catRes.categories);
      const rawSliders = (slidersRes?.sliders ?? []) as Array<{ id: number | string; title?: string; subtitle?: string; cta_text?: string; image_url?: string }>;
      if (rawSliders.length > 0) {
        setBanners(buildBannersFromSliders(rawSliders));
      } else if (catRes?.categories) {
        const fallbackBanners = (catRes.categories as Array<{ id: string; slug: string; name: string; imageUrl?: string }>)
          .filter((c) => c.imageUrl).slice(0, 5)
          .map((c, i) => ({ id: c.id, title: c.name, subtitle: "", cta: "Voir les produits", imageUrl: c.imageUrl, bg: SLIDER_COLORS[i % SLIDER_COLORS.length] }));
        setBanners(fallbackBanners);
      }
      // Afficher l'interface dès que sliders + catégories sont chargés
      setIsLoading(false);

      // PHASE 2 : Données secondaires en arrière-plan (produits + fêtes)
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
      const rawFetes = (fetesRes?.fetes ?? []) as Array<{ id: string; titre: string; emoji: string; dateLabel: string; image: string; isFeatured: boolean; actif: boolean; ordre: number }>;
      setFetes(rawFetes.filter((f) => f.actif).sort((a, b) => a.ordre - b.ordre));
    } catch {
      setIsLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-défilement bannière
  useEffect(() => {
    if (banners.length === 0) return;
    autoSlide.current = setInterval(() => {
      setBannerIdx((prev) => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => { if (autoSlide.current) clearInterval(autoSlide.current); };
  }, [banners.length]);

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
      {/* ── HEADER COMPACT ── */}
      <View style={styles.header}>
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          {/* Icône loupe SVG */}
          <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
            <Circle cx="11" cy="11" r="7" stroke="#E91E7B" strokeWidth="2" fill="none" />
            <Line x1="16.5" y1="16.5" x2="22" y2="22" stroke="#E91E7B" strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un produit, une marque..."
            placeholderTextColor="#C4C4C4"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        {/* Logo */}
        <View style={styles.headerLogoWrap}>
          <Image
            source={require("@/assets/images/assiasweet-logo.png")}
            style={styles.headerLogo}
            contentFit="contain"
          />
        </View>
        {/* Panier */}
        <Pressable
          style={({ pressed }) => [styles.headerCartBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] }]}
          onPress={() => router.push("/(tabs)/cart" as never)}
        >
          {/* Icône panier SVG */}
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#E91E7B" strokeWidth="2" fill="none" strokeLinejoin="round" />
            <Line x1="3" y1="6" x2="21" y2="6" stroke="#E91E7B" strokeWidth="2" strokeLinecap="round" />
            <Path d="M16 10a4 4 0 01-8 0" stroke="#E91E7B" strokeWidth="2" fill="none" strokeLinecap="round" />
          </Svg>
          {cartCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#E91E7B" />}
        contentContainerStyle={{ paddingBottom: 32 }}
       >
        {/* ── SLIDER BANNIÈRES ── */}
        <View style={{ marginBottom: 24 }}>
          {banners.length > 0 ? (
            <>
              <FlatList
                ref={bannerRef}
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(b) => b.id}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (W - 32));
                  setBannerIdx(idx);
                }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item: b }) => (
                  <TouchableOpacity
                    style={[styles.banner, { width: W - 32 }]}
                    activeOpacity={0.95}
                    onPress={() => router.push(`/(tabs)/catalog?cat=${b.categorySlug || ''}` as never)}
                  >
                    {b.imageUrl && (
                      <Image source={{ uri: b.imageUrl }} style={styles.bannerBgImg} contentFit="cover" cachePolicy="memory-disk" />
                    )}
                    <LinearGradient
                      colors={[b.bg + "A6", b.bg + "1A", "transparent"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.bannerOverlay}
                    />
                    <View style={styles.bannerContent}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bannerTitle}>{b.title}</Text>
                        {b.subtitle ? <Text style={styles.bannerSubtitle}>{b.subtitle}</Text> : null}
                        <TouchableOpacity style={styles.bannerCta} activeOpacity={0.8}>
                          <Text style={[styles.bannerCtaText, { color: b.bg }]}>{b.cta}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
              <View style={styles.dots}>
                {banners.map((_, i) => (
                  <View key={i} style={[styles.dot, i === bannerIdx && styles.dotActive]} />
                ))}
              </View>
            </>
          ) : (
            <View style={{ height: 130, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#E91E7B" />
            </View>
          )}
        </View>

        {/* ── CATÉGORIES ── */}
        <FadeInSection delay={100}>
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
                    {(CATEGORY_ICONS[cat.slug] || cat.imageUrl) ? (
                      <Image
                        source={{ uri: CATEGORY_ICONS[cat.slug] || cat.imageUrl }}
                        style={styles.catImg}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ fontSize: 24 }}>A</Text>
                    )}
                  </View>
                  <Text style={styles.catName} numberOfLines={1}>{CATEGORY_SHORT_LABELS[cat.slug] || cat.name}</Text>
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
                <Text style={styles.catName} numberOfLines={1}>Toutes</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
        </FadeInSection>
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
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              removeClippedSubviews
              maxToRenderPerBatch={6}
              windowSize={5}
              initialNumToRender={4}
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
                <View style={[styles.catCircle, { backgroundColor: "#fff" }]}>
                  <Image
                    source={{ uri: b.logo }}
                    style={{ width: 52, height: 52 }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
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
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              removeClippedSubviews
              maxToRenderPerBatch={6}
              windowSize={5}
              initialNumToRender={4}
              renderItem={({ item }) => (
                <View style={{ width: CARD_W }}>
                  <ProductCard item={item} onAdd={handleAddToCart} />
                </View>
              )}
            />
          </View>
        )}

        {/* ── VOUS ALLEZ LES AIMER ── */}
        {youLikeProducts.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              title="Vous allez les aimer 🍬"
              onSeeAll={() => router.push("/(tabs)/catalog?filter=featured" as never)}
            />
            <FlatList
              data={youLikeProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => `youlike-${p.id}`}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              removeClippedSubviews
              maxToRenderPerBatch={6}
              windowSize={5}
              initialNumToRender={4}
              renderItem={({ item }) => (
                <View style={{ width: CARD_W }}>
                  <ProductCard item={item} onAdd={handleAddToCart} />
                </View>
              )}
            />
          </View>
        )}
        {/* ── SECTION FÊTES & OCCASIONS ── */}
        {fetes.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>Fêtes, Univers & Occasions</Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Des confiseries pour chaque moment de l'année</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/catalog" as never)}>
                <Text style={{ fontSize: 13, color: "#E91E7B", fontWeight: "600" }}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            {/* Grille style site web : grande carte à gauche + 2x2 à droite */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}>
              {/* Grande carte featured */}
              {fetes.filter((f) => f.isFeatured).slice(0, 1).map((fete) => (
                <TouchableOpacity
                  key={fete.id}
                  onPress={() => router.push("/(tabs)/catalog" as never)}
                  activeOpacity={0.88}
                  style={{ flex: 1.3, height: 200, borderRadius: 16, overflow: "hidden", backgroundColor: "#F3F4F6" }}
                >
                  {fete.image ? (
                    <Image source={{ uri: fete.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : null}
                  <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "800", lineHeight: 18 }} numberOfLines={2}>{fete.titre}</Text>
                    {fete.dateLabel ? <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>{fete.dateLabel}</Text> : null}
                    <Text style={{ color: "#E91E7B", fontSize: 12, fontWeight: "600", marginTop: 4 }}>Découvrir la sélection →</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {/* Grille 2x2 des autres occasions */}
              <View style={{ flex: 1, gap: 8 }}>
                {fetes.filter((f) => !f.isFeatured).slice(0, 4).reduce<Array<Array<typeof fetes[0]>>>((rows, item, i) => {
                  if (i % 2 === 0) rows.push([item]);
                  else rows[rows.length - 1].push(item);
                  return rows;
                }, []).map((row, rowIdx) => (
                  <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                    {row.map((fete) => (
                      <TouchableOpacity
                        key={fete.id}
                        onPress={() => router.push("/(tabs)/catalog" as never)}
                        activeOpacity={0.88}
                        style={{ flex: 1, height: 96, borderRadius: 12, overflow: "hidden", backgroundColor: "#F3F4F6" }}
                      >
                        {fete.image ? (
                          <Image source={{ uri: fete.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        ) : null}
                        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.5)" }}>
                          <Text style={{ color: "white", fontSize: 11, fontWeight: "700", lineHeight: 14 }} numberOfLines={2}>
                            {fete.emoji ? fete.emoji + " " : ""}{fete.titre}
                          </Text>
                          {fete.dateLabel ? <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>{fete.dateLabel}</Text> : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

         {/* ── SECTION PROMO (Nouvelle Arrivage + Livraison) ── */}
        <View style={styles.promoSection}>
          {/* Carte Pâques — Édition Limitée */}
          <TouchableOpacity
            style={[styles.promoCard, styles.promoCardLeft]}
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/catalog?filter=new" as never)}
          >
            <View style={styles.promoCardOverlay} />
            <View style={styles.promoCardContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>🐣 Édition Limitée</Text>
              </View>
              <Text style={styles.promoCardTitle}>Nouvelle{"\n"}Arrivage Pâques</Text>
              <Text style={styles.promoCardSub}>Œufs surprises, chocolats{"\n"}& confiseries de Pâques</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>🏷️</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>Prix HT professionnels</Text>
              </View>
              <View style={styles.promoCtaBtn}>
                <Text style={styles.promoCtaText}>Découvrir →</Text>
              </View>
            </View>
          </TouchableOpacity>
          {/* Carte Livraison */}
          <TouchableOpacity
            style={[styles.promoCard, styles.promoCardRight]}
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/catalog" as never)}
          >
            <View style={styles.promoCardContent}>
              <View style={[styles.promoBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Text style={styles.promoBadgeText}>🚚 Livraison 24/48h</Text>
              </View>
              <Text style={[styles.promoCardTitle, { color: "#fff" }]}>Livraison{"\n"}France & Europe</Text>
              <View style={{ gap: 3, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>📦</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>Tarif selon le poids</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>🎁</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>Gratuite dès 500 € HT</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>📍</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>Retrait gratuit Roissy</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>🕘</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>Lun–Sam 9h–15h (sur RDV)</Text>
                </View>
              </View>
              <View style={[styles.promoCtaBtn, { backgroundColor: "#fff" }]}>
                <Text style={[styles.promoCtaText, { color: "#E91E7B" }]}>Commander →</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

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
  // Header compact (recherche + logo + panier sur une ligne)
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLogoWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#FFF0F7",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(233,30,123,0.12)",
    flexShrink: 0,
  },
  headerLogo: { width: 30, height: 30 },
  headerCartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#FFF0F7",
    alignItems: "center", justifyContent: "center",
    position: "relative",
    borderWidth: 1, borderColor: "rgba(233,30,123,0.1)",
    flexShrink: 0,
  },
  headerBadge: {
    position: "absolute", top: -3, right: -3,
    backgroundColor: "#E91E7B", borderRadius: 9,
    minWidth: 18, height: 18,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4, borderWidth: 2, borderColor: "#fff",
  },
  headerBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  // Barre de recherche intégrée dans le header
  searchBar: {
    flex: 1,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 14, paddingHorizontal: 12,
    height: 42,
    borderWidth: 1, borderColor: "rgba(233,30,123,0.08)",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1E1E1E", fontWeight: "400" },

  // Bannière
  banner: {
    borderRadius: 20, overflow: "hidden",
    minHeight: 160,
    justifyContent: "flex-end",
    position: "relative",
  },
  bannerBgImg: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    width: "100%", height: "100%",
  },
  bannerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  },
  bannerContent: { padding: 18, zIndex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", lineHeight: 26 },
  bannerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 4, lineHeight: 18 },
  bannerCta: {
    marginTop: 12, backgroundColor: "#fff",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    alignSelf: "flex-start",
  },
  bannerCtaText: { fontSize: 12, fontWeight: "700" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(233,30,123,0.2)" },
  dotActive: { width: 20, height: 5, borderRadius: 2.5, backgroundColor: "#E91E7B" },

  // Section header
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 16,
  },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionAccent: {
    width: 4, height: 18, borderRadius: 2,
    backgroundColor: "#E91E7B",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1E1E1E", letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "#FFF0F7", borderRadius: 20 },
  seeAll: { fontSize: 12, fontWeight: "600", color: "#E91E7B" },
  seeAllArrow: { fontSize: 16, fontWeight: "700", color: "#E91E7B", lineHeight: 18 },

  // Catégories
  catScroll: { paddingHorizontal: 16, paddingRight: 16 },
  catItemGap: { width: 14 },
  catItem: { alignItems: "center", width: 72 },
  catCircle: {
    width: 72, height: 60, borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#E91E7B", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: "rgba(233,30,123,0.08)",
  },
  catImg: { width: 72, height: 60 },
  catName: { fontSize: 10, fontWeight: "600", color: "#374151", textAlign: "center", marginTop: 5, lineHeight: 13 },

  // Card produit
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImgWrap: { position: "relative", width: "100%", aspectRatio: 0.9 },
  cardImg: { width: "100%", height: "100%" },
  cardImgPlaceholder: { backgroundColor: "#FFF0F7", alignItems: "center", justifyContent: "center" },
  cardPlaceholderIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FCE4F0",
    alignItems: "center", justifyContent: "center",
  },
  badgeRow: {
    position: "absolute", top: 8, left: 8,
    flexDirection: "row", gap: 4,
  },
  halalBadge: {
    backgroundColor: "rgba(39,174,96,0.92)",
    borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  halalText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  newBadge: {
    backgroundColor: "rgba(37,99,235,0.92)",
    borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  newText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  addBtn: {
    position: "absolute", bottom: 10, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#E91E7B",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#E91E7B", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45, shadowRadius: 6, elevation: 5,
  },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "300", lineHeight: 26, marginTop: -1 },
  cardBody: { padding: 12, paddingTop: 10 },
  cardBrand: { fontSize: 10, color: "#E91E7B", fontWeight: "700", marginBottom: 3, letterSpacing: 0.8 },
  cardName: { fontSize: 13, fontWeight: "600", color: "#1E1E1E", lineHeight: 18, marginBottom: 6 },
  cardPrice: { fontSize: 16, fontWeight: "800", color: "#1E1E1E" },
  cardPriceUnit: { fontSize: 12, fontWeight: "400", color: "#9CA3AF" },
  // Section promo
  promoSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  promoCard: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    minHeight: 180,
    justifyContent: "flex-end",
    position: "relative",
  },
  promoCardLeft: {
    backgroundColor: "#2D4A2D",
  },
  promoCardRight: {
    backgroundColor: "#C2185B",
  },
  promoCardOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  promoCardContent: {
    padding: 14,
    zIndex: 1,
  },
  promoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  promoBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  promoCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 20,
    marginBottom: 4,
  },
  promoCardSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 15,
    marginBottom: 10,
  },
  promoCtaBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  promoCtaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E1E1E",
  },
});
