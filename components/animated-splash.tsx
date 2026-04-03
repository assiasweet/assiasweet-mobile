import { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  // Logo animations
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(30);

  // Tagline animations
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);

  // Overlay fade out
  const overlayOpacity = useSharedValue(1);

  // Pulse ring
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Logo apparaît avec spring
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });

    // 2. Ring pulse
    ringOpacity.value = withDelay(400, withTiming(0.3, { duration: 400 }));
    ringScale.value = withDelay(400, withSequence(
      withTiming(1.4, { duration: 700, easing: Easing.out(Easing.cubic) }),
      withTiming(1.6, { duration: 500, easing: Easing.in(Easing.cubic) })
    ));

    // 3. Tagline apparaît
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // 4. Fade out général après 2.2s
    overlayOpacity.value = withDelay(2200, withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onFinish)();
    }));
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayAnimStyle]}>
      <LinearGradient
        colors={["#1a0010", "#3D0A20", "#E91E7B"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ring pulse derrière le logo */}
      <Animated.View style={[styles.ring, ringAnimStyle]} />

      {/* Contenu centré */}
      <View style={styles.center}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, logoAnimStyle]}>
          <Image
            source={require("../assets/images/assiasweet-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineAnimStyle]}>
          La confiserie B2B de référence
        </Animated.Text>
      </View>

      {/* Barre de chargement en bas */}
      <Animated.View style={[styles.loaderWrap, taglineAnimStyle]}>
        <View style={styles.loaderTrack}>
          <Animated.View style={styles.loaderBar} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  ring: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    alignSelf: "center",
    top: height / 2 - 110,
  },
  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E91E7B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  logo: {
    width: 130,
    height: 130,
  },
  tagline: {
    marginTop: 24,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "400",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  loaderWrap: {
    paddingBottom: 60,
    paddingHorizontal: 60,
    alignItems: "center",
  },
  loaderTrack: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
    overflow: "hidden",
  },
  loaderBar: {
    width: "60%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 1,
  },
});
