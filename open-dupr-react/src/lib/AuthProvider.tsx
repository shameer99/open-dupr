import React, { useState, useEffect } from "react";
import { AuthContext } from "./auth-context";
import type { AuthContextType } from "./types";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken")
  );

  useEffect(() => {
    const handleTokenRefresh = (event: CustomEvent) => {
      const { accessToken, refreshToken: newRefreshToken } = event.detail;
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
    };

    window.addEventListener(
      "tokenRefreshed",
      handleTokenRefresh as EventListener
    );
    return () => {
      window.removeEventListener(
        "tokenRefreshed",
        handleTokenRefresh as EventListener
      );
    };
  }, []);

  const value: AuthContextType = {
    token,
    refreshToken,
    setToken: (newToken: string | null) => {
      setToken(newToken);
      if (newToken) {
        localStorage.setItem("accessToken", newToken);
      } else {
        localStorage.removeItem("accessToken");
      }
    },
    setRefreshToken: (newRefreshToken: string | null) => {
      setRefreshToken(newRefreshToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }
    },
    logout: () => {
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
