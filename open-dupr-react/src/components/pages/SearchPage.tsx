import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import {
  SearchResultSkeleton,
  LoadingSpinner,
} from "@/components/ui/loading-skeletons";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { apiFetch } from "@/lib/api";
import { useHeader } from "@/lib/header-context";

interface SearchHit {
  id: number;
  fullName: string;
  imageUrl?: string;
  location?: string;
  stats?: { singles?: string; doubles?: string };
}

const DEFAULT_LIMIT = 25;

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTitle, setShowBackButton, setOnBackClick } = useHeader();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const performSearch = useCallback(
    async (reset = false) => {
      if (!query.trim()) {
        setHits([]);
        setHasMore(false);
        setOffset(0);
        return;
      }
      try {
        setLoading(true);
        const body = {
          offset: reset ? 0 : offset,
          limit: DEFAULT_LIMIT,
          query,
          filter: {
            lat: 30.2672,
            lng: -97.7431,
            radiusInMeters: 5_000_000,
            rating: { min: 1.0, max: 8.0 },
          },
          includeUnclaimedPlayers: false,
        };
        const resp = await apiFetch("/player/v1.0/search", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const newHits: SearchHit[] = resp?.result?.hits ?? [];
        setHits((prev) => (reset ? newHits : [...prev, ...newHits]));
        const nextOffset = (reset ? 0 : offset) + newHits.length;
        setOffset(nextOffset);
        setHasMore(newHits.length === DEFAULT_LIMIT);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [query, offset]
  );

  const handleRefresh = useCallback(async () => {
    if (query.trim()) {
      setOffset(0);
      await performSearch(true);
    }
  }, [query, performSearch]);

  const handleBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    setTitle("Search Players");
    setShowBackButton(true);
    setOnBackClick(() => handleBackClick);

    return () => {
      setTitle(null);
      setShowBackButton(false);
      setOnBackClick(undefined);
    };
  }, [setTitle, setShowBackButton, setOnBackClick, handleBackClick]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          void performSearch(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    void performSearch(true);
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      disabled={loading || !query.trim()}
    >
      <div className="container mx-auto p-4 max-w-2xl">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              Search
            </Button>
          </div>
        </form>
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

        {hits.length === 0 && !loading && query.trim() ? (
          <p className="text-muted-foreground">
            No players found for "{query}".
          </p>
        ) : hits.length === 0 && !loading ? (
          <p className="text-muted-foreground">
            Enter a query to find players.
          </p>
        ) : loading && hits.length === 0 ? (
          <SearchResultSkeleton />
        ) : (
          <div className="space-y-2">
            {hits.map((h) => (
              <button
                key={h.id}
                className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                onClick={() => navigate(`/player/${h.id}`)}
                type="button"
              >
                <Avatar src={h.imageUrl} name={h.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {h.fullName?.trim().replace(/\s+/g, " ")}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {h.location || ""}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{h.stats?.singles ? `S: ${h.stats.singles}` : ""}</div>
                  <div>{h.stats?.doubles ? `D: ${h.stats.doubles}` : ""}</div>
                </div>
              </button>
            ))}
            <div ref={loaderRef} />
            {loading && hits.length > 0 && (
              <div className="py-3 text-center">
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

export default SearchPage;
