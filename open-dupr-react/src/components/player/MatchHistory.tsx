import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  getOtherUserMatchHistory,
  getMyProfile,
  getFilteredOtherUserMatchHistory,
} from "@/lib/api";
import MatchCard from "@/components/player/MatchCard";
import { Button } from "@/components/ui/button";
import {
  MatchCardSkeleton,
  LoadingSpinner,
} from "@/components/ui/loading-skeletons";
import { navigateWithTransition } from "@/lib/view-transitions";

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight?: number;
  }>({ top: 0, left: 0 });
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const PAGE_SIZE = 25;

  // Get current logged-in user's ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const profileData = await getMyProfile();
        if (profileData?.result?.id) {
          setCurrentUserId(profileData.result.id);
        }
      } catch (err) {
        console.error("Failed to fetch current user profile:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  const loadPage = useCallback(
    async (userId: number, startOffset: number) => {
      try {
        setIsLoadingMore(true);

        let data;
        if (activeFilter === "all") {
          // Use the regular API for "all" matches
          data = await getOtherUserMatchHistory(userId, startOffset, PAGE_SIZE);
        } else {
          // Use the filtered API for singles/doubles
          const eventFormat: ("SINGLES" | "DOUBLES")[] =
            activeFilter === "singles" ? ["SINGLES"] : ["DOUBLES"];
          data = await getFilteredOtherUserMatchHistory(userId, {
            offset: startOffset,
            limit: PAGE_SIZE,
            filters: {
              eventFormat,
            },
            sort: {
              order: "DESC",
              parameter: "MATCH_DATE",
            },
          });
        }

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
    },
    [activeFilter]
  );

  const handleFilterChange = useCallback((newFilter: string) => {
    if (newFilter === activeFilter) {
      setShowFilterDropdown(false);
      return;
    }
    setActiveFilter(newFilter);
    setMatches([]);
    setOffset(0);
    setHasMore(true);
    setTotalCount(null);
    setError(null);
    setShowFilterDropdown(false);
  }, [activeFilter]);

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 140; // Approximate height of dropdown with 3 items
    const dropdownWidth = 192; // w-48 = 12rem = 192px
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Calculate initial position below the button
    let top = buttonRect.bottom + scrollY + 4;
    let left = buttonRect.left + scrollX;

    // Check if dropdown would go off the bottom of the viewport
    if (buttonRect.bottom + dropdownHeight > viewportHeight) {
      // Position above the button instead
      top = buttonRect.top + scrollY - dropdownHeight - 4;
    }

    // Check if dropdown would go off the right of the viewport
    if (buttonRect.left + dropdownWidth > viewportWidth) {
      // Align to the right edge of the button
      left = buttonRect.right + scrollX - dropdownWidth;
    }

    // Ensure dropdown doesn't go off the left edge
    if (left < scrollX) {
      left = scrollX + 8;
    }

    // Ensure dropdown doesn't go off the top
    if (top < scrollY) {
      top = scrollY + 8;
    }

    return { top, left };
  }, []);

  const toggleFilterDropdown = useCallback(() => {
    if (!showFilterDropdown) {
      const position = calculateDropdownPosition();
      setDropdownPosition(position);
    }
    setShowFilterDropdown((prev) => !prev);
  }, [showFilterDropdown, calculateDropdownPosition]);

  // Refresh is controlled by the parent profile container

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
  }, [playerId, loadPage, activeFilter]);

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

  // Handle clicking outside dropdown to close it and reposition on scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the button and the dropdown
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        // Also check if the click is not on the dropdown itself
        !(target as Element).closest('[data-dropdown="filter-dropdown"]')
      ) {
        setShowFilterDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showFilterDropdown) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    };

    const handleResize = () => {
      if (showFilterDropdown) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [showFilterDropdown, calculateDropdownPosition]);

  if (!playerId) {
    return (
      <div>
        <h2 className="text-xl font-bold">Match History</h2>
        <p className="text-muted-foreground mt-2">Match history coming soon.</p>
      </div>
    );
  }

  const count = typeof totalCount === "number" ? totalCount : matches.length;

  const getFilterDisplayText = () => {
    switch (activeFilter) {
      case "singles":
        return "singles";
      case "doubles":
        return "doubles";
      default:
        return "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">Match History</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {count} {getFilterDisplayText()}{" "}
              {count === 1 ? "match" : "matches"}
            </p>
            <div className="relative" ref={dropdownRef}>
              <Button
                ref={buttonRef}
                variant="ghost"
                size="sm"
                onClick={toggleFilterDropdown}
                className="h-6 w-6 p-0"
                aria-label="Filter matches"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        {isSelf && (
          <Button variant="default" onClick={() => navigateWithTransition(navigate, "/record-match")}>
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
      {error && <p className="text-destructive mt-2">{error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p className="text-muted-foreground mt-2">
          No matches found.
        </p>
      )}
      {!error && matches.length > 0 && (
        <div className="mt-4 space-y-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId || undefined}
              profileUserId={playerId}
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

      {showFilterDropdown &&
        createPortal(
          <div
            data-dropdown="filter-dropdown"
            className="fixed w-48 bg-background border border-border rounded-md shadow-lg z-[9999]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            <div className="p-2">
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors ${
                  activeFilter === "all"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => handleFilterChange("all")}
              >
                All Matches
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors ${
                  activeFilter === "singles"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => handleFilterChange("singles")}
              >
                Singles Only
              </button>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors ${
                  activeFilter === "doubles"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => handleFilterChange("doubles")}
              >
                Doubles Only
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MatchHistory;
