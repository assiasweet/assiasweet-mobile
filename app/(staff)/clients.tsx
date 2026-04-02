import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getAdminClients, getAdminClient, confirmCustomer } from "@/lib/api";
import type { Customer } from "@/lib/types";

const STATUS_CONFIG: Record<Customer["status"], { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "#92400E", bg: "#FEF3C7" },
  APPROVED: { label: "Approuvé", color: "#065F46", bg: "#D1FAE5" },
  REJECTED: { label: "Rejeté", color: "#991B1B", bg: "#FEE2E2" },
  INACTIVE: { label: "Inactif", color: "#374151", bg: "#F3F4F6" },
};

const FILTERS = [
  { label: "Tous", value: "" },
  { label: "⏳ En attente", value: "PENDING" },
  { label: "✅ Approuvés", value: "APPROVED" },
  { label: "❌ Rejetés", value: "REJECTED" },
];

export default function StaffClientsScreen() {
  const [clients, setClients] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getAdminClients({
        search: search || undefined,
        status: filterStatus || undefined,
      });
      setClients(result.clients ?? []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
  }, [load]);

  const handleOpenClient = async (client: Customer) => {
    try {
      const full = await getAdminClient(client.id);
      setSelectedClient(full);
    } catch {
      setSelectedClient(client);
    }
  };

  const handleConfirm = async (clientId: string) => {
    Alert.alert(
      "Valider le compte",
      "Confirmer l'approbation de ce client B2B ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Approuver",
          onPress: async () => {
            setIsConfirming(true);
            try {
              await confirmCustomer(clientId);
              setClients((prev) =>
                prev.map((c) => (c.id === clientId ? { ...c, status: "APPROVED" } : c))
              );
              if (selectedClient?.id === clientId) {
                setSelectedClient((prev) => prev ? { ...prev, status: "APPROVED" } : null);
              }
              Alert.alert("Compte approuvé", "Le client peut maintenant passer des commandes.");
            } catch (err: unknown) {
              Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible d'approuver");
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Clients</Text>
      </View>

      {/* Recherche */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          <Text style={{ color: "#9CA3AF", fontSize: 16 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, email, SIRET..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14, color: "#1E1E1E" }}
          />
        </View>
      </View>

      {/* Filtres */}
      <View style={{ paddingLeft: 16, marginBottom: 12 }}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterStatus(item.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: filterStatus === item.value ? "#E91E7B" : "#E5E7EB",
                backgroundColor: filterStatus === item.value ? "#FCE4F0" : "white",
              }}
            >
              <Text style={{ color: filterStatus === item.value ? "#E91E7B" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#E91E7B" />
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E91E7B" />
          }
          renderItem={({ item }) => {
            const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.INACTIVE;
            return (
              <TouchableOpacity
                onPress={() => handleOpenClient(item)}
                style={{
                  backgroundColor: "white",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: item.status === "PENDING" ? "#FDE68A" : "#F3F4F6",
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1E1E" }}>
                      {item.companyName}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 1 }}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{item.email}</Text>
                    {item.siret && (
                      <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>SIRET: {item.siret}</Text>
                    )}
                  </View>
                  <View style={{ gap: 6, alignItems: "flex-end" }}>
                    <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: sc.color, fontSize: 11, fontWeight: "700" }}>{sc.label}</Text>
                    </View>
                    {item.status === "PENDING" && (
                      <TouchableOpacity
                        onPress={() => handleConfirm(item.id)}
                        style={{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                      >
                        <Text style={{ color: "#065F46", fontSize: 12, fontWeight: "700" }}>✓ Approuver</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 40 }}>👥</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E1E1E", marginTop: 12 }}>
                Aucun client trouvé
              </Text>
            </View>
          }
        />
      )}

      {/* Modal détail client */}
      <Modal visible={!!selectedClient} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedClient(null)}>
        {selectedClient && (
          <View style={{ flex: 1, backgroundColor: "white" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>Fiche client</Text>
              <TouchableOpacity onPress={() => setSelectedClient(null)}>
                <Text style={{ color: "#9CA3AF", fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              {/* Statut */}
              {(() => {
                const sc = STATUS_CONFIG[selectedClient.status] ?? STATUS_CONFIG.INACTIVE;
                return (
                  <View style={{ backgroundColor: sc.bg, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: sc.color }}>
                        {selectedClient.companyName}
                      </Text>
                      <Text style={{ color: sc.color, opacity: 0.8, fontSize: 13 }}>
                        Statut : {sc.label}
                      </Text>
                    </View>
                    {selectedClient.status === "PENDING" && (
                      <TouchableOpacity
                        onPress={() => handleConfirm(selectedClient.id)}
                        disabled={isConfirming}
                        style={{ backgroundColor: "#065F46", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
                      >
                        {isConfirming ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text style={{ color: "white", fontWeight: "700" }}>Approuver</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}

              {/* Infos */}
              <View style={{ backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280" }}>CONTACT</Text>
                <Row label="Prénom" value={selectedClient.firstName} />
                <Row label="Nom" value={selectedClient.lastName} />
                <Row label="Email" value={selectedClient.email} />
                {selectedClient.phone && <Row label="Téléphone" value={selectedClient.phone} />}
              </View>

              <View style={{ backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280" }}>ENTREPRISE</Text>
                {selectedClient.siret && <Row label="SIRET" value={selectedClient.siret} />}
                {selectedClient.tvaIntra && <Row label="TVA Intra" value={selectedClient.tvaIntra} />}
                {selectedClient.activityType && <Row label="Activité" value={selectedClient.activityType} />}
                {selectedClient.priceList && <Row label="Tarif" value={selectedClient.priceList} />}
              </View>

              {(selectedClient.billingAddress || selectedClient.billingCity) && (
                <View style={{ backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, gap: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280" }}>ADRESSE DE FACTURATION</Text>
                  {selectedClient.billingAddress && <Row label="Rue" value={selectedClient.billingAddress} />}
                  {selectedClient.billingCity && <Row label="Ville" value={`${selectedClient.billingPostalCode} ${selectedClient.billingCity}`} />}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text style={{ fontSize: 13, color: "#9CA3AF", width: 90 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#1E1E1E", fontWeight: "600", flex: 1 }}>{value}</Text>
    </View>
  );
}
