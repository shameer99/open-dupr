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
