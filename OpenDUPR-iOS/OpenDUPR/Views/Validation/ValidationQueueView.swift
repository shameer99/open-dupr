//
//  ValidationQueueView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import Combine

struct ValidationQueueView: View {
    @StateObject private var viewModel = ValidationViewModel()
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.pendingMatches.isEmpty {
                    ScrollView {
                        VStack(spacing: 16) {
                            ForEach(0..<3) { _ in
                                ValidationCardSkeleton()
                            }
                        }
                        .padding()
                    }
                } else if viewModel.pendingMatches.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 80))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.duprGreen, Color.duprDarkGreen],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        
                        Text("All caught up!")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("No matches pending validation")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.pendingMatches) { match in
                                ValidationCard(match: match, viewModel: viewModel)
                                    .transition(.asymmetric(
                                        insertion: .move(edge: .trailing).combined(with: .opacity),
                                        removal: .move(edge: .leading).combined(with: .opacity)
                                    ))
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await viewModel.refresh()
                    }
                }
            }
            .navigationTitle("Validation Queue")
            .navigationBarTitleDisplayMode(.large)
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
        .task {
            await viewModel.loadPendingMatches()
        }
    }
}

// MARK: - Validation Card

struct ValidationCard: View {
    let match: Match
    @ObservedObject var viewModel: ValidationViewModel
    @EnvironmentObject var haptic: HapticManager
    @State private var showDetails = false
    
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
                
                if let venue = match.venue {
                    Text(venue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
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
                            
                            if let player2 = team.player2 {
                                Text("&")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(player2.fullName)
                                    .font(.callout)
                                    .fontWeight(team.winner ? .semibold : .regular)
                            }
                        }
                        
                        Spacer()
                        
                        // Scores
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
                        
                        if team.winner {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.duprGreen)
                                .font(.caption)
                        }
                    }
                }
            }
            .padding()
            .background(Color.duprTertiaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
            // Action Buttons
            HStack(spacing: 12) {
                Button(action: {
                    haptic.notification(.error)
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        viewModel.rejectMatch(match.id)
                    }
                }) {
                    HStack {
                        Image(systemName: "xmark")
                        Text("Reject")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                
                Button(action: {
                    haptic.notification(.success)
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        viewModel.confirmMatch(match.id)
                    }
                }) {
                    HStack {
                        Image(systemName: "checkmark")
                        Text("Confirm")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.duprGreen.opacity(0.1))
                    .foregroundColor(.duprGreen)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding()
        .duprCard()
        .scaleEffect(viewModel.processingMatchIds.contains(match.id) ? 0.95 : 1.0)
        .opacity(viewModel.processingMatchIds.contains(match.id) ? 0.5 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: viewModel.processingMatchIds.contains(match.id))
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

struct ValidationCardSkeleton: View {
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
                .frame(height: 80)
                .shimmering()
            
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 44)
                    .shimmering()
                
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 44)
                    .shimmering()
            }
        }
        .padding()
        .duprCard()
    }
}

// MARK: - View Model

@MainActor
class ValidationViewModel: ObservableObject {
    @Published var pendingMatches: [Match] = []
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    @Published var processingMatchIds: Set<Int> = []
    
    private var cancellables = Set<AnyCancellable>()
    
    func loadPendingMatches() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        // For now, we'll show pending matches from match history
        // In a real app, there would be a specific endpoint for validation queue
        APIService.shared.getMatchHistory(offset: 0, limit: 20)
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
                    // Filter for unconfirmed matches
                    self?.pendingMatches = response.result.hits.filter { !$0.confirmed }
                }
            )
            .store(in: &cancellables)
    }
    
    func refresh() async {
        await loadPendingMatches()
    }
    
    func confirmMatch(_ matchId: Int) {
        processingMatchIds.insert(matchId)
        
        APIService.shared.confirmMatch(matchId: matchId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.processingMatchIds.remove(matchId)
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        self?.showError = true
                    }
                },
                receiveValue: { [weak self] _ in
                    withAnimation {
                        self?.pendingMatches.removeAll { $0.id == matchId }
                    }
                    HapticManager.shared.successPattern()
                }
            )
            .store(in: &cancellables)
    }
    
    func rejectMatch(_ matchId: Int) {
        processingMatchIds.insert(matchId)
        
        APIService.shared.rejectMatch(matchId: matchId)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.processingMatchIds.remove(matchId)
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        self?.showError = true
                    }
                },
                receiveValue: { [weak self] _ in
                    withAnimation {
                        self?.pendingMatches.removeAll { $0.id == matchId }
                    }
                }
            )
            .store(in: &cancellables)
    }
}