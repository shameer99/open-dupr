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
   * Generate initials from a full name
   * @param {string} fullName - The user's full name
   * @returns {string} Initials (up to 2 characters)
   */
  generateInitials(fullName) {
    if (!fullName || typeof fullName !== "string") {
      return "?";
    }

    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    // Take first letter of first and last word
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  /**
   * Generate a consistent background color based on user ID
   * @param {number|string} userId - The user's ID
   * @returns {string} HSL color string
   */
  generateMonogramColor(userId) {
    // Convert userId to string and create a simple hash
    const str = String(userId);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use hash to generate a hue (0-360)
    const hue = Math.abs(hash) % 360;

    // Use fixed saturation and lightness for good readability
    return `hsl(${hue}, 65%, 50%)`;
  }

  /**
   * Create a monogram element
   * @param {string} fullName - The user's full name
   * @param {number|string} userId - The user's ID
   * @param {string} cssClass - Additional CSS class for sizing
   * @returns {HTMLElement} Monogram div element
   */
  createMonogram(fullName, userId, cssClass = "") {
    const monogram = document.createElement("div");
    monogram.className = `monogram ${cssClass}`;
    monogram.textContent = this.generateInitials(fullName);
    monogram.style.backgroundColor = this.generateMonogramColor(userId);
    return monogram;
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
    // Form toggle buttons
    const toggleToLogin = document.getElementById("toggleToLogin");

    if (toggleToLogin) {
      toggleToLogin.addEventListener("click", this.showLoginForm.bind(this));
    }

    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

    // Email verification
    this.setupEmailVerification();

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.handleLogout.bind(this));
    }

    // User profile follower/following counts
    const userFollowersCount = document.getElementById("userFollowersCount");
    const userFollowingCount = document.getElementById("userFollowingCount");

    if (userFollowersCount) {
      userFollowersCount.addEventListener("click", () =>
        this.showFollowersModal(
          this.currentUser?.id,
          this.currentUser?.fullName
        )
      );
    }

    if (userFollowingCount) {
      userFollowingCount.addEventListener("click", () =>
        this.showFollowingModal(
          this.currentUser?.id,
          this.currentUser?.fullName
        )
      );
    }

    // Player profile follower/following counts
    const playerFollowersCount = document.getElementById(
      "playerFollowersCount"
    );
    const playerFollowingCount = document.getElementById(
      "playerFollowingCount"
    );

    if (playerFollowersCount) {
      playerFollowersCount.addEventListener("click", () =>
        this.showFollowersModal(
          this.currentPlayerData?.id,
          this.currentPlayerData?.fullName
        )
      );
    }

    if (playerFollowingCount) {
      playerFollowingCount.addEventListener("click", () =>
        this.showFollowingModal(
          this.currentPlayerData?.id,
          this.currentPlayerData?.fullName
        )
      );
    }

    // Modal close buttons
    const closeFollowersModal = document.getElementById("closeFollowersModal");
    const closeFollowingModal = document.getElementById("closeFollowingModal");
    const followersModalOverlay = document.getElementById(
      "followersModalOverlay"
    );
    const followingModalOverlay = document.getElementById(
      "followingModalOverlay"
    );

    if (closeFollowersModal) {
      closeFollowersModal.addEventListener("click", () =>
        this.hideFollowersModal()
      );
    }

    if (closeFollowingModal) {
      closeFollowingModal.addEventListener("click", () =>
        this.hideFollowingModal()
      );
    }

    if (followersModalOverlay) {
      followersModalOverlay.addEventListener("click", (e) => {
        if (e.target === followersModalOverlay) {
          this.hideFollowersModal();
        }
      });
    }

    if (followingModalOverlay) {
      followingModalOverlay.addEventListener("click", (e) => {
        if (e.target === followingModalOverlay) {
          this.hideFollowingModal();
        }
      });
    }

    // Load more matches button
    const loadMoreBtn = document.getElementById("loadMoreMatches");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", this.loadMoreMatches.bind(this));
    }

    // Profile load more matches button
    const profileLoadMoreBtn = document.getElementById(
      "profileLoadMoreMatches"
    );
    if (profileLoadMoreBtn) {
      profileLoadMoreBtn.addEventListener(
        "click",
        this.loadMoreProfileMatches.bind(this)
      );
    }

    // Player load more matches button
    const playerLoadMoreBtn = document.getElementById("playerLoadMoreMatches");
    if (playerLoadMoreBtn) {
      playerLoadMoreBtn.addEventListener(
        "click",
        this.loadMorePlayerMatches.bind(this)
      );
    }

    // Player profile navigation
    const backFromPlayerProfile = document.getElementById(
      "backFromPlayerProfile"
    );
    if (backFromPlayerProfile) {
      backFromPlayerProfile.addEventListener("click", () =>
        this.showSection("profile")
      );
    }

    // Follow/unfollow buttons
    const followPlayerBtn = document.getElementById("followPlayerBtn");
    const unfollowPlayerBtn = document.getElementById("unfollowPlayerBtn");

    if (followPlayerBtn) {
      followPlayerBtn.addEventListener(
        "click",
        this.handleFollowPlayer.bind(this)
      );
    }

    if (unfollowPlayerBtn) {
      unfollowPlayerBtn.addEventListener(
        "click",
        this.handleUnfollowPlayer.bind(this)
      );
    }

    // Nav buttons
    const navProfile = document.getElementById("navProfile");
    if (navProfile) {
      navProfile.addEventListener("click", () => this.showSection("profile"));
    }

    const navSearch = document.getElementById("navSearch");
    if (navSearch) {
      navSearch.addEventListener("click", () => this.showSection("search"));
    }

    // Player search form
    const playerSearchForm = document.getElementById("playerSearchForm");
    if (playerSearchForm) {
      playerSearchForm.addEventListener("submit", this.handlePlayerSearch.bind(this));
    }
  }

  /**
   * Handle player search form submission
   */
  async handlePlayerSearch(event) {
    event.preventDefault();
    const input = document.getElementById("playerSearchInput");
    const query = input.value.trim();

    if (query.length < 2) {
      this.showError("Please enter at least 2 characters to search.");
      return;
    }

    this.showLoadingState("searchResults", true);
    this.clearError();

    try {
      await window.app.searchPlayers(query);
    } catch (error) {
      // Error is already handled in the app class
    } finally {
      this.showLoadingState("searchResults", false);
    }
  }

  /**
   * Show login form and hide signup form
   */
  showLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const toggleToLogin = document.getElementById("toggleToLogin");

    if (loginForm) loginForm.style.display = "block";

    if (toggleToLogin) {
      toggleToLogin.classList.add("active");
    }
  }

  /**
   * Setup email verification functionality
   */
  setupEmailVerification() {
    const resendBtn = document.getElementById("resendVerificationBtn");
    const checkBtn = document.getElementById("checkVerificationBtn");
    const goToDashboardLink = document.getElementById("goToDashboardLink");
    const logoutLink = document.getElementById("logoutFromVerificationLink");

    if (resendBtn) {
      resendBtn.addEventListener(
        "click",
        this.handleResendVerification.bind(this)
      );
    }

    if (checkBtn) {
      checkBtn.addEventListener(
        "click",
        this.handleCheckVerification.bind(this)
      );
    }

    if (goToDashboardLink) {
      goToDashboardLink.addEventListener(
        "click",
        this.handleCheckVerification.bind(this)
      );
    }

    if (logoutLink) {
      logoutLink.addEventListener("click", this.handleLogout.bind(this));
    }
  }

  /**
   * Show email verification screen
   * @param {string} email - User's email address
   */
  showEmailVerification(email) {
    this.currentPage = "emailVerification";
    this.updateVisibility();

    // Set the email in the verification message
    const emailSpan = document.getElementById("verificationEmail");
    if (emailSpan && email) {
      emailSpan.textContent = email;
    }
  }

  /**
   * Handle resend verification email
   */
  async handleResendVerification(event) {
    event.preventDefault();

    const btn = event.target.closest("button");
    const emailSpan = document.getElementById("verificationEmail");
    const email = emailSpan?.textContent || window.app?.currentUser?.email;

    if (!email) {
      this.showError(
        "Unable to resend verification email. Please try logging in again."
      );
      return;
    }

    this.showLoadingState("resendVerificationBtn", true);
    this.clearError();

    try {
      await window.app?.api?.resendEmailVerification(email);
      this.showSuccess("Verification email sent! Check your inbox.");
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      this.showError("Failed to send verification email. Please try again.");
    } finally {
      this.showLoadingState("resendVerificationBtn", false);
    }
  }

  /**
   * Handle check verification status
   */
  async handleCheckVerification(event) {
    event.preventDefault();

    try {
      console.log("🔍 Checking email verification status...");

      // Get fresh user profile to check verification status
      const profile = await window.app?.api?.getUserProfile();

      if (profile?.isValidEmail) {
        console.log("✅ Email verified! Redirecting to dashboard...");
        this.showSuccess("Email verified successfully!");

        // Update current user data
        if (window.app) {
          window.app.currentUser = profile;
        }

        // Show dashboard
        setTimeout(() => {
          this.showDashboard();
        }, 1000);
      } else {
        console.log("❌ Email not yet verified");
        this.showError(
          "Email not yet verified. Please check your email and click the verification link."
        );
      }
    } catch (error) {
      console.error("Failed to check verification status:", error);
      this.showError("Failed to check verification status. Please try again.");
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
    const emailVerification = document.getElementById("emailVerification");
    const dashboard = document.getElementById("dashboard");

    // Hide all sections first
    if (loginScreen) loginScreen.style.display = "none";
    if (emailVerification) emailVerification.style.display = "none";
    if (dashboard) dashboard.style.display = "none";

    // Show the appropriate section
    if (this.currentPage === "login") {
      if (loginScreen) loginScreen.style.display = "flex";
    } else if (this.currentPage === "emailVerification") {
      if (emailVerification) emailVerification.style.display = "block";
    } else if (this.currentPage === "dashboard") {
      if (dashboard) dashboard.style.display = "block";
    }
  }

  /**
   * Show specific section (profile or playerProfile)
   */
  showSection(section) {
    // Update content sections
    document.querySelectorAll(".section").forEach((sec) => {
      sec.classList.remove("active");
    });

    // Update nav buttons
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    const activeBtn = document.getElementById(`nav${section.charAt(0).toUpperCase() + section.slice(1)}`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }

    if (section === "playerProfile") {
      document.getElementById("playerProfileSection").classList.add("active");
    } else if (section === "search") {
      document.getElementById("searchSection").classList.add("active");
    } else {
      // Default to profile section
      document.getElementById("profileSection").classList.add("active");
    }
  }

  /**
   * Display user profile information
   */
  displayUserProfile(userData) {
    this.currentUser = userData;

    // Update header
    document.getElementById("userName").textContent = userData.fullName;

    // Update profile image or show monogram
    const profileImg = document.getElementById("profileImage");
    const userInfo = document.querySelector(".user-info");

    // Remove any existing monogram
    const existingMonogram = userInfo.querySelector(".profile-monogram");
    if (existingMonogram) {
      existingMonogram.remove();
    }

    if (userData.imageUrl) {
      profileImg.src = userData.imageUrl;
      profileImg.style.display = "block";
    } else {
      // Hide the image and create a monogram
      profileImg.style.display = "none";
      const monogram = this.createMonogram(
        userData.fullName,
        userData.id,
        "profile-monogram"
      );
      userInfo.insertBefore(monogram, userInfo.firstChild);
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

    // Handle rating display - could be string, number, or null/undefined
    let displayRating = "NR";
    if (rating && rating !== "-") {
      // If it's a valid number (string or number), display it
      const numericRating = parseFloat(rating);
      if (!isNaN(numericRating)) {
        displayRating = numericRating.toFixed(3);
      } else {
        displayRating = rating; // Use as-is if it's not a number
      }
    }

    card.querySelector(".rating-value").textContent = displayRating;
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
   * Display match history in profile view
   */
  displayProfileMatchHistory(matchData, append = false) {
    const container = document.getElementById("profileMatchHistoryList");
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
    const loadMoreBtn = document.getElementById("profileLoadMoreMatches");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = matchData.hasMore ? "block" : "none";
    }
  }

  /**
   * Display match history for a specific player
   */
  displayPlayerMatchHistory(matchData, append = false) {
    const container = document.getElementById("playerMatchHistoryList");
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
    const loadMoreBtn = document.getElementById("playerLoadMoreMatches");
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
   * Format team players with clickable names
   */
  formatTeamPlayers(team) {
    if (!team) return "Unknown";

    const players = [];
    if (team.player1) {
      players.push(
        this.makePlayerNameClickable(
          team.player1.id,
          team.player1.fullName,
          team.player1.imageUrl
        )
      );
    }
    if (team.player2) {
      players.push(
        this.makePlayerNameClickable(
          team.player2.id,
          team.player2.fullName,
          team.player2.imageUrl
        )
      );
    }

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
   * Load more profile matches (pagination)
   */
  async loadMoreProfileMatches() {
    if (window.app) {
      const currentCount = document.querySelectorAll(
        "#profileMatchHistoryList .match-item"
      ).length;
      window.app.loadProfileMatchHistory(currentCount, 10, true);
    }
  }

  /**
   * Load more player matches (pagination)
   */
  async loadMorePlayerMatches() {
    if (window.app && this.currentPlayerData) {
      const currentCount = document.querySelectorAll(
        "#playerMatchHistoryList .match-item"
      ).length;
      window.app.loadPlayerMatchHistory(
        this.currentPlayerData.id,
        currentCount,
        10,
        true
      );
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

  /**
   * Display player profile
   */
  showPlayerProfile(playerData) {
    this.currentPage = "playerProfile";
    this.currentPlayerData = playerData;

    // Update profile name and title
    document.getElementById("playerProfileName").textContent =
      playerData.fullName;
    document.getElementById("playerFullName").textContent = playerData.fullName;

    // Update player image or show monogram
    const playerImg = document.getElementById("playerProfileImage");
    const playerHeader = document.querySelector(".player-header");

    // Remove any existing monogram
    const existingMonogram = playerHeader.querySelector(
      ".player-profile-monogram"
    );
    if (existingMonogram) {
      existingMonogram.remove();
    }

    if (playerData.imageUrl) {
      playerImg.src = playerData.imageUrl;
      playerImg.style.display = "block";
    } else {
      // Hide the image and create a monogram
      playerImg.style.display = "none";
      const monogram = this.createMonogram(
        playerData.fullName,
        playerData.id,
        "player-profile-monogram"
      );
      playerHeader.insertBefore(
        monogram,
        playerHeader.querySelector(".player-info")
      );
    }

    // Update location
    document.getElementById("playerLocation").textContent =
      playerData.location || "";

    // Update follower counts and button visibility
    if (playerData.followingInfo) {
      this.updatePlayerFollowerCounts(playerData.followingInfo);

      // Show/hide follow/unfollow buttons
      const followBtn = document.getElementById("followPlayerBtn");
      const unfollowBtn = document.getElementById("unfollowPlayerBtn");

      if (playerData.followingInfo.isFollowed) {
        followBtn.style.display = "none";
        unfollowBtn.style.display = "block";
      } else {
        followBtn.style.display = "block";
        unfollowBtn.style.display = "none";
      }
    }

    // Update ratings
    if (playerData.stats) {
      this.updatePlayerRatingCard(
        "playerSinglesRating",
        "singles",
        playerData.stats
      );
      this.updatePlayerRatingCard(
        "playerDoublesRating",
        "doubles",
        playerData.stats
      );
    }

    // Update rating history
    this.displayPlayerRatingHistory(playerData.ratingHistory || []);

    this.showSection("playerProfile");
  }

  /**
   * Update player rating card
   */
  updatePlayerRatingCard(cardId, type, stats) {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Handle new stats format from /user/calculated/v1/stats/{id}
    if (stats && stats[type]) {
      const ratingData = stats[type];
      const averageOpponent = ratingData.averageOpponentDupr;

      // Handle both string and number values from API
      if (
        averageOpponent === "-" ||
        averageOpponent === null ||
        averageOpponent === undefined
      ) {
        card.querySelector(".rating-value").textContent = "NR";
      } else {
        // Try to convert to number (handles both string numbers and actual numbers)
        const numericRating = parseFloat(averageOpponent);
        if (!isNaN(numericRating)) {
          card.querySelector(".rating-value").textContent =
            numericRating.toFixed(3);
        } else {
          card.querySelector(".rating-value").textContent = "NR";
        }
      }
    } else {
      card.querySelector(".rating-value").textContent = "NR";
    }
  }

  /**
   * Display player rating history
   */
  displayPlayerRatingHistory(ratingHistory) {
    const container = document.getElementById("playerRatingHistoryList");
    if (!container) return;

    if (!ratingHistory || ratingHistory.length === 0) {
      container.innerHTML =
        '<div class="no-history">No rating history available</div>';
      return;
    }

    container.innerHTML = "";

    ratingHistory.forEach((entry) => {
      const historyItem = document.createElement("div");
      historyItem.className = "rating-history-item";

      // Handle new rating history format from POST endpoint
      const date = entry.date || entry.matchDate || "Unknown Date";

      // Check if rating is a valid number
      let rating = "NR";
      if (typeof entry.rating === "number" && !isNaN(entry.rating)) {
        rating = entry.rating.toFixed(3);
      }

      const status = entry.verified
        ? "Verified"
        : entry.provisional
        ? "Provisional"
        : "Rated";

      historyItem.innerHTML = `
        <div class="history-date">${this.formatDate(date)}</div>
        <div class="history-ratings">
          <span class="history-rating">Rating: ${rating}</span>
          <span class="history-status">${status}</span>
        </div>
      `;

      container.appendChild(historyItem);
    });
  }

  /**
   * Display followers list
   */
  showFollowersList(followersData, userId) {
    const container = document.getElementById("followersList");
    if (!container) {
      return;
    }

    if (!followersData.hits || followersData.hits.length === 0) {
      container.innerHTML = '<div class="no-users">No followers found</div>';
      return;
    }

    container.innerHTML = "";

    followersData.hits.forEach((follower) => {
      const userItem = this.createUserListItem(follower);
      container.appendChild(userItem);
    });
  }

  /**
   * Display following list
   */
  showFollowingList(followingData, userId) {
    const container = document.getElementById("followingList");
    if (!container) {
      return;
    }

    if (!followingData.hits || followingData.hits.length === 0) {
      container.innerHTML = '<div class="no-users">Not following anyone</div>';
      return;
    }

    container.innerHTML = "";

    followingData.hits.forEach((following) => {
      const userItem = this.createUserListItem(following);
      container.appendChild(userItem);
    });
  }

  /**
   * Create user list item for followers/following
   */
  createUserListItem(user) {
    const userDiv = document.createElement("div");
    userDiv.className = "user-item";

    // Handle both ActivityUser format (name, profileImage) and PlayerResponse format (fullName, imageUrl)
    const userName = user.name || user.fullName || "Unknown User";
    const userImage = user.profileImage || user.imageUrl;

    // Create avatar content
    let avatarContent;
    if (userImage) {
      avatarContent = `<img src="${userImage}" alt="${userName}">`;
    } else {
      const monogram = this.createMonogram(userName, user.id);
      avatarContent = monogram.outerHTML;
    }

    userDiv.innerHTML = `
      <div class="user-avatar">
        ${avatarContent}
      </div>
      <div class="user-info">
        <div class="user-name">${userName}</div>
      </div>
      <button class="btn btn-ghost user-action" onclick="window.app.viewPlayerProfile(${ 
        user.id
      }, '${userName.replace(/'/g, "\'" ).replace(/"/g, "&quot;")}', '${userImage || ""}')">
        View Profile
      </button>
    `;

    return userDiv;
  }

  /**
   * Handle follow player button click
   */
  handleFollowPlayer() {
    if (this.currentPlayerData && window.app) {
      window.app.followPlayer(
        this.currentPlayerData.id,
        this.currentPlayerData.fullName
      );
    }
  }

  /**
   * Handle unfollow player button click
   */
  handleUnfollowPlayer() {
    if (this.currentPlayerData && window.app) {
      window.app.unfollowPlayer(
        this.currentPlayerData.id,
        this.currentPlayerData.fullName
      );
    }
  }

  /**
   * Make player names clickable in match history
   */
  makePlayerNameClickable(playerId, playerName, playerImage = null) {
    const imageParam = playerImage ? `'${playerImage}'` : "null";
    return `<a href="#" class="player-link" onclick="window.app.viewPlayerProfile(${playerId}, '${playerName}', ${imageParam}); return false;">${playerName}</a>`;
  }

  /**
   * Show followers modal for a specific user
   */
  showFollowersModal(userId, userName) {
    if (!userId || !userName) return;

    const modal = document.getElementById("followersSection");
    const title = document.getElementById("followersModalTitle");

    if (modal && title) {
      title.textContent = `${userName}'s Followers`;
      modal.classList.add("active");

      // Load followers data
      if (window.app) {
        window.app.loadFollowers(userId);
      }
    }
  }

  /**
   * Show following modal for a specific user
   */
  showFollowingModal(userId, userName) {
    if (!userId || !userName) return;

    const modal = document.getElementById("followingSection");
    const title = document.getElementById("followingModalTitle");

    if (modal && title) {
      title.textContent = `${userName} is Following`;
      modal.classList.add("active");

      // Load following data
      if (window.app) {
        window.app.loadFollowing(userId);
      }
    }
  }

  /**
   * Hide followers modal
   */
  hideFollowersModal() {
    const modal = document.getElementById("followersSection");
    if (modal) {
      modal.classList.remove("active");
    }
  }

  /**
   * Hide following modal
   */
  hideFollowingModal() {
    const modal = document.getElementById("followingSection");
    if (modal) {
      modal.classList.remove("active");
    }
  }

  /**
   * Update user profile follower counts
   */
  updateUserFollowerCounts(followingInfo) {
    const followersElement = document.getElementById("userFollowersNumber");
    const followingElement = document.getElementById("userFollowingNumber");

    if (followersElement && followingInfo) {
      followersElement.textContent = followingInfo.followers || 0;
    }

    if (followingElement && followingInfo) {
      followingElement.textContent = followingInfo.followings || 0;
    }
  }

  /**
   * Update player profile follower counts
   */
  updatePlayerFollowerCounts(followingInfo) {
    const followersElement = document.getElementById("playerFollowersNumber");
    const followingElement = document.getElementById("playerFollowingNumber");

    if (followersElement && followingInfo) {
      followersElement.textContent = followingInfo.followers || 0;
    }

    if (followingElement && followingInfo) {
      followingElement.textContent = followingInfo.followings || 0;
    }
  }

  /**
   * Display player search results
   */
  displaySearchResults(results) {
    const container = document.getElementById("searchResults");
    if (!container) return;

    container.innerHTML = ""; // Clear previous results

    if (!results || results.hits.length === 0) {
      container.innerHTML = '<div class="placeholder">No players found.</div>';
      return;
    }

    results.hits.forEach((player) => {
      const playerCard = this.createPlayerCard(player);
      container.appendChild(playerCard);
    });
  }

  /**
   * Create a player card element for search results
   */
  createPlayerCard(player) {
    const card = document.createElement("div");
    card.className = "player-card";
    card.addEventListener("click", () =>
      window.app.viewPlayerProfile(player.id, player.fullName, player.imageUrl)
    );

    let avatarContent;
    if (player.imageUrl) {
      avatarContent = `<img src="${player.imageUrl}" alt="${player.fullName}" class="player-card-image">`;
    } else {
      const monogram = this.createMonogram(player.fullName, player.id, 'player-card-monogram');
      avatarContent = monogram.outerHTML;
    }

    const singlesRating = player.stats?.singles ? parseFloat(player.stats.singles).toFixed(3) : "NR";
    const doublesRating = player.stats?.doubles ? parseFloat(player.stats.doubles).toFixed(3) : "NR";

    card.innerHTML = `
      ${avatarContent}
      <div class="player-card-name">${player.fullName}</div>
      <div class="player-card-location">${player.location || ""}</div>
      <div class="player-card-ratings">
        <div class="player-card-rating">
          <div class="label">Singles</div>
          <div class="value">${singlesRating}</div>
        </div>
        <div class="player-card-rating">
          <div class="label">Doubles</div>
          <div class="value">${doublesRating}</div>
        </div>
      </div>
    `;

    return card;
  }
}

// Export for use in other modules
window.DUPRUIManager = DUPRUIManager;