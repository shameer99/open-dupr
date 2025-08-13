import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";

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
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mr-3">
          ← Back
        </Button>
        <h1 className="text-xl font-semibold">Search Players</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white"
        />
        <Button type="submit">Search</Button>
      </form>
      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

      {hits.length === 0 && !loading ? (
        <p className="text-muted-foreground">Enter a query to find players.</p>
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
          {loading && (
            <div className="py-3 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
