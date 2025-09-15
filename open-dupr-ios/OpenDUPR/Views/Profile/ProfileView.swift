import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var matches: [Match] = []
    @State private var calculatedStats: UserCalculatedStats?
    @State private var isLoadingMatches = false
    @State private var isLoadingStats = false
    @State private var isRefreshing = false
    @State private var showingLogoutAlert = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    // Profile Header
                    if let user = authManager.currentUser {
                        ProfileHeaderView(user: user, calculatedStats: calculatedStats)
                            .onTapGesture {
                                hapticManager.cardTap()
                            }
                    }
                    
                    // Stats Overview
                    if let stats = calculatedStats {
                        StatsOverviewView(stats: stats)
                            .onTapGesture {
                                hapticManager.cardTap()
                            }
                    }
                    
                    // Recent Matches
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Matches")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Spacer()
                            
                            if !matches.isEmpty {
                                NavigationLink(destination: MatchHistoryView()) {
                                    Text("View All")
                                        .font(.subheadline)
                                        .foregroundColor(.blue)
                                }
                                .simultaneousGesture(TapGesture().onEnded {
                                    hapticManager.buttonTap()
                                })
                            }
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
                .padding(.top)
            }
            .refreshable {
                await refreshData()
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Refresh", systemImage: "arrow.clockwise") {
                            hapticManager.buttonTap()
                            Task { await refreshData() }
                        }
                        
                        Divider()
                        
                        Button("Logout", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) {
                            hapticManager.buttonTap()
                            showingLogoutAlert = true
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundColor(.primary)
                    }
                }
            }
            .alert("Logout", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {
                    hapticManager.buttonTap()
                }
                Button("Logout", role: .destructive) {
                    hapticManager.buttonTap()
                    authManager.logout()
                }
            } message: {
                Text("Are you sure you want to logout?")
            }
        }
        .task {
            await loadInitialData()
        }
    }
    
    private func loadInitialData() async {
        async let matchesTask = loadMatches()
        async let statsTask = loadStats()
        
        await matchesTask
        await statsTask
    }
    
    private func refreshData() async {
        isRefreshing = true
        hapticManager.pullToRefresh()
        
        async let profileTask = authManager.loadUserProfile()
        async let matchesTask = loadMatches()
        async let statsTask = loadStats()
        
        await profileTask
        await matchesTask
        await statsTask
        
        isRefreshing = false
        hapticManager.successAction()
    }
    
    private func loadMatches() async {
        guard let token = await authManager.getValidToken() else { return }
        
        isLoadingMatches = true
        
        do {
            let response = try await APIClient.shared.getMatchHistory(token: token, offset: 0, limit: 5)
            if response.status == "SUCCESS" {
                matches = response.result.hits
            }
        } catch {
            print("Failed to load matches: \(error)")
        }
        
        isLoadingMatches = false
    }
    
    private func loadStats() async {
        guard let token = await authManager.getValidToken(),
              let user = authManager.currentUser else { return }
        
        isLoadingStats = true
        
        do {
            let response = try await APIClient.shared.getUserStats(userId: user.id, token: token)
            if response.status == "SUCCESS" {
                calculatedStats = response.result
            }
        } catch {
            print("Failed to load stats: \(error)")
        }
        
        isLoadingStats = false
    }
}

struct ProfileHeaderView: View {
    let user: User
    let calculatedStats: UserCalculatedStats?
    
    var body: some View {
        VStack(spacing: 16) {
            // Profile image and basic info
            HStack(spacing: 16) {
                AsyncImage(url: URL(string: user.imageUrl ?? "")) { image in
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
                    Text(user.displayName)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if !user.location.isEmpty {
                        Text(user.location)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 12) {
                        RatingBadge(rating: user.stats.singles, type: "S")
                        RatingBadge(rating: user.stats.doubles, type: "D")
                    }
                    .padding(.top, 4)
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

struct RatingBadge: View {
    let rating: String
    let type: String
    
    var body: some View {
        HStack(spacing: 4) {
            Text(type)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
            
            Text(rating)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.blue.opacity(0.1))
        )
    }
}

struct StatItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct StatsOverviewView: View {
    let stats: UserCalculatedStats
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Performance Stats")
                .font(.headline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: 16) {
                VStack(spacing: 12) {
                    Text("Singles")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    VStack(spacing: 8) {
                        StatRow(title: "Avg Partner", value: String(format: "%.2f", stats.singles.averagePartnerDupr))
                        StatRow(title: "Avg Opponent", value: String(format: "%.2f", stats.singles.averageOpponentDupr))
                        if let winPercent = stats.singles.averagePointsWonPercent {
                            StatRow(title: "Win %", value: String(format: "%.0f%%", winPercent * 100))
                        }
                    }
                }
                
                Divider()
                
                VStack(spacing: 12) {
                    Text("Doubles")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    VStack(spacing: 8) {
                        StatRow(title: "Avg Partner", value: String(format: "%.2f", stats.doubles.averagePartnerDupr))
                        StatRow(title: "Avg Opponent", value: String(format: "%.2f", stats.doubles.averageOpponentDupr))
                        if let winPercent = stats.doubles.averagePointsWonPercent {
                            StatRow(title: "Win %", value: String(format: "%.0f%%", winPercent * 100))
                        }
                    }
                }
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

struct StatRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}

struct EmptyMatchesView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "sportscourt")
                .font(.system(size: 40))
                .foregroundColor(.secondary)
            
            Text("No matches yet")
                .font(.headline)
                .fontWeight(.medium)
            
            Text("Record your first match to see it here")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        )
        .padding(.horizontal)
    }
}

struct MatchCardSkeleton: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 80, height: 20)
                
                Spacer()
                
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 60, height: 16)
            }
            
            HStack {
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 120, height: 16)
                
                Spacer()
                
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 40, height: 16)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
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
    ProfileView()
        .environmentObject(AuthenticationManager())
        .environmentObject(HapticManager())
}