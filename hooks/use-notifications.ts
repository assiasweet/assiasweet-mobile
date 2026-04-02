import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { registerPushToken } from "@/lib/api";

// Configurer le handler global (appeler une seule fois au démarrage)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook pour demander les permissions de notifications push et enregistrer le token
 * sur le serveur. À utiliser dans le layout racine après authentification.
 */
export function useNotifications(isAuthenticated: boolean) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Configurer le canal Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("assiasweet", {
        name: "AssiaSweet",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E91E7B",
        sound: "default",
      });
    }

    // Demander les permissions et enregistrer le token
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        try {
          await registerPushToken(token);
        } catch {
          // Silencieux si l'endpoint n'est pas encore disponible
        }
      }
    });

    // Écouter les notifications reçues en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification reçue — le handler global s'occupe de l'affichage
      }
    );

    // Écouter les taps sur les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Navigation possible ici si besoin
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Les notifications push ne fonctionnent que sur un vrai appareil
  if (!Device.isDevice) return null;
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "assiasweet-mobile",
    });
    return tokenData.data;
  } catch {
    return null;
  }
}
