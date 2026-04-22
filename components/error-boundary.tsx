import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";


interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary global — attrape les erreurs JS non gérées et affiche
 * un écran de récupération au lieu de crasher l'app.
 *
 * Utilisé dans le root _layout.tsx pour envelopper toute l'app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur pour le debugging
    console.error("[ErrorBoundary] Crash attrapé:", error.message);
    console.error("[ErrorBoundary] Stack:", errorInfo.componentStack);
  }

  handleRestart = () => {
    // Reset l'état pour relancer le rendu de l'app
    this.setState({ hasError: false, error: null });
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Oups !</Text>
            <Text style={styles.message}>
              L'application a rencontré une erreur inattendue.
            </Text>
            <Text style={styles.errorText} numberOfLines={3}>
              {this.state.error?.message ?? "Erreur inconnue"}
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={this.handleRestart}>
              <Text style={styles.primaryBtnText}>Redémarrer l'app</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={this.handleReset}>
              <Text style={styles.secondaryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    gap: 12,
    maxWidth: 320,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E1E1E",
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  errorText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontFamily: "monospace",
    marginTop: 4,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: "#1A5C2A",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  secondaryBtnText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },
});
