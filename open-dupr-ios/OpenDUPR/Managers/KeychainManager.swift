import Foundation
import Security

class KeychainManager {
    private let service = "com.opendupr.ios"
    private let accessTokenKey = "access_token"
    private let refreshTokenKey = "refresh_token"
    
    func storeTokens(accessToken: String, refreshToken: String) {
        storeItem(key: accessTokenKey, value: accessToken)
        storeItem(key: refreshTokenKey, value: refreshToken)
    }
    
    func getAccessToken() -> String? {
        return getItem(key: accessTokenKey)
    }
    
    func getRefreshToken() -> String? {
        return getItem(key: refreshTokenKey)
    }
    
    func updateAccessToken(_ token: String) {
        storeItem(key: accessTokenKey, value: token)
    }
    
    func clearTokens() {
        deleteItem(key: accessTokenKey)
        deleteItem(key: refreshTokenKey)
    }
    
    private func storeItem(key: String, value: String) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete any existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add the new item
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status != errSecSuccess {
            print("Failed to store item in keychain: \(status)")
        }
    }
    
    private func getItem(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess,
           let data = dataTypeRef as? Data,
           let string = String(data: data, encoding: .utf8) {
            return string
        }
        
        return nil
    }
    
    private func deleteItem(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}