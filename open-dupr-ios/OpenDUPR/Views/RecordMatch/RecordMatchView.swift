import SwiftUI

struct RecordMatchView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @EnvironmentObject var hapticManager: HapticManager
    
    @State private var selectedFormat: MatchFormat = .singles
    @State private var selectedOpponent: PlayerSearchResult?
    @State private var selectedPartner: PlayerSearchResult?
    @State private var selectedOpponents: [PlayerSearchResult] = []
    
    @State private var game1Team1Score = ""
    @State private var game1Team2Score = ""
    @State private var game2Team1Score = ""
    @State private var game2Team2Score = ""
    @State private var game3Team1Score = ""
    @State private var game3Team2Score = ""
    
    @State private var venue = ""
    @State private var eventDate = Date()
    
    @State private var showingPlayerSearch = false
    @State private var searchType: PlayerSearchType = .opponent
    @State private var isSubmitting = false
    @State private var showingSuccessAlert = false
    
    enum MatchFormat: String, CaseIterable {
        case singles = "SINGLES"
        case doubles = "DOUBLES"
        
        var displayName: String {
            switch self {
            case .singles: return "Singles"
            case .doubles: return "Doubles"
            }
        }
    }
    
    enum PlayerSearchType {
        case opponent, partner, opponentTeam
    }
    
    var canSubmit: Bool {
        let hasValidScores = !game1Team1Score.isEmpty && !game1Team2Score.isEmpty
        
        switch selectedFormat {
        case .singles:
            return hasValidScores && selectedOpponent != nil
        case .doubles:
            return hasValidScores && selectedPartner != nil && selectedOpponents.count == 2
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Match Format Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Match Format")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        HStack(spacing: 12) {
                            ForEach(MatchFormat.allCases, id: \.self) { format in
                                Button(action: {
                                    hapticManager.buttonTap()
                                    selectedFormat = format
                                    resetPlayerSelections()
                                }) {
                                    Text(format.displayName)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 10)
                                        .background(
                                            RoundedRectangle(cornerRadius: 20)
                                                .fill(selectedFormat == format ? Color.blue : Color.secondary.opacity(0.1))
                                        )
                                        .foregroundColor(selectedFormat == format ? .white : .primary)
                                }
                            }
                        }
                    }
                    
                    // Player Selection
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Players")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        if selectedFormat == .doubles {
                            // Partner selection for doubles
                            PlayerSelectionRow(
                                title: "Your Partner",
                                selectedPlayer: selectedPartner,
                                onTap: {
                                    hapticManager.buttonTap()
                                    searchType = .partner
                                    showingPlayerSearch = true
                                }
                            )
                        }
                        
                        // Opponent selection
                        if selectedFormat == .singles {
                            PlayerSelectionRow(
                                title: "Opponent",
                                selectedPlayer: selectedOpponent,
                                onTap: {
                                    hapticManager.buttonTap()
                                    searchType = .opponent
                                    showingPlayerSearch = true
                                }
                            )
                        } else {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Opposing Team")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                ForEach(0..<2, id: \.self) { index in
                                    PlayerSelectionRow(
                                        title: "Opponent \(index + 1)",
                                        selectedPlayer: selectedOpponents.indices.contains(index) ? selectedOpponents[index] : nil,
                                        onTap: {
                                            hapticManager.buttonTap()
                                            searchType = .opponentTeam
                                            showingPlayerSearch = true
                                        }
                                    )
                                }
                            }
                        }
                    }
                    
                    // Score Entry
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Scores")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        VStack(spacing: 12) {
                            GameScoreRow(
                                gameNumber: 1,
                                team1Score: $game1Team1Score,
                                team2Score: $game1Team2Score,
                                team1Label: selectedFormat == .singles ? "You" : "Your Team",
                                team2Label: selectedFormat == .singles ? "Opponent" : "Opposing Team"
                            )
                            
                            GameScoreRow(
                                gameNumber: 2,
                                team1Score: $game2Team1Score,
                                team2Score: $game2Team2Score,
                                team1Label: selectedFormat == .singles ? "You" : "Your Team",
                                team2Label: selectedFormat == .singles ? "Opponent" : "Opposing Team",
                                isOptional: true
                            )
                            
                            GameScoreRow(
                                gameNumber: 3,
                                team1Score: $game3Team1Score,
                                team2Score: $game3Team2Score,
                                team1Label: selectedFormat == .singles ? "You" : "Your Team",
                                team2Label: selectedFormat == .singles ? "Opponent" : "Opposing Team",
                                isOptional: true
                            )
                        }
                    }
                    
                    // Match Details
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Match Details")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        VStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Venue (Optional)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                TextField("Enter venue name", text: $venue)
                                    .textFieldStyle(ModernTextFieldStyle())
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Date")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                DatePicker("Match Date", selection: $eventDate, displayedComponents: .date)
                                    .datePickerStyle(CompactDatePickerStyle())
                            }
                        }
                    }
                    
                    // Submit Button
                    Button(action: {
                        Task {
                            await submitMatch()
                        }
                    }) {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .tint(.white)
                            }
                            
                            Text(isSubmitting ? "Recording Match..." : "Record Match")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: canSubmit ? [.blue, .purple] : [.secondary.opacity(0.3)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .disabled(!canSubmit || isSubmitting)
                    .padding(.top, 20)
                }
                .padding()
            }
            .navigationTitle("Record Match")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingPlayerSearch) {
                PlayerSearchSheet(
                    searchType: searchType,
                    selectedFormat: selectedFormat,
                    onPlayerSelected: { player in
                        handlePlayerSelection(player)
                    }
                )
            }
            .alert("Match Recorded!", isPresented: $showingSuccessAlert) {
                Button("OK") {
                    resetForm()
                }
            } message: {
                Text("Your match has been successfully recorded and is pending validation.")
            }
        }
    }
    
    private func resetPlayerSelections() {
        selectedOpponent = nil
        selectedPartner = nil
        selectedOpponents = []
    }
    
    private func resetForm() {
        selectedFormat = .singles
        resetPlayerSelections()
        game1Team1Score = ""
        game1Team2Score = ""
        game2Team1Score = ""
        game2Team2Score = ""
        game3Team1Score = ""
        game3Team2Score = ""
        venue = ""
        eventDate = Date()
    }
    
    private func handlePlayerSelection(_ player: PlayerSearchResult) {
        switch searchType {
        case .opponent:
            selectedOpponent = player
        case .partner:
            selectedPartner = player
        case .opponentTeam:
            if selectedOpponents.count < 2 {
                selectedOpponents.append(player)
            }
        }
        showingPlayerSearch = false
    }
    
    private func submitMatch() async {
        guard let token = await authManager.getValidToken(),
              let currentUser = authManager.currentUser else { return }
        
        isSubmitting = true
        hapticManager.buttonTap()
        
        // This would implement the actual match submission
        // For now, simulate the API call
        
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
        
        isSubmitting = false
        showingSuccessAlert = true
        hapticManager.successAction()
    }
}

struct PlayerSelectionRow: View {
    let title: String
    let selectedPlayer: PlayerSearchResult?
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    if let player = selectedPlayer {
                        HStack(spacing: 8) {
                            AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Image(systemName: "person.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                            .frame(width: 20, height: 20)
                            .clipShape(Circle())
                            
                            Text(player.displayName)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        Text("Tap to select player")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct GameScoreRow: View {
    let gameNumber: Int
    @Binding var team1Score: String
    @Binding var team2Score: String
    let team1Label: String
    let team2Label: String
    var isOptional: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Game \(gameNumber)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if isOptional {
                    Text("(Optional)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(team1Label)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    TextField("0", text: $team1Score)
                        .keyboardType(.numberPad)
                        .textFieldStyle(ScoreTextFieldStyle())
                }
                
                Text("vs")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 16)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(team2Label)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    TextField("0", text: $team2Score)
                        .keyboardType(.numberPad)
                        .textFieldStyle(ScoreTextFieldStyle())
                }
            }
        }
    }
}

struct ScoreTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .frame(width: 60)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(.regularMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
            )
            .multilineTextAlignment(.center)
    }
}

struct PlayerSearchSheet: View {
    let searchType: RecordMatchView.PlayerSearchType
    let selectedFormat: RecordMatchView.MatchFormat
    let onPlayerSelected: (PlayerSearchResult) -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            SearchView()
                .navigationTitle("Select Player")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            dismiss()
                        }
                    }
                }
        }
    }
}

#Preview {
    RecordMatchView()
        .environmentObject(AuthenticationManager())
        .environmentObject(HapticManager())
}