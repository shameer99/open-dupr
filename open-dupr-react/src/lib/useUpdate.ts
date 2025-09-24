import { useContext } from "react";
import { UpdateContext } from "./update-context";

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    console.warn("useUpdate must be used within an UpdateProvider. Falling back to default values.");
    // Provide fallback values instead of throwing error
    return {
      showUpdateBanner: false,
      setShowUpdateBanner: () => {},
      reloadApp: () => window.location.reload(),
      dismissBanner: () => {},
    };
  }
  return context;
};