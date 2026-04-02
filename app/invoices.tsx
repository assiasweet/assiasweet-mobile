import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { getInvoices } from "@/lib/api";
import type { Invoice } from "@/lib/types";

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownload = async (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      await Linking.openURL(invoice.pdfUrl);
    } else {
      Alert.alert("Facture", "La facture PDF n'est pas encore disponible.");
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color="#E91E7B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Mes factures</Text>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const date = new Date(item.issuedAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
          const isPaid = item.status === "PAYEE";

          return (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#FCE4F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22 }}>🧾</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1E1E" }}>
                  {item.invoiceNumber}
                </Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{date}</Text>
                <View
                  style={{
                    marginTop: 4,
                    alignSelf: "flex-start",
                    backgroundColor: isPaid ? "#D1FAE5" : "#FEF3C7",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "700", color: isPaid ? "#065F46" : "#92400E" }}>
                    {isPaid ? "PAYÉE" : "EN ATTENTE"}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#E91E7B" }}>
                  {Number(item.totalTTC).toFixed(2)} €
                </Text>
                <TouchableOpacity
                  onPress={() => handleDownload(item)}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#1E1E1E", fontWeight: "600" }}>
                    PDF ↓
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🧾</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E1E1E", marginTop: 12 }}>
              Aucune facture
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 4 }}>
              Vos factures apparaîtront ici après livraison
            </Text>
          </View>
        }
      />
    </View>
  );
}
