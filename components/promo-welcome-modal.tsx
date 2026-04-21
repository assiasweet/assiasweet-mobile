import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

const PROMO_SEEN_KEY = "has_seen_promo_modal_v1";

export function PromoWelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(PROMO_SEEN_KEY).then((val) => {
      if (val !== "1") {
        // Délai léger pour laisser l'écran se charger
        setTimeout(() => {
          setVisible(true);
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              damping: 18,
              stiffness: 200,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }, 800);
      }
    });
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(PROMO_SEEN_KEY, "1");
    setVisible(false);
  };

  const handleCopy = async () => {
    try {
      // Utiliser l'API web Clipboard si disponible (web + certains Android)
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("BIENVENUE10");
      }
    } catch {
      // ignore — le texte est visible à l'écran
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async () => {
    await AsyncStorage.setItem(PROMO_SEEN_KEY, "1");
    setVisible(false);
    router.push("/(auth)/register" as never);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Bouton fermer */}
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Titre */}
          <Text style={styles.title}>Bienvenue sur ASSIASWEET 🍬</Text>
          <Text style={styles.subtitle}>
            Grossiste N°1 en bonbons et confiseries en Île-de-France
          </Text>

          {/* Bloc promo */}
          <View style={styles.promoBox}>
            <Text style={styles.promoLabel}>🎁 Offre de bienvenue</Text>
            <Text style={styles.promoPercent}>-10%</Text>
            <Text style={styles.promoDesc}>sur votre première commande avec le code</Text>

            <TouchableOpacity style={styles.codeBtn} onPress={handleCopy}>
              <Text style={styles.codeText}>
                BIENVENUE10{"  "}
                <Text style={styles.copyIcon}>{copied ? "✓" : "⧉"}</Text>
              </Text>
            </TouchableOpacity>

            {copied && (
              <Text style={styles.copiedText}>Code copié !</Text>
            )}
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Profitez de prix grossiste sur plus de 700 références : Haribo, Damel, Fini, Dulceplus, Trolli et bien plus.
          </Text>

          {/* CTA principal */}
          <TouchableOpacity style={styles.ctaBtn} onPress={handleRegister}>
            <Text style={styles.ctaText}>Créer mon compte pro →</Text>
          </TouchableOpacity>

          {/* Lien secondaire */}
          <TouchableOpacity onPress={dismiss}>
            <Text style={styles.skipText}>Non merci, je continue</Text>
          </TouchableOpacity>

          {/* Infos bas */}
          <Text style={styles.infoText}>
            Commande minimum 100€ HT · Livraison France & Europe · Retrait gratuit à Roissy
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 18,
  },
  promoBox: {
    backgroundColor: "#FFF0F7",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  promoLabel: {
    fontSize: 13,
    color: "#E91E7B",
    fontWeight: "600",
    marginBottom: 4,
  },
  promoPercent: {
    fontSize: 42,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 50,
  },
  promoDesc: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  codeBtn: {
    backgroundColor: "#E91E7B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  codeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  copyIcon: {
    fontSize: 16,
    fontWeight: "400",
  },
  copiedText: {
    fontSize: 12,
    color: "#22C55E",
    marginTop: 6,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  ctaBtn: {
    backgroundColor: "#E91E7B",
    borderRadius: 14,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  skipText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 14,
  },
  infoText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
});
