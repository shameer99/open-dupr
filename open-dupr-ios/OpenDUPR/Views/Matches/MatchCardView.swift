import SwiftUI

struct MatchCardView: View {
    let match: Match
    @EnvironmentObject var hapticManager: HapticManager
    
    var body: some View {
        VStack(spacing: 12) {
            // Header with date and format
            HStack {
                Text(match.formattedDate)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Spacer()
                
                HStack(spacing: 6) {
                    Image(systemName: match.isSingles ? "person" : "person.2")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(match.eventFormat.capitalized)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
            }
            
            // Match details
            VStack(spacing: 8) {
                // Venue/Location
                if let venue = match.venue, !venue.isEmpty {
                    HStack {
                        Image(systemName: "location")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(venue)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                    }
                }
                
                // Teams and score
                if match.teams.count >= 2 {
                    let team1 = match.teams[0]
                    let team2 = match.teams[1]
                    
                    HStack(alignment: .center, spacing: 16) {
                        // Team 1
                        TeamView(team: team1, isWinner: team1.winner)
                        
                        // Score
                        VStack(spacing: 4) {
                            Text("VS")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                            
                            if !match.scoreText.isEmpty {
                                Text(match.scoreText)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        // Team 2
                        TeamView(team: team2, isWinner: team2.winner)
                    }
                }
            }
            
            // Match status
            HStack {
                StatusBadge(status: match.status, confirmed: match.confirmed)
                
                Spacer()
                
                if let winningTeam = match.winningTeam,
                   let delta = winningTeam.delta {
                    Text(delta)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(delta.hasPrefix("+") ? .green : .red)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(
                            RoundedRectangle(cornerRadius: 6)
                                .fill(delta.hasPrefix("+") ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
                        )
                }
            }
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
        .padding(.horizontal)
    }
}

struct TeamView: View {
    let team: Match.Team
    let isWinner: Bool
    
    var body: some View {
        VStack(spacing: 4) {
            // Player names
            VStack(spacing: 2) {
                PlayerNameView(player: team.player1, isWinner: isWinner)
                
                if let player2 = team.player2 {
                    PlayerNameView(player: player2, isWinner: isWinner)
                }
            }
            
            // Team rating
            if let rating = team.teamRating {
                Text(rating)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct PlayerNameView: View {
    let player: Match.Team.Player
    let isWinner: Bool
    
    var body: some View {
        HStack(spacing: 6) {
            AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.secondary)
            }
            .frame(width: 16, height: 16)
            .clipShape(Circle())
            
            Text(player.fullName)
                .font(.caption)
                .fontWeight(isWinner ? .semibold : .regular)
                .foregroundColor(isWinner ? .primary : .secondary)
                .lineLimit(1)
            
            Text("(\(player.rating))")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct StatusBadge: View {
    let status: String
    let confirmed: Bool
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)
            
            Text(statusText)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(statusColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(statusColor.opacity(0.1))
        )
    }
    
    private var statusColor: Color {
        if !confirmed {
            return .orange
        }
        
        switch status.uppercased() {
        case "COMPLETE":
            return .green
        case "PENDING":
            return .orange
        default:
            return .secondary
        }
    }
    
    private var statusText: String {
        if !confirmed {
            return "Pending"
        }
        
        switch status.uppercased() {
        case "COMPLETE":
            return "Complete"
        case "PENDING":
            return "Pending"
        default:
            return status.capitalized
        }
    }
}

#Preview {
    let sampleMatch = Match(
        id: 1,
        matchId: 1,
        displayIdentity: "TEST123",
        venue: "Test Court",
        location: "Test City",
        tournament: nil,
        league: nil,
        eventDate: "2024-01-15",
        eventFormat: "DOUBLES",
        confirmed: true,
        teams: [
            Match.Team(
                id: 1,
                serial: 1,
                player1: Match.Team.Player(id: 1, fullName: "John Doe", imageUrl: nil, rating: "4.125", validatedMatch: true),
                player2: Match.Team.Player(id: 2, fullName: "Jane Smith", imageUrl: nil, rating: "3.950", validatedMatch: true),
                game1: 11,
                game2: 9,
                game3: 11,
                game4: -1,
                game5: -1,
                winner: true,
                delta: "+0.025",
                teamRating: "4.038"
            ),
            Match.Team(
                id: 2,
                serial: 2,
                player1: Match.Team.Player(id: 3, fullName: "Bob Johnson", imageUrl: nil, rating: "4.200", validatedMatch: true),
                player2: Match.Team.Player(id: 4, fullName: "Alice Brown", imageUrl: nil, rating: "3.875", validatedMatch: true),
                game1: 9,
                game2: 11,
                game3: 9,
                game4: -1,
                game5: -1,
                winner: false,
                delta: "-0.025",
                teamRating: "4.038"
            )
        ],
        matchSource: "CLUB",
        noOfGames: 3,
        status: "COMPLETE",
        created: "2024-01-15T14:30:00.000Z",
        modified: nil
    )
    
    MatchCardView(match: sampleMatch)
        .environmentObject(HapticManager())
}