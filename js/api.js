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
      const response = await this.makeRequest(
        `/player/${this.version}/search`,
        {
          method: "POST",
          body: JSON.stringify(searchParams),
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
}

// Export for use in other modules
window.DUPRApi = DUPRApi;
