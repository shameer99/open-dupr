import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFollowing, getOtherUserFollowInfo, getPlayerById } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import type { FollowUser } from "@/lib/types";

const FollowingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 50;

  const loadPage = useCallback(async (userId: number, startOffset: number) => {
    try {
      setIsLoadingMore(true);
      const response = await getFollowing(userId, startOffset, PAGE_SIZE);
      const newItems: FollowUser[] = response?.results ?? [];
      setFollowing((prev) =>
        startOffset === 0 ? newItems : [...prev, ...newItems]
      );
      setHasMore(newItems.length === PAGE_SIZE);
      setOffset(startOffset + newItems.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load following");
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setFollowing([]);
        setOffset(0);
        setHasMore(true);
        const userId = parseInt(id);

        const [followInfoData, playerDetail]: [
          { result?: { followings?: number } } | null,
          { result?: { fullName?: string } } | null
        ] = await Promise.all([
          getOtherUserFollowInfo(userId).catch(() => null),
          getPlayerById(userId).catch(() => null),
        ]);

        const count = followInfoData?.result?.followings;
        if (typeof count === "number") setFollowingCount(count);
        const name = playerDetail?.result?.fullName as string | undefined;
        if (name) setTargetName(name);

        await loadPage(userId, 0);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load following"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, loadPage]);

  useEffect(() => {
    if (!loaderRef.current) return;
    if (!id) return;
    const userId = parseInt(id);

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
  }, [id, hasMore, isLoadingMore, loading, offset, loadPage]);

  const handleUserClick = (userId: number) => {
    navigate(`/player/${userId}`);
  };

  const handleBackClick = () => {
    const canGoBack = (window.history.state &&
      (window.history.state as { idx?: number }).idx! > 0) as boolean;
    if (canGoBack) {
      navigate(-1);
    } else if (id) {
      navigate(`/player/${id}`);
    } else {
      navigate("/profile");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={handleBackClick} className="mr-4">
          ← Back
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">
            {targetName ? `${targetName}'s Following` : "Following"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {typeof followingCount === "number"
              ? followingCount
              : following.length}{" "}
            {(typeof followingCount === "number"
              ? followingCount
              : following.length) === 1
              ? "following"
              : "following"}
          </p>
        </div>
      </div>

      {following.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No following to display.
        </p>
      ) : (
        <div className="space-y-3">
          {following.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border"
              onClick={() => handleUserClick(user.id)}
            >
              <Avatar src={user.profileImage} name={user.name} size="md" />
              <div className="flex-1">
                <p className="font-medium">
                  {user.name?.trim().replace(/\s+/g, " ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Click to view profile
                </p>
              </div>
            </div>
          ))}
          <div ref={loaderRef} />
          {isLoadingMore && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading more…
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowingPage;
