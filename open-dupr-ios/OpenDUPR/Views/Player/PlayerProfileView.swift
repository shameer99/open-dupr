import SwiftUI

struct PlayerProfileView: View {
    let playerId: Int
    
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var player: PlayerSearchResult?
    @State private var matches: [Match] = []
    @State private var calculatedStats: UserCalculatedStats?
    @State private var followInfo: FollowInfo?
    @State private var isLoading = true
    @State private var isLoadingMatches = false
    @State private var isLoadingStats = false
    @State private var isFollowing = false
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                if isLoading {
                    PlayerProfileSkeleton()
                } else if let player = player {
                    // Player Header
                    PlayerHeaderView(
                        player: player,
                        calculatedStats: calculatedStats,
                        followInfo: followInfo,
                        isFollowing: isFollowing
                    ) {
                        await toggleFollow()
                    }
                    
                    // Stats Overview
                    if let stats = calculatedStats {
                        StatsOverviewView(stats: stats)
                    }
                    
                    // Recent Matches
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Matches")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Spacer()
                        }
                        .padding(.horizontal)
                        
                        if isLoadingMatches {
                            ForEach(0..<3, id: \.self) { _ in
                                MatchCardSkeleton()
                            }
                        } else if matches.isEmpty {
                            EmptyMatchesView()
                        } else {
                            ForEach(matches.prefix(5)) { match in
                                MatchCardView(match: match)
                                    .onTapGesture {
                                        hapticManager.cardTap()
                                    }
                            }
                        }
                    }
                }
            }
            .padding(.top)
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadPlayerData()
        }
    }
    
    private func loadPlayerData() async {
        guard let token = await authManager.getValidToken() else { return }
        
        isLoading = true
        
        // Load player matches and stats in parallel
        async let matchesTask = loadPlayerMatches(token: token)
        async let statsTask = loadPlayerStats(token: token)
        async let followTask = loadFollowInfo(token: token)
        
        await matchesTask
        await statsTask
        await followTask
        
        isLoading = false
    }
    
    private func loadPlayerMatches(token: String) async {
        isLoadingMatches = true
        
        do {
            let response = try await APIClient.shared.getPlayerMatchHistory(
                playerId: playerId,
                token: token,
                offset: 0,
                limit: 5
            )
            
            if response.status == "SUCCESS" {
                matches = response.result.hits
            }
        } catch {
            print("Failed to load player matches: \(error)")
        }
        
        isLoadingMatches = false
    }
    
    private func loadPlayerStats(token: String) async {
        isLoadingStats = true
        
        do {
            let response = try await APIClient.shared.getUserStats(userId: playerId, token: token)
            if response.status == "SUCCESS" {
                calculatedStats = response.result
            }
        } catch {
            print("Failed to load player stats: \(error)")
        }
        
        isLoadingStats = false
    }
    
    private func loadFollowInfo(token: String) async {
        do {
            let response = try await APIClient.shared.getFollowInfo(userId: playerId, token: token)
            if response.status == "SUCCESS" {
                followInfo = response.result
                isFollowing = response.result.isFollowed
            }
        } catch {
            print("Failed to load follow info: \(error)")
        }
    }
    
    private func toggleFollow() async {
        guard let token = await authManager.getValidToken() else { return }
        
        hapticManager.buttonTap()
        
        do {
            if isFollowing {
                try await APIClient.shared.unfollowUser(userId: playerId, token: token)
            } else {
                try await APIClient.shared.followUser(userId: playerId, token: token)
            }
            
            isFollowing.toggle()
            hapticManager.successAction()
            
            // Reload follow info to get updated counts
            await loadFollowInfo(token: token)
            
        } catch {
            print("Failed to toggle follow: \(error)")
            hapticManager.errorAction()
        }
    }
}

struct PlayerHeaderView: View {
    let player: PlayerSearchResult
    let calculatedStats: UserCalculatedStats?
    let followInfo: FollowInfo?
    let isFollowing: Bool
    let onFollowToggle: () async -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Profile image and basic info
            HStack(spacing: 16) {
                AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.secondary)
                }
                .frame(width: 80, height: 80)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Color.blue.opacity(0.3), lineWidth: 2)
                )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(player.displayName)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if !player.location.isEmpty {
                        Text(player.location)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 12) {
                        RatingBadge(rating: player.ratings.singles, type: "S")
                        RatingBadge(rating: player.ratings.doubles, type: "D")
                    }
                    .padding(.top, 4)
                }
                
                Spacer()
            }
            
            // Follow button and stats
            HStack(spacing: 20) {
                Button(action: {
                    Task {
                        await onFollowToggle()
                    }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: isFollowing ? "person.badge.minus" : "person.badge.plus")
                        Text(isFollowing ? "Unfollow" : "Follow")
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(isFollowing ? .red : .white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(isFollowing ? Color.red.opacity(0.1) : Color.blue)
                    )
                }
                
                if let followInfo = followInfo {
                    HStack(spacing: 20) {
                        VStack(spacing: 2) {
                            Text("\(followInfo.followers)")
                                .font(.headline)
                                .fontWeight(.bold)
                            Text("Followers")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        VStack(spacing: 2) {
                            Text("\(followInfo.followings)")
                                .font(.headline)
                                .fontWeight(.bold)
                            Text("Following")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
            }
            
            // Win/Loss record
            if let stats = calculatedStats {
                HStack(spacing: 20) {
                    StatItem(title: "Wins", value: "\(stats.resulOverview.wins)")
                    StatItem(title: "Losses", value: "\(stats.resulOverview.losses)")
                    if let total = stats.resulOverview.totalMatches {
                        StatItem(title: "Total", value: "\(total)")
                    }
                }
                .padding(.top, 8)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        )
        .padding(.horizontal)
    }
}

struct PlayerProfileSkeleton: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                Circle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 80, height: 80)
                
                VStack(alignment: .leading, spacing: 4) {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .frame(width: 120, height: 24)
                    
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .frame(width: 80, height: 16)
                    
                    HStack(spacing: 8) {
                        Rectangle()
                            .fill(Color.secondary.opacity(0.3))
                            .frame(width: 40, height: 20)
                        
                        Rectangle()
                            .fill(Color.secondary.opacity(0.3))
                            .frame(width: 40, height: 20)
                    }
                }
                
                Spacer()
            }
            
            HStack(spacing: 20) {
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 80, height: 32)
                
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 60, height: 20)
                
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 60, height: 20)
                
                Spacer()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        )
        .padding(.horizontal)
        .opacity(isAnimating ? 0.5 : 1.0)
        .animation(.easeInOut(duration: 1).repeatForever(autoreverses: true), value: isAnimating)
        .onAppear {
            isAnimating = true
        }
    }
}

#Preview {
    NavigationView {
        PlayerProfileView(playerId: 123456)
            .environmentObject(AuthenticationManager())
            .environmentObject(HapticManager())
    }
}