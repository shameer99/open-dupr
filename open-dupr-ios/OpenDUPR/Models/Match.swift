import Foundation

struct Match: Codable, Identifiable {
    let id: Int
    let matchId: Int
    let displayIdentity: String?
    let venue: String?
    let location: String?
    let tournament: String?
    let league: String?
    let eventDate: String
    let eventFormat: String
    let confirmed: Bool
    let teams: [Team]
    let matchSource: String?
    let noOfGames: Int?
    let status: String
    let created: String?
    let modified: String?
    
    struct Team: Codable, Identifiable {
        let id: Int
        let serial: Int
        let player1: Player
        let player2: Player?
        let game1: Int?
        let game2: Int?
        let game3: Int?
        let game4: Int?
        let game5: Int?
        let winner: Bool
        let delta: String?
        let teamRating: String?
        
        struct Player: Codable, Identifiable {
            let id: Int
            let fullName: String
            let imageUrl: String?
            let rating: String
            let validatedMatch: Bool?
        }
    }
    
    // Computed properties for UI
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        if let date = formatter.date(from: eventDate) {
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
        
        return eventDate
    }
    
    var isDoubles: Bool {
        return eventFormat == "DOUBLES"
    }
    
    var isSingles: Bool {
        return eventFormat == "SINGLES"
    }
    
    var winningTeam: Team? {
        return teams.first { $0.winner }
    }
    
    var losingTeam: Team? {
        return teams.first { !$0.winner }
    }
    
    var scoreText: String {
        guard teams.count >= 2 else { return "" }
        
        let team1 = teams[0]
        let team2 = teams[1]
        
        var scores: [String] = []
        
        if let g1_1 = team1.game1, let g1_2 = team2.game1 {
            scores.append("\(g1_1)-\(g1_2)")
        }
        
        if let g2_1 = team1.game2, let g2_2 = team2.game2, g2_1 != -1, g2_2 != -1 {
            scores.append("\(g2_1)-\(g2_2)")
        }
        
        if let g3_1 = team1.game3, let g3_2 = team2.game3, g3_1 != -1, g3_2 != -1 {
            scores.append("\(g3_1)-\(g3_2)")
        }
        
        return scores.joined(separator: ", ")
    }
}

struct MatchHistoryResponse: Codable {
    let status: String
    let message: String?
    let result: MatchHistoryResult
    
    struct MatchHistoryResult: Codable {
        let offset: Int
        let limit: Int
        let total: Int
        let empty: Bool
        let hasMore: Bool
        let hasPrevious: Bool
        let hits: [Match]
    }
}

struct UserCalculatedStats: Codable {
    let singles: GameStats
    let doubles: GameStats
    let resulOverview: ResultOverview
    
    struct GameStats: Codable {
        let averagePartnerDupr: Double
        let averageOpponentDupr: Double
        let averagePointsWonPercent: Double?
        let halfLife: Double?
    }
    
    struct ResultOverview: Codable {
        let wins: Int
        let losses: Int
        let pending: Int?
        let totalMatches: Int?
    }
}

struct UserStatsResponse: Codable {
    let status: String
    let message: String?
    let result: UserCalculatedStats
}