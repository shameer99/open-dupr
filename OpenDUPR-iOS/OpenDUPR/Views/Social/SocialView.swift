//
//  SocialView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import Combine

struct SocialView: View {
    let userId: Int
    let userName: String
    
    @State private var selectedTab = 0
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        VStack(spacing: 0) {
            // Custom Segmented Control
            HStack(spacing: 0) {
                ForEach(0..<2) { index in
                    Button(action: {
                        haptic.selection()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            selectedTab = index
                        }
                    }) {
                        VStack(spacing: 8) {
                            Text(index == 0 ? "Followers" : "Following")
                                .font(.headline)
                                .foregroundColor(selectedTab == index ? .primary : .secondary)
                            
                            Rectangle()
                                .fill(selectedTab == index ? Color.duprGreen : Color.clear)
                                .frame(height: 3)
                                .clipShape(RoundedRectangle(cornerRadius: 1.5))
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal)
            .background(Color.duprSecondaryBackground)
            
            // Content
            TabView(selection: $selectedTab) {
                FollowersView(userId: userId)
                    .tag(0)
                
                FollowingView(userId: userId)
                    .tag(1)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .navigationTitle("\(userName)")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Followers View

struct FollowersView: View {
    let userId: Int
    @StateObject private var viewModel: FollowersViewModel
    @EnvironmentObject var haptic: HapticManager
    
    init(userId: Int) {
        self.userId = userId
        self._viewModel = StateObject(wrappedValue: FollowersViewModel(userId: userId, isFollowers: true))
    }
    
    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.users.isEmpty {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(0..<5) { _ in
                            UserRowSkeleton()
                        }
                    }
                    .padding()
                }
            } else if viewModel.users.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "person.2.slash")
                        .font(.system(size: 60))
                        .foregroundColor(.gray.opacity(0.3))
                    
                    Text("No followers yet")
                        .font(.title3)
                        .fontWeight(.semibold)
                    
                    Text("Followers will appear here")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .frame(maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.users) { user in
                            NavigationLink(destination: PlayerDetailView(playerId: user.id)) {
                                UserRow(user: user)
                            }
                            .buttonStyle(PlainButtonStyle())
                            
                            if user.id != viewModel.users.last?.id {
                                Divider()
                                    .padding(.leading, 76)
                            }
                        }
                    }
                    .padding(.vertical)
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .task {
            await viewModel.loadUsers()
        }
    }
}

// MARK: - Following View

struct FollowingView: View {
    let userId: Int
    @StateObject private var viewModel: FollowersViewModel
    @EnvironmentObject var haptic: HapticManager
    
    init(userId: Int) {
        self.userId = userId
        self._viewModel = StateObject(wrappedValue: FollowersViewModel(userId: userId, isFollowers: false))
    }
    
    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.users.isEmpty {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(0..<5) { _ in
                            UserRowSkeleton()
                        }
                    }
                    .padding()
                }
            } else if viewModel.users.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "person.2.slash")
                        .font(.system(size: 60))
                        .foregroundColor(.gray.opacity(0.3))
                    
                    Text("Not following anyone")
                        .font(.title3)
                        .fontWeight(.semibold)
                    
                    Text("Players you follow will appear here")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .frame(maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.users) { user in
                            NavigationLink(destination: PlayerDetailView(playerId: user.id)) {
                                UserRow(user: user)
                            }
                            .buttonStyle(PlainButtonStyle())
                            
                            if user.id != viewModel.users.last?.id {
                                Divider()
                                    .padding(.leading, 76)
                            }
                        }
                    }
                    .padding(.vertical)
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .task {
            await viewModel.loadUsers()
        }
    }
}

// MARK: - User Row

struct UserRow: View {
    let user: FollowUser
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        HStack(spacing: 16) {
            AsyncImage(url: URL(string: user.profileImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.fill")
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(Color.gray.opacity(0.3))
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())
            
            Text(user.name)
                .font(.body)
                .foregroundColor(.primary)
            
            Spacer()
            
            if user.isFollow {
                Text("Following")
                    .font(.caption)
                    .foregroundColor(.duprGreen)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.duprGreen, lineWidth: 1)
                    )
            }
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.tertiary)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .contentShape(Rectangle())
        .onTapGesture {
            haptic.selection()
        }
    }
}

struct UserRowSkeleton: View {
    var body: some View {
        HStack(spacing: 16) {
            Circle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 50, height: 50)
                .shimmering()
            
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 150, height: 20)
                .shimmering()
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
}

// MARK: - View Model

@MainActor
class FollowersViewModel: ObservableObject {
    @Published var users: [FollowUser] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let userId: Int
    private let isFollowers: Bool
    private var cancellables = Set<AnyCancellable>()
    
    init(userId: Int, isFollowers: Bool) {
        self.userId = userId
        self.isFollowers = isFollowers
    }
    
    func loadUsers() async {
        guard !isLoading else { return }
        
        isLoading = true
        
        let publisher = isFollowers
            ? APIService.shared.getFollowers(userId: userId)
            : APIService.shared.getFollowing(userId: userId)
        
        publisher
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.users = response.results
                }
            )
            .store(in: &cancellables)
    }
    
    func refresh() async {
        await loadUsers()
    }
}