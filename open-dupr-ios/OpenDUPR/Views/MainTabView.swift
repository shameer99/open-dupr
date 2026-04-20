import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var hapticManager: HapticManager
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ProfileView()
                .tabItem {
                    Image(systemName: selectedTab == 0 ? "person.fill" : "person")
                    Text("Profile")
                }
                .tag(0)
            
            FeedView()
                .tabItem {
                    Image(systemName: selectedTab == 1 ? "house.fill" : "house")
                    Text("Feed")
                }
                .tag(1)
            
            SearchView()
                .tabItem {
                    Image(systemName: selectedTab == 2 ? "magnifyingglass.circle.fill" : "magnifyingglass")
                    Text("Search")
                }
                .tag(2)
            
            RecordMatchView()
                .tabItem {
                    Image(systemName: selectedTab == 3 ? "plus.circle.fill" : "plus.circle")
                    Text("Record")
                }
                .tag(3)
        }
        .onChange(of: selectedTab) { _, newValue in
            hapticManager.tabSelection()
        }
        .tint(.blue)
    }
}

#Preview {
    MainTabView()
        .environmentObject(HapticManager())
        .environmentObject(AuthenticationManager())
}