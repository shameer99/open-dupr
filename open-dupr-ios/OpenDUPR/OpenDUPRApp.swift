import SwiftUI

@main
struct OpenDUPRApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var hapticManager = HapticManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(hapticManager)
                .preferredColorScheme(.dark) // Default to dark mode for modern look
        }
    }
}