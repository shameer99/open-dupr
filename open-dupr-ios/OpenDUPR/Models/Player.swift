import Foundation

struct PlayerSearchResult: Codable, Identifiable {
    let id: Int
    let fullName: String
    let firstName: String?
    let lastName: String?
    let shortAddress: String?
    let gender: String?
    let age: Int?
    let hand: String?
    let imageUrl: String?
    let ratings: Ratings
    let distance: String?
    let distanceInMiles: Double?
    let enablePrivacy: Bool?
    let verifiedEmail: Bool?
    let registered: Bool?
    let duprId: String?
    let status: String?
    
    struct Ratings: Codable {
        let singles: String
        let singlesVerified: String?
        let singlesProvisional: Bool
        let singlesReliabilityScore: Int
        let doubles: String
        let doublesVerified: String?
        let doublesProvisional: Bool
        let doublesReliabilityScore: Int
        let defaultRating: String
    }
    
    // Computed properties
    var displayName: String { fullName }
    var location: String { shortAddress ?? "" }
    
    var singlesRating: Double {
        return ratings.singles == "NR" ? 0.0 : (Double(ratings.singles) ?? 0.0)
    }
    
    var doublesRating: Double {
        return ratings.doubles == "NR" ? 0.0 : (Double(ratings.doubles) ?? 0.0)
    }
    
    var primaryRating: String {
        return ratings.defaultRating == "SINGLES" ? ratings.singles : ratings.doubles
    }
}

struct PlayerSearchResponse: Codable {
    let status: String
    let message: String?
    let result: PlayerSearchResult_
    
    struct PlayerSearchResult_: Codable {
        let offset: Int
        let limit: Int
        let total: Int
        let hits: [PlayerSearchResult]
    }
}

struct FollowUser: Codable, Identifiable {
    let id: Int
    let name: String
    let profileImage: String?
    let isFollow: Bool
    
    var displayName: String { name }
}

struct FollowersResponse: Codable {
    let status: String
    let message: String?
    let results: [FollowUser]
}

struct FollowInfo: Codable {
    let isFollowed: Bool
    let followers: Int
    let followings: Int
}

struct FollowInfoResponse: Codable {
    let status: String
    let message: String?
    let result: FollowInfo
}