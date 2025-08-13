const BASE_URL = "https://api.dupr.gg";

export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/v1/refresh`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-refresh-token": refreshToken,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const newAccessToken =
      typeof data.result === "string" ? data.result : data.result?.accessToken;
    const newRefreshToken = localStorage.getItem("refreshToken");

    if (!newAccessToken || !newRefreshToken) {
      return null;
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

export async function apiFetch(
  path: string,
  options: RequestInit = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (path.includes("/auth/v1/login")) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
  }

  const makeRequest = async (accessToken?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  const token = localStorage.getItem("accessToken");
  let response = await makeRequest(token || undefined);

  if (
    response.status === 401 &&
    localStorage.getItem("refreshToken") &&
    !path.includes("/auth/")
  ) {
    if (isRefreshing && refreshPromise) {
      const refreshResult = await refreshPromise;
      if (
        refreshResult &&
        refreshResult.accessToken &&
        refreshResult.refreshToken
      ) {
        response = await makeRequest(refreshResult.accessToken);
      }
    } else {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();

      try {
        const refreshResult = await refreshPromise;
        if (
          refreshResult &&
          refreshResult.accessToken &&
          refreshResult.refreshToken
        ) {
          localStorage.setItem("accessToken", refreshResult.accessToken);
          localStorage.setItem("refreshToken", refreshResult.refreshToken);

          window.dispatchEvent(
            new CustomEvent("tokenRefreshed", {
              detail: {
                accessToken: refreshResult.accessToken,
                refreshToken: refreshResult.refreshToken,
              },
            })
          );

          response = await makeRequest(refreshResult.accessToken);
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          throw new Error("Session expired");
        }
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
  }

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export const getMyProfile = () => apiFetch("/user/v1/profile");

export const getFollowInfo = (feedId: number) =>
  apiFetch(`/activity/v1/user/${feedId}/followingInfo`);

export const getFollowers = (feedId: number, offset = 0, limit = 20) =>
  apiFetch(
    `/activity/v1/user/${feedId}/followers?offset=${offset}&limit=${limit}`
  );

export const getFollowing = (feedId: number, offset = 0, limit = 20) =>
  apiFetch(
    `/activity/v1/user/${feedId}/followings?offset=${offset}&limit=${limit}`
  );

export const followUser = (feedId: number) =>
  apiFetch(`/activity/v1/user/${feedId}/follow`, { method: "POST" });

export const unfollowUser = (feedId: number) =>
  apiFetch(`/activity/v1/user/${feedId}/follow`, { method: "DELETE" });

export const getOtherUserStats = (userId: number) =>
  apiFetch(`/user/calculated/v1.0/stats/${userId}`);

export const getOtherUserMatchHistory = (
  userId: number,
  offset = 0,
  limit = 25
) => apiFetch(`/player/v1.0/${userId}/history?offset=${offset}&limit=${limit}`);

export const getOtherUserRatingHistory = (userId: number, type = "DOUBLES") =>
  apiFetch(`/player/v1.0/${userId}/rating-history`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });

export const getOtherUserFollowInfo = (userId: number) =>
  apiFetch(`/activity/v1.1/user/${userId}/followingInfo`);

export const getPlayerById = (userId: number) =>
  apiFetch(`/player/v1.0/${userId}`);

export interface SaveMatchTeam {
  player1: number;
  player2?: number | "";
  game1: number;
  game2?: number;
  game3?: number;
  game4?: number;
  game5?: number;
  winner: boolean;
}

export interface SaveMatchRequestBody {
  event?: string;
  eventDate: string; // yyyy-MM-dd
  location?: string;
  matchType: "SIDE_ONLY" | "RALLY";
  format: "SINGLES" | "DOUBLES";
  team1: SaveMatchTeam;
  team2: SaveMatchTeam;
  notify: boolean;
  scores: { first: number; second: number }[];
  clubId?: number;
  league?: string;
  tournament?: string;
  scoreFormatId?: number;
}

export const saveMatch = (body: SaveMatchRequestBody) =>
  apiFetch(`/match/v1.0/save`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export interface PlayerSearchFilter {
  lat: number;
  lng: number;
  radiusInMeters: number;
  rating: { min: number; max: number };
}

export interface PlayerSearchRequest {
  offset: number;
  limit: number;
  query: string;
  filter: PlayerSearchFilter;
  includeUnclaimedPlayers: boolean;
}

export interface PlayerSearchHit {
  id: number;
  fullName: string;
  imageUrl?: string;
  location?: string;
  stats?: { singles?: string; doubles?: string };
}

export const searchPlayers = (searchRequest: PlayerSearchRequest) =>
  apiFetch("/player/v1.0/search", {
    method: "POST",
    body: JSON.stringify(searchRequest),
  });

export const confirmMatch = (matchId: number) =>
  apiFetch("/match/v1.0/confirm", {
    method: "POST",
    body: JSON.stringify({ matchId }),
  });

export const rejectMatch = (matchId: number) =>
  apiFetch(`/match/v1.0/delete/${matchId}`, {
    method: "DELETE",
  });

export const getMyMatchHistory = (offset = 0, limit = 25) =>
  apiFetch(`/match/v1.0/history?offset=${offset}&limit=${limit}`);

export const getPendingMatches = async () => {
  const data = await getMyMatchHistory(0, 25);
  const matches = data?.result?.hits || [];
  return matches.filter((match: { confirmed?: boolean }) => !match.confirmed);
};
