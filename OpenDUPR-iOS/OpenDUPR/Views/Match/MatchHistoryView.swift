//
//  MatchHistoryView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import Combine

struct MatchHistoryView: View {
    let userId: Int
    @StateObject private var viewModel: MatchHistoryViewModel
    @EnvironmentObject var haptic: HapticManager
    
    init(userId: Int) {
        self.userId = userId
        self._viewModel = StateObject(wrappedValue: MatchHistoryViewModel(userId: userId))
    }
    
    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.matches.isEmpty {
                ScrollView {
                    VStack(spacing: 16) {
                        ForEach(0..<5) { _ in
                            MatchCardSkeleton()
                        }
                    }
                    .padding()
                }
            } else if viewModel.matches.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "list.bullet.rectangle")
                        .font(.system(size: 60))
                        .foregroundColor(.gray.opacity(0.3))
                    
                    Text("No matches yet")
                        .font(.title3)
                        .fontWeight(.semibold)
                    
                    Text("Matches will appear here once recorded")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .frame(maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.matches) { match in
                            MatchCard(match: match)
                                .onTapGesture {
                                    haptic.impact(.light)
                                }
                        }
                        
                        if viewModel.hasMore {
                            ProgressView()
                                .padding()
                                .onAppear {
                                    viewModel.loadMore()
                                }
                        }
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .navigationTitle("Match History")
        .navigationBarTitleDisplayMode(.large)
        .task {
            await viewModel.loadMatches()
        }
    }
}

struct MatchCard: View {
    let match: Match
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(match.eventFormat.displayName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(match.eventFormat == .singles ? .singlesOrange : .doublesBlue)
                    
                    Text(formatDate(match.eventDate))
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                Spacer()
                
                if match.confirmed {
                    Label("Confirmed", systemImage: "checkmark.seal.fill")
                        .font(.caption)
                        .foregroundColor(.duprGreen)
                } else {
                    Label("Pending", systemImage: "clock.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
            
            if let venue = match.venue {
                HStack {
                    Image(systemName: "location.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(venue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Teams
            VStack(spacing: 8) {
                ForEach(match.teams) { team in
                    HStack {
                        // Players
                        HStack(spacing: 4) {
                            Text(team.player1.fullName)
                                .font(.callout)
                                .fontWeight(team.winner ? .semibold : .regular)
                            
                            if let rating = team.player1.rating {
                                Text("(\(rating))")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            if let player2 = team.player2 {
                                Text("&")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(player2.fullName)
                                    .font(.callout)
                                    .fontWeight(team.winner ? .semibold : .regular)
                                
                                if let rating = player2.rating {
                                    Text("(\(rating))")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        
                        Spacer()
                        
                        // Scores and Delta
                        VStack(alignment: .trailing, spacing: 2) {
                            HStack(spacing: 6) {
                                if team.game1 > 0 {
                                    Text("\(team.game1)")
                                        .font(.callout)
                                        .fontWeight(team.winner ? .semibold : .regular)
                                }
                                if team.game2 > 0 {
                                    Text("\(team.game2)")
                                        .font(.callout)
                                        .fontWeight(team.winner ? .semibold : .regular)
                                }
                                if team.game3 > 0 {
                                    Text("\(team.game3)")
                                        .font(.callout)
                                        .fontWeight(team.winner ? .semibold : .regular)
                                }
                            }
                            .foregroundColor(team.winner ? .duprGreen : .secondary)
                            
                            if let delta = team.delta {
                                Text(delta)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(delta.hasPrefix("+") ? .duprGreen : .red)
                            }
                        }
                    }
                }
            }
            .padding()
            .background(Color.duprTertiaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding()
        .duprCard()
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateString) else { return dateString }
        
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

struct MatchCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 60, height: 16)
                        .shimmering()
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 100, height: 20)
                        .shimmering()
                }
                
                Spacer()
            }
            
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.2))
                .frame(height: 100)
                .shimmering()
        }
        .padding()
        .duprCard()
    }
}

// MARK: - View Model

@MainActor
class MatchHistoryViewModel: ObservableObject {
    @Published var matches: [Match] = []
    @Published var isLoading = false
    @Published var hasMore = false
    @Published var errorMessage: String?
    
    private let userId: Int
    private var offset = 0
    private let limit = 20
    private var cancellables = Set<AnyCancellable>()
    
    init(userId: Int) {
        self.userId = userId
    }
    
    func loadMatches() async {
        guard !isLoading else { return }
        
        isLoading = true
        offset = 0
        
        APIService.shared.getPlayerMatchHistory(playerId: userId, offset: offset, limit: limit)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    guard let self = self else { return }
                    self.matches = response.result.hits
                    self.hasMore = response.result.hasMore
                    self.offset = self.limit
                }
            )
            .store(in: &cancellables)
    }
    
    func loadMore() {
        guard !isLoading && hasMore else { return }
        
        isLoading = true
        
        APIService.shared.getPlayerMatchHistory(playerId: userId, offset: offset, limit: limit)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    guard let self = self else { return }
                    self.matches.append(contentsOf: response.result.hits)
                    self.hasMore = response.result.hasMore
                    self.offset += self.limit
                }
            )
            .store(in: &cancellables)
    }
    
    func refresh() async {
        await loadMatches()
    }
}