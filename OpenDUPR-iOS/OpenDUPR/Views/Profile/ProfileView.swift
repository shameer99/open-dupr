//
//  ProfileView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var haptic: HapticManager
    @EnvironmentObject var themeManager: ThemeManager
    
    @State private var showingRecordMatch = false
    @State private var showingRatingHistory = false
    @State private var isRefreshing = false
    @State private var showSettings = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let user = authManager.currentUser {
                        // Profile Header
                        ProfileHeaderView(user: user)
                            .padding(.horizontal)
                        
                        // Stats Cards
                        HStack(spacing: 16) {
                            RatingCard(
                                title: "Singles",
                                rating: user.stats.singles,
                                verified: user.stats.singlesVerified,
                                reliability: user.stats.singlesReliabilityScore ?? 0,
                                color: .singlesOrange
                            )
                            .onTapGesture {
                                haptic.impact(.light)
                                showingRatingHistory = true
                            }
                            
                            RatingCard(
                                title: "Doubles",
                                rating: user.stats.doubles,
                                verified: user.stats.doublesVerified,
                                reliability: user.stats.doublesReliabilityScore ?? 0,
                                color: .doublesBlue
                            )
                            .onTapGesture {
                                haptic.impact(.light)
                                showingRatingHistory = true
                            }
                        }
                        .padding(.horizontal)
                        
                        // Action Buttons
                        VStack(spacing: 12) {
                            Button(action: {
                                haptic.impact(.medium)
                                showingRecordMatch = true
                            }) {
                                HStack {
                                    Image(systemName: "plus.circle.fill")
                                    Text("Record Match")
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding()
                                .duprCard()
                            }
                            .foregroundColor(.primary)
                            
                            NavigationLink(destination: MatchHistoryView(userId: user.id)) {
                                HStack {
                                    Image(systemName: "list.bullet.rectangle.fill")
                                    Text("Match History")
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding()
                                .duprCard()
                            }
                            .foregroundColor(.primary)
                            
                            NavigationLink(destination: SocialView(userId: user.id, userName: user.fullName)) {
                                HStack {
                                    Image(systemName: "person.2.fill")
                                    Text("Followers & Following")
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding()
                                .duprCard()
                            }
                            .foregroundColor(.primary)
                        }
                        .padding(.horizontal)
                    } else {
                        // Loading state
                        VStack(spacing: 20) {
                            ProfileHeaderSkeleton()
                            HStack(spacing: 16) {
                                RatingCardSkeleton()
                                RatingCardSkeleton()
                            }
                            VStack(spacing: 12) {
                                ActionButtonSkeleton()
                                ActionButtonSkeleton()
                                ActionButtonSkeleton()
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .refreshable {
                await refreshProfile()
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        haptic.impact(.light)
                        showSettings = true
                    }) {
                        Image(systemName: "gearshape.fill")
                            .foregroundColor(.duprGreen)
                    }
                }
            }
            .sheet(isPresented: $showingRecordMatch) {
                RecordMatchWebView()
            }
            .sheet(isPresented: $showingRatingHistory) {
                RatingHistoryWebView(userId: authManager.currentUser?.id ?? 0)
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }
    
    private func refreshProfile() async {
        haptic.impact(.light)
        authManager.loadUserProfile()
        try? await Task.sleep(nanoseconds: 1_000_000_000)
    }
}

// MARK: - Subviews

struct ProfileHeaderView: View {
    let user: User
    
    var body: some View {
        HStack(spacing: 20) {
            // Avatar
            AsyncImage(url: URL(string: user.imageUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.white)
                    .frame(width: 80, height: 80)
                    .background(Color.gray.opacity(0.3))
            }
            .frame(width: 80, height: 80)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(Color.duprGreen, lineWidth: 3)
            )
            .shadow(color: Color.duprGreen.opacity(0.3), radius: 10, x: 0, y: 5)
            
            VStack(alignment: .leading, spacing: 8) {
                Text(user.fullName)
                    .font(.title2)
                    .fontWeight(.bold)
                
                if let location = user.addresses?.first?.formattedAddress {
                    HStack {
                        Image(systemName: "location.fill")
                            .font(.caption)
                            .foregroundColor(.duprGreen)
                        Text(location)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                if let username = user.username {
                    Text("@\(username)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding()
        .duprCard()
    }
}

struct RatingCard: View {
    let title: String
    let rating: String
    let verified: String?
    let reliability: Int
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .textCase(.uppercase)
            
            Text(rating)
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(color)
            
            if let verified = verified {
                Text("Verified: \(verified)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            // Reliability indicator
            HStack(spacing: 2) {
                ForEach(0..<5) { index in
                    Rectangle()
                        .fill(index < reliability / 20 ? color : Color.gray.opacity(0.3))
                        .frame(width: 20, height: 4)
                        .clipShape(RoundedRectangle(cornerRadius: 2))
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .duprCard()
    }
}

// MARK: - Skeleton Views

struct ProfileHeaderSkeleton: View {
    var body: some View {
        HStack(spacing: 20) {
            Circle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 80, height: 80)
                .shimmering()
            
            VStack(alignment: .leading, spacing: 8) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 150, height: 24)
                    .shimmering()
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 100, height: 16)
                    .shimmering()
            }
            
            Spacer()
        }
        .padding()
        .duprCard()
    }
}

struct RatingCardSkeleton: View {
    var body: some View {
        VStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 60, height: 16)
                .shimmering()
            
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 80, height: 32)
                .shimmering()
            
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 100, height: 12)
                .shimmering()
        }
        .frame(maxWidth: .infinity)
        .padding()
        .duprCard()
    }
}

struct ActionButtonSkeleton: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color.gray.opacity(0.2))
            .frame(height: 56)
            .shimmering()
    }
}

// Shimmer effect
extension View {
    func shimmering() -> some View {
        self
            .redacted(reason: .placeholder)
            .shimmering(active: true)
    }
    
    func shimmering(active: Bool) -> some View {
        self
            .overlay(
                active ?
                LinearGradient(
                    colors: [.clear, .white.opacity(0.5), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .rotationEffect(.degrees(70))
                .offset(x: -200)
                .animation(
                    Animation.linear(duration: 1.5)
                        .repeatForever(autoreverses: false),
                    value: active
                )
                : nil
            )
            .animation(.default, value: active)
    }
}