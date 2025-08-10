import React, { useState } from "react";
import { AuthContext } from "./auth-context";
import type { AuthContextType } from "./types";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );

  const value: AuthContextType = {
    token,
    setToken: (newToken: string | null) => {
      setToken(newToken);
      if (newToken) {
        localStorage.setItem("accessToken", newToken);
      } else {
        localStorage.removeItem("accessToken");
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
