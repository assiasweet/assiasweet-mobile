import { useCallback, useEffect, useRef } from "react";
import { Platform, InteractionManager } from "react-native";

/**
 * Hook pour jouer le son ka-ching quand une nouvelle commande arrive.
 * Utiliser dans le dashboard staff et l'écran des commandes staff.
 *
 * Le player audio est initialisé de manière lazy (après les interactions)
 * pour éviter les crashs natifs au redémarrage de l'app sur Android.
 *
 * Usage:
 * ```tsx
 * const playKaching = useKaching();
 * // Quand une nouvelle commande est détectée :
 * playKaching();
 * ```
 */
export function useKaching() {
  const initialized = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (Platform.OS === "web") return;

    // Lazy-load : initialiser le mode audio APRÈS les interactions
    // pour éviter les crashs natifs au redémarrage Android
    const task = InteractionManager.runAfterInteractions(async () => {
      if (!mountedRef.current) return;

      try {
        const audioModule = await import("expo-audio");

        // Configurer le mode audio (playsInSilentMode pour iOS)
        if (Platform.OS === "ios") {
          await audioModule.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
        }

        initialized.current = true;
      } catch {
        // Si expo-audio n'est pas disponible, on ignore silencieusement
      }
    });

    return () => {
      mountedRef.current = false;
      task.cancel();
      initialized.current = false;
    };
  }, []);

  const playKaching = useCallback(async () => {
    if (Platform.OS === "web") return;
    if (!mountedRef.current) return;

    try {
      const audioModule = await import("expo-audio");
      const sound = require("@/assets/sounds/kaching.wav");

      // Créer un player éphémère via l'API impérative (pas de hook)
      const tempPlayer = audioModule.createAudioPlayer(sound);
      tempPlayer.play();

      // Libérer après la lecture (3s max pour un son court)
      setTimeout(() => {
        try {
          tempPlayer.remove();
        } catch {
          // ignore
        }
      }, 3000);
    } catch {
      // Silencieux si le son ne peut pas être joué
    }
  }, []);

  return playKaching;
}
