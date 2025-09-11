import React, { useEffect, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { getOtherUserStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import ReliabilityModal from "@/components/ui/reliability-modal";
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

const formatReliability = (score?: number): string => {
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
  const [showReliabilityModal, setShowReliabilityModal] = useState(false);
  const [currentReliabilityScore, setCurrentReliabilityScore] = useState<
    number | undefined
  >(undefined);

  const openReliabilityModal = (reliabilityScore: number | undefined) => {
    setCurrentReliabilityScore(reliabilityScore);
    setShowReliabilityModal(true);
  };

  const closeReliabilityModal = () => {
    setShowReliabilityModal(false);
    setCurrentReliabilityScore(undefined);
  };

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
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">-</p>
            <p className="text-sm text-muted-foreground mt-1">Singles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">-</p>
            <p className="text-sm text-muted-foreground mt-1">Doubles</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PlayerStatsSkeleton />;
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatRating(singles)}</p>
            <p className="text-sm text-muted-foreground mt-1">Singles</p>
            {singlesReliabilityScore != null && (
              <p className="text-xs text-green-600 font-medium mt-1">
                {formatReliability(singlesReliabilityScore)}
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatRating(doubles)}</p>
            <p className="text-sm text-muted-foreground mt-1">Doubles</p>
            {doublesReliabilityScore != null && (
              <p className="text-xs text-green-600 font-medium mt-1">
                {formatReliability(doublesReliabilityScore)}
              </p>
            )}
          </div>
        </div>
        <p className="text-red-500 text-sm text-center mt-3 pt-3 border-t">{error}</p>
      </div>
    );
  }

  return (
    <>
      <ReliabilityModal
        open={showReliabilityModal}
        onClose={closeReliabilityModal}
        reliabilityPercentage={currentReliabilityScore}
      />

      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center lg:text-left">
            <p className="text-2xl font-bold">{formatRating(singles)}</p>
            <p className="text-sm text-muted-foreground mt-1">Singles</p>
            {singlesReliabilityScore != null && (
              <div className="flex items-center justify-center lg:justify-start gap-1 mt-1">
                <p className="text-xs text-green-600 font-medium">
                  {formatReliability(singlesReliabilityScore)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openReliabilityModal(singlesReliabilityScore)
                  }
                  className="h-4 w-4 p-0 text-green-600 hover:text-green-800"
                >
                  <Info className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-center lg:text-left">
            <p className="text-2xl font-bold">{formatRating(doubles)}</p>
            <p className="text-sm text-muted-foreground mt-1">Doubles</p>
            {doublesReliabilityScore != null && (
              <div className="flex items-center justify-center lg:justify-start gap-1 mt-1">
                <p className="text-xs text-green-600 font-medium">
                  {formatReliability(doublesReliabilityScore)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openReliabilityModal(doublesReliabilityScore)
                  }
                  className="h-4 w-4 p-0 text-green-600 hover:text-green-800"
                >
                  <Info className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {stats && (
          <div className="mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-md px-2 -mx-2 transition-colors"
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
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs font-medium">
                  {stats.resulOverview.wins}W
                </span>
                <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-1 text-xs font-medium">
                  {stats.resulOverview.losses}L
                </span>
              </div>
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <div className="text-lg font-bold text-green-600">
                      {stats.resulOverview.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <div className="text-lg font-bold text-red-600">
                      {stats.resulOverview.losses}
                    </div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-lg font-bold text-muted-foreground">
                      {stats.resulOverview.pending}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Singles</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted p-2 rounded-md">
                        <div className="text-muted-foreground">Avg Partner</div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.singles?.averagePartnerDupr,
                            3
                          )}
                        </div>
                      </div>
                      <div className="bg-muted p-2 rounded-md">
                        <div className="text-muted-foreground">
                          Avg Opponent
                        </div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.singles?.averageOpponentDupr,
                            3
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Doubles</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted p-2 rounded-md">
                        <div className="text-muted-foreground">Avg Partner</div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.doubles?.averagePartnerDupr,
                            3
                          )}
                        </div>
                      </div>
                      <div className="bg-muted p-2 rounded-md">
                        <div className="text-muted-foreground">
                          Avg Opponent
                        </div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.doubles?.averageOpponentDupr,
                            3
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PlayerStatsRatings;
