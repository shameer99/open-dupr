import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/useTheme";
import { useAuth } from "@/lib/useAuth";
import { navigateWithTransition, navigateToProfile } from "@/lib/view-transitions";
import {
  getMyProfile,
  getFollowers,
  getFollowing,
  apiFetch,
} from "@/lib/api";
import type { FollowUser } from "@/lib/types";
import {
  X,
  Search,
  User,
  LayoutList,
  Plus,
  Info,
  LogOut,
  Download,
  Moon,
  Sun,
  Monitor,
  Users,
} from "lucide-react";

interface SearchHit {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  shortAddress?: string;
  distance?: string;
  ratings?: {
    singles?: string;
    singlesVerified?: string;
    singlesProvisional?: boolean;
    doubles?: string;
    doublesVerified?: string;
    doublesProvisional?: boolean;
    defaultRating?: "SINGLES" | "DOUBLES";
  };
}

interface SearchAPIResponse {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  shortAddress?: string;
  distance?: string;
  ratings?: {
    singles?: string;
    singlesVerified?: string;
    singlesProvisional?: boolean;
    doubles?: string;
    doublesVerified?: string;
    doublesProvisional?: boolean;
    defaultRating?: "SINGLES" | "DOUBLES";
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  keywords: string[];
}

interface FullScreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatRating = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(3) : "-";
  }
  const text = String(value).trim();
  return text.length > 0 && text !== "NR" ? text : "-";
};

const FullScreenSearch: React.FC<FullScreenSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { logout: authLogout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [friends, setFriends] = useState<FollowUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [myProfile, setMyProfile] = useState<{ id: number; fullName: string; imageUrl?: string; addresses?: Array<{ latitude?: number; longitude?: number }> } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check PWA install status
  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    const navStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    const standalone = checkStandalone() || navStandalone;
    setIsInstalled(standalone);

    const pwaEl = document.getElementById("pwa-install") as (HTMLElement & {
      isInstallAvailable?: boolean;
    }) | null;
    const updateCanInstall = () => {
      if (!pwaEl) return;
      const available = !!pwaEl.isInstallAvailable;
      setCanInstall(available);
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

  // Load user profile and coordinates
  useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;
    (async () => {
      try {
        const data = await getMyProfile();
        const profile = data?.result;
        if (mounted && profile) {
          setMyProfile(profile);
          const addr = profile?.addresses?.[0];
          const lat = addr?.latitude;
          const lng = addr?.longitude;
          if (typeof lat === "number" && typeof lng === "number") {
            setUserLatLng({ lat, lng });
          }
        }
      } catch {
        // ignore, fallback will be used
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Load friends (followers + following)
  const loadFriends = useCallback(async () => {
    if (!myProfile?.id) return;
    setIsLoadingFriends(true);
    try {
      const [followersResp, followingResp] = await Promise.all([
        getFollowers(myProfile.id, 0, 20),
        getFollowing(myProfile.id, 0, 20),
      ]);

      const followers = followersResp?.results || [];
      const following = followingResp?.results || [];

      const combined = [...following, ...followers]
        .filter(
          (user, index, arr) => arr.findIndex((u) => u.id === user.id) === index
        )
        .filter((user) => user.id !== myProfile.id);

      setFriends(combined);
    } catch {
      // Error handling intentionally silent
    } finally {
      setIsLoadingFriends(false);
    }
  }, [myProfile?.id]);

  useEffect(() => {
    if (isOpen && myProfile?.id) {
      loadFriends();
    }
  }, [isOpen, myProfile?.id, loadFriends]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const triggerInstall = useCallback(() => {
    onClose();
    const pwaEl = document.getElementById("pwa-install") as (HTMLElement & {
      showDialog?: (forced?: boolean) => void;
    }) | null;
    pwaEl?.showDialog?.(true);
  }, [onClose]);

  const goToProfile = useCallback(() => {
    onClose();
    navigateToProfile(navigate, "/profile");
  }, [onClose, navigate]);

  const goToRecordMatch = useCallback(() => {
    onClose();
    navigateWithTransition(navigate, "/record-match");
  }, [onClose, navigate]);

  const goToAbout = useCallback(() => {
    onClose();
    navigateWithTransition(navigate, "/about");
  }, [onClose, navigate]);

  const goToFeed = useCallback(() => {
    onClose();
    navigateWithTransition(navigate, "/feed");
  }, [onClose, navigate]);

  const logout = useCallback(() => {
    onClose();
    authLogout();
    navigateWithTransition(navigate, "/login");
  }, [onClose, authLogout, navigate]);

  // Quick actions with keywords for filtering
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: "profile",
      label: "My Profile",
      icon: <User className="h-5 w-5" />,
      onClick: goToProfile,
      keywords: ["profile", "me", "my", "account", "user"],
    },
    {
      id: "feed",
      label: "Feed",
      icon: <LayoutList className="h-5 w-5" />,
      onClick: goToFeed,
      keywords: ["feed", "timeline", "activity", "posts"],
    },
    {
      id: "record-match",
      label: "Add Match",
      icon: <Plus className="h-5 w-5" />,
      onClick: goToRecordMatch,
      keywords: ["add", "match", "record", "game", "play", "score"],
    },
    {
      id: "about",
      label: "About Open DUPR",
      icon: <Info className="h-5 w-5" />,
      onClick: goToAbout,
      keywords: ["about", "info", "help", "support", "open", "dupr"],
    },
    {
      id: "logout",
      label: "Log out",
      icon: <LogOut className="h-5 w-5" />,
      onClick: logout,
      keywords: ["logout", "log", "out", "sign", "exit", "leave"],
    },
    ...((!isInstalled && canInstall) ? [{
      id: "install",
      label: "Install App",
      icon: <Download className="h-5 w-5" />,
      onClick: triggerInstall,
      keywords: ["install", "app", "download", "pwa"],
    }] : []),
  ], [isInstalled, canInstall, goToProfile, goToFeed, goToRecordMatch, goToAbout, logout, triggerInstall]);

  // Filter actions based on search query
  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return quickActions;
    
    const query = searchQuery.toLowerCase();
    return quickActions.filter(action =>
      action.label.toLowerCase().includes(query) ||
      action.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [quickActions, searchQuery]);

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    
    const query = searchQuery.toLowerCase();
    return friends.filter(friend =>
      friend.name?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  // Perform player search
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const body = {
          offset: 0,
          limit: 10,
          query: query.trim(),
          filter: {
            lat: userLatLng?.lat ?? 30.2672,
            lng: userLatLng?.lng ?? -97.7431,
            radiusInMeters: 5_000_000,
            rating: { min: 1.0, max: 8.0 },
          },
          includeUnclaimedPlayers: false,
        };
        const resp = await apiFetch("/player/v1.0/search", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const newHits: SearchHit[] = (resp?.result?.hits ?? []).map(
          (hit: SearchAPIResponse) => ({
            id: hit.id,
            fullName: hit.fullName,
            firstName: hit.firstName,
            lastName: hit.lastName,
            imageUrl: hit.imageUrl,
            shortAddress: hit.shortAddress,
            distance: hit.distance,
            ratings: hit.ratings,
          })
        );
        setSearchResults(newHits.filter(player => player.id !== myProfile?.id));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [userLatLng, myProfile?.id]
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handlePlayerClick = (playerId: number) => {
    onClose();
    navigateToProfile(navigate, `/player/${playerId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col safe-area-inset-top"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Search</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search players, actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 text-base h-12"
          />
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground hover:opacity-80 transition-colors"
              type="button"
              aria-label="Clear search"
            >
              <X className="w-full h-full" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Actions */}
        {filteredActions.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {searchQuery.trim() ? `Actions matching "${searchQuery}"` : "Quick Actions"}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors min-w-[80px]"
                >
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Theme Controls */}
            {!searchQuery.trim() && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Theme</h4>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent transition-colors ${
                      theme === "light" ? "ring-2 ring-ring" : ""
                    }`}
                    aria-label="Light theme"
                  >
                    <Sun className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent transition-colors ${
                      theme === "dark" ? "ring-2 ring-ring" : ""
                    }`}
                    aria-label="Dark theme"
                  >
                    <Moon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent transition-colors ${
                      theme === "system" ? "ring-2 ring-ring" : ""
                    }`}
                    aria-label="System theme"
                  >
                    <Monitor className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Friends */}
        {filteredFriends.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {searchQuery.trim() ? `Friends matching "${searchQuery}"` : "Friends"}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {isLoadingFriends ? (
                <div className="flex gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 text-center">
                      <div className="w-16 h-16 rounded-full animate-pulse mb-2 bg-muted" />
                      <div className="w-16 h-3 rounded animate-pulse bg-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handlePlayerClick(friend.id)}
                    className="flex-shrink-0 text-center group"
                  >
                    <div className="w-16 h-16 mb-2 group-hover:scale-105 transition-transform">
                      <Avatar
                        src={friend.profileImage}
                        name={friend.name || ""}
                        size="lg"
                      />
                    </div>
                    <div className="w-16 min-h-[2.5rem] flex items-center justify-center">
                      <p className="text-xs font-medium text-foreground leading-tight text-center whitespace-pre-line">
                        {(() => {
                          const name = friend.name || "";
                          const words = name.split(" ");
                          if (words.length === 1) {
                            if (name.length > 4) {
                              const mid = Math.ceil(name.length / 2);
                              return name.slice(0, mid) + "\n" + name.slice(mid);
                            }
                            return name + "\n ";
                          } else if (words.length === 2) {
                            return words[0] + "\n" + words[1];
                          } else {
                            return words[0] + "\n" + words.slice(1).join(" ");
                          }
                        })()}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Player Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Player Search Results
            </h3>
            {isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                Searching players...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerClick(player.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent text-left"
                  >
                    <Avatar
                      src={player.imageUrl}
                      name={player.fullName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {player.fullName?.trim().replace(/\s+/g, " ")}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-mono font-medium">
                            {formatRating(player.ratings?.singles)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="font-mono font-medium">
                            {formatRating(player.ratings?.doubles)}
                          </span>
                        </div>
                        {player.shortAddress && (
                          <div className="text-xs truncate ml-auto">
                            {player.shortAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No players found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Empty state when no search query */}
        {!searchQuery.trim() && filteredFriends.length === 0 && !isLoadingFriends && (
          <div className="p-4 text-center text-muted-foreground">
            <p>Start typing to search for players</p>
            <p className="text-sm mt-1">or use the quick actions above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenSearch;