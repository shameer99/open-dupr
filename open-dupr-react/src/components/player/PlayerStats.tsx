import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getOtherUserStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserStats } from "@/lib/types";

interface PlayerStatsProps {
  playerId?: number;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerId }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!playerId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getOtherUserStats(playerId);
        setStats(data.result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [playerId]);

  if (!playerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Statistics coming soon.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No statistics available.</p>
        </CardContent>
      </Card>
    );
  }

  const toDecimalString = (value: unknown, fractionDigits: number): string => {
    const numericValue =
      typeof value === "number" ? value : value != null ? Number(value) : NaN;
    return Number.isFinite(numericValue)
      ? numericValue.toFixed(fractionDigits)
      : "-";
  };

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
            <CardTitle>Stats</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
              W {stats.resulOverview.wins}
            </span>
            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
              L {stats.resulOverview.losses}
            </span>
          </div>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-6">
          {/* Overall Results */}
          <div>
            <h3 className="font-semibold mb-3">Match Results</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {stats.resulOverview.wins}
                </div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {stats.resulOverview.losses}
                </div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold text-gray-600">
                  {stats.resulOverview.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>

          {/* Singles Stats */}
          <div>
            <h3 className="font-semibold mb-3">Singles Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Avg Partner DUPR:</span>
                <span className="ml-2 font-mono">
                  {toDecimalString(stats.singles?.averagePartnerDupr, 3)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Avg Opponent DUPR:
                </span>
                <span className="ml-2 font-mono">
                  {toDecimalString(stats.singles?.averageOpponentDupr, 3)}
                </span>
              </div>
            </div>
          </div>

          {/* Doubles Stats */}
          <div>
            <h3 className="font-semibold mb-3">Doubles Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Avg Partner DUPR:</span>
                <span className="ml-2 font-mono">
                  {toDecimalString(stats.doubles?.averagePartnerDupr, 3)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Avg Opponent DUPR:
                </span>
                <span className="ml-2 font-mono">
                  {toDecimalString(stats.doubles?.averageOpponentDupr, 3)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PlayerStats;
