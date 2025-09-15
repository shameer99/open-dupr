import SwiftUI

struct FeedView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var feedItems: [FeedItem] = []
    @State private var isLoading = false
    @State private var isRefreshing = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    if isLoading && feedItems.isEmpty {
                        ForEach(0..<5, id: \.self) { _ in
                            FeedItemSkeleton()
                        }
                    } else if feedItems.isEmpty {
                        EmptyFeedView()
                            .padding(.top, 50)
                    } else {
                        ForEach(feedItems) { item in
                            FeedItemView(item: item)
                                .onTapGesture {
                                    hapticManager.cardTap()
                                }
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.top)
            }
            .refreshable {
                await refreshFeed()
            }
            .navigationTitle("Feed")
            .navigationBarTitleDisplayMode(.large)
        }
        .task {
            await loadFeed()
        }
    }
    
    private func loadFeed() async {
        guard let token = await authManager.getValidToken(),
              let user = authManager.currentUser else { return }
        
        isLoading = true
        
        // For now, we'll simulate feed data since the API endpoint would need user's feed ID
        // In a real implementation, you'd call the feed API endpoint
        
        // Simulate loading delay
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Mock feed data
        feedItems = createMockFeedItems()
        
        isLoading = false
    }
    
    private func refreshFeed() async {
        isRefreshing = true
        hapticManager.pullToRefresh()
        
        await loadFeed()
        
        isRefreshing = false
        hapticManager.successAction()
    }
    
    private func createMockFeedItems() -> [FeedItem] {
        // This would be replaced with actual API call to /activity/v1.1/user/{feedId}
        return []
    }
}

struct FeedItem: Identifiable {
    let id = UUID()
    let playerName: String
    let playerImageUrl: String?
    let action: String
    let timestamp: Date
    let match: Match?
}

struct FeedItemView: View {
    let item: FeedItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with player info and timestamp
            HStack(spacing: 12) {
                AsyncImage(url: URL(string: item.playerImageUrl ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .foregroundColor(.secondary)
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.playerName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Text(item.action)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(timeAgoString(from: item.timestamp))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Match content if available
            if let match = item.match {
                MatchCardView(match: match)
                    .padding(.leading, 52) // Align with content
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.regularMaterial)
        )
    }
    
    private func timeAgoString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct FeedItemSkeleton: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Circle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 40, height: 40)
                
                VStack(alignment: .leading, spacing: 2) {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .frame(width: 100, height: 16)
                    
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .frame(width: 80, height: 12)
                }
                
                Spacer()
                
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 40, height: 12)
            }
            
            Rectangle()
                .fill(Color.secondary.opacity(0.3))
                .frame(height: 80)
                .padding(.leading, 52)
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

struct EmptyFeedView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "house.circle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            VStack(spacing: 8) {
                Text("Your Feed is Empty")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Follow other players to see their match activity here")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            NavigationLink(destination: SearchView()) {
                HStack {
                    Image(systemName: "magnifyingglass")
                    Text("Find Players to Follow")
                }
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.blue)
                )
            }
        }
        .padding()
    }
}

#Preview {
    FeedView()
        .environmentObject(AuthenticationManager())
        .environmentObject(HapticManager())
}