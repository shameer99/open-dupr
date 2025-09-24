import { createContext } from "react";

export interface UpdateContextType {
  showUpdateBanner: boolean;
  setShowUpdateBanner: (show: boolean) => void;
  reloadApp: () => void;
  dismissBanner: () => void;
}

export const UpdateContext = createContext<UpdateContextType | undefined>(undefined);