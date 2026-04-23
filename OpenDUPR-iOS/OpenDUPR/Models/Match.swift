//
//  Match.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import Foundation

struct Match: Codable, Identifiable {
    let id: Int
    let matchId: Int
    let displayIdentity: String?
    let venue: String?
    let location: String?
    let tournament: String?
    let eventDate: String
    let eventFormat: EventFormat
    let confirmed: Bool
    let teams: [Team]
    let matchSource: String?
    let noOfGames: Int?
    let status: String
    let created: String
    
    enum EventFormat: String, Codable, CaseIterable {
        case singles = "SINGLES"
        case doubles = "DOUBLES"
        
        var displayName: String {
            switch self {
            case .singles: return "Singles"
            case .doubles: return "Doubles"
            }
        }
    }
}

struct Team: Codable, Identifiable {
    let id: Int
    let serial: Int
    let player1: MatchPlayer
    let player2: MatchPlayer?
    let game1: Int
    let game2: Int
    let game3: Int
    let game4: Int
    let game5: Int
    let winner: Bool
    let delta: String?
    let teamRating: String?
}

struct MatchPlayer: Codable {
    let id: Int
    let fullName: String
    let imageUrl: String?
    let rating: String?
}

struct MatchHistoryResponse: Codable {
    let status: String
    let result: MatchHistoryResult
}

struct MatchHistoryResult: Codable {
    let offset: Int
    let limit: Int
    let total: Int
    let empty: Bool
    let hasMore: Bool
    let hasPrevious: Bool
    let hits: [Match]
}