// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// ─────────────────────────────────────────────────────────────────────────────
// APP_VARIANT : "client" (défaut) | "staff"
// Injecté via la variable d'environnement APP_VARIANT au moment du build EAS.
// ─────────────────────────────────────────────────────────────────────────────
const APP_VARIANT = (process.env.APP_VARIANT ?? "client") as "client" | "staff";
const isStaff = APP_VARIANT === "staff";

// Bundle IDs fixes (pas générés dynamiquement)
const CLIENT_BUNDLE_ID = "com.assiasweet.client";
const STAFF_BUNDLE_ID  = "com.assiasweet.staff";

// Schéma de deep link
const CLIENT_SCHEME = "assiasweet";
const STAFF_SCHEME  = "assiasweet-staff";

// ─────────────────────────────────────────────────────────────────────────────
// Identité visuelle par variante
// ─────────────────────────────────────────────────────────────────────────────
const variant = {
  client: {
    appName:        "AssiaSweet",
    appSlug:        "assiasweet",
    bundleId:       CLIENT_BUNDLE_ID,
    scheme:         CLIENT_SCHEME,
    icon:           "./assets/images/icon-client.png",
    splashIcon:     "./assets/images/splash-icon-client.png",
    splashBg:       "#ffffff",
    adaptiveBg:     "#E91E7B",
    adaptiveFg:     "./assets/images/android-icon-foreground-client.png",
    primaryColor:   "#E91E7B",
    logoUrl:        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663351627308/rSoqYBWvNEfAhgCm.png",
  },
  staff: {
    appName:        "AssiaSweet Staff",
    appSlug:        "assiasweet",   // slug EAS immuable
    bundleId:       STAFF_BUNDLE_ID,
    scheme:         STAFF_SCHEME,
    icon:           "./assets/images/icon-staff.png",
    splashIcon:     "./assets/images/splash-icon-staff.png",
    splashBg:       "#f0faf2",
    adaptiveBg:     "#1A5C2A",
    adaptiveFg:     "./assets/images/android-icon-foreground-staff.png",
    primaryColor:   "#1A5C2A",
    logoUrl:        "",
  },
} as const;

const v = isStaff ? variant.staff : variant.client;

const config: ExpoConfig = {
  name:        v.appName,
  slug:        v.appSlug,
  version:     "1.0.0",
  orientation: "portrait",
  icon:        v.icon,
  scheme:      v.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: v.bundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor:  v.adaptiveBg,
      foregroundImage:  v.adaptiveFg,
      backgroundImage:  "./assets/images/android-icon-background.png",
      monochromeImage:  "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: (!isStaff) as true,
    predictiveBackGestureEnabled: false,
    package: v.bundleId,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action:     "VIEW",
        autoVerify: true,
        data: [{ scheme: v.scheme, host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output:  "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission:    "Autoriser $(PRODUCT_NAME) à accéder à votre caméra pour scanner les codes-barres.",
        microphonePermission: "Autoriser $(PRODUCT_NAME) à accéder à votre microphone.",
        recordAudioAndroid:  false,
      },
    ],
    [
      "expo-audio",
      { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." },
    ],
    ...(!isStaff ? [[
      "expo-video",
      { supportsBackgroundPlayback: true, supportsPictureInPicture: true },
    ] as const] : []) as any[],
    [
      "expo-splash-screen",
      {
        image:       v.splashIcon,
        imageWidth:  200,
        resizeMode:  "contain",
        backgroundColor: v.splashBg,
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs:   ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes:     true,
    reactCompiler:   true,
  },
  extra: {
    // Exposé à l'app via Constants.expoConfig.extra
    appVariant:   APP_VARIANT,
    primaryColor: v.primaryColor,
    eas: {
      projectId: "06c5fb81-8ce7-4462-9e3d-9ec6a3f488a4",
    },
  },
  owner: "zohil",
};

export default config;
