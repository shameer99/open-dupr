import { useEffect, useState } from "react";
import { ThemeProviderContext } from "./ThemeContext";

type Theme = "dark" | "light" | "system";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme?: Theme) => {
    if (newTheme) {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    } else {
      const newToggledTheme = theme === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, newToggledTheme);
      setThemeState(newToggledTheme);
    }
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
