//
//  OpenDUPRApp.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

@main
struct OpenDUPRApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var themeManager = ThemeManager()
    @StateObject private var hapticManager = HapticManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(themeManager)
                .environmentObject(hapticManager)
                .preferredColorScheme(themeManager.isDarkMode ? .dark : .light)
                .tint(Color.duprGreen)
        }
    }
}