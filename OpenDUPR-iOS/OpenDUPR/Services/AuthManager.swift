//
//  AuthManager.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import Foundation
import Combine
import SwiftUI

class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    private let haptic = HapticManager.shared
    
    init() {
        checkAuthStatus()
    }
    
    private func checkAuthStatus() {
        isAuthenticated = KeychainManager.shared.getAccessToken() != nil
        if isAuthenticated {
            loadUserProfile()
        }
    }
    
    func login(email: String, password: String) {
        isLoading = true
        errorMessage = nil
        
        APIService.shared.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                        self?.haptic.notification(.error)
                    }
                },
                receiveValue: { [weak self] response in
                    guard let self = self else { return }
                    
                    KeychainManager.shared.saveAccessToken(response.result.accessToken)
                    KeychainManager.shared.saveRefreshToken(response.result.refreshToken)
                    
                    self.currentUser = response.result.user
                    
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                        self.isAuthenticated = true
                    }
                    
                    self.haptic.notification(.success)
                }
            )
            .store(in: &cancellables)
    }
    
    func logout() {
        haptic.impact(.medium)
        
        KeychainManager.shared.clearTokens()
        
        withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
            isAuthenticated = false
            currentUser = nil
        }
    }
    
    func loadUserProfile() {
        APIService.shared.getMyProfile()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { [weak self] response in
                    self?.currentUser = response.result
                }
            )
            .store(in: &cancellables)
    }
}