//
//  Search.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

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
    let ratings: PlayerRatings
    let distance: String?
    let distanceInMiles: Double?
    let isPlayer1: Bool?
    let verifiedEmail: Bool?
    let registered: Bool?
    let duprId: String?
    let status: String?
}

struct PlayerRatings: Codable {
    let singles: String
    let singlesVerified: String?
    let singlesProvisional: Bool?
    let singlesReliabilityScore: Int?
    let doubles: String
    let doublesVerified: String?
    let doublesProvisional: Bool?
    let doublesReliabilityScore: Int?
    let defaultRating: String?
}

struct SearchResponse: Codable {
    let status: String
    let result: SearchResult
}

struct SearchResult: Codable {
    let offset: Int
    let limit: Int
    let total: Int
    let hits: [PlayerSearchResult]
}