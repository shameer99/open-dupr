import React, { useState, useEffect } from "react";
import type { UpdateContextType } from "./update-context";
import { UpdateContext } from "./update-context";

interface UpdateProviderProps {
  children: React.ReactNode;
}

export const UpdateProvider: React.FC<UpdateProviderProps> = ({ children }) => {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  const reloadApp = () => {
    try {
      // If service worker update is available, trigger it first
      const windowWithSW = window as unknown as { triggerServiceWorkerUpdate?: () => void };
      if (windowWithSW.triggerServiceWorkerUpdate) {
        windowWithSW.triggerServiceWorkerUpdate();
        // The service worker will reload the page after update
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error during app reload:", error);
      // Fallback to simple reload
      window.location.reload();
    }
  };

  const dismissBanner = () => {
    setShowUpdateBanner(false);
  };

  useEffect(() => {
    try {
      // Check for debug parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("debug_update") === "true") {
        setShowUpdateBanner(true);
      }

      // Listen for service worker update events
      const handleShowUpdateBanner = () => {
        setShowUpdateBanner(true);
      };

      window.addEventListener("show-update-banner", handleShowUpdateBanner);

      return () => {
        window.removeEventListener("show-update-banner", handleShowUpdateBanner);
      };
    } catch (error) {
      console.error("Error setting up update context:", error);
    }
  }, []);

  const value: UpdateContextType = {
    showUpdateBanner,
    setShowUpdateBanner,
    reloadApp,
    dismissBanner,
  };

  return (
    <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
  );
};