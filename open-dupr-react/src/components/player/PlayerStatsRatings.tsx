import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getOtherUserStats } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlayerStatsSkeleton } from "@/components/ui/loading-skeletons";
import type { UserStats } from "@/lib/types";

interface PlayerStatsRatingsProps {
  playerId?: number;
  singles?: string | number | null;
  doubles?: string | number | null;
  singlesReliabilityScore?: number;
  doublesReliabilityScore?: number;
}

const formatRating = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(3) : "-";
  }
  const text = String(value).trim();
  return text.length > 0 ? text : "-";
};

const formatConfidence = (score?: number): string => {
  if (score == null) return "";
  return `${score}%`;
};

const toDecimalString = (value: unknown, fractionDigits: number): string => {
  const numericValue =
    typeof value === "number" ? value : value != null ? Number(value) : NaN;
  return Number.isFinite(numericValue)
    ? numericValue.toFixed(fractionDigits)
    : "-";
};

const PlayerStatsRatings: React.FC<PlayerStatsRatingsProps> = ({
  playerId,
  singles,
  doubles,
  singlesReliabilityScore,
  doublesReliabilityScore,
}) => {
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
        <CardHeader className="pb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">DUPR Ratings</p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Singles</p>
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Doubles</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return <PlayerStatsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">DUPR Ratings</p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-2xl font-bold">{formatRating(singles)}</p>
                <p className="text-xs text-muted-foreground">Singles</p>
                {singlesReliabilityScore != null && (
                  <p className="text-xs text-green-600 font-medium">
                    {formatConfidence(singlesReliabilityScore)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{formatRating(doubles)}</p>
                <p className="text-xs text-muted-foreground">Doubles</p>
                {doublesReliabilityScore != null && (
                  <p className="text-xs text-green-600 font-medium">
                    {formatConfidence(doublesReliabilityScore)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">DUPR Ratings</p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-2xl font-bold">{formatRating(singles)}</p>
              <p className="text-xs text-muted-foreground">Singles</p>
              {singlesReliabilityScore != null && (
                <p className="text-xs text-green-600 font-medium">
                  {formatConfidence(singlesReliabilityScore)}
                </p>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{formatRating(doubles)}</p>
              <p className="text-xs text-muted-foreground">Doubles</p>
              {doublesReliabilityScore != null && (
                <p className="text-xs text-green-600 font-medium">
                  {formatConfidence(doublesReliabilityScore)}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {stats && (
        <CardContent className="pt-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
            aria-expanded={expanded}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Match Stats</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                {stats.resulOverview.wins}W
              </span>
              <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                {stats.resulOverview.losses}L
              </span>
            </div>
          </button>

          {expanded && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {stats.resulOverview.wins}
                  </div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {stats.resulOverview.losses}
                  </div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">
                    {stats.resulOverview.pending}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Singles</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-muted-foreground">Avg Partner</div>
                      <div className="font-mono font-medium">
                        {toDecimalString(stats.singles?.averagePartnerDupr, 3)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-muted-foreground">Avg Opponent</div>
                      <div className="font-mono font-medium">
                        {toDecimalString(stats.singles?.averageOpponentDupr, 3)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Doubles</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-muted-foreground">Avg Partner</div>
                      <div className="font-mono font-medium">
                        {toDecimalString(stats.doubles?.averagePartnerDupr, 3)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-muted-foreground">Avg Opponent</div>
                      <div className="font-mono font-medium">
                        {toDecimalString(stats.doubles?.averageOpponentDupr, 3)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PlayerStatsRatings;
