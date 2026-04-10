/**
 * Écran de paiement PayPal — WebView
 *
 * Flux :
 * 1. Reçoit les params : paypalOrderId, internalOrderId, amount, orderNumber
 * 2. Affiche la page d'approbation PayPal dans une WebView
 * 3. Détecte la redirection vers return_url ou cancel_url
 * 4. Capture le paiement via l'API backend
 * 5. Navigue vers la confirmation ou affiche une erreur
 */
import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { router, useLocalSearchParams } from "expo-router";
import { capturePayPalOrder } from "@/lib/api";

// URLs de retour configurées dans le backend PayPal
const RETURN_URL = "https://assiasweet.vercel.app/checkout/confirmation";
const CANCEL_URL = "https://assiasweet.vercel.app/checkout/confirmation?cancelled=1";

// URL d'approbation PayPal (sandbox ou live selon PAYPAL_MODE)
// Le backend retourne l'ID PayPal, on construit l'URL d'approbation ici
const PAYPAL_APPROVE_BASE = "https://www.sandbox.paypal.com/checkoutnow?token=";
// En production : "https://www.paypal.com/checkoutnow?token="

export default function PayPalPaymentScreen() {
  const params = useLocalSearchParams<{
    paypalOrderId: string;
    internalOrderId: string;
    amount: string;
    orderNumber: string;
  }>();

  const { paypalOrderId, internalOrderId, amount, orderNumber } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  // URL d'approbation PayPal
  const approvalUrl = `${PAYPAL_APPROVE_BASE}${paypalOrderId}`;

  const handleCapture = useCallback(async () => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    setIsCapturing(true);
    try {
      const result = await capturePayPalOrder({
        paypalOrderId,
        internalOrderId,
      });
      if (result.status === "COMPLETED") {
        // Succès — naviguer vers la confirmation
        router.replace({
          pathname: "/(tabs)/orders",
        } as Parameters<typeof router.replace>[0]);
        setTimeout(() => {
          Alert.alert(
            "Paiement confirmé ! 🎉",
            `Votre commande ${result.orderNumber || orderNumber} a été payée via PayPal.\n\nNous préparons votre commande.`,
            [{ text: "Voir mes commandes" }]
          );
        }, 500);
      } else {
        setError(`Paiement non complété (statut : ${result.status}). Veuillez réessayer.`);
        hasProcessed.current = false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la capture PayPal";
      setError(msg);
      hasProcessed.current = false;
    } finally {
      setIsCapturing(false);
    }
  }, [paypalOrderId, internalOrderId, orderNumber]);

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      const url = navState.url;
      if (!url) return;

      // Détecter la redirection vers return_url (paiement approuvé)
      if (url.startsWith(RETURN_URL) && !url.includes("cancelled=1")) {
        handleCapture();
        return;
      }

      // Détecter l'annulation
      if (url.startsWith(CANCEL_URL) || url.includes("cancelled=1")) {
        if (!hasProcessed.current) {
          hasProcessed.current = true;
          Alert.alert(
            "Paiement annulé",
            "Vous avez annulé le paiement PayPal. Votre commande n'a pas été traitée.",
            [
              {
                text: "Réessayer",
                onPress: () => {
                  hasProcessed.current = false;
                  setError(null);
                },
              },
              {
                text: "Retour",
                style: "cancel",
                onPress: () => router.back(),
              },
            ]
          );
        }
      }
    },
    [handleCapture]
  );

  if (!paypalOrderId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erreur : ID PayPal manquant</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Erreur de paiement</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            hasProcessed.current = false;
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Retour au checkout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              "Annuler le paiement ?",
              "Voulez-vous vraiment annuler le paiement PayPal ?",
              [
                { text: "Continuer le paiement", style: "cancel" },
                {
                  text: "Annuler",
                  style: "destructive",
                  onPress: () => router.back(),
                },
              ]
            );
          }}
        >
          <Text style={styles.backButtonText}>✕ Annuler</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Paiement PayPal</Text>
          <Text style={styles.headerAmount}>{Number(amount).toFixed(2)} €</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      {/* Indicateur de capture en cours */}
      {isCapturing && (
        <View style={styles.capturingOverlay}>
          <ActivityIndicator size="large" color="#E91E7B" />
          <Text style={styles.capturingText}>Confirmation du paiement…</Text>
        </View>
      )}

      {/* WebView PayPal */}
      <WebView
        source={{ uri: approvalUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(e) => {
          setError(`Impossible de charger PayPal : ${e.nativeEvent.description}`);
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        // Permettre les cookies pour l'auth PayPal
        sharedCookiesEnabled={Platform.OS === "ios"}
        thirdPartyCookiesEnabled
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#003087" />
            <Text style={styles.loadingText}>Chargement de PayPal…</Text>
          </View>
        )}
      />

      {/* Overlay de chargement initial */}
      {isLoading && !isCapturing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#003087" />
          <Text style={styles.loadingText}>Chargement de PayPal…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    backgroundColor: "#003087",
    borderBottomWidth: 1,
    borderBottomColor: "#002070",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerAmount: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 10,
  },
  loadingText: {
    color: "#003087",
    fontSize: 15,
    fontWeight: "600",
  },
  capturingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 20,
  },
  capturingText: {
    color: "#E91E7B",
    fontSize: 16,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#E91E7B",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
});
