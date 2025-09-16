import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { getOtherUserStats, getOtherUserRatingHistory } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReliabilityModal from "@/components/ui/reliability-modal";
import { PlayerStatsSkeleton } from "@/components/ui/loading-skeletons";
import AnimatedCounter from "@/components/ui/animated-counter";
import type { UserStats } from "@/lib/types";
import RatingHistoryChart from "./RatingHistoryChart";

interface PlayerStatsRatingsProps {
  playerId?: number;
  singles?: string | number | null;
  doubles?: string | number | null;
  singlesReliabilityScore?: number;
  doublesReliabilityScore?: number;
}

const AnimatedRating: React.FC<{ value: unknown; className?: string }> = ({
  value,
  className = "",
}) => {
  if (value == null) return <span className={className}>-</span>;
  
  const numericValue = typeof value === "number" ? value : Number(value);
  
  if (!Number.isFinite(numericValue)) {
    return <span className={className}>-</span>;
  }

  return (
    <AnimatedCounter
      value={numericValue}
      duration={1500}
      decimals={3}
      className={className}
    />
  );
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
  const [ratingHistoryError, setRatingHistoryError] = useState<string | null>(
    null
  );

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
        const [singlesResp, doublesResp] = await Promise.all([
          getOtherUserRatingHistory(playerId, "SINGLES"),
          getOtherUserRatingHistory(playerId, "DOUBLES"),
        ]);

        const singlesArr: Array<{ date?: string; rating?: unknown }> =
          singlesResp?.result?.ratingHistory ?? [];
        const doublesArr: Array<{ date?: string; rating?: unknown }> =
          doublesResp?.result?.ratingHistory ?? [];

        // Group ratings by date, keeping track of all ratings for each date
        const singlesByDate = new Map<string, Array<{ rating: unknown }>>();
        const doublesByDate = new Map<string, Array<{ rating: unknown }>>();

        // Group singles ratings by date
        for (const s of singlesArr) {
          const d = s.date || "";
          if (!d) continue;
          if (!singlesByDate.has(d)) {
            singlesByDate.set(d, []);
          }
          singlesByDate.get(d)!.push({ rating: s.rating });
        }

        // Group doubles ratings by date
        for (const dItem of doublesArr) {
          const d = dItem.date || "";
          if (!d) continue;
          if (!doublesByDate.has(d)) {
            doublesByDate.set(d, []);
          }
          doublesByDate.get(d)!.push({ rating: dItem.rating });
        }

        // Get all unique dates
        const allDates = new Set([...singlesByDate.keys(), ...doublesByDate.keys()]);
        
        const byDate = new Map<
          string,
          { date: string; singles?: number | null; doubles?: number | null }
        >();

        // For each date, use the first (latest) rating of that day
        for (const date of allDates) {
          const entry: { date: string; singles?: number | null; doubles?: number | null } = { date };

          // Get latest singles rating for this date (first in API response)
          const singlesRatings = singlesByDate.get(date) || [];
          if (singlesRatings.length > 0) {
            const latestSinglesRating = singlesRatings[0].rating;
            const val =
              typeof latestSinglesRating === "number"
                ? latestSinglesRating
                : latestSinglesRating != null
                ? Number(latestSinglesRating)
                : null;
            entry.singles = Number.isFinite(val as number) ? (val as number) : null;
          }

          // Get latest doubles rating for this date (first in API response)
          const doublesRatings = doublesByDate.get(date) || [];
          if (doublesRatings.length > 0) {
            const latestDoublesRating = doublesRatings[0].rating;
            const val =
              typeof latestDoublesRating === "number"
                ? latestDoublesRating
                : latestDoublesRating != null
                ? Number(latestDoublesRating)
                : null;
            entry.doubles = Number.isFinite(val as number) ? (val as number) : null;
          }

          byDate.set(date, entry);
        }

        const rows = Array.from(byDate.values()).sort((a, b) =>
          a.date < b.date ? -1 : a.date > b.date ? 1 : 0
        );
        if (!cancelled) setRatingHistory(rows);
      } catch (e) {
        if (!cancelled)
          setRatingHistoryError(
            e instanceof Error ? e.message : "Failed to load rating history"
          );
      } finally {
        if (!cancelled) setRatingHistoryLoading(false);
      }
    };
    fetchRatingHistory();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const hasAnyHistory = useMemo(
    () => ratingHistory && ratingHistory.length > 1,
    [ratingHistory]
  );

  if (!playerId) {
    return (
      <Card className="py-3">
        <CardHeader className="pb-1 px-4">
          <div className="text-center">
            <div className="grid grid-cols-2 gap-3 mt-1.5">
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
      <Card className="py-3">
        <CardHeader className="pb-1 px-4">
          <div className="text-center">
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <div>
                <AnimatedRating value={singles} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">Singles</p>
                {singlesReliabilityScore != null && (
                  <p className="text-xs text-[color:var(--success)] font-medium">
                    {formatReliability(singlesReliabilityScore)}
                  </p>
                )}
              </div>
              <div>
                <AnimatedRating value={doubles} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">Doubles</p>
                {doublesReliabilityScore != null && (
                  <p className="text-xs text-[color:var(--success)] font-medium">
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

      <Card className="py-3">
        <CardHeader className="pb-1 px-4">
          <div className="text-center lg:text-left">
            <div className="grid grid-cols-2 gap-3 mt-1.5 lg:mt-0 lg:max-w-xs">
              <div>
                <AnimatedRating value={singles} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">Singles</p>
                {singlesReliabilityScore != null && (
                  <div className="flex items-center justify-center lg:justify-start gap-1">
                    <p className="text-xs text-[color:var(--success)] font-medium">
                      {formatReliability(singlesReliabilityScore)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openReliabilityModal(singlesReliabilityScore)
                      }
                      className="h-4 w-4 p-0 text-[color:var(--success)] hover:opacity-90"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="lg:justify-self-end">
                <AnimatedRating value={doubles} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">Doubles</p>
                {doublesReliabilityScore != null && (
                  <div className="flex items-center justify-center lg:justify-start gap-1">
                    <p className="text-xs text-[color:var(--success)] font-medium">
                      {formatReliability(doublesReliabilityScore)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        openReliabilityModal(doublesReliabilityScore)
                      }
                      className="h-4 w-4 p-0 text-[color:var(--success)] hover:opacity-90"
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
          <CardContent className="-mt-1.5 pt-0 px-4">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between py-0.5 hover:bg-accent rounded px-2 -mx-2 -mt-0.5 transition-colors cursor-pointer"
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
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--success) 15%, transparent)",
                    color: "var(--success)",
                  }}
                >
                  {stats.resulOverview.wins}W
                </span>
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--destructive) 15%, transparent)",
                    color: "var(--destructive)",
                  }}
                >
                  {stats.resulOverview.losses}L
                </span>
              </div>
            </button>

            {expanded && (
              <div className="mt-1 space-y-1.5 border-t pt-1.5">
                <div>
                  <h4 className="text-sm font-medium mb-1">Rating History</h4>
                  {ratingHistoryLoading && (
                    <div className="text-xs text-muted-foreground">
                      Loading rating history…
                    </div>
                  )}
                  {ratingHistoryError && (
                    <div className="text-xs text-red-600">
                      {ratingHistoryError}
                    </div>
                  )}
                  {!ratingHistoryLoading &&
                    !ratingHistoryError &&
                    (hasAnyHistory ? (
                      <div className="h-40 w-full">
                        <RatingHistoryChart data={ratingHistory} />
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No rating history yet.
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div
                    className="p-2 rounded-md"
                    style={{
                      backgroundColor:
                        "color-mix(in oklab, var(--success) 10%, transparent)",
                    }}
                  >
                    <div
                      className="text-base font-bold"
                      style={{ color: "var(--success)" }}
                    >
                      {stats.resulOverview.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div
                    className="p-2 rounded-md"
                    style={{
                      backgroundColor:
                        "color-mix(in oklab, var(--destructive) 10%, transparent)",
                    }}
                  >
                    <div
                      className="text-base font-bold"
                      style={{ color: "var(--destructive)" }}
                    >
                      {stats.resulOverview.losses}
                    </div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="p-2 rounded-md bg-muted/40">
                    <div className="text-base font-bold text-muted-foreground">
                      {stats.resulOverview.pending}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Singles</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/40 p-1 rounded">
                        <div className="text-muted-foreground">Avg Partner</div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.singles?.averagePartnerDupr,
                            3
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-1 rounded">
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
                      <div className="bg-muted/40 p-1 rounded">
                        <div className="text-muted-foreground">Avg Partner</div>
                        <div className="font-mono font-medium">
                          {toDecimalString(
                            stats.doubles?.averagePartnerDupr,
                            3
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/40 p-1 rounded">
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
