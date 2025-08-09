/**
 * Main Application Logic
 * Coordinates between API client and UI manager
 * Implements MVP functionality: auth, profile, match history
 */

class OpenDUPRApp {
  constructor() {
    this.api = new DUPRApi();
    this.ui = new DUPRUIManager();
    this.currentUser = null;
    this.matchHistory = {
      data: [],
      hasMore: false,
      offset: 0,
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("🏓 Initializing Open DUPR...");

    // Initialize UI
    this.ui.init();

    // Check if user is already authenticated
    if (this.api.isAuthenticated()) {
      console.log("🔐 User is authenticated, loading data...");
      try {
        const isVerified = await this.loadUserData();
        if (isVerified) {
          this.ui.showDashboard();
        }
      } catch (error) {
        // If loading data fails (e.g., token expired), show login screen
        this.logout();
        this.ui.showLoginScreen();
      }
    } else {
      this.ui.showLoginScreen();
    }

    this.ui.showLoadingState("app", false);
    console.log("✅ Open DUPR initialized");
  }

  /**
   * Show a specific section of the dashboard
   */
  showSection(sectionName) {
    this.ui.showSection(sectionName);
  }

  /**
   * Handle user login
   */
  async login(email, password) {
    try {
      console.log("🔐 Attempting login...");

      const authData = await this.api.login(email, password);
      this.currentUser = authData.user;

      console.log("✅ Login successful");
      this.ui.showSuccess("Login successful!");

      // Load user data and show dashboard (or verification screen)
      const isVerified = await this.loadUserData();
      if (isVerified) {
        this.ui.showDashboard();
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
      this.ui.showError(
        error.message || "Login failed. Please check your credentials."
      );
      throw error;
    }
  }

  /**
   * Resend email verification (method for UI to call)
   */
  async resendEmailVerification(email) {
    try {
      await this.api.resendEmailVerification(email);
      return true;
    } catch (error) {
      console.error("❌ Failed to resend verification email:", error);
      throw error;
    }
  }

  /**
   * Handle user logout
   */
  logout() {
    this.api.logout();
    this.currentUser = null;
    this.matchHistory = { data: [], hasMore: false, offset: 0 };

    this.ui.showLoginScreen();
    this.ui.showSuccess("Logged out successfully");
  }

  /**
   * Load complete user data (profile and initial match history)
   */
  async loadUserData() {
    try {
      // Load user profile
      const profileData = await this.api.getUserProfile();
      this.currentUser = profileData;

      // Check if email verification is required
      if (profileData.isValidEmail === false) {
        console.log("📧 Email verification required");
        this.ui.showEmailVerification(profileData.email);
        return false; // <-- Return false if user is not verified
      }

      this.ui.displayUserProfile(profileData);

      // Load user's follower/following counts
      try {
        const followingInfo = await this.api.getFollowingInfo(profileData.id);
        this.ui.updateUserFollowerCounts(followingInfo);
      } catch (error) {
        console.warn("Failed to load follower counts:", error);
        // Don't fail the whole operation if follower counts fail
      }

      // Load initial match history for profile view
      await this.loadProfileMatchHistory();

      return true; // <-- Return true if user is verified and data is loaded
    } catch (error) {
      console.error("❌ Failed to load user data:", error);
      throw error;
    }
  }

  /**
   * Check email verification status and redirect accordingly
   */
  async checkEmailVerificationStatus() {
    try {
      console.log("🔍 Checking email verification status...");

      // Get fresh user profile
      const profile = await this.api.getUserProfile();
      this.currentUser = profile;

      if (profile.isValidEmail) {
        console.log("✅ Email verified, showing dashboard");
        await this.loadUserData();
        this.ui.showDashboard();
      } else {
        console.log("📧 Email not verified, showing verification screen");
        this.ui.showEmailVerification(profile.email);
      }
    } catch (error) {
      console.error("❌ Failed to check email verification status:", error);
      this.ui.showError(
        "Failed to check verification status. Please try logging in again."
      );
      this.logout();
    }
  }

  /**
   * Load match history for profile view
   */
  async loadProfileMatchHistory(offset = 0, limit = 10, append = false) {
    try {
      this.ui.showLoadingState("profileMatchHistoryList", true);

      const historyData = await this.api.getMatchHistory(offset, limit);

      if (append) {
        // Append to existing data
        this.matchHistory.data.push(...historyData.hits);
        this.matchHistory.offset = offset + limit;
      } else {
        // Replace existing data
        this.matchHistory.data = historyData.hits;
        this.matchHistory.offset = limit;
      }

      this.matchHistory.hasMore = historyData.hasMore;

      this.ui.displayProfileMatchHistory(
        {
          hits: append ? historyData.hits : this.matchHistory.data,
          hasMore: this.matchHistory.hasMore,
          total: historyData.total,
        },
        append
      );
    } catch (error) {
      console.error("❌ Failed to load profile match history:", error);
      this.ui.showError("Failed to load match history");
    } finally {
      this.ui.showLoadingState("profileMatchHistoryList", false);
    }
  }

  /**
   * Load match history for a specific player
   */
  async loadPlayerMatchHistory(
    playerId,
    offset = 0,
    limit = 10,
    append = false
  ) {
    try {
      this.ui.showLoadingState("playerMatchHistoryList", true);

      const historyData = await this.api.getPlayerMatchHistory(
        playerId,
        offset,
        limit
      );

      if (!this.playerMatchHistory) {
        this.playerMatchHistory = { data: [], offset: 0, hasMore: false };
      }

      if (append) {
        // Append to existing data
        this.playerMatchHistory.data.push(...historyData.hits);
        this.playerMatchHistory.offset = offset + limit;
      } else {
        // Replace existing data
        this.playerMatchHistory.data = historyData.hits;
        this.playerMatchHistory.offset = limit;
      }

      this.playerMatchHistory.hasMore = historyData.hasMore;

      this.ui.displayPlayerMatchHistory(
        {
          hits: append ? historyData.hits : this.playerMatchHistory.data,
          hasMore: this.playerMatchHistory.hasMore,
          total: historyData.total,
        },
        append
      );
    } catch (error) {
      console.error("❌ Failed to load player match history:", error);
      this.ui.showError("Failed to load player match history");
    } finally {
      this.ui.showLoadingState("playerMatchHistoryList", false);
    }
  }

  /**
   * Legacy load match history method (kept for compatibility)
   */
  async loadMatchHistory(offset = 0, limit = 10, append = false) {
    // Redirect to profile match history for now
    await this.loadProfileMatchHistory(offset, limit, append);
  }

  /**
   * Search for players
   */
  async searchPlayers(query) {
    try {
      const searchParams = {
        offset: 0,
        limit: 50, // Fetch more results for a better search experience
        query,
        // Using a default location as per API requirements.
        // A future enhancement could use browser location.
        filter: {
          lat: 30.2672,
          lng: -97.7431,
          radiusInMeters: 20000000, // Wide radius for global search
        },
        includeUnclaimedPlayers: false,
      };

      const results = await this.api.searchPlayers(searchParams);
      this.ui.displaySearchResults(results);
    } catch (error) {
      console.error("❌ Player search failed:", error);
      this.ui.showError("Failed to search for players. Please try again.");
      // Re-throw to be caught by the UI handler if needed
      throw error;
    }
  }

  /**
   * Get player rating history (future enhancement)
   */
  async getPlayerRatingHistory(playerId) {
    try {
      const historyData = await this.api.getPlayerRatingHistory(playerId);
      return historyData;
    } catch (error) {
      console.error("❌ Failed to load rating history:", error);
      this.ui.showError("Failed to load rating history");
      throw error;
    }
  }

  /**
   * View a specific player's profile
   */
  async viewPlayerProfile(playerId, playerName, playerImage = null) {
    try {
      this.ui.showLoadingState("playerProfile", true);

      const playerData = await this.api.getPlayerProfile(
        playerId,
        playerName,
        playerImage
      );
      const followingInfo = await this.api.getFollowingInfo(playerId);

      this.ui.showPlayerProfile({
        ...playerData,
        followingInfo,
      });

      // Load match history for this player
      await this.loadPlayerMatchHistory(playerId);
    } catch (error) {
      console.error("❌ Failed to load player profile:", error);
      this.ui.showError("Failed to load player profile");
      throw error;
    } finally {
      this.ui.showLoadingState("playerProfile", false);
    }
  }

  /**
   * Follow a player
   */
  async followPlayer(playerId, playerName) {
    try {
      await this.api.followUser(playerId);
      this.ui.showSuccess(`Now following ${playerName}`);

      // Refresh the current player profile if viewing it
      if (this.ui.currentPage === "playerProfile") {
        await this.viewPlayerProfile(playerId, playerName);
      }
    } catch (error) {
      console.error("❌ Failed to follow player:", error);
      this.ui.showError("Failed to follow player");
      throw error;
    }
  }

  /**
   * Unfollow a player
   */
  async unfollowPlayer(playerId, playerName) {
    try {
      await this.api.unfollowUser(playerId);
      this.ui.showSuccess(`Unfollowed ${playerName}`);

      // Refresh the current player profile if viewing it
      if (this.ui.currentPage === "playerProfile") {
        await this.viewPlayerProfile(playerId, playerName);
      }
    } catch (error) {
      console.error("❌ Failed to unfollow player:", error);
      this.ui.showError("Failed to unfollow player");
      throw error;
    }
  }

  /**
   * Load followers list
   */
  async loadFollowers(userId = null, offset = 0, limit = 20) {
    try {
      this.ui.showLoadingState("followersList", true);

      const followersData = await this.api.getFollowers(userId, offset, limit);

      this.ui.showFollowersList(followersData, userId);
    } catch (error) {
      console.error("❌ Failed to load followers:", error);
      this.ui.showError("Failed to load followers");
      throw error;
    } finally {
      this.ui.showLoadingState("followersList", false);
    }
  }

  /**
   * Load following list
   */
  async loadFollowing(userId = null, offset = 0, limit = 20) {
    try {
      this.ui.showLoadingState("followingList", true);

      const followingData = await this.api.getFollowing(userId, offset, limit);

      this.ui.showFollowingList(followingData, userId);
    } catch (error) {
      console.error("❌ Failed to load following:", error);
      this.ui.showError("Failed to load following");
      throw error;
    } finally {
      this.ui.showLoadingState("followingList", false);
    }
  }

  /**
   * Handle application errors
   */
  handleError(error, context = "Application") {
    console.error(`❌ ${context} error:`, error);

    if (error.message && error.message.includes("401")) {
      // Token expired or invalid
      this.logout();
      this.ui.showError("Session expired. Please log in again.");
    } else {
      this.ui.showError(error.message || "An unexpected error occurred");
    }
  }

  /**
   * Get current user data
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.api.isAuthenticated() && this.currentUser;
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    window.app = new OpenDUPRApp();
    await window.app.init();
  } catch (error) {
    console.error("Failed to initialize application:", error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: system-ui;">
        <h2>Failed to initialize Open DUPR</h2>
        <p>Please refresh the page to try again.</p>
        <button onclick="location.reload()">Refresh</button>
      </div>
    `;
  }
});

// Handle global errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  if (window.app) {
    window.app.handleError(event.error, "Global");
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  if (window.app) {
    window.app.handleError(event.reason, "Promise");
  }
});
