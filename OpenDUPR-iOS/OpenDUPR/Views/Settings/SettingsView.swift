//
//  SettingsView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager
    @EnvironmentObject var haptic: HapticManager
    
    @State private var showingLogoutAlert = false
    @State private var showingAbout = false
    
    var body: some View {
        NavigationStack {
            List {
                // Profile Section
                if let user = authManager.currentUser {
                    Section {
                        HStack(spacing: 16) {
                            AsyncImage(url: URL(string: user.imageUrl ?? "")) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.white)
                                    .frame(width: 60, height: 60)
                                    .background(Color.gray.opacity(0.3))
                            }
                            .frame(width: 60, height: 60)
                            .clipShape(Circle())
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.fullName)
                                    .font(.headline)
                                
                                if let email = user.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Spacer()
                        }
                        .padding(.vertical, 8)
                    }
                }
                
                // Appearance
                Section("Appearance") {
                    Toggle(isOn: $themeManager.useSystemTheme) {
                        Label("Use System Theme", systemImage: "iphone")
                    }
                    .onChange(of: themeManager.useSystemTheme) { _, useSystem in
                        haptic.impact(.light)
                        if useSystem {
                            themeManager.isDarkMode = UITraitCollection.current.userInterfaceStyle == .dark
                        }
                    }
                    
                    if !themeManager.useSystemTheme {
                        Toggle(isOn: $themeManager.isDarkMode) {
                            Label("Dark Mode", systemImage: themeManager.isDarkMode ? "moon.fill" : "sun.max.fill")
                        }
                        .onChange(of: themeManager.isDarkMode) { _, _ in
                            haptic.impact(.light)
                        }
                    }
                }
                
                // App Info
                Section("Information") {
                    Button(action: {
                        haptic.impact(.light)
                        showingAbout = true
                    }) {
                        Label("About Open DUPR", systemImage: "info.circle")
                            .foregroundColor(.primary)
                    }
                    
                    Link(destination: URL(string: "https://github.com/opendupr/opendupr/issues")!) {
                        Label("Report an Issue", systemImage: "exclamationmark.bubble")
                    }
                    
                    HStack {
                        Label("Version", systemImage: "gear")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
                
                // Account Actions
                Section {
                    Button(action: {
                        haptic.impact(.medium)
                        showingLogoutAlert = true
                    }) {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        haptic.impact(.light)
                        dismiss()
                    }
                }
            }
            .alert("Sign Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    haptic.impact(.medium)
                    dismiss()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        authManager.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .sheet(isPresented: $showingAbout) {
                AboutView()
            }
        }
    }
}