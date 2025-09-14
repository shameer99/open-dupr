import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getFollowers,
  getFollowing,
  getOtherUserFollowInfo,
  getPlayerById,
  getMyProfile,
} from "@/lib/api";
import Avatar from "@/components/ui/avatar";
import {
  FollowUserListSkeleton,
  LoadingSpinner,
} from "@/components/ui/loading-skeletons";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { usePageLoading } from "@/lib/loading-context";
import { useHeader } from "@/lib/header-context";
import type { FollowUser, Player } from "@/lib/types";
import FollowButton from "@/components/player/FollowButton";
import { User, Users, ArrowUp, ArrowDown } from "lucide-react";

type TabType = "followers" | "following";
type SortOption = "alphabetical" | "singles" | "doubles" | "none";
type SortDirection = "asc" | "desc";

const formatRating = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(3) : "-";
  }
  const text = String(value).trim();
  return text.length > 0 ? text : "-";
};

const parseRating = (ratingStr: string): number => {
  if (ratingStr === "-" || !ratingStr) return -1;
  const parsed = parseFloat(ratingStr);
  return isNaN(parsed) ? -1 : parsed;
};

const sortUsers = (users: FollowUser[], sortOption: SortOption, sortDirection: SortDirection, userRatings: Record<number, { singles: string; doubles: string }>): FollowUser[] => {
  if (sortOption === "none") return users;
  
  return [...users].sort((a, b) => {
    let result = 0;
    
    switch (sortOption) {
      case "alphabetical": {
        const nameA = a.name?.trim().toLowerCase() || "";
        const nameB = b.name?.trim().toLowerCase() || "";
        result = nameA.localeCompare(nameB);
        break;
      }
      
      case "singles": {
        const ratingA = parseRating(userRatings[a.id]?.singles || "-");
        const ratingB = parseRating(userRatings[b.id]?.singles || "-");
        result = ratingB - ratingA; // Default descending order (higher ratings first)
        break;
      }
      
      case "doubles": {
        const ratingA = parseRating(userRatings[a.id]?.doubles || "-");
        const ratingB = parseRating(userRatings[b.id]?.doubles || "-");
        result = ratingB - ratingA; // Default descending order (higher ratings first)
        break;
      }
      
      default:
        return 0;
    }
    
    return sortDirection === "asc" ? -result : result;
  });
};

const FollowersFollowingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selfProfile, setSelfProfile] = useState<Player | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "followers";
  const {
    setTitle,
    setShowBackButton,
    setOnBackClick,
    setAvatarUrl,
    setPlayerName,
  } = useHeader();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  // Page-level loading: header info (name, image, counts)
  const [pageLoading, setPageLoading] = useState(true);
  // List-level loading when switching tabs or first page fetch
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [followersOffset, setFollowersOffset] = useState<number>(0);
  const [followingOffset, setFollowingOffset] = useState<number>(0);
  const [followersHasMore, setFollowersHasMore] = useState<boolean>(true);
  const [followingHasMore, setFollowingHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [userRatings, setUserRatings] = useState<Record<number, { singles: string; doubles: string }>>({});
  const [sortOption, setSortOption] = useState<SortOption>("none");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();
  const PAGE_SIZE = 50;

  const fetchUserRatings = useCallback(async (userIds: number[]) => {
    const ratingPromises = userIds.map(async (userId) => {
      try {
        const playerData = await getPlayerById(userId);
        console.log(`Player data for user ${userId}:`, playerData);
        const ratings = playerData?.result?.ratings;
        if (ratings) {
          console.log(`Ratings for user ${userId}:`, ratings);
          return {
            userId,
            ratings: {
              singles: formatRating(ratings.singles),
              doubles: formatRating(ratings.doubles),
            },
          };
        } else {
          console.log(`No ratings found for user ${userId}, playerData:`, playerData);
        }
      } catch (err) {
        console.warn(`Failed to fetch ratings for user ${userId}:`, err);
      }
      return null;
    });

    const results = await Promise.all(ratingPromises);
    const newRatings: Record<number, { singles: string; doubles: string }> = {};
    
    results.forEach((result) => {
      if (result) {
        newRatings[result.userId] = result.ratings;
      }
    });

    console.log('Setting new ratings:', newRatings);
    setUserRatings((prev) => {
      const updated = { ...prev, ...newRatings };
      console.log('Updated userRatings state:', updated);
      return updated;
    });
  }, []);

  const loadFollowersPage = useCallback(
    async (userId: number, startOffset: number) => {
      try {
        setIsLoadingMore(true);
        const response = await getFollowers(userId, startOffset, PAGE_SIZE);
        const newItems: FollowUser[] = response?.results ?? [];
        setFollowers((prev) =>
          startOffset === 0 ? newItems : [...prev, ...newItems]
        );
        setFollowersHasMore(newItems.length === PAGE_SIZE);
        setFollowersOffset(startOffset + newItems.length);
        
        // Fetch ratings for new users
        const newUserIds = newItems.map((user) => user.id);
        await fetchUserRatings(newUserIds);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load followers"
        );
      } finally {
        setIsLoadingMore(false);
      }
    },
    [fetchUserRatings]
  );

  const loadFollowingPage = useCallback(
    async (userId: number, startOffset: number) => {
      try {
        setIsLoadingMore(true);
        const response = await getFollowing(userId, startOffset, PAGE_SIZE);
        const newItems: FollowUser[] = response?.results ?? [];
        setFollowing((prev) =>
          startOffset === 0 ? newItems : [...prev, ...newItems]
        );
        setFollowingHasMore(newItems.length === PAGE_SIZE);
        setFollowingOffset(startOffset + newItems.length);
        
        // Fetch ratings for new users
        const newUserIds = newItems.map((user) => user.id);
        await fetchUserRatings(newUserIds);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load following"
        );
      } finally {
        setIsLoadingMore(false);
      }
    },
    [fetchUserRatings]
  );

  // Initial load and when visiting a different player id
  useEffect(() => {
    const fetchPage = async () => {
      if (!id) return;
      try {
        setPageLoading(true);
        startPageLoad([
          "Getting user info",
          "Loading social data",
          "Rendering content",
        ]);

        // Reset lists/state when navigating to a different user
        setFollowers([]);
        setFollowing([]);
        setFollowersOffset(0);
        setFollowingOffset(0);
        setFollowersHasMore(true);
        setFollowingHasMore(true);
        setUserRatings({});
        setSortOption("none");
        setSortDirection("desc");

        const userId = parseInt(id);

        completeLoadingStep("Getting user info");
        const [followInfoData, playerDetail] = await Promise.all([
          getOtherUserFollowInfo(userId).catch(() => null),
          getPlayerById(userId).catch(() => null),
        ]);

        // Also fetch current user's profile to get their ID
        const selfProfileData = await getMyProfile().catch(() => null);
        if (selfProfileData?.result) {
          setSelfProfile(selfProfileData.result);
        }

        const followersTotal = followInfoData?.result?.followers;
        const followingTotal = followInfoData?.result?.followings;
        if (typeof followersTotal === "number")
          setFollowersCount(followersTotal);
        if (typeof followingTotal === "number")
          setFollowingCount(followingTotal);

        const name = playerDetail?.result?.fullName as string | undefined;
        const image = playerDetail?.result?.imageUrl as string | undefined;
        if (name) {
          setTargetName(name);
          setPlayerName(name);
        }
        if (image) setAvatarUrl(image);

        completeLoadingStep("Loading social data");

        // Load the first page for the currently active tab without triggering a full-page skeleton
        setListLoading(true);
        if (activeTab === "followers") {
          await loadFollowersPage(userId, 0);
        } else {
          await loadFollowingPage(userId, 0);
        }
        setListLoading(false);

        setTimeout(() => {
          completeLoadingStep("Rendering content");
          finishPageLoad();
        }, 50);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load followers/following"
        );
        finishPageLoad();
      } finally {
        setPageLoading(false);
      }
    };

    fetchPage();
    // Only when id changes; avoid re-running on tab switches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!loaderRef.current) return;
    if (!id) return;
    const userId = parseInt(id);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingMore && !pageLoading) {
          if (activeTab === "followers" && followersHasMore) {
            void loadFollowersPage(userId, followersOffset);
          } else if (activeTab === "following" && followingHasMore) {
            void loadFollowingPage(userId, followingOffset);
          }
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [
    id,
    activeTab,
    followersHasMore,
    followingHasMore,
    isLoadingMore,
    pageLoading,
    followersOffset,
    followingOffset,
    loadFollowersPage,
    loadFollowingPage,
  ]);

  const handleTabChange = async (newTab: TabType) => {
    if (newTab === activeTab) return;

    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setSortOption("none"); // Reset sort when switching tabs
    setSortDirection("desc");

    if (!id) return;
    const userId = parseInt(id);

    // If the target tab has not been loaded yet, fetch its first page and show a list-only loading state
    if (newTab === "followers" && followers.length === 0) {
      setListLoading(true);
      await loadFollowersPage(userId, 0);
      setListLoading(false);
    } else if (newTab === "following" && following.length === 0) {
      setListLoading(true);
      await loadFollowingPage(userId, 0);
      setListLoading(false);
    }
  };

  const handleUserClick = (userId: number) => {
    navigate(`/player/${userId}`);
  };

  const handleFollowStateChange = (userId: number, isFollowed: boolean) => {
    const updateUser = (list: FollowUser[]) =>
      list.map((user) =>
        user.id === userId ? { ...user, isFollow: isFollowed } : user
      );
    setFollowers(updateUser);
    setFollowing(updateUser);
  };

  const handleSortOptionChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    if (newSortOption !== "none") {
      // Set default direction based on sort type
      if (newSortOption === "alphabetical") {
        setSortDirection("asc");
      } else {
        setSortDirection("desc"); // For ratings, default to highest first
      }
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  const handleBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const title =
      targetName || (activeTab === "followers" ? "Followers" : "Following");
    setTitle(title);
    setShowBackButton(true);
    setOnBackClick(() => handleBackClick);

    return () => {
      setTitle(null);
      setShowBackButton(false);
      setOnBackClick(undefined);
      setAvatarUrl(null);
      setPlayerName(null);
    };
  }, [
    activeTab,
    targetName,
    setTitle,
    setShowBackButton,
    setOnBackClick,
    setAvatarUrl,
    setPlayerName,
    handleBackClick,
  ]);

  const handleRefresh = useCallback(async () => {
    if (!id) return;

    try {
      setListLoading(true);
      setError(null);
      setSortOption("none"); // Reset sort on refresh
      setSortDirection("desc");

      if (activeTab === "followers") {
        setFollowers([]);
        setFollowersOffset(0);
        setFollowersHasMore(true);
        await loadFollowersPage(parseInt(id), 0);
      } else {
        setFollowing([]);
        setFollowingOffset(0);
        setFollowingHasMore(true);
        await loadFollowingPage(parseInt(id), 0);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to load ${activeTab}`
      );
    } finally {
      setListLoading(false);
    }
  }, [id, activeTab, loadFollowersPage, loadFollowingPage]);

  if (pageLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <FollowUserListSkeleton />
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

  const currentList = activeTab === "followers" ? followers : following;
  const hasMore =
    activeTab === "followers" ? followersHasMore : followingHasMore;
  
  const currentCount = activeTab === "followers" ? followersCount : followingCount;
  const canSort = currentCount !== null && currentCount <= 100;
  const sortedList = canSort ? sortUsers(currentList, sortOption, sortDirection, userRatings) : currentList;

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={listLoading}>
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => handleTabChange("followers")}
            className={`flex-1 pb-3 px-1 text-center font-medium transition-colors ${
              activeTab === "followers"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Followers
            {typeof followersCount === "number" && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {followersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("following")}
            className={`flex-1 pb-3 px-1 text-center font-medium transition-colors ${
              activeTab === "following"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Following
            {typeof followingCount === "number" && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {followingCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort Controls */}
        {canSort ? (
          <div className="mb-4 flex justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSortDirection}
                className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors ${
                  sortOption === "none" ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
                title={sortOption !== "none" ? `Sort ${sortDirection === "asc" ? "ascending" : "descending"}` : ""}
                tabIndex={sortOption === "none" ? -1 : 0}
              >
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              <select
                value={sortOption}
                onChange={(e) => handleSortOptionChange(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Sort by...</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="singles">Singles Rating</option>
                <option value="doubles">Doubles Rating</option>
              </select>
            </div>
          </div>
        ) : currentCount !== null && currentCount > 100 ? (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Sort unavailable:</span> Lists with more than 100 {activeTab} cannot be sorted. This list has {currentCount} {activeTab}.
            </p>
          </div>
        ) : null}

        {listLoading && currentList.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border animate-pulse"
              >
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedList.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No {activeTab} to display.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedList.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar src={user.profileImage} name={user.name} size="md" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {user.name?.trim().replace(/\s+/g, " ")}
                    </p>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-mono font-medium">
                          {userRatings[user.id]?.singles || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-mono font-medium">
                          {userRatings[user.id]?.doubles || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {selfProfile && user.id !== selfProfile.id && !(activeTab === "following" && id && parseInt(id) === selfProfile.id) && (
                  <FollowButton
                    user={user}
                    onFollowStateChange={handleFollowStateChange}
                  />
                )}
              </div>
            ))}
            <div ref={loaderRef} />
            {(isLoadingMore || listLoading) && hasMore && (
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
    </PullToRefresh>
  );
};

export default FollowersFollowingPage;
