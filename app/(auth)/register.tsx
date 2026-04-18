import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { registerCustomer } from "@/lib/api";
import { ScreenContainer } from "@/components/screen-container";

const nav = router as unknown as { back: () => void; replace: (p: string) => void };

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Étape 1 — Informations entreprise
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [activityType, setActivityType] = useState("");

  // Étape 2 — Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Étape 3 — Adresses
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [sameAddress, setSameAddress] = useState(true);
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  const [vatNumber, setVatNumber] = useState("");

  const activityTypes = ["Épicerie / Superette", "Forain / Marché", "Boulangerie / Pâtisserie", "Revendeur", "Grossiste", "Autre"];

  const handleNext = () => {
    if (step === 1) {
      if (!companyName.trim() || !siret.trim()) {
        Alert.alert("Champs requis", "Veuillez renseigner le nom de l'entreprise et le SIRET.");
        return;
      }
      if (siret.replace(/\s/g, "").length !== 14) {
        Alert.alert("SIRET invalide", "Le numéro SIRET doit contenir 14 chiffres.");
        return;
      }
    }
    if (step === 2) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
        Alert.alert("Champs requis", "Veuillez remplir tous les champs obligatoires.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 8) {
        Alert.alert("Mot de passe trop court", "Minimum 8 caractères.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!billingStreet.trim() || !billingCity.trim() || !billingPostalCode.trim()) {
      Alert.alert("Adresse requise", "Veuillez renseigner votre adresse de facturation.");
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        siret: siret.replace(/\s/g, ""),
        vatNumber: vatNumber.trim() || undefined,
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        activityType,
        billingAddress: billingStreet.trim(),
        billingCity: billingCity.trim(),
        billingPostalCode: billingPostalCode.trim(),
        billingCountry: "FR",
        shippingAddress: sameAddress ? billingStreet.trim() : shippingStreet.trim(),
        shippingCity: sameAddress ? billingCity.trim() : shippingCity.trim(),
        shippingPostalCode: sameAddress ? billingPostalCode.trim() : shippingPostalCode.trim(),
        shippingCountry: "FR",
      });

      Alert.alert(
        "Inscription réussie !",
        "Votre compte est en cours de validation. Vous recevrez un email dès qu'il sera activé.",
        [{ text: "OK", onPress: () => nav.replace("/(auth)/pending") }]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      Alert.alert("Erreur", message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={{
            width: s === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: s <= step ? "#E91E7B" : "#E5E7EB",
          }}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-foreground">Votre entreprise</Text>
      <Text className="text-muted text-sm">Étape 1 sur 3 — Informations professionnelles</Text>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">
          Nom de l'entreprise *
        </Text>
        <TextInput
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Ex : Épicerie Dupont"
          placeholderTextColor="#9CA3AF"
          style={inputStyle}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">
          Numéro SIRET * (14 chiffres)
        </Text>
        <TextInput
          value={siret}
          onChangeText={setSiret}
          placeholder="123 456 789 01234"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={17}
          style={inputStyle}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">
          Type d'activité
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {activityTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActivityType(type)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: activityType === type ? "#E91E7B" : "#E5E7EB",
                backgroundColor: activityType === type ? "#FCE4F0" : "white",
              }}
            >
              <Text
                style={{
                  color: activityType === type ? "#E91E7B" : "#6B7280",
                  fontWeight: activityType === type ? "600" : "400",
                  fontSize: 14,
                }}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-foreground">Vos coordonnées</Text>
      <Text className="text-muted text-sm">Étape 2 sur 3 — Informations de contact</Text>

      <View className="flex-row gap-3">
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-medium text-foreground mb-2">Prénom *</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Jean"
            placeholderTextColor="#9CA3AF"
            style={inputStyle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-medium text-foreground mb-2">Nom *</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Dupont"
            placeholderTextColor="#9CA3AF"
            style={inputStyle}
          />
        </View>
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Téléphone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="06 12 34 56 78"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          style={inputStyle}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Email *</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="jean@epicerie.fr"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Mot de passe * (min. 8 caractères)</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={inputStyle}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Confirmer le mot de passe *</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={inputStyle}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="gap-4">
      <Text className="text-xl font-bold text-foreground">Vos adresses</Text>
      <Text className="text-muted text-sm">Étape 3 sur 3 — Adresse de facturation</Text>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Rue *</Text>
        <TextInput
          value={billingStreet}
          onChangeText={setBillingStreet}
          placeholder="12 rue de la Paix"
          placeholderTextColor="#9CA3AF"
          style={inputStyle}
        />
      </View>

      <View className="flex-row gap-3">
        <View style={{ flex: 2 }}>
          <Text className="text-sm font-medium text-foreground mb-2">Ville *</Text>
          <TextInput
            value={billingCity}
            onChangeText={setBillingCity}
            placeholder="Paris"
            placeholderTextColor="#9CA3AF"
            style={inputStyle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-medium text-foreground mb-2">Code postal *</Text>
          <TextInput
            value={billingPostalCode}
            onChangeText={setBillingPostalCode}
            placeholder="75001"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={5}
            style={inputStyle}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setSameAddress(!sameAddress)}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: sameAddress ? "#E91E7B" : "#E5E7EB",
            backgroundColor: sameAddress ? "#E91E7B" : "white",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sameAddress && <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>✓</Text>}
        </View>
        <Text className="text-sm text-foreground">
          Adresse de livraison identique à la facturation
        </Text>
      </TouchableOpacity>

      {!sameAddress && (
        <View className="gap-4 pt-2">
          <Text className="text-sm font-semibold text-foreground">Adresse de livraison</Text>
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Rue</Text>
            <TextInput
              value={shippingStreet}
              onChangeText={setShippingStreet}
              placeholder="12 rue de la Paix"
              placeholderTextColor="#9CA3AF"
              style={inputStyle}
            />
          </View>
          <View className="flex-row gap-3">
            <View style={{ flex: 2 }}>
              <Text className="text-sm font-medium text-foreground mb-2">Ville</Text>
              <TextInput
                value={shippingCity}
                onChangeText={setShippingCity}
                placeholder="Paris"
                placeholderTextColor="#9CA3AF"
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-sm font-medium text-foreground mb-2">Code postal</Text>
              <TextInput
                value={shippingPostalCode}
                onChangeText={setShippingPostalCode}
                placeholder="75001"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={5}
                style={inputStyle}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-white" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep((s) => s - 1) : nav.back())}
            style={{ padding: 8, marginRight: 8 }}
          >
            <Text style={{ fontSize: 24, color: "#1E1E1E" }}>←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Créer un compte</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={{ marginTop: 32 }}>
            {step < 3 ? (
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: "#E91E7B",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  Continuer →
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{
                  backgroundColor: "#E91E7B",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                    Créer mon compte
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: "#1E1E1E",
  backgroundColor: "#F9FAFB",
};
