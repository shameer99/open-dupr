const BASE_URL = "https://api.dupr.gg";

// Refresh token function
export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  console.log(
    "[authdebug] refreshAccessToken called, refreshToken exists:",
    !!refreshToken
  );

  if (!refreshToken) {
    console.log("[authdebug] No refresh token found in localStorage");
    return null;
  }

  try {
    console.log(
      "[authdebug] Attempting refresh token request to /auth/v1/refresh"
    );
    const response = await fetch(`${BASE_URL}/auth/v1/refresh`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-refresh-token": refreshToken,
      },
    });

    console.log("[authdebug] Refresh response status:", response.status);

    if (!response.ok) {
      console.log("[authdebug] Refresh failed with status:", response.status);
      const errorText = await response.text();
      console.log("[authdebug] Refresh error response:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("[authdebug] Refresh successful, received response:");
    console.log(
      "[authdebug] Full response data:",
      JSON.stringify(data, null, 2)
    );
    console.log("[authdebug] data.result:", data.result);

    // The refresh endpoint returns a single token string as data.result, not an object
    const newAccessToken =
      typeof data.result === "string" ? data.result : data.result?.accessToken;
    const newRefreshToken = localStorage.getItem("refreshToken"); // Keep existing refresh token

    console.log("[authdebug] Parsed accessToken:", newAccessToken);
    console.log("[authdebug] Using existing refreshToken:", newRefreshToken);
    console.log(
      "[authdebug] New accessToken length:",
      newAccessToken?.length || 0
    );
    console.log(
      "[authdebug] RefreshToken length:",
      newRefreshToken?.length || 0
    );

    if (!newAccessToken || !newRefreshToken) {
      console.log(
        "[authdebug] Missing tokens, accessToken:",
        !!newAccessToken,
        "refreshToken:",
        !!newRefreshToken
      );
      return null;
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.log("[authdebug] Refresh request failed with error:", error);
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
): Promise<any> {
  console.log("[authdebug] apiFetch called for path:", path);

  // For login endpoint, use a simple fetch without token logic
  if (path.includes("/auth/v1/login")) {
    console.log("[authdebug] Login endpoint detected, using simple fetch");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.log(
        "[authdebug] Login request failed with status:",
        response.status
      );
      const errorText = await response.text();
      console.log("[authdebug] Login error response:", errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    console.log("[authdebug] Login request successful");
    return response.json();
  }

  const makeRequest = async (accessToken?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      console.log(
        "[authdebug] Making request with accessToken (length):",
        accessToken.length
      );
    } else {
      console.log("[authdebug] Making request without accessToken");
    }

    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  // First attempt with current token
  let token = localStorage.getItem("accessToken");
  console.log("[authdebug] Current accessToken exists:", !!token);
  console.log(
    "[authdebug] Current refreshToken exists:",
    !!localStorage.getItem("refreshToken")
  );

  let response = await makeRequest(token || undefined);
  console.log("[authdebug] Initial request response status:", response.status);

  // If 401 and we have a refresh token, try to refresh (but not for auth endpoints)
  if (
    response.status === 401 &&
    localStorage.getItem("refreshToken") &&
    !path.includes("/auth/")
  ) {
    console.log("[authdebug] Got 401, attempting token refresh...");

    // If we're already refreshing, wait for it
    if (isRefreshing && refreshPromise) {
      console.log(
        "[authdebug] Already refreshing, waiting for existing promise"
      );
      const refreshResult = await refreshPromise;
      if (
        refreshResult &&
        refreshResult.accessToken &&
        refreshResult.refreshToken
      ) {
        console.log("[authdebug] Using tokens from existing refresh");
        response = await makeRequest(refreshResult.accessToken);
      } else {
        console.log("[authdebug] Existing refresh failed, tokens missing");
      }
    } else {
      // Start refresh process
      console.log("[authdebug] Starting new refresh process");
      isRefreshing = true;
      refreshPromise = refreshAccessToken();

      try {
        const refreshResult = await refreshPromise;
        if (
          refreshResult &&
          refreshResult.accessToken &&
          refreshResult.refreshToken
        ) {
          console.log(
            "[authdebug] Refresh successful, updating localStorage and retrying request"
          );
          // Update localStorage with new tokens
          localStorage.setItem("accessToken", refreshResult.accessToken);
          localStorage.setItem("refreshToken", refreshResult.refreshToken);

          // Trigger a custom event to update auth context
          window.dispatchEvent(
            new CustomEvent("tokenRefreshed", {
              detail: {
                accessToken: refreshResult.accessToken,
                refreshToken: refreshResult.refreshToken,
              },
            })
          );

          // Retry the original request
          response = await makeRequest(refreshResult.accessToken);
          console.log(
            "[authdebug] Retry request response status:",
            response.status
          );
        } else {
          console.log("[authdebug] Refresh failed, redirecting to login");
          // Refresh failed, redirect to login
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
  } else if (response.status === 401) {
    console.log("[authdebug] Got 401 but no refresh token available");
  }

  // If still 401 after refresh attempt, redirect to login
  if (response.status === 401) {
    console.log(
      "[authdebug] Still 401 after refresh attempt, redirecting to login"
    );
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    console.log("[authdebug] Request failed with status:", response.status);
    throw new Error(`API request failed with status ${response.status}`);
  }

  console.log("[authdebug] Request successful");
  return response.json();
}

export const getMyProfile = () => apiFetch("/user/v1/profile");

// Social/Follow API functions
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

// Other User Profile API functions
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

// Player profile by ID (includes ratings.singles/doubles)
export const getPlayerById = (userId: number) =>
  apiFetch(`/player/v1.0/${userId}`);

// Matches API
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

// Player search
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

// Match validation
export const confirmMatch = (matchId: number) =>
  apiFetch("/match/v1.0/confirm", {
    method: "POST",
    body: JSON.stringify({ matchId }),
  });

export const rejectMatch = (matchId: number) =>
  apiFetch(`/match/v1.0/delete/${matchId}`, {
    method: "DELETE",
  });

// Current user match history (for self)
export const getMyMatchHistory = (offset = 0, limit = 25) =>
  apiFetch(`/match/v1.0/history?offset=${offset}&limit=${limit}`);

// Helper function to get pending matches for validation
export const getPendingMatches = async () => {
  // Get the current user's match history to check for pending validation
  // Use maximum allowed limit of 25 for this endpoint
  const data = await getMyMatchHistory(0, 25);
  const matches = data?.result?.hits || [];
  return matches.filter((match: { confirmed?: boolean }) => !match.confirmed);
};

// Debug helper function to test refresh endpoint directly
export const debugTestRefresh = async () => {
  console.log("[authdebug] === TESTING REFRESH ENDPOINT DIRECTLY ===");
  const result = await refreshAccessToken();
  console.log("[authdebug] Direct refresh test result:", result);
  return result;
};
