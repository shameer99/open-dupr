//
//  AboutView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI

struct AboutView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 30) {
                    // Logo and Title
                    VStack(spacing: 20) {
                        Image(systemName: "tennis.racket")
                            .font(.system(size: 80))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.duprGreen, Color.duprDarkGreen],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .rotationEffect(.degrees(-45))
                            .shadow(color: Color.duprGreen.opacity(0.3), radius: 20, x: 0, y: 10)
                        
                        Text("Open DUPR")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.duprGreen, Color.duprDarkGreen],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                        
                        Text("Version 1.0.0")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 20)
                    
                    // Description
                    VStack(spacing: 16) {
                        Text("About Open DUPR")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text("Open DUPR is an open-source alternative to the official DUPR app, providing a clean and modern interface for tracking your pickleball journey.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    
                    // Features
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Features")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        FeatureRow(icon: "person.fill", title: "Profile Management", description: "View and manage your player profile")
                        FeatureRow(icon: "rectangle.stack.fill", title: "Activity Feed", description: "See matches from players you follow")
                        FeatureRow(icon: "magnifyingglass", title: "Player Search", description: "Find players near you")
                        FeatureRow(icon: "checkmark.seal.fill", title: "Match Validation", description: "Validate pending match results")
                        FeatureRow(icon: "chart.line.uptrend.xyaxis", title: "Rating History", description: "Track your rating progress over time")
                    }
                    .padding(.horizontal)
                    
                    // Links
                    VStack(spacing: 12) {
                        Link(destination: URL(string: "https://github.com/opendupr/opendupr")!) {
                            HStack {
                                Image(systemName: "link")
                                Text("View on GitHub")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.duprGreen.opacity(0.1))
                            .foregroundColor(.duprGreen)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        
                        Link(destination: URL(string: "https://dupr.gg")!) {
                            HStack {
                                Image(systemName: "globe")
                                Text("Official DUPR Website")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.duprSecondaryBackground)
                            .foregroundColor(.primary)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(.horizontal)
                    
                    // Disclaimer
                    Text("This app is not affiliated with DUPR. All data is retrieved from the official DUPR API.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                        .padding(.bottom, 20)
                }
            }
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        haptic.impact(.light)
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.duprGreen)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .duprCard()
    }
}