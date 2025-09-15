import { createContext } from "react";

export type ThemeSetting = "system" | "light" | "dark";

export type ResolvedTheme = "light" | "dark";

export type ThemeContextValue = {
  theme: ThemeSetting;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeSetting) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

