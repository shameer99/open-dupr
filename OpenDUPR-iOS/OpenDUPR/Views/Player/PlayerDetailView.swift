//
//  PlayerDetailView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import Combine

struct PlayerDetailView: View {
    let playerId: Int
    @StateObject private var viewModel: PlayerDetailViewModel
    @EnvironmentObject var haptic: HapticManager
    @State private var showingRatingHistory = false
    
    init(playerId: Int) {
        self.playerId = playerId
        self._viewModel = StateObject(wrappedValue: PlayerDetailViewModel(playerId: playerId))
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let profile = viewModel.playerProfile {
                    // Profile Header
                    ProfileHeaderView(user: profile)
                        .padding(.horizontal)
                    
                    // Follow Button
                    if let followInfo = viewModel.followInfo {
                        VStack(spacing: 12) {
                            // Follow/Unfollow Button
                            Button(action: {
                                haptic.impact(.medium)
                                viewModel.toggleFollow()
                            }) {
                                HStack {
                                    Image(systemName: followInfo.isFollowed ? "person.badge.minus" : "person.badge.plus")
                                    Text(followInfo.isFollowed ? "Unfollow" : "Follow")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(followInfo.isFollowed ? Color.gray.opacity(0.2) : Color.duprGreen)
                                .foregroundColor(followInfo.isFollowed ? .primary : .white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .disabled(viewModel.isProcessingFollow)
                            .opacity(viewModel.isProcessingFollow ? 0.6 : 1.0)
                            
                            // Social Stats
                            HStack(spacing: 40) {
                                NavigationLink(destination: SocialView(userId: playerId, userName: profile.fullName)) {
                                    VStack {
                                        Text("\(followInfo.followers)")
                                            .font(.title2)
                                            .fontWeight(.bold)
                                        Text("Followers")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .buttonStyle(PlainButtonStyle())
                                
                                NavigationLink(destination: SocialView(userId: playerId, userName: profile.fullName)) {
                                    VStack {
                                        Text("\(followInfo.followings)")
                                            .font(.title2)
                                            .fontWeight(.bold)
                                        Text("Following")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Stats Cards
                    if let stats = profile.stats {
                        HStack(spacing: 16) {
                            RatingCard(
                                title: "Singles",
                                rating: stats.singles,
                                verified: stats.singlesVerified,
                                reliability: stats.singlesReliabilityScore ?? 0,
                                color: .singlesOrange
                            )
                            .onTapGesture {
                                haptic.impact(.light)
                                showingRatingHistory = true
                            }
                            
                            RatingCard(
                                title: "Doubles",
                                rating: stats.doubles,
                                verified: stats.doublesVerified,
                                reliability: stats.doublesReliabilityScore ?? 0,
                                color: .doublesBlue
                            )
                            .onTapGesture {
                                haptic.impact(.light)
                                showingRatingHistory = true
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Match Statistics
                    if let calculatedStats = viewModel.calculatedStats {
                        VStack(spacing: 16) {
                            Text("Statistics")
                                .font(.headline)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            if let overview = calculatedStats.resulOverview {
                                HStack(spacing: 30) {
                                    StatItem(
                                        value: "\(overview.wins)",
                                        label: "Wins",
                                        color: .duprGreen
                                    )
                                    
                                    StatItem(
                                        value: "\(overview.losses)",
                                        label: "Losses",
                                        color: .red
                                    )
                                    
                                    StatItem(
                                        value: String(format: "%.1f%%", Double(overview.wins) / Double(overview.wins + overview.losses) * 100),
                                        label: "Win Rate",
                                        color: .duprGreen
                                    )
                                }
                                .padding()
                                .duprCard()
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // View Match History
                    NavigationLink(destination: MatchHistoryView(userId: playerId)) {
                        HStack {
                            Image(systemName: "list.bullet.rectangle.fill")
                            Text("View Match History")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .duprCard()
                    }
                    .foregroundColor(.primary)
                    .padding(.horizontal)
                    
                } else {
                    // Loading state
                    VStack(spacing: 20) {
                        ProfileHeaderSkeleton()
                        
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 50)
                            .shimmering()
                        
                        HStack(spacing: 16) {
                            RatingCardSkeleton()
                            RatingCardSkeleton()
                        }
                        
                        ActionButtonSkeleton()
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingRatingHistory) {
            RatingHistoryWebView(userId: playerId)
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred")
        }
        .task {
            await viewModel.loadPlayerData()
        }
    }
}

struct StatItem: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - View Model

@MainActor
class PlayerDetailViewModel: ObservableObject {
    @Published var playerProfile: User?
    @Published var followInfo: FollowInfo?
    @Published var calculatedStats: CalculatedStats?
    @Published var isLoading = false
    @Published var isProcessingFollow = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private let playerId: Int
    private var cancellables = Set<AnyCancellable>()
    
    init(playerId: Int) {
        self.playerId = playerId
    }
    
    func loadPlayerData() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        // Load player profile from search result
        // In a real app, there would be a specific endpoint for player profile
        APIService.shared.searchPlayers(query: String(playerId))
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        self?.showError = true
                    }
                },
                receiveValue: { [weak self] response in
                    guard let self = self else { return }
                    if let playerResult = response.result.hits.first(where: { $0.id == self.playerId }) {
                        // Convert search result to user profile
                        self.playerProfile = User(
                            id: playerResult.id,
                            fullName: playerResult.fullName,
                            firstName: playerResult.firstName,
                            lastName: playerResult.lastName,
                            email: nil,
                            username: nil,
                            displayUsername: nil,
                            imageUrl: playerResult.imageUrl,
                            birthdate: nil,
                            gender: playerResult.gender,
                            hand: playerResult.hand,
                            phone: nil,
                            stats: UserStats(
                                singles: playerResult.ratings.singles,
                                singlesVerified: playerResult.ratings.singlesVerified,
                                singlesProvisional: playerResult.ratings.singlesProvisional,
                                singlesReliabilityScore: playerResult.ratings.singlesReliabilityScore,
                                doubles: playerResult.ratings.doubles,
                                doublesVerified: playerResult.ratings.doublesVerified,
                                doublesProvisional: playerResult.ratings.doublesProvisional,
                                doublesReliabilityScore: playerResult.ratings.doublesReliabilityScore,
                                defaultRating: playerResult.ratings.defaultRating
                            ),
                            addresses: playerResult.shortAddress != nil ? [Address(
                                formattedAddress: playerResult.shortAddress!,
                                latitude: nil,
                                longitude: nil
                            )] : nil,
                            active: true,
                            restricted: false
                        )
                    }
                    
                    // Load additional data
                    self.loadFollowInfo()
                    self.loadCalculatedStats()
                }
            )
            .store(in: &cancellables)
    }
    
    private func loadFollowInfo() {
        APIService.shared.getFollowInfo(userId: playerId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { [weak self] response in
                    self?.followInfo = response.result
                }
            )
            .store(in: &cancellables)
    }
    
    private func loadCalculatedStats() {
        APIService.shared.getUserStats(userId: playerId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { [weak self] response in
                    self?.calculatedStats = response.result
                }
            )
            .store(in: &cancellables)
    }
    
    func toggleFollow() {
        guard let followInfo = followInfo else { return }
        
        isProcessingFollow = true
        
        let publisher = followInfo.isFollowed
            ? APIService.shared.unfollowUser(userId: playerId)
            : APIService.shared.followUser(userId: playerId)
        
        publisher
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isProcessingFollow = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        self?.showError = true
                    }
                },
                receiveValue: { [weak self] _ in
                    guard let self = self else { return }
                    
                    // Update follow info locally
                    self.followInfo?.isFollowed.toggle()
                    if self.followInfo?.isFollowed == true {
                        self.followInfo?.followers += 1
                    } else {
                        self.followInfo?.followers -= 1
                    }
                    
                    HapticManager.shared.notification(.success)
                }
            )
            .store(in: &cancellables)
    }
}