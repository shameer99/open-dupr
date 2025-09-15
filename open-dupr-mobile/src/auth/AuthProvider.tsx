import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

type AuthContextType = {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string | null) => Promise<void>;
  setRefreshToken: (refreshToken: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [t, r] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
      ]);
      setTokenState(t);
      setRefreshTokenState(r);
    })();
  }, []);

  const setToken = useCallback(async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) await SecureStore.setItemAsync("accessToken", newToken);
    else await SecureStore.deleteItemAsync("accessToken");
  }, []);

  const setRefreshToken = useCallback(async (newRefreshToken: string | null) => {
    setRefreshTokenState(newRefreshToken);
    if (newRefreshToken) await SecureStore.setItemAsync("refreshToken", newRefreshToken);
    else await SecureStore.deleteItemAsync("refreshToken");
  }, []);

  const logout = useCallback(async () => {
    setTokenState(null);
    setRefreshTokenState(null);
    await Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
    ]);
  }, []);

  const value = useMemo<AuthContextType>(() => ({ token, refreshToken, setToken, setRefreshToken, logout }), [token, refreshToken, setToken, setRefreshToken, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

