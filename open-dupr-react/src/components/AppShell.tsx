import React from "react";
import AppHeader from "@/components/AppHeader";

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-dvh flex flex-col safe-area-inset-bottom">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default AppShell;
