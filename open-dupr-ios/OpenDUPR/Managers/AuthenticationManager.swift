import Foundation
import Combine

@MainActor
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var accessToken: String?
    private var refreshToken: String?
    private let apiClient = APIClient.shared
    
    private let keychain = KeychainManager()
    
    func checkStoredAuth() {
        if let token = keychain.getAccessToken(),
           let refresh = keychain.getRefreshToken() {
            self.accessToken = token
            self.refreshToken = refresh
            self.isAuthenticated = true
            
            // Fetch user profile
            Task {
                await loadUserProfile()
            }
        }
    }
    
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await apiClient.login(email: email, password: password)
            
            if response.status == "SUCCESS" {
                self.accessToken = response.result.accessToken
                self.refreshToken = response.result.refreshToken
                self.currentUser = response.result.user
                
                // Store tokens securely
                keychain.storeTokens(
                    accessToken: response.result.accessToken,
                    refreshToken: response.result.refreshToken
                )
                
                self.isAuthenticated = true
            } else {
                self.errorMessage = response.message ?? "Login failed"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func logout() {
        keychain.clearTokens()
        accessToken = nil
        refreshToken = nil
        currentUser = nil
        isAuthenticated = false
    }
    
    func loadUserProfile() async {
        guard let token = accessToken else { return }
        
        do {
            let response = try await apiClient.getUserProfile(token: token)
            if response.status == "SUCCESS" {
                self.currentUser = response.result
            }
        } catch {
            print("Failed to load user profile: \(error)")
        }
    }
    
    func refreshAccessToken() async -> Bool {
        guard let refreshToken = refreshToken else { return false }
        
        do {
            let newToken = try await apiClient.refreshToken(refreshToken: refreshToken)
            self.accessToken = newToken
            keychain.updateAccessToken(newToken)
            return true
        } catch {
            logout()
            return false
        }
    }
    
    func getValidToken() async -> String? {
        guard let token = accessToken else { return nil }
        
        // Check if token needs refresh (simple approach - could be improved)
        if await !apiClient.validateToken(token) {
            if await refreshAccessToken() {
                return accessToken
            } else {
                return nil
            }
        }
        
        return token
    }
}