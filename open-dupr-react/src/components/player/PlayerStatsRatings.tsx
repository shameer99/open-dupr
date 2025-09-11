import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { getOtherUserStats, getOtherUserRatingHistoryCombined } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReliabilityModal from "@/components/ui/reliability-modal";
import { PlayerStatsSkeleton } from "@/components/ui/loading-skeletons";
import type { UserStats } from "@/lib/types";
import RatingHistoryChart from "./RatingHistoryChart";

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
  const [ratingHistory, setRatingHistory] = useState<
    { date: string; singles?: number | null; doubles?: number | null }[]
  >([]);
  const [ratingHistoryLoading, setRatingHistoryLoading] = useState(false);
  const [ratingHistoryError, setRatingHistoryError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    const fetchRatingHistory = async () => {
      try {
        setRatingHistoryLoading(true);
        setRatingHistoryError(null);
        const resp = await getOtherUserRatingHistoryCombined(playerId, 0, 200);
        const hits = resp?.result?.hits ?? [];
        const rows: { date: string; singles?: number | null; doubles?: number | null }[] = hits
          .map((h: { matchDate?: string; singles?: unknown; doubles?: unknown }) => {
            const date = h.matchDate ?? "";
            const singleNum = typeof h.singles === "number" ? h.singles : h.singles != null ? Number(h.singles) : null;
            const doubleNum = typeof h.doubles === "number" ? h.doubles : h.doubles != null ? Number(h.doubles) : null;
            return { date, singles: Number.isFinite(singleNum as number) ? (singleNum as number) : null, doubles: Number.isFinite(doubleNum as number) ? (doubleNum as number) : null };
          })
          .filter((r: { date: string }) => r.date);
        // Sort by date ascending
        rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        if (!cancelled) setRatingHistory(rows);
      } catch (e) {
        if (!cancelled)
          setRatingHistoryError(e instanceof Error ? e.message : "Failed to load rating history");
      } finally {
        if (!cancelled) setRatingHistoryLoading(false);
      }
    };
    fetchRatingHistory();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const hasAnyHistory = useMemo(() => ratingHistory && ratingHistory.length > 1, [ratingHistory]);

  if (!playerId) {
    return (
      <Card className="py-4">
        <CardHeader className="pb-1 px-4">
          <div className="text-center">
            <div className="grid grid-cols-2 gap-4 mt-2">
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
      <Card className="py-4">
        <CardHeader className="pb-1 px-4">
          <div className="text-center">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold">{formatRating(singles)}</p>
                <p className="text-xs text-muted-foreground">Singles</p>
                {singlesReliabilityScore != null && (
                  <p className="text-xs text-green-600 font-medium">
                    {formatReliability(singlesReliabilityScore)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{formatRating(doubles)}</p>
                <p className="text-xs text-muted-foreground">Doubles</p>
                {doublesReliabilityScore != null && (
                  <p className="text-xs text-green-600 font-medium">
                    {formatReliability(doublesReliabilityScore)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ReliabilityModal
        open={showReliabilityModal}
        onClose={closeReliabilityModal}
        reliabilityPercentage={currentReliabilityScore}
      />

      <Card className="py-4">
        <CardHeader className="pb-1 px-4">
          <div className="text-center lg:text-left">
            <div className="grid grid-cols-2 gap-4 mt-2 lg:mt-0 lg:max-w-xs">
              <div>
                <p className="text-2xl font-bold">{formatRating(singles)}</p>
                <p className="text-xs text-muted-foreground">Singles</p>
                {singlesReliabilityScore != null && (
                  <div className="flex items-center justify-center lg:justify-start gap-1">
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
              <div className="lg:justify-self-end">
                <p className="text-2xl font-bold">{formatRating(doubles)}</p>
                <p className="text-xs text-muted-foreground">Doubles</p>
                {doublesReliabilityScore != null && (
                  <div className="flex items-center justify-center lg:justify-start gap-1">
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
          </div>
        </CardHeader>

        {stats && (
          <CardContent className="-mt-2 pt-0 px-4">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between py-0.5 hover:bg-gray-50 rounded px-2 -mx-2 -mt-1 transition-colors"
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
              <div className="mt-1 space-y-1.5 border-t pt-1.5">
                <div>
                  <h4 className="text-sm font-medium mb-1">Rating History</h4>
                  {ratingHistoryLoading && (
                    <div className="text-xs text-muted-foreground">Loading rating history…</div>
                  )}
                  {ratingHistoryError && (
                    <div className="text-xs text-red-600">{ratingHistoryError}</div>
                  )}
                  {!ratingHistoryLoading && !ratingHistoryError && (
                    hasAnyHistory ? (
                      <div className="h-40 w-full">
                        <RatingHistoryChart data={ratingHistory} />
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No rating history yet.</div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 p-2 rounded-lg">
                    <div className="text-base font-bold text-green-600">
                      {stats.resulOverview.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg">
                    <div className="text-base font-bold text-red-600">
                      {stats.resulOverview.losses}
                    </div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-base font-bold text-gray-600">
                      {stats.resulOverview.pending}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Singles</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-1 rounded">
                        <div className="text-muted-foreground">Avg Partner</div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.singles?.averagePartnerDupr,
                            3
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-1 rounded">
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
                    <h4 className="text-sm font-medium mb-1">Doubles</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-1 rounded">
                        <div className="text-muted-foreground">Avg Partner</div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.doubles?.averagePartnerDupr,
                            3
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-1 rounded">
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
          </CardContent>
        )}
      </Card>
    </>
  );
};

export default PlayerStatsRatings;
