import React, { useEffect, useState, useCallback } from "react";
import { useHeader } from "@/lib/header-context";
import { useAuth } from "@/lib/useAuth";
import { getUserActivityFeed } from "@/lib/api";
import { MatchCardSkeleton } from "@/components/ui/loading-skeletons";
import MatchCard from "@/components/player/MatchCard";
import { Button } from "@/components/ui/button";

interface FeedActivity {
  id: number;
  matchId: number;
  userId: number;
  displayIdentity: string;
  venue?: string;
  location?: string;
  tournament?: string;
  league?: string;
  eventDate: string;
  eventFormat: "SINGLES" | "DOUBLES";
  confirmed: boolean;
  teams: Array<{
    id: number;
    serial: number;
    player1: {
      id: number;
      fullName: string;
      imageUrl?: string;
      rating?: string;
    };
    player2?: {
      id: number;
      fullName: string;
      imageUrl?: string;
      rating?: string;
    };
    game1: number;
    game2: number;
    game3?: number;
    game4?: number;
    game5?: number;
    winner: boolean;
    delta?: string;
    teamRating?: string;
  }>;
  matchSource?: string;
  noOfGames: number;
  status: string;
  created: string;
}

const FeedPage: React.FC = () => {
  const { setTitle, setShowBackButton, setOnBackClick, setShowHamburgerMenu } = useHeader();
  const { token } = useAuth();
  const [feedActivities, setFeedActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (loadMore = false) => {
    if (!token) return;

    try {
      if (!loadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        throw new Error("User ID not found");
      }

      const offset = loadMore ? feedActivities.length : 0;
      const limit = 10;

      const response = await getUserActivityFeed(parseInt(currentUserId), offset, limit);

      if (response.status === "SUCCESS") {
        const activities = response.result?.hits || response.results || [];
        
        if (loadMore) {
          setFeedActivities(prev => [...prev, ...activities]);
        } else {
          setFeedActivities(activities);
        }

        setHasMore(activities.length === limit);
      } else {
        throw new Error(response.message || "Failed to fetch feed");
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, feedActivities.length]);

  useEffect(() => {
    setTitle("Activity Feed");
    setShowBackButton(false);
    setShowHamburgerMenu(true);
  }, [setTitle, setShowBackButton, setOnBackClick, setShowHamburgerMenu]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFeed(true);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchFeed()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (feedActivities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No activity to show</p>
          <p className="text-sm text-muted-foreground">
            Follow players to see their matches in your feed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        {feedActivities.map((activity) => (
          <MatchCard
            key={activity.id}
            match={activity}
            profileUserId={activity.userId}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeedPage;