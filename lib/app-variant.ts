/**
 * Détecte la variante de l'application au runtime.
 *
 * - En build EAS : APP_VARIANT est injecté dans Constants.expoConfig.extra
 * - En développement local : fallback sur "client"
 */
import Constants from "expo-constants";

export type AppVariant = "client" | "staff";

export const APP_VARIANT: AppVariant =
  (Constants.expoConfig?.extra?.appVariant as AppVariant) ?? "client";

export const isStaffApp = APP_VARIANT === "staff";
export const isClientApp = APP_VARIANT === "client";

/** Couleur primaire de la variante courante */
export const PRIMARY_COLOR: string =
  (Constants.expoConfig?.extra?.primaryColor as string) ?? "#E91E7B";
