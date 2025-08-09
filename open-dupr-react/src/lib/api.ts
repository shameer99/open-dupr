const BASE_URL = "https://api.dupr.gg";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token is invalid or expired, log the user out
    localStorage.removeItem("accessToken");
    // Redirect to login page
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export const getMyProfile = () => apiFetch("/user/v1/profile");
export const getPlayerProfile = (id: string) =>
  apiFetch(`/player/search/byDuprId?duprId=${id}`);
