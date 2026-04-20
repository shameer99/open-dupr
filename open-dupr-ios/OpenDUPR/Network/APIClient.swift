import Foundation

class APIClient {
    static let shared = APIClient()
    
    private let baseURL = "https://api.dupr.gg"
    private let session = URLSession.shared
    
    private init() {}
    
    // MARK: - Authentication
    
    func login(email: String, password: String) async throws -> LoginResponse {
        let endpoint = "/auth/v1/login"
        let body = [
            "email": email,
            "password": password
        ]
        
        return try await performRequest(
            endpoint: endpoint,
            method: "POST",
            body: body,
            responseType: LoginResponse.self
        )
    }
    
    func refreshToken(refreshToken: String) async throws -> String {
        let endpoint = "/auth/v1/refresh"
        
        var request = URLRequest(url: URL(string: baseURL + endpoint)!)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(refreshToken, forHTTPHeaderField: "x-refresh-token")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        let refreshResponse = try JSONDecoder().decode(RefreshTokenResponse.self, from: data)
        
        if refreshResponse.status == "SUCCESS" {
            return refreshResponse.result
        } else {
            throw APIError.apiError(refreshResponse.message ?? "Token refresh failed")
        }
    }
    
    func validateToken(_ token: String) async -> Bool {
        // Simple validation by trying to fetch user profile
        do {
            _ = try await getUserProfile(token: token)
            return true
        } catch {
            return false
        }
    }
    
    // MARK: - User Profile
    
    func getUserProfile(token: String) async throws -> UserProfileResponse {
        let endpoint = "/user/v1/profile"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: UserProfileResponse.self
        )
    }
    
    func getUserStats(userId: Int, token: String) async throws -> UserStatsResponse {
        let endpoint = "/user/calculated/v1.0/stats/\(userId)"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: UserStatsResponse.self
        )
    }
    
    // MARK: - Match History
    
    func getMatchHistory(token: String, offset: Int = 0, limit: Int = 25) async throws -> MatchHistoryResponse {
        let endpoint = "/match/v1/history?offset=\(offset)&limit=\(limit)"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: MatchHistoryResponse.self
        )
    }
    
    func getPlayerMatchHistory(playerId: Int, token: String, offset: Int = 0, limit: Int = 25) async throws -> MatchHistoryResponse {
        let endpoint = "/player/v1/\(playerId)/history?offset=\(offset)&limit=\(limit)"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: MatchHistoryResponse.self
        )
    }
    
    // MARK: - Player Search
    
    func searchPlayers(query: String, token: String, offset: Int = 0, limit: Int = 25) async throws -> PlayerSearchResponse {
        let endpoint = "/player/v1/search"
        
        let body: [String: Any] = [
            "offset": offset,
            "limit": limit,
            "query": query,
            "filter": [
                "lat": 37.7749,  // Default to SF coordinates
                "lng": -122.4194,
                "radiusInMeters": 100000,
                "rating": [
                    "min": 1.0,
                    "max": 6.0
                ]
            ],
            "includeUnclaimedPlayers": false
        ]
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "POST",
            token: token,
            body: body,
            responseType: PlayerSearchResponse.self
        )
    }
    
    // MARK: - Social Features
    
    func getFollowInfo(userId: Int, token: String) async throws -> FollowInfoResponse {
        let endpoint = "/activity/v1.1/user/\(userId)/followingInfo"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: FollowInfoResponse.self
        )
    }
    
    func getFollowers(userId: Int, token: String, offset: Int = 0, limit: Int = 25) async throws -> FollowersResponse {
        let endpoint = "/activity/v1.1/user/\(userId)/followers?offset=\(offset)&limit=\(limit)"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: FollowersResponse.self
        )
    }
    
    func getFollowing(userId: Int, token: String, offset: Int = 0, limit: Int = 25) async throws -> FollowersResponse {
        let endpoint = "/activity/v1.1/user/\(userId)/followings?offset=\(offset)&limit=\(limit)"
        
        return try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "GET",
            token: token,
            responseType: FollowersResponse.self
        )
    }
    
    func followUser(userId: Int, token: String) async throws {
        let endpoint = "/activity/v1.1/user/\(userId)/follow"
        
        _ = try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "POST",
            token: token,
            responseType: GenericResponse.self
        )
    }
    
    func unfollowUser(userId: Int, token: String) async throws {
        let endpoint = "/activity/v1.1/user/\(userId)/follow"
        
        _ = try await performAuthenticatedRequest(
            endpoint: endpoint,
            method: "DELETE",
            token: token,
            responseType: GenericResponse.self
        )
    }
    
    // MARK: - Helper Methods
    
    private func performRequest<T: Codable>(
        endpoint: String,
        method: String,
        body: [String: Any]? = nil,
        responseType: T.Type
    ) async throws -> T {
        var request = URLRequest(url: URL(string: baseURL + endpoint)!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    private func performAuthenticatedRequest<T: Codable>(
        endpoint: String,
        method: String,
        token: String,
        body: [String: Any]? = nil,
        responseType: T.Type
    ) async throws -> T {
        var request = URLRequest(url: URL(string: baseURL + endpoint)!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 401 {
                throw APIError.unauthorized
            }
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - Supporting Types

struct RefreshTokenResponse: Codable {
    let status: String
    let message: String?
    let result: String
}

struct GenericResponse: Codable {
    let status: String
    let message: String?
}

enum APIError: Error, LocalizedError {
    case invalidResponse
    case httpError(Int)
    case unauthorized
    case apiError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .unauthorized:
            return "Unauthorized - please log in again"
        case .apiError(let message):
            return message
        }
    }
}