//
//  FeedView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import Combine

struct FeedView: View {
    @StateObject private var viewModel = FeedViewModel()
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.posts.isEmpty {
                    // Initial loading
                    ScrollView {
                        VStack(spacing: 16) {
                            ForEach(0..<5) { _ in
                                FeedCardSkeleton()
                            }
                        }
                        .padding()
                    }
                } else if viewModel.posts.isEmpty {
                    // Empty state
                    VStack(spacing: 20) {
                        Image(systemName: "rectangle.stack.badge.plus")
                            .font(.system(size: 80))
                            .foregroundColor(.gray.opacity(0.3))
                        
                        Text("No posts yet")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Follow some players to see their matches here")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        NavigationLink(destination: SearchView()) {
                            HStack {
                                Image(systemName: "magnifyingglass")
                                Text("Find Players")
                            }
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color.duprGreen)
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }
                    .padding()
                } else {
                    // Feed content
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.posts) { post in
                                FeedCard(post: post)
                                    .transition(.asymmetric(
                                        insertion: .move(edge: .bottom).combined(with: .opacity),
                                        removal: .move(edge: .top).combined(with: .opacity)
                                    ))
                            }
                            
                            if viewModel.isLoadingMore {
                                ProgressView()
                                    .padding()
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await viewModel.refresh()
                    }
                }
            }
            .navigationTitle("Feed")
            .navigationBarTitleDisplayMode(.large)
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
        .task {
            await viewModel.loadFeed()
        }
    }
}

// MARK: - Feed Card

struct FeedCard: View {
    let post: FeedPost
    @EnvironmentObject var haptic: HapticManager
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                AsyncImage(url: URL(string: post.actor.profileImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.fill")
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(Color.gray.opacity(0.3))
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(post.actor.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Text(formatDate(post.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if post.actor.isFollow {
                    Text("Following")
                        .font(.caption)
                        .foregroundColor(.duprGreen)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.duprGreen, lineWidth: 1)
                        )
                }
            }
            
            // Matches
            if let matches = post.matches {
                VStack(spacing: 8) {
                    ForEach(matches.indices, id: \.self) { index in
                        if index < 2 || isExpanded {
                            FeedMatchCard(match: matches[index])
                                .transition(.asymmetric(
                                    insertion: .scale.combined(with: .opacity),
                                    removal: .scale.combined(with: .opacity)
                                ))
                        }
                    }
                    
                    if matches.count > 2 && !isExpanded {
                        Button(action: {
                            haptic.impact(.light)
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                isExpanded = true
                            }
                        }) {
                            HStack {
                                Text("Show \(matches.count - 2) more")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                Image(systemName: "chevron.down")
                                    .font(.caption)
                            }
                            .foregroundColor(.duprGreen)
                        }
                    }
                }
            }
            
            // Reactions
            HStack(spacing: 20) {
                Button(action: {
                    haptic.impact(.light)
                    // Handle like
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "heart")
                            .font(.system(size: 16))
                        if let likes = post.reactionCounts["like"], likes > 0 {
                            Text("\(likes)")
                                .font(.caption)
                        }
                    }
                    .foregroundColor(.secondary)
                }
                
                Button(action: {
                    haptic.impact(.light)
                    // Handle comment
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "bubble.right")
                            .font(.system(size: 16))
                        if let comments = post.reactionCounts["comment"], comments > 0 {
                            Text("\(comments)")
                                .font(.caption)
                        }
                    }
                    .foregroundColor(.secondary)
                }
                
                Spacer()
            }
        }
        .padding()
        .duprCard()
    }
    
    private func formatDate(_ timestamp: Int) -> String {
        let date = Date(timeIntervalSince1970: TimeInterval(timestamp / 1000))
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct FeedMatchCard: View {
    let match: FeedMatch
    
    var body: some View {
        VStack(spacing: 8) {
            // Match info
            HStack {
                if let venue = match.venue {
                    Text(venue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(match.eventFormat.lowercased().capitalized)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(match.eventFormat == "SINGLES" ? .singlesOrange : .doublesBlue)
            }
            
            // Teams
            VStack(spacing: 4) {
                ForEach(match.teams.indices, id: \.self) { index in
                    let team = match.teams[index]
                    HStack {
                        // Players
                        HStack(spacing: 8) {
                            if let player1 = team.player1 {
                                Text(player1.fullName)
                                    .font(.caption)
                                    .fontWeight(team.winner ? .semibold : .regular)
                            }
                            
                            if let player2 = team.player2 {
                                Text("&")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(player2.fullName)
                                    .font(.caption)
                                    .fontWeight(team.winner ? .semibold : .regular)
                            }
                        }
                        
                        Spacer()
                        
                        // Scores
                        HStack(spacing: 6) {
                            Text("\(team.game1)")
                                .font(.caption)
                                .fontWeight(team.winner ? .semibold : .regular)
                            
                            if let game2 = team.game2, game2 > 0 {
                                Text("\(game2)")
                                    .font(.caption)
                                    .fontWeight(team.winner ? .semibold : .regular)
                            }
                            
                            if let game3 = team.game3, game3 > 0 {
                                Text("\(game3)")
                                    .font(.caption)
                                    .fontWeight(team.winner ? .semibold : .regular)
                            }
                        }
                        .foregroundColor(team.winner ? .duprGreen : .secondary)
                    }
                }
            }
            .padding(8)
            .background(Color.duprTertiaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

struct FeedCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .shimmering()
                
                VStack(alignment: .leading, spacing: 2) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 120, height: 16)
                        .shimmering()
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 80, height: 12)
                        .shimmering()
                }
                
                Spacer()
            }
            
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.2))
                .frame(height: 100)
                .shimmering()
            
            HStack(spacing: 20) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 40, height: 20)
                    .shimmering()
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 40, height: 20)
                    .shimmering()
            }
        }
        .padding()
        .duprCard()
    }
}

// MARK: - View Model

@MainActor
class FeedViewModel: ObservableObject {
    @Published var posts: [FeedPost] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    func loadFeed() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        APIService.shared.getFeed()
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
                    self?.posts = response.results.filter { $0.verb == "MATCH" }
                }
            )
            .store(in: &cancellables)
    }
    
    func refresh() async {
        await loadFeed()
    }
}