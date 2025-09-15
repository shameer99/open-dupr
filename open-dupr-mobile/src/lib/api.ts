import * as SecureStore from "expo-secure-store";

const BASE_URL = "https://api.dupr.gg";

let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

export async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/v1/refresh`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-refresh-token": refreshToken,
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const newAccessToken = typeof data.result === "string" ? data.result : data.result?.accessToken;
    const newRefreshToken = await SecureStore.getItemAsync("refreshToken");
    if (!newAccessToken || !newRefreshToken) return null;
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const makeRequest = async (accessToken?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
  };

  if (path.includes("/auth/v1/login")) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (!response.ok) {
      const msg = `API request failed with status ${response.status}`;
      const err = new Error(msg) as Error & { response?: { status: number; data: unknown } };
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {}
      err.response = { status: response.status, data };
      throw err;
    }
    return response.json();
  }

  const token = await SecureStore.getItemAsync("accessToken");
  let response = await makeRequest(token || undefined);

  if (response.status === 401 && (await SecureStore.getItemAsync("refreshToken")) && !path.includes("/auth/")) {
    if (isRefreshing && refreshPromise) {
      const r = await refreshPromise;
      if (r?.accessToken) response = await makeRequest(r.accessToken);
    } else {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
      try {
        const r = await refreshPromise;
        if (r?.accessToken && r?.refreshToken) {
          await SecureStore.setItemAsync("accessToken", r.accessToken);
          await SecureStore.setItemAsync("refreshToken", r.refreshToken);
          response = await makeRequest(r.accessToken);
        } else {
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");
          throw new Error("Session expired");
        }
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
  }

  if (response.status === 401) {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const msg = `API request failed with status ${response.status}`;
    const err = new Error(msg) as Error & { response?: { status: number; data: unknown } };
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {}
    err.response = { status: response.status, data };
    throw err;
  }

  return response.json();
}

export const getMyProfile = () => apiFetch("/user/v1.0/profile");
export const getFeed = (feedId: number, limit = 10) => apiFetch(`/activity/v1.1/user/${feedId}?limit=${limit}`);

