//
//  APIService.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import Foundation
import Combine

enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case serverError(String)
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        case .serverError(let message):
            return message
        case .unauthorized:
            return "Unauthorized access"
        }
    }
}

class APIService: ObservableObject {
    static let shared = APIService()
    private let baseURL = "https://api.dupr.gg"
    private let version = "v1.0"
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isRefreshing = false
    
    private init() {}
    
    private func makeRequest<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        headers: [String: String] = [:],
        responseType: T.Type
    ) -> AnyPublisher<T, Error> {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add custom headers
        for (key, value) in headers {
            request.addValue(value, forHTTPHeaderField: key)
        }
        
        // Add auth token if available
        if let token = KeychainManager.shared.getAccessToken() {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        request.httpBody = body
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.serverError("Invalid response")
                }
                
                if httpResponse.statusCode == 401 {
                    throw APIError.unauthorized
                }
                
                if httpResponse.statusCode >= 400 {
                    if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                        throw APIError.serverError(errorResponse.message ?? "Server error")
                    }
                    throw APIError.serverError("HTTP \(httpResponse.statusCode)")
                }
                
                return data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .tryCatch { [weak self] error -> AnyPublisher<T, Error> in
                if case APIError.unauthorized = error {
                    return self?.refreshTokenAndRetry(
                        endpoint: endpoint,
                        method: method,
                        body: body,
                        headers: headers,
                        responseType: responseType
                    ) ?? Fail(error: error).eraseToAnyPublisher()
                }
                throw error
            }
            .eraseToAnyPublisher()
    }
    
    private func refreshTokenAndRetry<T: Decodable>(
        endpoint: String,
        method: String,
        body: Data?,
        headers: [String: String],
        responseType: T.Type
    ) -> AnyPublisher<T, Error> {
        guard !isRefreshing,
              let refreshToken = KeychainManager.shared.getRefreshToken() else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }
        
        isRefreshing = true
        
        var refreshHeaders = [String: String]()
        refreshHeaders["x-refresh-token"] = refreshToken
        
        return makeRequest(
            endpoint: "/auth/\(version)/refresh",
            headers: refreshHeaders,
            responseType: RefreshResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            KeychainManager.shared.saveAccessToken(response.result)
            self?.isRefreshing = false
        })
        .flatMap { [weak self] _ -> AnyPublisher<T, Error> in
            guard let self = self else {
                return Fail(error: APIError.serverError("Self deallocated"))
                    .eraseToAnyPublisher()
            }
            return self.makeRequest(
                endpoint: endpoint,
                method: method,
                body: body,
                headers: headers,
                responseType: responseType
            )
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Auth
    
    func login(email: String, password: String) -> AnyPublisher<LoginResponse, Error> {
        let body = ["email": email, "password": password]
        let bodyData = try? JSONSerialization.data(withJSONObject: body)
        
        return makeRequest(
            endpoint: "/auth/\(version)/login",
            method: "POST",
            body: bodyData,
            responseType: LoginResponse.self
        )
    }
    
    // MARK: - Profile
    
    func getMyProfile() -> AnyPublisher<ProfileResponse, Error> {
        makeRequest(
            endpoint: "/user/\(version)/profile",
            responseType: ProfileResponse.self
        )
    }
    
    func getUserStats(userId: Int) -> AnyPublisher<UserStatsResponse, Error> {
        makeRequest(
            endpoint: "/user/calculated/\(version)/stats/\(userId)",
            responseType: UserStatsResponse.self
        )
    }
    
    // MARK: - Match History
    
    func getMatchHistory(offset: Int = 0, limit: Int = 20) -> AnyPublisher<MatchHistoryResponse, Error> {
        makeRequest(
            endpoint: "/match/\(version)/history?offset=\(offset)&limit=\(limit)",
            responseType: MatchHistoryResponse.self
        )
    }
    
    func getPlayerMatchHistory(playerId: Int, offset: Int = 0, limit: Int = 20) -> AnyPublisher<MatchHistoryResponse, Error> {
        makeRequest(
            endpoint: "/player/\(version)/\(playerId)/history?offset=\(offset)&limit=\(limit)",
            responseType: MatchHistoryResponse.self
        )
    }
    
    // MARK: - Social
    
    func getFollowInfo(userId: Int) -> AnyPublisher<FollowInfoResponse, Error> {
        makeRequest(
            endpoint: "/activity/v1.1/user/\(userId)/followingInfo",
            responseType: FollowInfoResponse.self
        )
    }
    
    func getFollowers(userId: Int, offset: Int = 0, limit: Int = 50) -> AnyPublisher<FollowersResponse, Error> {
        makeRequest(
            endpoint: "/activity/v1.1/user/\(userId)/followers?offset=\(offset)&limit=\(limit)",
            responseType: FollowersResponse.self
        )
    }
    
    func getFollowing(userId: Int, offset: Int = 0, limit: Int = 50) -> AnyPublisher<FollowersResponse, Error> {
        makeRequest(
            endpoint: "/activity/v1.1/user/\(userId)/followings?offset=\(offset)&limit=\(limit)",
            responseType: FollowersResponse.self
        )
    }
    
    func followUser(userId: Int) -> AnyPublisher<SimpleResponse, Error> {
        makeRequest(
            endpoint: "/activity/v1.1/user/\(userId)/follow",
            method: "POST",
            responseType: SimpleResponse.self
        )
    }
    
    func unfollowUser(userId: Int) -> AnyPublisher<SimpleResponse, Error> {
        makeRequest(
            endpoint: "/activity/v1.1/user/\(userId)/follow",
            method: "DELETE",
            responseType: SimpleResponse.self
        )
    }
    
    // MARK: - Feed
    
    func getFeed(limit: Int = 20) -> AnyPublisher<FeedResponse, Error> {
        makeRequest(
            endpoint: "/activity/v1.1/user/feed?limit=\(limit)",
            responseType: FeedResponse.self
        )
    }
    
    // MARK: - Search
    
    func searchPlayers(query: String, lat: Double? = nil, lng: Double? = nil) -> AnyPublisher<SearchResponse, Error> {
        let filter = SearchFilter(
            lat: lat ?? 0,
            lng: lng ?? 0,
            radiusInMeters: 80467 // 50 miles
        )
        
        let searchRequest = SearchRequest(
            offset: 0,
            limit: 25,
            query: query,
            filter: filter,
            includeUnclaimedPlayers: false
        )
        
        let bodyData = try? JSONEncoder().encode(searchRequest)
        
        return makeRequest(
            endpoint: "/player/\(version)/search",
            method: "POST",
            body: bodyData,
            responseType: SearchResponse.self
        )
    }
    
    // MARK: - Match Validation
    
    func confirmMatch(matchId: Int) -> AnyPublisher<SimpleResponse, Error> {
        let body = ["matchId": matchId]
        let bodyData = try? JSONSerialization.data(withJSONObject: body)
        
        return makeRequest(
            endpoint: "/match/\(version)/confirm",
            method: "POST",
            body: bodyData,
            responseType: SimpleResponse.self
        )
    }
    
    func rejectMatch(matchId: Int) -> AnyPublisher<SimpleResponse, Error> {
        makeRequest(
            endpoint: "/match/\(version)/delete/\(matchId)",
            method: "DELETE",
            responseType: SimpleResponse.self
        )
    }
}

// MARK: - Supporting Types

struct ErrorResponse: Codable {
    let status: String
    let message: String?
}

struct RefreshResponse: Codable {
    let status: String
    let result: String
}

struct SimpleResponse: Codable {
    let status: String
    let message: String?
}

struct UserStatsResponse: Codable {
    let status: String
    let result: CalculatedStats
}

struct CalculatedStats: Codable {
    let singles: MatchRatings?
    let doubles: MatchRatings?
    let resulOverview: RatingsOverview?
}

struct MatchRatings: Codable {
    let averagePartnerDupr: Double
    let averageOpponentDupr: Double
    let averagePointsWonPercent: Double?
    let halfLife: Double?
}

struct RatingsOverview: Codable {
    let wins: Int
    let losses: Int
    let pending: Int?
}

struct SearchRequest: Codable {
    let offset: Int
    let limit: Int
    let query: String
    let filter: SearchFilter
    let includeUnclaimedPlayers: Bool
}

struct SearchFilter: Codable {
    let lat: Double
    let lng: Double
    let radiusInMeters: Int
}