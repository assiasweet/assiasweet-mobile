"use no memo";
/**
 * SplashAnimation — Animation d'ouverture AssiaSweet
 *
 * Séquence :
 * 1. Fond dégradé rose → violet qui pulse
 * 2. Particules bonbons qui explosent depuis le centre (émojis colorés)
 * 3. Logo qui tombe du haut avec effet de rebond élastique
 * 4. Shimmer doré sur le logo (effet brillance)
 * 5. Cercles concentriques qui irradient depuis le logo
 * 6. Tout disparaît avec un zoom-out + fade vers l'app
 */
import { useEffect, useCallback } from "react";
import { View, Image, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

// Particules bonbons — positions et délais variés
const PARTICLES = [
  { emoji: "🍬", x: -W * 0.35, y: -H * 0.25, delay: 0,   size: 36, rot: -40 },
  { emoji: "🍭", x:  W * 0.38, y: -H * 0.30, delay: 60,  size: 44, rot:  55 },
  { emoji: "🍫", x: -W * 0.42, y:  H * 0.20, delay: 120, size: 32, rot: -25 },
  { emoji: "🍡", x:  W * 0.40, y:  H * 0.22, delay: 80,  size: 38, rot:  70 },
  { emoji: "🍬", x:  W * 0.10, y: -H * 0.38, delay: 40,  size: 30, rot:  30 },
  { emoji: "🍭", x: -W * 0.15, y:  H * 0.35, delay: 100, size: 42, rot: -60 },
  { emoji: "🍩", x:  W * 0.45, y: -H * 0.10, delay: 20,  size: 34, rot:  45 },
  { emoji: "🍬", x: -W * 0.44, y: -H * 0.08, delay: 150, size: 28, rot: -80 },
  { emoji: "⭐",  x:  W * 0.20, y:  H * 0.40, delay: 70,  size: 26, rot:  20 },
  { emoji: "✨",  x: -W * 0.22, y: -H * 0.40, delay: 90,  size: 24, rot: -15 },
  { emoji: "🍫", x:  W * 0.48, y:  H * 0.38, delay: 130, size: 30, rot:  65 },
  { emoji: "🍡", x: -W * 0.48, y:  H * 0.32, delay: 50,  size: 36, rot: -50 },
];

// Cercles d'onde
const RINGS = [0, 1, 2, 3];

interface ParticleProps {
  emoji: string;
  targetX: number;
  targetY: number;
  delay: number;
  size: number;
  rotation: number;
  trigger: SharedValue<number>;
}

function Particle({ emoji, targetX, targetY, delay, size, rotation, trigger }: ParticleProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    // Explosion depuis le centre
    x.value = withDelay(delay, withSpring(targetX, { damping: 8, stiffness: 60, mass: 0.8 }));
    y.value = withDelay(delay, withSpring(targetY, { damping: 8, stiffness: 60, mass: 0.8 }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(900, withTiming(0, { duration: 400 }))
    ));
    scale.value = withDelay(delay, withSequence(
      withSpring(1.2, { damping: 6, stiffness: 200 }),
      withTiming(0.8, { duration: 200 })
    ));
    rot.value = withDelay(delay, withTiming(rotation, { duration: 800, easing: Easing.out(Easing.cubic) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rot.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ fontSize: size, position: "absolute" }, style]}>
      {emoji}
    </Animated.Text>
  );
}

interface RingProps {
  index: number;
}

function Ring({ index }: RingProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const delay = 400 + index * 180;

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(3.5, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) })
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringSize = 120 + index * 20;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 2.5,
          borderColor: index % 2 === 0 ? "#E91E7B" : "#7C3AED",
        },
        style,
      ]}
    />
  );
}

interface Props {
  onFinish: () => void;
}

export function SplashAnimation({ onFinish }: Props) {
  // --- Logo ---
  const logoScale = useSharedValue(0);
  const logoY = useSharedValue(-H * 0.6);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-15);

  // --- Shimmer ---
  const shimmerX = useSharedValue(-W);

  // --- Fond ---
  const bgOpacity = useSharedValue(1);
  const bgScale = useSharedValue(1);

  // --- Conteneur global (exit) ---
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // --- Pulse fond ---
  const bgPulse = useSharedValue(1);

  const finish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Pulse du fond
    bgPulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Logo : chute depuis le haut avec rebond élastique
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 150 }));
    logoY.value = withDelay(200, withSpring(0, {
      damping: 7,
      stiffness: 120,
      mass: 1.2,
      overshootClamping: false,
    }));
    logoScale.value = withDelay(200, withSpring(1, {
      damping: 6,
      stiffness: 100,
      mass: 1,
    }));
    logoRotate.value = withDelay(200, withSpring(0, {
      damping: 8,
      stiffness: 80,
    }));

    // Shimmer doré qui traverse le logo (après que le logo soit posé)
    shimmerX.value = withDelay(900, withRepeat(
      withTiming(W * 1.5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      2,
      false
    ));

    // Exit : zoom-out + fade après 2.4s
    containerOpacity.value = withDelay(2400, withTiming(0, {
      duration: 500,
      easing: Easing.in(Easing.cubic),
    }));
    containerScale.value = withDelay(2400, withTiming(1.15, {
      duration: 500,
      easing: Easing.in(Easing.cubic),
    }));

    // Appeler onFinish après la fin de l'animation
    const timer = setTimeout(() => {
      runOnJS(finish)();
    }, 2950);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgPulse.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoY.value },
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: interpolate(
      shimmerX.value,
      [-W, 0, W * 0.5, W * 1.5],
      [0, 0.7, 0.5, 0],
      Extrapolation.CLAMP
    ),
  }));

  const trigger = useSharedValue(1);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Fond dégradé animé */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        {/* Fond rose-violet dégradé via couches */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FCE4F0" }]} />
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: "#E91E7B",
          opacity: 0.12,
          borderRadius: W,
          transform: [{ scaleX: 1.5 }, { scaleY: 0.8 }],
          top: -H * 0.1,
        }]} />
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: "#7C3AED",
          opacity: 0.08,
          borderRadius: W,
          transform: [{ scaleX: 1.3 }, { scaleY: 0.7 }],
          top: H * 0.3,
        }]} />
      </Animated.View>

      {/* Cercles d'onde irradiants */}
      <View style={styles.center}>
        {RINGS.map((i) => (
          <Ring key={i} index={i} />
        ))}
      </View>

      {/* Particules bonbons */}
      <View style={styles.center}>
        {PARTICLES.map((p, i) => (
          <Particle
            key={i}
            emoji={p.emoji}
            targetX={p.x}
            targetY={p.y}
            delay={p.delay}
            size={p.size}
            rotation={p.rot}
            trigger={trigger}
          />
        ))}
      </View>

      {/* Logo avec rebond */}
      <View style={styles.center}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require("@/assets/images/logo-splash.webp")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Shimmer doré par-dessus le logo */}
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const LOGO_SIZE = Math.min(W * 0.72, 300);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    // Ombre douce
    ...(Platform.OS === "ios" ? {
      shadowColor: "#E91E7B",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
    } : {
      elevation: 20,
    }),
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: -LOGO_SIZE * 0.5,
    width: LOGO_SIZE * 0.4,
    height: LOGO_SIZE,
    backgroundColor: "rgba(255, 215, 0, 0.45)",
    transform: [{ skewX: "-20deg" }],
    borderRadius: 4,
  },
});
