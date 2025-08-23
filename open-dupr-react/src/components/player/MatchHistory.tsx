import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOtherUserMatchHistory, getMyProfile } from "@/lib/api";
import MatchCard from "@/components/player/MatchCard";
import { Button } from "@/components/ui/button";
import {
  MatchCardSkeleton,
  LoadingSpinner,
} from "@/components/ui/loading-skeletons";

interface MatchHistoryProps {
  playerId?: number;
  isSelf?: boolean;
}

type PlayerRef = {
  id?: number;
  fullName: string;
  imageUrl?: string;
  rating?: string;
  preRating?: string;
  postRating?: string;
  validatedMatch?: boolean;
};

type MatchTeam = {
  id?: number;
  serial?: number;
  player1: PlayerRef;
  player2?: PlayerRef | null;
  winner?: boolean;
  delta?: string;
  teamRating?: string;
  game1?: number;
  game2?: number;
  game3?: number;
  game4?: number;
  game5?: number;
  preMatchRatingAndImpact?: Record<string, string | number | null | undefined>;
};

type MatchData = {
  id: number;
  venue?: string;
  location?: string;
  tournament?: string;
  eventDate?: string;
  eventFormat?: string;
  teams: MatchTeam[];
  noOfGames?: number;
  confirmed?: boolean;
};

const MatchHistory: React.FC<MatchHistoryProps> = ({
  playerId,
  isSelf = false,
}) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(
    undefined
  );
  const PAGE_SIZE = 25;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await getMyProfile();
        setCurrentUserId(profile?.result?.id);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };

    fetchUser();
  }, []);

  const loadPage = useCallback(async (userId: number, startOffset: number) => {
    try {
      setIsLoadingMore(true);
      const data = await getOtherUserMatchHistory(
        userId,
        startOffset,
        PAGE_SIZE
      );
      const result = data?.result ?? {};
      const newItems: MatchData[] = result?.hits ?? [];
      setMatches((prev) =>
        startOffset === 0 ? newItems : [...prev, ...newItems]
      );
      const hasMoreFromApi =
        typeof result?.hasMore === "boolean"
          ? result.hasMore
          : newItems.length === PAGE_SIZE;
      setHasMore(hasMoreFromApi);
      setOffset(startOffset + newItems.length);
      if (typeof result?.total === "number") setTotalCount(result.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load match history"
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!playerId) return;
    const run = async () => {
      try {
        setLoading(true);
        setMatches([]);
        setOffset(0);
        setHasMore(true);
        setTotalCount(null);
        await loadPage(playerId, 0);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [playerId, loadPage]);

  useEffect(() => {
    if (!loaderRef.current) return;
    if (!playerId) return;
    const userId = playerId;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore && !loading) {
          void loadPage(userId, offset);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [playerId, hasMore, isLoadingMore, loading, offset, loadPage]);

  if (!playerId) {
    return (
      <div>
        <h2 className="text-xl font-bold">Match History</h2>
        <p className="text-muted-foreground mt-2">Match history coming soon.</p>
      </div>
    );
  }

  const count = typeof totalCount === "number" ? totalCount : matches.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">Match History</h2>
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? "match" : "matches"}
          </p>
        </div>
        {isSelf && (
          <Button variant="default" onClick={() => navigate("/record-match")}>
            Add Match
          </Button>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p className="text-muted-foreground mt-2">No matches found.</p>
      )}
      {!error && matches.length > 0 && (
        <div className="mt-4 space-y-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
              onMatchUpdate={() => {
                if (playerId) {
                  loadPage(playerId, 0);
                }
              }}
            />
          ))}
          <div ref={loaderRef} />
          {isLoadingMore && (
            <div className="py-4 text-center">
              <LoadingSpinner size="sm" />
              <p className="text-sm text-muted-foreground mt-2">
                Loading more...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
