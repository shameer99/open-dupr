import React, { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./theme-base";
import type { ThemeContextValue, ThemeSetting, ResolvedTheme } from "./theme-base";

const THEME_STORAGE_KEY = "open-dupr-theme";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDocumentClass(isDark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeSetting>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeSetting | null;
      return stored ?? "system";
    } catch {
      return "system";
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => getSystemPrefersDark());

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") return systemPrefersDark ? "dark" : "light";
    return theme;
  }, [theme, systemPrefersDark]);

  useEffect(() => {
    applyDocumentClass(resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    try {
      media.addEventListener("change", onChange);
    } catch {
      // Safari - older API
      // @ts-ignore
      media.addListener(onChange);
    }
    return () => {
      try {
        media.removeEventListener("change", onChange);
      } catch {
        // @ts-ignore
        media.removeListener(onChange);
      }
    };
  }, []);

  const setTheme = (next: ThemeSetting) => {
    setThemeState(next);
  };

  const value = useMemo<ThemeContextValue>(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;

