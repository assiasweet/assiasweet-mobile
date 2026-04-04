import { Redirect } from "expo-router";
import { isStaffApp } from "@/lib/app-variant";

/**
 * Point d'entrée de l'application.
 * - Variante "staff"  → interface staff uniquement
 * - Variante "client" → interface client (tabs)
 */
export default function Index() {
  if (isStaffApp) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={"/(staff)" as any} />;
  }
  return <Redirect href="/(tabs)" />;
}
