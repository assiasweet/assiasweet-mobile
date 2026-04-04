import { Redirect } from "expo-router";
import { isStaffApp } from "@/lib/app-variant";

// Catch-all pour les routes non trouvées
// Redirige vers la section appropriée selon la variante
export default function NotFoundScreen() {
  if (isStaffApp) {
    return <Redirect href={"/(staff)" as never} />;
  }
  return <Redirect href={"/(tabs)/index" as never} />;
}
