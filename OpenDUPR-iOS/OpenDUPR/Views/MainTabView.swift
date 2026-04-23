//
//  MainTabView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(0)
            
            FeedView()
                .tabItem {
                    Label("Feed", systemImage: "rectangle.stack.fill")
                }
                .tag(1)
            
            SearchView()
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
                .tag(2)
            
            ValidationQueueView()
                .tabItem {
                    Label("Validate", systemImage: "checkmark.seal.fill")
                }
                .tag(3)
        }
        .onChange(of: selectedTab) { _, _ in
            haptic.selection()
        }
        .tint(Color.duprGreen)
    }
}