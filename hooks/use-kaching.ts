import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

const KACHING_SOUND = require("@/assets/sounds/kaching.wav");

/**
 * Hook pour jouer le son ka-ching quand une nouvelle commande arrive.
 * Utiliser dans le dashboard staff et l'écran des commandes staff.
 *
 * Usage:
 * ```tsx
 * const playKaching = useKaching();
 * // Quand une nouvelle commande est détectée :
 * playKaching();
 * ```
 */
export function useKaching() {
  const player = useAudioPlayer(KACHING_SOUND);
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    // Activer la lecture en mode silencieux iOS
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    initialized.current = true;

    return () => {
      player.release();
    };
  }, [player]);

  const playKaching = useCallback(() => {
    if (Platform.OS === "web") return;
    if (!initialized.current) return;

    try {
      // Remettre au début et jouer
      player.seekTo(0);
      player.play();
    } catch {
      // Silencieux si le son ne peut pas être joué
    }
  }, [player]);

  return playKaching;
}
