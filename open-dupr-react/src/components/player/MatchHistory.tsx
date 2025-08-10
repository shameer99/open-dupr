import React, { useEffect, useState } from "react";
import { getOtherUserMatchHistory } from "@/lib/api";

interface MatchHistoryProps {
  playerId?: number;
}

interface MatchData {
  id: number;
  venue: string;
  eventDate: string;
  eventFormat: string;
  teams: Array<{
    player1: { fullName: string; rating: string };
    player2?: { fullName: string; rating: string };
    winner: boolean;
    delta: string;
  }>;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ playerId }) => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        const data = await getOtherUserMatchHistory(playerId, 0, 10);
        setMatches(data.result?.hits || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load match history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [playerId]);

  if (!playerId) {
    return (
      <div>
        <h2 className="text-xl font-bold">Match History</h2>
        <p className="text-muted-foreground mt-2">Match history coming soon.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Match History</h2>
      {loading && (
        <p className="text-muted-foreground mt-2">Loading matches...</p>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p className="text-muted-foreground mt-2">No matches found.</p>
      )}
      {!loading && !error && matches.length > 0 && (
        <div className="mt-4 space-y-3">
          {matches.slice(0, 5).map((match) => (
            <div key={match.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{match.venue}</p>
                  <p className="text-sm text-muted-foreground">
                    {match.eventDate} • {match.eventFormat}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {match.teams.map((team, idx) => (
                  <div
                    key={idx}
                    className={`text-sm ${
                      team.winner ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {team.player1.fullName}{" "}
                    {team.player2 ? `& ${team.player2.fullName}` : ""}
                    <span className="ml-2 font-mono">{team.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
