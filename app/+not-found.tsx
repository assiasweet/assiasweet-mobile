import { Redirect } from "expo-router";
import { Platform } from "react-native";

// Catch-all pour les routes non trouvées
// Sur le web (prévisualisation), redirige vers la boutique
export default function NotFoundScreen() {
  return <Redirect href={"/(tabs)/index" as never} />;
}
