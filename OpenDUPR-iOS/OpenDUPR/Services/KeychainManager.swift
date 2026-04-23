//
//  KeychainManager.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import Foundation
import Security

class KeychainManager {
    static let shared = KeychainManager()
    
    private let accessTokenKey = "com.opendupr.accessToken"
    private let refreshTokenKey = "com.opendupr.refreshToken"
    
    private init() {}
    
    func saveAccessToken(_ token: String) {
        save(token, for: accessTokenKey)
    }
    
    func saveRefreshToken(_ token: String) {
        save(token, for: refreshTokenKey)
    }
    
    func getAccessToken() -> String? {
        get(for: accessTokenKey)
    }
    
    func getRefreshToken() -> String? {
        get(for: refreshTokenKey)
    }
    
    func clearTokens() {
        delete(for: accessTokenKey)
        delete(for: refreshTokenKey)
    }
    
    private func save(_ value: String, for key: String) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func get(for key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return string
    }
    
    private func delete(for key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}