import React from "react";
import AppHeader from "@/components/AppHeader";

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

export default AppShell;
