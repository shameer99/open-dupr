const API_BASE_URL = 'https://api.dupr.gg';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    const response = await this.request('/auth/v1/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    
    if (response.status === 'SUCCESS') {
      localStorage.setItem('accessToken', response.result.accessToken);
      localStorage.setItem('refreshToken', response.result.refreshToken);
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // User Profile
  async getUserProfile() {
    return this.request('/user/v1/profile');
  }

  async getPlayerStats(playerId) {
    return this.request(`/user/calculated/v1/stats/${playerId}`);
  }

  // Match History
  async getMatchHistory(offset = 0, limit = 10) {
    return this.request(`/match/v1/history?offset=${offset}&limit=${limit}`);
  }

  async getPlayerMatchHistory(playerId, offset = 0, limit = 10) {
    return this.request(`/player/v1/${playerId}/history?offset=${offset}&limit=${limit}`);
  }

  // Player Search
  async searchPlayers(query, filters = {}) {
    return this.request('/player/v1/search', {
      method: 'POST',
      body: JSON.stringify({
        offset: 0,
        limit: 20,
        query,
        filter: {
          includeUnclaimedPlayers: false,
          ...filters,
        },
      }),
    });
  }

  // Social Features
  async getFollowers(feedId, offset = 0, limit = 10) {
    return this.request(`/activity/v1/user/${feedId}/followers?offset=${offset}&limit=${limit}`);
  }

  async getFollowing(feedId, offset = 0, limit = 10) {
    return this.request(`/activity/v1/user/${feedId}/followings?offset=${offset}&limit=${limit}`);
  }

  async getFollowingInfo(feedId) {
    return this.request(`/activity/v1/user/${feedId}/followingInfo`);
  }

  async followUser(feedId) {
    return this.request(`/activity/v1/user/${feedId}/follow`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async unfollowUser(feedId) {
    return this.request(`/activity/v1/user/${feedId}/follow`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
