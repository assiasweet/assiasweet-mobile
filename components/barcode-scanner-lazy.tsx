import React, { Suspense } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

const LazyBarcodeScanner = React.lazy(() =>
  import("./barcode-scanner").then((mod) => ({ default: mod.BarcodeScanner }))
);

interface BarcodeScannerLazyProps {
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

/**
 * Wrapper lazy pour BarcodeScanner.
 * N'importe expo-camera que quand le scanner est effectivement affiché,
 * ce qui évite les crashs natifs au démarrage de l'app.
 */
export function BarcodeScannerLazy({ onScanned, onClose }: BarcodeScannerLazyProps) {
  return (
    <Suspense
      fallback={
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E91E7B" />
        </View>
      }
    >
      <LazyBarcodeScanner onScanned={onScanned} onClose={onClose} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});
