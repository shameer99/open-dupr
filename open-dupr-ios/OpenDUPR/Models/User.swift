import Foundation

struct User: Codable, Identifiable {
    let id: Int
    let fullName: String
    let firstName: String
    let lastName: String
    let email: String
    let username: String?
    let displayUsername: Bool?
    let imageUrl: String?
    let birthdate: String?
    let gender: String?
    let hand: String?
    let phone: String?
    let stats: UserStats
    let addresses: [Address]?
    let active: Bool?
    let restricted: Bool?
    
    struct UserStats: Codable {
        let singles: String
        let singlesVerified: String?
        let singlesProvisional: Bool?
        let singlesReliabilityScore: Int?
        let doubles: String
        let doublesVerified: String?
        let doublesProvisional: Bool?
        let doublesReliabilityScore: Int?
        let defaultRating: String
    }
    
    struct Address: Codable {
        let formattedAddress: String
        let latitude: Double?
        let longitude: Double?
    }
    
    // Computed properties for UI
    var displayName: String {
        return fullName
    }
    
    var primaryRating: String {
        return stats.defaultRating == "SINGLES" ? stats.singles : stats.doubles
    }
    
    var singlesRating: Double {
        return Double(stats.singles) ?? 0.0
    }
    
    var doublesRating: Double {
        return Double(stats.doubles) ?? 0.0
    }
    
    var location: String {
        return addresses?.first?.formattedAddress ?? ""
    }
}

struct LoginResponse: Codable {
    let status: String
    let message: String?
    let result: LoginResult
    
    struct LoginResult: Codable {
        let accessToken: String
        let refreshToken: String
        let user: User
    }
}

struct UserProfileResponse: Codable {
    let status: String
    let message: String?
    let result: User
}