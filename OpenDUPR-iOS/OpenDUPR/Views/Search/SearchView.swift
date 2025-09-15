//
//  SearchView.swift
//  OpenDUPR
//
//  Created on 2025-09-15.
//

import SwiftUI
import Combine
import CoreLocation

struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()
    @StateObject private var locationManager = LocationManager()
    @EnvironmentObject var haptic: HapticManager
    
    @State private var searchText = ""
    @State private var showFilters = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search Bar
                HStack {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField("Search players...", text: $searchText)
                            .textFieldStyle(.plain)
                            .onSubmit {
                                haptic.impact(.light)
                                viewModel.search(
                                    query: searchText,
                                    location: locationManager.lastLocation
                                )
                            }
                        
                        if !searchText.isEmpty {
                            Button(action: {
                                haptic.impact(.light)
                                searchText = ""
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(12)
                    .background(Color.duprSecondaryBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    
                    Button(action: {
                        haptic.impact(.light)
                        showFilters.toggle()
                    }) {
                        Image(systemName: "slider.horizontal.3")
                            .foregroundColor(showFilters ? .duprGreen : .secondary)
                            .padding(12)
                            .background(Color.duprSecondaryBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
                .padding()
                
                // Results
                if viewModel.isLoading && viewModel.results.isEmpty {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(0..<5) { _ in
                                SearchResultSkeleton()
                            }
                        }
                        .padding(.horizontal)
                    }
                } else if viewModel.results.isEmpty && !searchText.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "person.slash")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.3))
                        
                        Text("No players found")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text("Try a different search term")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxHeight: .infinity)
                } else if viewModel.results.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.3))
                        
                        Text("Search for players")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        Text("Find players by name or location")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.results) { player in
                                NavigationLink(destination: PlayerDetailView(playerId: player.id)) {
                                    SearchResultCard(player: player)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showFilters) {
                SearchFiltersView(viewModel: viewModel)
            }
        }
        .onAppear {
            locationManager.requestLocation()
        }
        .onChange(of: searchText) { _, newValue in
            viewModel.searchDebounced(
                query: newValue,
                location: locationManager.lastLocation
            )
        }
    }
}

// MARK: - Search Result Card

struct SearchResultCard: View {
    let player: PlayerSearchResult
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        HStack(spacing: 16) {
            // Avatar
            AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
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
                Text(player.fullName)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                HStack(spacing: 12) {
                    // Location
                    if let location = player.shortAddress {
                        HStack(spacing: 4) {
                            Image(systemName: "location.fill")
                                .font(.caption)
                                .foregroundColor(.duprGreen)
                            Text(location)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Distance
                    if let distance = player.distance {
                        Text(distance)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Ratings
                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Text("S:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(player.ratings.singles)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.singlesOrange)
                    }
                    
                    HStack(spacing: 4) {
                        Text("D:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(player.ratings.doubles)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.doublesBlue)
                    }
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.tertiary)
        }
        .padding()
        .duprCard()
        .onTapGesture {
            haptic.selection()
        }
    }
}

struct SearchResultSkeleton: View {
    var body: some View {
        HStack(spacing: 16) {
            Circle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 60, height: 60)
                .shimmering()
            
            VStack(alignment: .leading, spacing: 4) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 150, height: 20)
                    .shimmering()
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 100, height: 16)
                    .shimmering()
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 120, height: 16)
                    .shimmering()
            }
            
            Spacer()
        }
        .padding()
        .duprCard()
    }
}

// MARK: - Filters View

struct SearchFiltersView: View {
    @ObservedObject var viewModel: SearchViewModel
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var haptic: HapticManager
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Rating Range") {
                    VStack {
                        HStack {
                            Text("Min: \(String(format: "%.1f", viewModel.minRating))")
                            Spacer()
                            Text("Max: \(String(format: "%.1f", viewModel.maxRating))")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                        
                        HStack {
                            Slider(value: $viewModel.minRating, in: 1.0...5.0, step: 0.1)
                                .onChange(of: viewModel.minRating) { _, newValue in
                                    haptic.selection()
                                    if newValue > viewModel.maxRating {
                                        viewModel.maxRating = newValue
                                    }
                                }
                            
                            Slider(value: $viewModel.maxRating, in: 1.0...5.0, step: 0.1)
                                .onChange(of: viewModel.maxRating) { _, newValue in
                                    haptic.selection()
                                    if newValue < viewModel.minRating {
                                        viewModel.minRating = newValue
                                    }
                                }
                        }
                    }
                }
                
                Section("Gender") {
                    Picker("Gender", selection: $viewModel.gender) {
                        Text("All").tag(Gender.all)
                        Text("Male").tag(Gender.male)
                        Text("Female").tag(Gender.female)
                    }
                    .pickerStyle(.segmented)
                }
                
                Section("Distance") {
                    Picker("Max Distance", selection: $viewModel.maxDistance) {
                        Text("10 miles").tag(10)
                        Text("25 miles").tag(25)
                        Text("50 miles").tag(50)
                        Text("100 miles").tag(100)
                        Text("Any").tag(1000)
                    }
                }
            }
            .navigationTitle("Search Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        haptic.impact(.light)
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        haptic.impact(.medium)
                        viewModel.applyFilters()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

// MARK: - View Model

enum Gender {
    case all, male, female
}

@MainActor
class SearchViewModel: ObservableObject {
    @Published var results: [PlayerSearchResult] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    // Filters
    @Published var minRating: Double = 1.0
    @Published var maxRating: Double = 5.0
    @Published var gender: Gender = .all
    @Published var maxDistance: Int = 50
    
    private var cancellables = Set<AnyCancellable>()
    private var searchCancellable: AnyCancellable?
    private var lastQuery = ""
    private var lastLocation: CLLocation?
    
    func search(query: String, location: CLLocation?) {
        guard !query.isEmpty else {
            results = []
            return
        }
        
        lastQuery = query
        lastLocation = location
        isLoading = true
        
        APIService.shared.searchPlayers(
            query: query,
            lat: location?.coordinate.latitude,
            lng: location?.coordinate.longitude
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            },
            receiveValue: { [weak self] response in
                self?.results = response.result.hits
            }
        )
        .store(in: &cancellables)
    }
    
    func searchDebounced(query: String, location: CLLocation?) {
        searchCancellable?.cancel()
        
        guard !query.isEmpty else {
            results = []
            return
        }
        
        searchCancellable = Just(query)
            .delay(for: .milliseconds(500), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.search(query: query, location: location)
            }
    }
    
    func applyFilters() {
        // Re-search with current query and filters
        search(query: lastQuery, location: lastLocation)
    }
}

// MARK: - Location Manager

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    @Published var lastLocation: CLLocation?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }
    
    func requestLocation() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.requestLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        lastLocation = locations.last
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error)")
    }
}