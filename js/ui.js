/**
 * UI Management Module
 * Handles DOM manipulation and UI updates
 * Follows the MVP scope: authentication, profile display, match history
 */

class DUPRUIManager {
  constructor() {
    this.currentUser = null;
    this.currentPage = "login";
    this.loadingStates = new Set();
  }

  /**
   * Initialize UI event listeners and setup
   */
  init() {
    this.setupEventListeners();
    this.showLoadingState("app", true);
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.handleLogout.bind(this));
    }

    // Navigation
    const profileTab = document.getElementById("profileTab");
    const historyTab = document.getElementById("historyTab");

    if (profileTab) {
      profileTab.addEventListener("click", () => this.showSection("profile"));
    }

    if (historyTab) {
      historyTab.addEventListener("click", () => this.showSection("history"));
    }

    // Load more matches button
    const loadMoreBtn = document.getElementById("loadMoreMatches");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", this.loadMoreMatches.bind(this));
    }
  }

  /**
   * Handle login form submission
   */
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      this.showError("Please enter both email and password");
      return;
    }

    this.showLoadingState("loginForm", true);
    this.clearError();

    try {
      // This will be called from main.js
      window.app.login(email, password);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.showLoadingState("loginForm", false);
    }
  }

  /**
   * Handle logout
   */
  handleLogout() {
    if (window.app) {
      window.app.logout();
    }
  }

  /**
   * Show login screen
   */
  showLoginScreen() {
    this.currentPage = "login";
    this.updateVisibility();
    document.getElementById("email").focus();
  }

  /**
   * Show main dashboard
   */
  showDashboard() {
    this.currentPage = "dashboard";
    this.updateVisibility();
    this.showSection("profile");
  }

  /**
   * Update element visibility based on current page
   */
  updateVisibility() {
    const loginScreen = document.getElementById("loginScreen");
    const dashboard = document.getElementById("dashboard");

    if (this.currentPage === "login") {
      loginScreen.style.display = "flex";
      dashboard.style.display = "none";
    } else {
      loginScreen.style.display = "none";
      dashboard.style.display = "block";
    }
  }

  /**
   * Show specific section (profile or history)
   */
  showSection(section) {
    // Update navigation
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.getElementById(`${section}Tab`).classList.add("active");

    // Update content
    document.querySelectorAll(".section").forEach((sec) => {
      sec.classList.remove("active");
    });
    document.getElementById(`${section}Section`).classList.add("active");

    // Load data if needed
    if (section === "history" && window.app) {
      window.app.loadMatchHistory();
    }
  }

  /**
   * Display user profile information
   */
  displayUserProfile(userData) {
    this.currentUser = userData;

    // Update header
    document.getElementById("userName").textContent = userData.fullName;

    // Update profile image
    const profileImg = document.getElementById("profileImage");
    if (userData.imageUrl) {
      profileImg.src = userData.imageUrl;
      profileImg.style.display = "block";
    }

    // Update ratings
    if (userData.stats) {
      this.updateRatingCard("singles", userData.stats);
      this.updateRatingCard("doubles", userData.stats);
    }

    // Update profile details
    this.updateProfileDetails(userData);
  }

  /**
   * Update rating card
   */
  updateRatingCard(type, stats) {
    const card = document.getElementById(`${type}Rating`);
    if (!card) return;

    const rating = stats[type];
    const verified = stats[`${type}Verified`];
    const provisional = stats[`${type}Provisional`];
    const reliability = stats[`${type}ReliabilityScore`];

    card.querySelector(".rating-value").textContent = rating || "NR";
    card.querySelector(".rating-verified").textContent = verified
      ? `Verified: ${verified}`
      : "";
    card.querySelector(".rating-status").textContent = provisional
      ? "Provisional"
      : "Rated";

    if (reliability) {
      card.querySelector(
        ".rating-reliability"
      ).textContent = `${reliability}% reliable`;
    }
  }

  /**
   * Update profile details section
   */
  updateProfileDetails(userData) {
    const details = document.getElementById("profileDetails");
    if (!details) return;

    details.innerHTML = `
      <div class="detail-item">
        <label>Email:</label>
        <span>${userData.email || "Not provided"}</span>
      </div>
      <div class="detail-item">
        <label>Phone:</label>
        <span>${userData.phone || "Not provided"}</span>
      </div>
      <div class="detail-item">
        <label>Gender:</label>
        <span>${userData.gender || "Not specified"}</span>
      </div>
      <div class="detail-item">
        <label>Hand:</label>
        <span>${userData.hand || "Not specified"}</span>
      </div>
      <div class="detail-item">
        <label>Location:</label>
        <span>${
          userData.addresses?.[0]?.formattedAddress || "Not provided"
        }</span>
      </div>
    `;
  }

  /**
   * Display match history
   */
  displayMatchHistory(matchData, append = false) {
    const container = document.getElementById("matchHistoryList");
    if (!container) return;

    if (!append) {
      container.innerHTML = "";
    }

    if (!matchData.hits || matchData.hits.length === 0) {
      if (!append) {
        container.innerHTML = '<div class="no-matches">No matches found</div>';
      }
      return;
    }

    matchData.hits.forEach((match) => {
      const matchElement = this.createMatchElement(match);
      container.appendChild(matchElement);
    });

    // Update load more button
    const loadMoreBtn = document.getElementById("loadMoreMatches");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = matchData.hasMore ? "block" : "none";
    }
  }

  /**
   * Create match element
   */
  createMatchElement(match) {
    const matchDiv = document.createElement("div");
    matchDiv.className = "match-item";

    const userTeam = this.findUserTeam(match.teams);
    const opponentTeam = match.teams.find((team) => team !== userTeam);

    const result = userTeam?.winner ? "Won" : "Lost";
    const resultClass = userTeam?.winner ? "win" : "loss";

    matchDiv.innerHTML = `
      <div class="match-header">
        <div class="match-info">
          <div class="match-venue">${match.venue}</div>
          <div class="match-date">${this.formatDate(match.eventDate)}</div>
        </div>
        <div class="match-result ${resultClass}">${result}</div>
      </div>
      <div class="match-details">
        <div class="match-score">
          ${this.formatScore(userTeam, opponentTeam)}
        </div>
        <div class="match-teams">
          <div class="team">
            <strong>Your Team:</strong> ${this.formatTeamPlayers(userTeam)}
          </div>
          <div class="team">
            <strong>Opponents:</strong> ${this.formatTeamPlayers(opponentTeam)}
          </div>
        </div>
        <div class="match-meta">
          <span class="match-format">${match.eventFormat}</span>
          <span class="match-source">${match.matchSource}</span>
          ${
            userTeam?.delta
              ? `<span class="rating-change">${userTeam.delta}</span>`
              : ""
          }
        </div>
      </div>
    `;

    return matchDiv;
  }

  /**
   * Find user's team in match
   */
  findUserTeam(teams) {
    if (!this.currentUser || !teams) return null;

    return teams.find(
      (team) =>
        team.player1?.id === this.currentUser.id ||
        team.player2?.id === this.currentUser.id
    );
  }

  /**
   * Format team players
   */
  formatTeamPlayers(team) {
    if (!team) return "Unknown";

    const players = [];
    if (team.player1) players.push(team.player1.fullName);
    if (team.player2) players.push(team.player2.fullName);

    return players.join(" & ") || "Unknown";
  }

  /**
   * Format match score
   */
  formatScore(userTeam, opponentTeam) {
    if (!userTeam || !opponentTeam) return "";

    const games = [];
    for (let i = 1; i <= 5; i++) {
      const userScore = userTeam[`game${i}`];
      const oppScore = opponentTeam[`game${i}`];

      if (userScore >= 0 && oppScore >= 0) {
        games.push(`${userScore}-${oppScore}`);
      }
    }

    return games.join(", ");
  }

  /**
   * Format date
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Load more matches (pagination)
   */
  async loadMoreMatches() {
    if (window.app) {
      const currentCount = document.querySelectorAll(
        "#matchHistoryList .match-item"
      ).length;
      window.app.loadMatchHistory(currentCount, 10, true);
    }
  }

  /**
   * Show loading state
   */
  showLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isLoading) {
      this.loadingStates.add(elementId);
      element.classList.add("loading");
    } else {
      this.loadingStates.delete(elementId);
      element.classList.remove("loading");
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.clearError();
      }, 5000);
    }
  }

  /**
   * Clear error message
   */
  clearError() {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
      errorDiv.style.display = "none";
      errorDiv.textContent = "";
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = "block";

      // Auto-hide after 3 seconds
      setTimeout(() => {
        successDiv.style.display = "none";
      }, 3000);
    }
  }
}

// Export for use in other modules
window.DUPRUIManager = DUPRUIManager;
