//
//  Social.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import Foundation

struct FollowUser: Codable, Identifiable {
    let id: Int
    let name: String
    let profileImage: String?
    let isFollow: Bool
}

struct FollowInfo: Codable {
    let isFollowed: Bool
    let followers: Int
    let followings: Int
}

struct FollowInfoResponse: Codable {
    let status: String
    let result: FollowInfo
}

struct FollowersResponse: Codable {
    let status: String
    let results: [FollowUser]
}

struct FeedPost: Codable, Identifiable {
    let id: String
    let activityId: String
    let actor: FeedActor
    let verb: String
    let content: String
    let reactionCounts: [String: Int]
    let matches: [FeedMatch]?
    let createdAt: Int
    let updatedAt: Int
}

struct FeedActor: Codable {
    let id: Int
    let name: String
    let profileImage: String?
    let isFollow: Bool
}

struct FeedMatch: Codable {
    let id: Int
    let venue: String?
    let location: String?
    let eventDate: String
    let eventFormat: String
    let teams: [FeedTeam]
    let confirmed: Bool
    let status: String
}

struct FeedTeam: Codable {
    let player1: FeedPlayer?
    let player2: FeedPlayer?
    let game1: Int
    let game2: Int?
    let game3: Int?
    let winner: Bool
}

struct FeedPlayer: Codable {
    let id: Int
    let fullName: String
    let imageUrl: String?
}

struct FeedResponse: Codable {
    let status: String
    let results: [FeedPost]
}