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
      try {
        await this.loadUserData();
        this.ui.showDashboard();
      } catch (error) {
        console.error("Failed to load user data:", error);
        this.api.logout();
        this.ui.showLoginScreen();
      }
    } else {
      this.ui.showLoginScreen();
    }

    this.ui.showLoadingState("app", false);
    console.log("✅ Open DUPR initialized");
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

      // Load user data and show dashboard
      await this.loadUserData();
      this.ui.showDashboard();
    } catch (error) {
      console.error("❌ Login failed:", error);
      this.ui.showError(
        error.message || "Login failed. Please check your credentials."
      );
      throw error;
    }
  }

  /**
   * Handle user logout
   */
  logout() {
    console.log("🚪 Logging out...");

    this.api.logout();
    this.currentUser = null;
    this.matchHistory = { data: [], hasMore: false, offset: 0 };

    this.ui.showLoginScreen();
    this.ui.showSuccess("Logged out successfully");

    console.log("✅ Logout complete");
  }

  /**
   * Load complete user data (profile and initial match history)
   */
  async loadUserData() {
    try {
      console.log("📊 Loading user data...");

      // Load user profile
      const profileData = await this.api.getUserProfile();
      this.currentUser = profileData;
      this.ui.displayUserProfile(profileData);

      // Load initial match history
      await this.loadMatchHistory();

      console.log("✅ User data loaded");
    } catch (error) {
      console.error("❌ Failed to load user data:", error);
      throw error;
    }
  }

  /**
   * Load match history with pagination
   */
  async loadMatchHistory(offset = 0, limit = 10, append = false) {
    try {
      console.log(
        `📋 Loading match history (offset: ${offset}, limit: ${limit})...`
      );

      this.ui.showLoadingState("matchHistoryList", true);

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

      this.ui.displayMatchHistory(
        {
          hits: append ? historyData.hits : this.matchHistory.data,
          hasMore: this.matchHistory.hasMore,
          total: historyData.total,
        },
        append
      );

      console.log(
        `✅ Match history loaded (${historyData.hits.length} matches)`
      );
    } catch (error) {
      console.error("❌ Failed to load match history:", error);
      this.ui.showError("Failed to load match history");
    } finally {
      this.ui.showLoadingState("matchHistoryList", false);
    }
  }

  /**
   * Search for players (future enhancement)
   */
  async searchPlayers(query, filters = {}) {
    try {
      console.log(`🔍 Searching players: ${query}`);

      const searchParams = {
        offset: 0,
        limit: 10,
        query,
        filters,
      };

      const results = await this.api.searchPlayers(searchParams);
      console.log(`✅ Player search complete (${results.hits.length} results)`);

      return results;
    } catch (error) {
      console.error("❌ Player search failed:", error);
      this.ui.showError("Failed to search players");
      throw error;
    }
  }

  /**
   * Get player rating history (future enhancement)
   */
  async getPlayerRatingHistory(playerId) {
    try {
      console.log(`📈 Loading rating history for player ${playerId}`);

      const historyData = await this.api.getPlayerRatingHistory(playerId);
      console.log(
        `✅ Rating history loaded (${historyData.hits.length} entries)`
      );

      return historyData;
    } catch (error) {
      console.error("❌ Failed to load rating history:", error);
      this.ui.showError("Failed to load rating history");
      throw error;
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
