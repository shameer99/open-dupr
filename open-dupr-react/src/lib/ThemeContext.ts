import { createContext } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme?: Theme) => void;
};

export const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});
