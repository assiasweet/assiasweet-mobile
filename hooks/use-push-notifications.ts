import { useEffect, useRef } from "react";
import { Platform } from "react-native";

export function usePushNotifications() {
  const initialized = useRef(false);

  useEffect(() => {
    // Ne pas initialiser les notifications sur le web
    if (Platform.OS === "web") return;
    if (initialized.current) return;
    initialized.current = true;

    // Import dynamique pour éviter les erreurs sur le web
    void (async () => {
      try {
        const Notifications = await import("expo-notifications");
        const Device = await import("expo-device");

        // Configure le handler pour afficher les notifs en foreground
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Canal Android
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("assiasweet", {
            name: "AssiaSweet",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#E91E7B",
          });
        }

        // Enregistrement du token push
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus === "granted") {
            try {
              await Notifications.getExpoPushTokenAsync({
                projectId: "assiasweet-mobile",
              });
            } catch {
              // Ignore push token errors
            }
          }
        }
      } catch {
        // Ignore notification errors on unsupported platforms
      }
    })();
  }, []);

  return {};
}
