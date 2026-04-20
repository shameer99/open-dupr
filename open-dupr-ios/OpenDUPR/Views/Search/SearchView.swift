import SwiftUI

struct SearchView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var searchText = ""
    @State private var searchResults: [PlayerSearchResult] = []
    @State private var isSearching = false
    @State private var hasSearched = false
    @FocusState private var isSearchFocused: Bool
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    
                    TextField("Search players...", text: $searchText)
                        .focused($isSearchFocused)
                        .textFieldStyle(PlainTextFieldStyle())
                        .onSubmit {
                            Task {
                                await performSearch()
                            }
                        }
                    
                    if !searchText.isEmpty {
                        Button(action: {
                            hapticManager.buttonTap()
                            searchText = ""
                            searchResults = []
                            hasSearched = false
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.regularMaterial)
                )
                .padding()
                
                // Search results
                ScrollView {
                    LazyVStack(spacing: 12) {
                        if isSearching {
                            ForEach(0..<5, id: \.self) { _ in
                                PlayerCardSkeleton()
                            }
                        } else if hasSearched && searchResults.isEmpty {
                            EmptySearchView(searchText: searchText)
                                .padding(.top, 50)
                        } else if !hasSearched && searchText.isEmpty {
                            SearchSuggestionsView()
                                .padding(.top, 50)
                        } else {
                            ForEach(searchResults) { player in
                                NavigationLink(destination: PlayerProfileView(playerId: player.id)) {
                                    PlayerCardView(player: player)
                                }
                                .buttonStyle(PlainButtonStyle())
                                .simultaneousGesture(TapGesture().onEnded {
                                    hapticManager.cardTap()
                                })
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.large)
        }
        .onChange(of: searchText) { _, newValue in
            if newValue.isEmpty {
                searchResults = []
                hasSearched = false
            } else if newValue.count >= 2 {
                // Debounce search
                Task {
                    try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
                    if searchText == newValue {
                        await performSearch()
                    }
                }
            }
        }
    }
    
    private func performSearch() async {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let token = await authManager.getValidToken() else { return }
        
        isSearching = true
        hapticManager.buttonTap()
        
        do {
            let response = try await APIClient.shared.searchPlayers(
                query: searchText.trimmingCharacters(in: .whitespacesAndNewlines),
                token: token
            )
            
            if response.status == "SUCCESS" {
                searchResults = response.result.hits
                hasSearched = true
            }
        } catch {
            print("Search failed: \(error)")
            hapticManager.errorAction()
            searchResults = []
            hasSearched = true
        }
        
        isSearching = false
    }
}

struct PlayerCardView: View {
    let player: PlayerSearchResult
    
    var body: some View {
        HStack(spacing: 12) {
            // Profile image
            AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.secondary)
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())
            
            // Player info
            VStack(alignment: .leading, spacing: 4) {
                Text(player.displayName)
                    .font(.headline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                if !player.location.isEmpty {
                    Text(player.location)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                HStack(spacing: 12) {
                    RatingBadge(rating: player.ratings.singles, type: "S")
                    RatingBadge(rating: player.ratings.doubles, type: "D")
                    
                    if let distance = player.distance {
                        Text(distance)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.leading, 8)
                    }
                }
            }
            
            Spacer()
            
            // Navigation indicator
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.regularMaterial)
        )
    }
}

struct PlayerCardSkeleton: View {
    @State private var isAnimating = false
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.secondary.opacity(0.3))
                .frame(width: 50, height: 50)
            
            VStack(alignment: .leading, spacing: 4) {
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 120, height: 20)
                
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 80, height: 16)
                
                HStack(spacing: 8) {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .frame(width: 40, height: 16)
                    
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .frame(width: 40, height: 16)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.regularMaterial)
        )
        .opacity(isAnimating ? 0.5 : 1.0)
        .animation(.easeInOut(duration: 1).repeatForever(autoreverses: true), value: isAnimating)
        .onAppear {
            isAnimating = true
        }
    }
}

struct EmptySearchView: View {
    let searchText: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.2.slash")
                .font(.system(size: 50))
                .foregroundColor(.secondary)
            
            Text("No players found")
                .font(.headline)
                .fontWeight(.medium)
            
            Text("No results for \"\(searchText)\"")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Text("Try adjusting your search terms")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

struct SearchSuggestionsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "magnifyingglass.circle")
                .font(.system(size: 50))
                .foregroundColor(.secondary)
            
            VStack(spacing: 8) {
                Text("Search for Players")
                    .font(.headline)
                    .fontWeight(.medium)
                
                Text("Find other DUPR players to connect and play with")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Search tips:")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("• Enter a player's name")
                    Text("• Search by location")
                    Text("• Use partial names")
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
            )
        }
        .padding()
    }
}

#Preview {
    SearchView()
        .environmentObject(AuthenticationManager())
        .environmentObject(HapticManager())
}