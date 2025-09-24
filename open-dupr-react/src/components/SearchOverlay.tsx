import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import { useHeader } from "@/lib/header-context";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/lib/useTheme";
import { getMyProfile, getFollowers, getFollowing, searchPlayers, type PlayerSearchHit } from "@/lib/api";
import { navigateToProfile, navigateWithTransition } from "@/lib/view-transitions";
import { useNavigate } from "react-router-dom";
import { Download, Info, LayoutList, LogOut, Moon, Plus, Search, Sun, Monitor, User } from "lucide-react";

const MIN_QUERY_CHARS = 2;

interface FriendItem {
  id: number;
  fullName: string;
  imageUrl?: string;
}

const ActionsRow: React.FC<{
  onClose: () => void;
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
}> = ({ onClose, canInstall, isInstalled, onInstall }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setIsSearchOpen } = useHeader();
  const { setTheme, theme } = useTheme();

  const go = (path: string) => {
    onClose();
    navigateWithTransition(navigate, path);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
      <Button variant="outline" size="sm" onClick={() => go("/profile")} className="shrink-0">
        <User className="h-4 w-4 mr-2" /> Profile
      </Button>
      <Button variant="outline" size="sm" onClick={() => go("/feed")} className="shrink-0">
        <LayoutList className="h-4 w-4 mr-2" /> Feed
      </Button>
      <Button variant="outline" size="sm" onClick={() => go("/record-match")} className="shrink-0">
        <Plus className="h-4 w-4 mr-2" /> Add Match
      </Button>
      <Button variant="outline" size="sm" onClick={() => go("/about")} className="shrink-0">
        <Info className="h-4 w-4 mr-2" /> About
      </Button>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent cursor-pointer ${
            theme === "light" ? "ring-2 ring-ring" : ""
          }`}
          aria-label="Light theme"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent cursor-pointer ${
            theme === "dark" ? "ring-2 ring-ring" : ""
          }`}
          aria-label="Dark theme"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent cursor-pointer ${
            theme === "system" ? "ring-2 ring-ring" : ""
          }`}
          aria-label="System theme"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
      {!isInstalled && canInstall && (
        <Button variant="outline" size="sm" onClick={onInstall} className="shrink-0">
          <Download className="h-4 w-4 mr-2" /> Install App
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onClose();
          logout();
          setIsSearchOpen(false);
          navigateWithTransition(navigate, "/login");
        }}
        className="text-red-600 shrink-0"
      >
        <LogOut className="h-4 w-4 mr-2" /> Log out
      </Button>
    </div>
  );
};

const FriendsRow: React.FC<{
  friends: FriendItem[];
  onSelect: (friend: FriendItem) => void;
  loading: boolean;
}> = ({ friends, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 text-center">
            <div className="w-16 h-16 rounded-full animate-pulse mb-2 bg-muted" />
            <div className="w-16 h-3 rounded animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  if (friends.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
      {friends.map((f) => (
        <button
          key={f.id}
          type="button"
          className="flex-shrink-0 text-center group"
          onClick={() => onSelect(f)}
        >
          <div className="w-16 h-16 mb-2 group-hover:scale-105 transition-transform">
            <Avatar src={f.imageUrl} name={f.fullName} size="lg" />
          </div>
          <div className="w-16 min-h-[2.5rem] flex items-center justify-center">
            <p className="text-xs font-medium text-foreground leading-tight text-center hyphens-auto whitespace-pre-line">
              {(() => {
                const words = f.fullName.split(" ");
                if (words.length === 1) {
                  if (f.fullName.length > 4) {
                    const mid = Math.ceil(f.fullName.length / 2);
                    return f.fullName.slice(0, mid) + "\n" + f.fullName.slice(mid);
                  }
                  return f.fullName + "\n ";
                } else if (words.length === 2) {
                  return words[0] + "\n" + words[1];
                } else {
                  return words[0] + "\n" + words.slice(1).join(" ");
                }
              })()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

const SearchOverlay: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen } = useHeader();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlayerSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Handle PWA install availability and installed state
  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    const navStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    const standalone = checkStandalone() || navStandalone;
    setIsInstalled(standalone);

    const pwaEl = document.getElementById("pwa-install") as (HTMLElement & {
      isInstallAvailable?: boolean;
      showDialog?: (forced?: boolean) => void;
    }) | null;
    const updateCanInstall = () => {
      if (!pwaEl) return;
      setCanInstall(!!pwaEl.isInstallAvailable);
    };
    updateCanInstall();

    const onAvailable = () => updateCanInstall();
    const onInstalled = () => setIsInstalled(true);
    pwaEl?.addEventListener?.("pwa-install-available-event", onAvailable as EventListener);
    window.addEventListener("appinstalled", onInstalled as EventListener);
    return () => {
      pwaEl?.removeEventListener?.("pwa-install-available-event", onAvailable as EventListener);
      window.removeEventListener("appinstalled", onInstalled as EventListener);
    };
  }, []);

  const triggerInstall = () => {
    const pwaEl = document.getElementById("pwa-install") as (HTMLElement & {
      showDialog?: (forced?: boolean) => void;
    }) | null;
    pwaEl?.showDialog?.(true);
  };

  // Body scroll lock when open
  useEffect(() => {
    if (isSearchOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isSearchOpen]);

  // Load friends (followers + following) on open
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingFriends(true);
        const me = await getMyProfile();
        const myId = me?.result?.id as number | undefined;
        if (!myId) {
          setFriends([]);
          return;
        }
        const [followersResp, followingResp] = await Promise.all([
          getFollowers(myId, 0, 20),
          getFollowing(myId, 0, 20),
        ]);
        const followers = followersResp?.results || [];
        const following = followingResp?.results || [];
        const combined = [...following, ...followers]
          .filter((user: { id: number }, index: number, arr: { id: number }[]) =>
            arr.findIndex((u) => u.id === user.id) === index
          )
          .filter((user: { id: number }) => user.id !== myId)
          .map((user: { id: number; name: string; profileImage?: string }) => ({
            id: user.id,
            fullName: user.name,
            imageUrl: user.profileImage,
          }));
        if (!cancelled) setFriends(combined);
      } catch {
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setLoadingFriends(false);
      }
    };
    if (isSearchOpen) void load();
    return () => {
      cancelled = true;
    };
  }, [isSearchOpen]);

  // Debounced search
  useEffect(() => {
    if (!isSearchOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_CHARS) {
      setHits([]);
      setError(null);
      return;
    }
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        let userLat: number | undefined;
        let userLng: number | undefined;
        try {
          const profile = await getMyProfile();
          const addr = profile?.result?.addresses?.[0];
          if (typeof addr?.latitude === "number" && typeof addr?.longitude === "number") {
            userLat = addr.latitude;
            userLng = addr.longitude;
          }
        } catch {
          void 0;
        }
        const resp = await searchPlayers({
          offset: 0,
          limit: 25,
          query: trimmed,
          filter: {
            lat: userLat ?? 30.2672,
            lng: userLng ?? -97.7431,
            radiusInMeters: 5_000_000,
            rating: { min: 1.0, max: 8.0 },
          },
          includeUnclaimedPlayers: false,
        });
        const newHits = (resp?.result?.hits || []) as PlayerSearchHit[];
        setHits(newHits);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    };
    const handle = setTimeout(() => void run(), 250);
    return () => clearTimeout(handle);
  }, [query, isSearchOpen]);

  const close = useCallback(() => setIsSearchOpen(false), [setIsSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-inset-top">
      <div className="container mx-auto max-w-2xl h-full flex flex-col px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="icon" onClick={close} aria-label="Close search">
            ✕
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="pl-9 h-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="mb-3">
          <ActionsRow
            onClose={close}
            canInstall={canInstall}
            isInstalled={isInstalled}
            onInstall={triggerInstall}
          />
        </div>

        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Friends</div>
          <FriendsRow
            friends={friends}
            loading={loadingFriends}
            onSelect={(f) => {
              close();
              navigateToProfile(navigate, `/player/${f.id}`);
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {error && (
            <div className="mb-2 text-sm" style={{ color: "var(--destructive)" }}>
              {error}
            </div>
          )}
          {query.trim().length < MIN_QUERY_CHARS ? (
            <p className="text-muted-foreground">Enter at least {MIN_QUERY_CHARS} characters to search players.</p>
          ) : loading ? (
            <p className="text-muted-foreground">Searching...</p>
          ) : hits.length === 0 ? (
            <p className="text-muted-foreground">No players found for "{query}".</p>
          ) : (
            <div className="space-y-2">
              {hits.map((h) => (
                <button
                  key={h.id}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border cursor-pointer"
                  style={{
                    backgroundColor: "color-mix(in oklab, var(--muted) 20%, transparent)",
                  }}
                  onClick={() => {
                    close();
                    navigateToProfile(navigate, `/player/${h.id}`);
                  }}
                  type="button"
                >
                  <Avatar src={h.imageUrl} name={h.fullName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{h.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;

