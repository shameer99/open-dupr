import React from "react";
import PWAInstall from "@khmyznikov/pwa-install/react-legacy";
import AppHeader from "@/components/AppHeader";
import UpdateBanner from "@/components/ui/update-banner";
import { useUpdate } from "@/lib/useUpdate";

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showUpdateBanner, reloadApp, dismissBanner } = useUpdate();

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
      {showUpdateBanner && (
        <UpdateBanner onReload={reloadApp} onDismiss={dismissBanner} />
      )}
      <div className={showUpdateBanner ? "mt-14" : ""}>
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
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
