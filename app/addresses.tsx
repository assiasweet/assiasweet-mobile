import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "@/lib/api";
import type { Address } from "@/lib/types";

type AddressForm = Omit<Address, "id" | "customerId">;

const emptyForm: AddressForm = {
  type: "shipping",
  company: "",
  firstName: "",
  lastName: "",
  street: "",
  complement: "",
  city: "",
  postalCode: "",
  country: "FR",
};

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      type: addr.type,
      company: addr.company || "",
      firstName: addr.firstName,
      lastName: addr.lastName,
      street: addr.street,
      complement: addr.complement || "",
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.street.trim() || !form.city.trim() || !form.postalCode.trim()) {
      Alert.alert("Champs requis", "Rue, ville et code postal sont obligatoires.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateAddress(editingId, form);
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await createAddress(form);
        setAddresses((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (err: unknown) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible d'enregistrer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Supprimer", "Supprimer cette adresse ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddress(id);
            setAddresses((prev) => prev.filter((a) => a.id !== id));
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer l'adresse.");
          }
        },
      },
    ]);
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
      <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1E1E1E" }}>Mes adresses</Text>
        <TouchableOpacity
          onPress={openAdd}
          style={{ backgroundColor: "#E91E7B", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              padding: 14,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
                  <View
                    style={{
                      backgroundColor: item.type === "billing" ? "#DBEAFE" : "#FCE4F0",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: item.type === "billing" ? "#1D4ED8" : "#E91E7B" }}>
                      {item.type === "billing" ? "FACTURATION" : "LIVRAISON"}
                    </Text>
                  </View>
                </View>
                {item.company && (
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1E1E" }}>{item.company}</Text>
                )}
                <Text style={{ fontSize: 14, color: "#1E1E1E" }}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{item.street}</Text>
                {item.complement && (
                  <Text style={{ fontSize: 13, color: "#6B7280" }}>{item.complement}</Text>
                )}
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  {item.postalCode} {item.city}
                </Text>
              </View>
              <View style={{ gap: 8, marginLeft: 12 }}>
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <Text style={{ color: "#3B82F6", fontSize: 13, fontWeight: "600" }}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={{ color: "#EF4444", fontSize: 13 }}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>📍</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E1E1E", marginTop: 12 }}>
              Aucune adresse enregistrée
            </Text>
            <TouchableOpacity
              onPress={openAdd}
              style={{ backgroundColor: "#E91E7B", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Ajouter une adresse</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal ajout/modification */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1E1E" }}>
              {editingId ? "Modifier l'adresse" : "Nouvelle adresse"}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ color: "#9CA3AF", fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
              {/* Type */}
              <View>
                <Text style={lbl}>Type d'adresse</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {(["shipping", "billing"] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: form.type === t ? "#E91E7B" : "#E5E7EB",
                        backgroundColor: form.type === t ? "#FCE4F0" : "white",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: form.type === t ? "#E91E7B" : "#6B7280", fontWeight: "600", fontSize: 13 }}>
                        {t === "shipping" ? "🚚 Livraison" : "🧾 Facturation"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={lbl}>Entreprise (optionnel)</Text>
                <TextInput value={form.company} onChangeText={(v) => setForm((f) => ({ ...f, company: v }))} style={inp} placeholder="Nom de l'entreprise" placeholderTextColor="#9CA3AF" />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>Prénom</Text>
                  <TextInput value={form.firstName} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} style={inp} placeholder="Jean" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>Nom</Text>
                  <TextInput value={form.lastName} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} style={inp} placeholder="Dupont" placeholderTextColor="#9CA3AF" />
                </View>
              </View>

              <View>
                <Text style={lbl}>Rue *</Text>
                <TextInput value={form.street} onChangeText={(v) => setForm((f) => ({ ...f, street: v }))} style={inp} placeholder="12 rue de la Paix" placeholderTextColor="#9CA3AF" />
              </View>

              <View>
                <Text style={lbl}>Complément</Text>
                <TextInput value={form.complement} onChangeText={(v) => setForm((f) => ({ ...f, complement: v }))} style={inp} placeholder="Bât. A, étage 2..." placeholderTextColor="#9CA3AF" />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 2 }}>
                  <Text style={lbl}>Ville *</Text>
                  <TextInput value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} style={inp} placeholder="Paris" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>Code postal *</Text>
                  <TextInput value={form.postalCode} onChangeText={(v) => setForm((f) => ({ ...f, postalCode: v }))} style={inp} placeholder="75001" placeholderTextColor="#9CA3AF" keyboardType="numeric" maxLength={5} />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={{ backgroundColor: "#E91E7B", borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? <ActivityIndicator color="white" /> : (
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                  {editingId ? "Enregistrer" : "Ajouter l'adresse"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const lbl = { fontSize: 13, fontWeight: "600" as const, color: "#1E1E1E", marginBottom: 6 };
const inp = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: "#1E1E1E",
  backgroundColor: "#F9FAFB",
};
