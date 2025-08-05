/**
 * DUPR API Client
 * Handles all API interactions with the DUPR backend
 * Based on API_GUIDE.md specifications
 */

class DUPRApi {
  constructor() {
    this.baseURL = "https://api.dupr.gg";
    this.version = "v1";
    this.accessToken = localStorage.getItem("dupr_access_token");
    this.refreshToken = localStorage.getItem("dupr_refresh_token");
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.status === "FAILURE") {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  /**
   * Authentication - Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response with tokens and user data
   */
  async login(email, password) {
    try {
      const response = await this.makeRequest(`/auth/${this.version}/login`, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (response.result) {
        this.accessToken = response.result.accessToken;
        this.refreshToken = response.result.refreshToken;

        // Store tokens securely
        localStorage.setItem("dupr_access_token", this.accessToken);
        localStorage.setItem("dupr_refresh_token", this.refreshToken);

        return response.result;
      }

      throw new Error("Invalid login response");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  /**
   * Logout user and clear tokens
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("dupr_access_token");
    localStorage.removeItem("dupr_refresh_token");
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile() {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(`/user/${this.version}/profile`);
      return response.result;
    } catch (error) {
      console.error("Failed to get user profile:", error);
      throw error;
    }
  }

  /**
   * Get user match history
   * @param {number} offset - Starting position for pagination
   * @param {number} limit - Number of matches to return (max 25)
   * @returns {Promise<Object>} Match history data
   */
  async getMatchHistory(offset = 0, limit = 10) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/match/${this.version}/history?offset=${offset}&limit=${limit}`
      );
      return response.result;
    } catch (error) {
      console.error("Failed to get match history:", error);
      throw error;
    }
  }

  /**
   * Get filtered match history
   * @param {Object} searchParams - Search parameters including filters
   * @returns {Promise<Object>} Filtered match history data
   */
  async getFilteredMatchHistory(searchParams) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/match/${this.version}/history`,
        {
          method: "POST",
          body: JSON.stringify(searchParams),
        }
      );
      return response.result;
    } catch (error) {
      console.error("Failed to get filtered match history:", error);
      throw error;
    }
  }

  /**
   * Search players
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Player search results
   */
  async searchPlayers(searchParams) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      // Format request according to API spec
      const requestBody = {
        offset: searchParams.offset || 0,
        limit: searchParams.limit || 10,
        query: searchParams.query || "",
        filter: {
          // Default location (will be overridden if provided)
          lat: 0,
          lng: 0,
          radiusInMeters: 100000, // 100km default radius
          ...searchParams.filter,
        },
        includeUnclaimedPlayers:
          searchParams.includeUnclaimedPlayers !== undefined
            ? searchParams.includeUnclaimedPlayers
            : false,
      };

      const response = await this.makeRequest(
        `/player/${this.version}/search`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );
      return response.result;
    } catch (error) {
      console.error("Failed to search players:", error);
      throw error;
    }
  }

  /**
   * Get player rating history
   * @param {number} playerId - Player ID
   * @param {number} offset - Starting position for pagination
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object>} Rating history data
   */
  async getPlayerRatingHistory(playerId, offset = 0, limit = 10) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/player/${this.version}/${playerId}/rating-history?offset=${offset}&limit=${limit}`
      );
      return response.result;
    } catch (error) {
      console.error("Failed to get player rating history:", error);
      throw error;
    }
  }

  /**
   * Get player match history (for any player)
   * @param {number} playerId - Player ID
   * @param {number} offset - Starting position for pagination
   * @param {number} limit - Number of matches to return
   * @returns {Promise<Object>} Player match history data
   */
  async getPlayerMatchHistory(playerId, offset = 0, limit = 10) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/player/${this.version}/${playerId}/history?offset=${offset}&limit=${limit}`
      );
      return response.result;
    } catch (error) {
      console.error("Failed to get player match history:", error);
      throw error;
    }
  }

  /**
   * Get player profile information using proper endpoints
   * @param {number} playerId - Player ID
   * @param {string} playerName - Player name (from followers/following data)
   * @param {string} playerImage - Player image URL (from followers/following data)
   * @returns {Promise<Object>} Player profile data
   */
  async getPlayerProfile(playerId, playerName, playerImage = null) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      // Get player statistics using the correct endpoint
      const statsResponse = await this.makeRequest(
        `/user/calculated/${this.version}/stats/${playerId}`
      );

      // Get rating history using the corrected endpoint (POST with body)
      const ratingHistoryResponse = await this.makeRequest(
        `/player/${this.version}/${playerId}/rating-history`,
        {
          method: "POST",
          body: JSON.stringify({
            type: "DOUBLES", // Default to doubles
            limit: 10,
          }),
        }
      );

      return {
        id: playerId,
        fullName: playerName,
        name: playerName,
        imageUrl: playerImage,
        profileImage: playerImage,
        stats: statsResponse.result,
        ratingHistory: ratingHistoryResponse.result?.ratingHistory || [],
      };
    } catch (error) {
      console.error("Failed to get player profile:", error);
      throw error;
    }
  }

  /**
   * Follow a user
   * @param {number} feedId - User feed ID to follow
   * @returns {Promise<Object>} Follow response
   */
  async followUser(feedId) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/activity/${this.version}/user/${feedId}/follow`,
        {
          method: "POST",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to follow user:", error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @param {number} feedId - User feed ID to unfollow
   * @returns {Promise<Object>} Unfollow response
   */
  async unfollowUser(feedId) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/activity/${this.version}/user/${feedId}/follow`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to unfollow user:", error);
      throw error;
    }
  }

  /**
   * Get user's followers
   * @param {number} feedId - User feed ID (optional, defaults to current user)
   * @param {number} offset - Starting position for pagination
   * @param {number} limit - Number of followers to return
   * @returns {Promise<Object>} Followers list
   */
  async getFollowers(feedId = null, offset = 0, limit = 10) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      // If no feedId provided, use current user's profile endpoint to get their ID
      const targetFeedId = feedId || (await this.getUserProfile()).id;

      const response = await this.makeRequest(
        `/activity/${this.version}/user/${targetFeedId}/followers?offset=${offset}&limit=${limit}`
      );

      // Activity endpoints return 'results' array, not 'result.hits'
      const formattedResponse = {
        hits: response.results || [],
        hasMore: false, // Activity endpoints don't provide pagination info
        total: response.results?.length || 0,
      };

      return formattedResponse;
    } catch (error) {
      console.error("Failed to get followers:", error);
      throw error;
    }
  }

  /**
   * Get user's following list
   * @param {number} feedId - User feed ID (optional, defaults to current user)
   * @param {number} offset - Starting position for pagination
   * @param {number} limit - Number of following to return
   * @returns {Promise<Object>} Following list
   */
  async getFollowing(feedId = null, offset = 0, limit = 10) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      // If no feedId provided, use current user's profile endpoint to get their ID
      const targetFeedId = feedId || (await this.getUserProfile()).id;

      const response = await this.makeRequest(
        `/activity/${this.version}/user/${targetFeedId}/followings?offset=${offset}&limit=${limit}`
      );

      // Activity endpoints return 'results' array, not 'result.hits'
      const formattedResponse = {
        hits: response.results || [],
        hasMore: false, // Activity endpoints don't provide pagination info
        total: response.results?.length || 0,
      };

      return formattedResponse;
    } catch (error) {
      console.error("Failed to get following list:", error);
      throw error;
    }
  }

  /**
   * Get following info (counts and follow status)
   * @param {number} feedId - User feed ID
   * @returns {Promise<Object>} Following info
   */
  async getFollowingInfo(feedId) {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await this.makeRequest(
        `/activity/${this.version}/user/${feedId}/followingInfo`
      );
      return response.result;
    } catch (error) {
      console.error("Failed to get following info:", error);
      throw error;
    }
  }
}

// Export for use in other modules
window.DUPRApi = DUPRApi;
