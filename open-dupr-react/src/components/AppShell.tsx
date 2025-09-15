import React from "react";
import PWAInstall from "@khmyznikov/pwa-install/react-legacy";
import AppHeader from "@/components/AppHeader";

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-dvh flex flex-col safe-area-inset-bottom">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <PWAInstall id="pwa-install" useLocalStorage disableScreenshots />
    </div>
  );
};

export default AppShell;
