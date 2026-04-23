//
//  LoginView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isPasswordVisible = false
    @State private var showingAbout = false
    
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [Color.duprGreen.opacity(0.3), Color.duprDarkGreen.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    Spacer()
                    
                    // Logo and Title
                    VStack(spacing: 20) {
                        Image(systemName: "tennis.racket")
                            .font(.system(size: 80))
                            .foregroundStyle(Color.duprGreen)
                            .rotationEffect(.degrees(-45))
                            .scaleEffect(1.2)
                            .shadow(color: Color.duprGreen.opacity(0.3), radius: 20, x: 0, y: 10)
                        
                        Text("Open DUPR")
                            .font(.system(size: 42, weight: .bold, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.duprGreen, Color.duprDarkGreen],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                        
                        Text("Track your pickleball journey")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.bottom, 40)
                    
                    // Login Form
                    VStack(spacing: 20) {
                        // Email Field
                        HStack {
                            Image(systemName: "envelope.fill")
                                .foregroundColor(.duprGreen)
                                .frame(width: 30)
                            
                            TextField("Email", text: $email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                        }
                        .padding()
                        .background(Color.duprSecondaryBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.duprGreen.opacity(0.3), lineWidth: 1)
                        )
                        
                        // Password Field
                        HStack {
                            Image(systemName: "lock.fill")
                                .foregroundColor(.duprGreen)
                                .frame(width: 30)
                            
                            if isPasswordVisible {
                                TextField("Password", text: $password)
                                    .textContentType(.password)
                            } else {
                                SecureField("Password", text: $password)
                                    .textContentType(.password)
                            }
                            
                            Button(action: {
                                haptic.impact(.light)
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                    isPasswordVisible.toggle()
                                }
                            }) {
                                Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color.duprSecondaryBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.duprGreen.opacity(0.3), lineWidth: 1)
                        )
                        
                        // Error Message
                        if let error = authManager.errorMessage {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.red)
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(.red)
                            }
                            .padding(.horizontal)
                            .transition(.asymmetric(
                                insertion: .scale.combined(with: .opacity),
                                removal: .opacity
                            ))
                        }
                        
                        // Login Button
                        Button(action: {
                            haptic.impact(.medium)
                            authManager.login(email: email, password: password)
                        }) {
                            HStack {
                                if authManager.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text("Sign In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(
                                    colors: [Color.duprGreen, Color.duprDarkGreen],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .shadow(color: Color.duprGreen.opacity(0.3), radius: 10, x: 0, y: 5)
                        }
                        .disabled(email.isEmpty || password.isEmpty || authManager.isLoading)
                        .opacity(email.isEmpty || password.isEmpty ? 0.6 : 1.0)
                        .scaleEffect(authManager.isLoading ? 0.95 : 1.0)
                        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: authManager.isLoading)
                    }
                    .padding(.horizontal, 30)
                    
                    Spacer()
                    
                    // About Button
                    Button(action: {
                        haptic.impact(.light)
                        showingAbout = true
                    }) {
                        HStack {
                            Image(systemName: "info.circle.fill")
                            Text("About Open DUPR")
                        }
                        .foregroundColor(.secondary)
                        .font(.footnote)
                    }
                    .padding(.bottom)
                }
            }
            .sheet(isPresented: $showingAbout) {
                AboutView()
            }
        }
    }
}