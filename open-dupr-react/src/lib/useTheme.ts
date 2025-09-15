import { useContext } from "react";
import { ThemeContext } from "./theme-base";
import type { ThemeContextValue } from "./theme-base";

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

