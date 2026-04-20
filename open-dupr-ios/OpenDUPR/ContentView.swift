import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var isLoading = true
    
    var body: some View {
        Group {
            if isLoading {
                LaunchScreen()
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .onAppear {
            // Check for stored authentication
            authManager.checkStoredAuth()
            
            // Add a small delay for launch screen
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation(.easeInOut(duration: 0.5)) {
                    isLoading = false
                }
            }
        }
    }
}

struct LaunchScreen: View {
    @State private var animateGradient = false
    
    var body: some View {
        ZStack {
            // Animated gradient background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.blue.opacity(0.8),
                    Color.purple.opacity(0.8),
                    Color.pink.opacity(0.8)
                ]),
                startPoint: animateGradient ? .topLeading : .bottomTrailing,
                endPoint: animateGradient ? .bottomTrailing : .topLeading
            )
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                    animateGradient.toggle()
                }
            }
            
            VStack(spacing: 20) {
                // App icon/logo
                Image(systemName: "sportscourt.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white, .white.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .scaleEffect(1.0)
                    .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: animateGradient)
                
                Text("Open DUPR")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Clean • Fast • Open Source")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationManager())
        .environmentObject(HapticManager())
}