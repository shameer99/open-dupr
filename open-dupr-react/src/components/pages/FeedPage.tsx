import React, { useEffect, useState, useCallback, useRef } from "react";
import { getMyProfile, getActivityFeed } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/utils";
import {
  LoadingPage,
  LoadingSpinner,
  MatchCardSkeleton,
} from "@/components/ui/loading-skeletons";
import type { Player, FeedItem } from "@/lib/types";
import MatchCard from "@/components/player/MatchCard";
import { usePageLoading } from "@/lib/loading-context";

const FeedPage: React.FC = () => {
  const [profile, setProfile] = useState<Player | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 10;

  const loadMoreFeed = useCallback(async () => {
    if (!profile || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const data = await getActivityFeed(profile.id, PAGE_SIZE);
      const newItems = data?.result?.hits ?? [];
      setFeed((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length === PAGE_SIZE);
    } catch (err) {
      setError(extractApiErrorMessage(err, "An error occurred"));
    } finally {
      setIsLoadingMore(false);
    }
  }, [profile, isLoadingMore, hasMore]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        startPageLoad(["Fetching profile", "Fetching feed"]);
        setLoading(true);

        completeLoadingStep("Fetching profile");
        const profileData = await getMyProfile();
        setProfile(profileData.result);

        completeLoadingStep("Fetching feed");
        const feedData = await getActivityFeed(profileData.result.id, PAGE_SIZE);
        setFeed(feedData?.result?.hits ?? []);
        setHasMore((feedData?.result?.hits ?? []).length === PAGE_SIZE);

        finishPageLoad();
      } catch (err) {
        setError(extractApiErrorMessage(err, "An error occurred"));
        finishPageLoad();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [startPageLoad, completeLoadingStep, finishPageLoad]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          loadMoreFeed();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMoreFeed]);

  if (loading) {
    return (
      <LoadingPage>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </LoadingPage>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Feed</h1>
      {feed.length > 0 ? (
        <div className="space-y-3">
          {feed.map((item) => (
            <MatchCard
              key={item.match.id}
              match={item.match}
              currentUserId={profile?.id}
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
      ) : (
        <p>No activity in your feed yet.</p>
      )}
    </div>
  );
};

export default FeedPage;
