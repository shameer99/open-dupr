import React from "react";
import AppHeader from "@/components/AppHeader";
import PageTransition from "./PageTransition";

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
};

export default AppShell;
