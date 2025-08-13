import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { AuthContext } from "./auth-context";
import type { AuthContextType } from "./types";
import { setAccessToken, refreshAccessToken } from "./api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(
    Cookies.get("refreshToken") || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleTokenRefresh = (event: CustomEvent) => {
      const { accessToken, refreshToken: newRefreshToken } = event.detail;
      setTokenState(accessToken);
      setAccessToken(accessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
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

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (Cookies.get("refreshToken")) {
        try {
          const result = await refreshAccessToken();
          if (result) {
            setTokenState(result.accessToken);
            // The access token is already set in api.ts by refreshAccessToken
            setRefreshToken(result.refreshToken);
          } else {
            setTokenState(null);
            setAccessToken(null);
            setRefreshToken(null);
            Cookies.remove("refreshToken");
          }
        } catch (error) {
          console.error("Failed to refresh token on load", error);
          setTokenState(null);
          setAccessToken(null);
          setRefreshToken(null);
          Cookies.remove("refreshToken");
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    setAccessToken(newToken);
  };

  const value: AuthContextType = {
    token,
    refreshToken,
    setToken,
    setRefreshToken: (newRefreshToken: string | null) => {
      setRefreshToken(newRefreshToken);
      if (newRefreshToken) {
        Cookies.set("refreshToken", newRefreshToken, {
          secure: true,
          sameSite: "strict",
        });
      } else {
        Cookies.remove("refreshToken");
      }
    },
    logout: () => {
      setTokenState(null);
      setAccessToken(null);
      setRefreshToken(null);
      Cookies.remove("refreshToken");
    },
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
