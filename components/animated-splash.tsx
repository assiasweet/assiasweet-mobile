import { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const circle1Scale = useSharedValue(0.4);
  const circle1Opacity = useSharedValue(0);
  const circle2Scale = useSharedValue(0.4);
  const circle2Opacity = useSharedValue(0);
  const circle3Scale = useSharedValue(0.4);
  const circle3Opacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(10);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // Cercles roses clairs qui s'expandent
    circle3Opacity.value = withTiming(1, { duration: 300 });
    circle3Scale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

    circle2Opacity.value = withDelay(150, withTiming(1, { duration: 300 }));
    circle2Scale.value = withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));

    circle1Opacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    circle1Scale.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // Logo
    logoOpacity.value = withDelay(250, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(250, withTiming(1, { duration: 550, easing: Easing.out(Easing.back(1.1)) }));

    // Tagline
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    taglineY.value = withDelay(800, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Fade out
    overlayOpacity.value = withDelay(2000, withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onFinish)();
    }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const c1Style = useAnimatedStyle(() => ({
    opacity: circle1Opacity.value,
    transform: [{ scale: circle1Scale.value }],
  }));
  const c2Style = useAnimatedStyle(() => ({
    opacity: circle2Opacity.value,
    transform: [{ scale: circle2Scale.value }],
  }));
  const c3Style = useAnimatedStyle(() => ({
    opacity: circle3Opacity.value,
    transform: [{ scale: circle3Scale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, overlayStyle]}>
      {/* Fond blanc */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff" }]} />

      {/* Cercles roses concentriques */}
      <Animated.View style={[styles.circleBase, styles.c3, c3Style]} />
      <Animated.View style={[styles.circleBase, styles.c2, c2Style]} />
      <Animated.View style={[styles.circleBase, styles.c1, c1Style]} />

      {/* Contenu centré */}
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image
            source={require("../assets/images/assiasweet-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          La confiserie B2B de référence
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 999 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBase: {
    position: "absolute",
    borderRadius: 9999,
    alignSelf: "center",
  },
  c1: {
    width: 220,
    height: 220,
    top: height / 2 - 110,
    backgroundColor: "rgba(233, 30, 123, 0.07)",
  },
  c2: {
    width: 320,
    height: 320,
    top: height / 2 - 160,
    backgroundColor: "rgba(233, 30, 123, 0.045)",
  },
  c3: {
    width: 430,
    height: 430,
    top: height / 2 - 215,
    backgroundColor: "rgba(233, 30, 123, 0.025)",
  },
  logoWrap: {
    width: 148,
    height: 148,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E91E7B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "rgba(233,30,123,0.12)",
  },
  logo: { width: 118, height: 118 },
  tagline: {
    marginTop: 26,
    fontSize: 12,
    color: "#E91E7B",
    fontWeight: "600",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    textAlign: "center",
    opacity: 0.75,
  },
});
