import SwiftUI

struct MatchHistoryView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var matches: [Match] = []
    @State private var isLoading = false
    @State private var isLoadingMore = false
    @State private var hasMoreMatches = true
    @State private var currentOffset = 0
    @State private var selectedFormat: MatchFormat = .all
    
    private let pageSize = 25
    
    enum MatchFormat: String, CaseIterable {
        case all = "All"
        case singles = "Singles"
        case doubles = "Doubles"
        
        var displayName: String { rawValue }
    }
    
    var filteredMatches: [Match] {
        switch selectedFormat {
        case .all:
            return matches
        case .singles:
            return matches.filter { $0.isSingles }
        case .doubles:
            return matches.filter { $0.isDoubles }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Format filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(MatchFormat.allCases, id: \.self) { format in
                        Button(action: {
                            hapticManager.buttonTap()
                            selectedFormat = format
                        }) {
                            Text(format.displayName)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(selectedFormat == format ? Color.blue : Color.secondary.opacity(0.1))
                                )
                                .foregroundColor(selectedFormat == format ? .white : .primary)
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 8)
            
            // Matches list
            ScrollView {
                LazyVStack(spacing: 12) {
                    if isLoading && matches.isEmpty {
                        ForEach(0..<5, id: \.self) { _ in
                            MatchCardSkeleton()
                        }
                    } else if filteredMatches.isEmpty {
                        EmptyMatchesView()
                            .padding(.top, 50)
                    } else {
                        ForEach(filteredMatches) { match in
                            MatchCardView(match: match)
                                .onTapGesture {
                                    hapticManager.cardTap()
                                    // Navigate to match details
                                }
                                .onAppear {
                                    // Load more when approaching the end
                                    if match.id == filteredMatches.last?.id && hasMoreMatches && !isLoadingMore {
                                        Task {
                                            await loadMoreMatches()
                                        }
                                    }
                                }
                        }
                        
                        // Loading more indicator
                        if isLoadingMore {
                            HStack {
                                ProgressView()
                                    .scaleEffect(0.8)
                                Text("Loading more...")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                        }
                    }
                }
                .padding(.top, 8)
            }
        }
        .navigationTitle("Match History")
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await refreshMatches()
        }
        .task {
            await loadMatches()
        }
    }
    
    private func loadMatches() async {
        guard let token = await authManager.getValidToken() else { return }
        
        isLoading = true
        currentOffset = 0
        
        do {
            let response = try await APIClient.shared.getMatchHistory(
                token: token,
                offset: currentOffset,
                limit: pageSize
            )
            
            if response.status == "SUCCESS" {
                matches = response.result.hits
                hasMoreMatches = response.result.hasMore
                currentOffset = pageSize
            }
        } catch {
            print("Failed to load matches: \(error)")
            hapticManager.errorAction()
        }
        
        isLoading = false
    }
    
    private func loadMoreMatches() async {
        guard let token = await authManager.getValidToken(),
              hasMoreMatches && !isLoadingMore else { return }
        
        isLoadingMore = true
        
        do {
            let response = try await APIClient.shared.getMatchHistory(
                token: token,
                offset: currentOffset,
                limit: pageSize
            )
            
            if response.status == "SUCCESS" {
                matches.append(contentsOf: response.result.hits)
                hasMoreMatches = response.result.hasMore
                currentOffset += pageSize
            }
        } catch {
            print("Failed to load more matches: \(error)")
            hapticManager.errorAction()
        }
        
        isLoadingMore = false
    }
    
    private func refreshMatches() async {
        hapticManager.pullToRefresh()
        await loadMatches()
        hapticManager.successAction()
    }
}

#Preview {
    NavigationView {
        MatchHistoryView()
            .environmentObject(AuthenticationManager())
            .environmentObject(HapticManager())
    }
}