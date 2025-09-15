import React from "react";
import PWAInstall from "@khmyznikov/pwa-install/react-legacy";
import AppHeader from "@/components/AppHeader";

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    const el = document.getElementById("pwa-install") as
      | (HTMLElement & {
          hideDialog?: () => void;
        })
      | null;
    el?.hideDialog?.();
  }, []);
  return (
    <div className="min-h-dvh flex flex-col safe-area-inset-bottom">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <PWAInstall
        id="pwa-install"
        useLocalStorage
        manualApple
        manualChrome
        disableScreenshots
        name="Open DUPR"
        description="A clean, fast, and open-source frontend for DUPR."
        icon="/pwa-192x192.png"
      />
    </div>
  );
};

export default AppShell;
