import React, { createContext, useCallback, useContext, useMemo } from "react";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
  setColorScheme: () => {},
});

// Appliquer les CSS variables sur le DOM — appelé une seule fois hors du cycle React
if (typeof document !== "undefined") {
  const root = document.documentElement;
  root.dataset.theme = "light";
  const palette = SchemeColors["light"];
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(`--color-${token}`, value as string);
  });
}

// Valeur stable — ne change jamais (on force le mode light)
const STABLE_VALUE: ThemeContextValue = {
  colorScheme: "light",
  setColorScheme: () => {},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={STABLE_VALUE}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}
