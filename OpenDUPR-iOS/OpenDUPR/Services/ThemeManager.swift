//
//  ThemeManager.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

class ThemeManager: ObservableObject {
    @AppStorage("isDarkMode") var isDarkMode = false
    @AppStorage("useSystemTheme") var useSystemTheme = true
    
    init() {
        if useSystemTheme {
            isDarkMode = UITraitCollection.current.userInterfaceStyle == .dark
        }
    }
    
    func toggleTheme() {
        HapticManager.shared.impact(.light)
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            isDarkMode.toggle()
            useSystemTheme = false
        }
    }
}

// MARK: - Custom Colors

extension Color {
    static let duprGreen = Color(red: 0.0, green: 0.8, blue: 0.4)
    static let duprDarkGreen = Color(red: 0.0, green: 0.6, blue: 0.3)
    
    static let duprBackground = Color(UIColor.systemBackground)
    static let duprSecondaryBackground = Color(UIColor.secondarySystemBackground)
    static let duprTertiaryBackground = Color(UIColor.tertiarySystemBackground)
    
    static let duprLabel = Color(UIColor.label)
    static let duprSecondaryLabel = Color(UIColor.secondaryLabel)
    static let duprTertiaryLabel = Color(UIColor.tertiaryLabel)
    
    static let duprSeparator = Color(UIColor.separator)
    
    static let singlesOrange = Color(red: 1.0, green: 0.6, blue: 0.0)
    static let doublesBlue = Color(red: 0.0, green: 0.5, blue: 1.0)
}

// MARK: - View Extensions

extension View {
    func duprCard() -> some View {
        self
            .background(Color.duprSecondaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 2)
    }
    
    func glassBackground() -> some View {
        self
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}