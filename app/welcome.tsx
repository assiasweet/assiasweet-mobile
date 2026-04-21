import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/auth";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const WELCOME_KEY_PREFIX = "has_seen_welcome_";

export async function markWelcomeSeen(customerId: string | number) {
  await AsyncStorage.setItem(`${WELCOME_KEY_PREFIX}${customerId}`, "1");
}

export async function hasSeenWelcome(customerId: string | number): Promise<boolean> {
  const val = await AsyncStorage.getItem(`${WELCOME_KEY_PREFIX}${customerId}`);
  return val === "1";
}

const SLIDES = [
  {
    id: "1",
    emoji: "🍬",
    title: "Bienvenue chez AssiaSweet !",
    subtitle: "Votre grossiste en bonbons & confiseries. Des milliers de références à prix professionnels.",
    bg: "#FFF0F7",
    accent: "#E91E7B",
  },
  {
    id: "2",
    emoji: "🛒",
    title: "Commandez en quelques clics",
    subtitle: "Parcourez notre catalogue, ajoutez vos produits au panier et passez commande facilement.",
    bg: "#F0F7FF",
    accent: "#1E7BE9",
  },
  {
    id: "3",
    emoji: "🚚",
    title: "Livraison France & Europe",
    subtitle: "Livraison 24/48h. Gratuite dès 500 € HT. Retrait gratuit à Roissy sur rendez-vous.",
    bg: "#F0FFF4",
    accent: "#1E9B4B",
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const auth = useAuthStore((s) => s.auth);

  const customerId =
    auth.status === "customer" ? (auth.customer as { id?: string | number })?.id ?? "guest" : "guest";

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await markWelcomeSeen(customerId);
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    await markWelcomeSeen(customerId);
    router.replace("/(tabs)");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Logo AssiaSweet en haut */}
      <View style={styles.logoRow}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Illustration zone */}
            <View style={[styles.emojiZone, { backgroundColor: item.bg }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            {/* Texte */}
            <View style={styles.textZone}>
              <Text style={[styles.slideTitle, { color: item.accent }]}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Indicateurs de progression */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex
                ? { backgroundColor: SLIDES[activeIndex].accent, width: 20 }
                : { backgroundColor: "#D1D5DB", width: 8 },
            ]}
          />
        ))}
      </View>

      {/* Boutons */}
      <View style={styles.buttonsRow}>
        {!isLast ? (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: SLIDES[activeIndex].accent }]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {isLast ? "Commencer →" : "Suivant →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  logoRow: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  slide: {
    flex: 1,
    alignItems: "center",
  },
  emojiZone: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 80,
  },
  textZone: {
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 10,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 30,
  },
  slideSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 28,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  nextBtn: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
