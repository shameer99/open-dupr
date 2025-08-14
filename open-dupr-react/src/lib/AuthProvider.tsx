import React, { useState, useEffect, useMemo, useCallback } from "react";
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

  const setTokenHandler = useCallback((newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, []);

  const setRefreshTokenHandler = useCallback(
    (newRefreshToken: string | null) => {
      setRefreshToken(newRefreshToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }
    },
    []
  );

  const logoutHandler = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      setToken: setTokenHandler,
      setRefreshToken: setRefreshTokenHandler,
      logout: logoutHandler,
    }),
    [
      token,
      refreshToken,
      setTokenHandler,
      setRefreshTokenHandler,
      logoutHandler,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
