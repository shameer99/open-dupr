import React, { useEffect, useState } from "react";
import { getOtherUserMatchHistory } from "@/lib/api";
import MatchCard, { Match } from "@/components/player/MatchCard";

interface MatchHistoryProps {
  playerId?: number;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ playerId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
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
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={playerId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
