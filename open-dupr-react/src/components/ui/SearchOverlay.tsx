import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/lib/useTheme";
import { navigateToProfile, navigateWithTransition } from "@/lib/view-transitions";
import {
  User,
  Search,
  Plus,
  LogOut,
  Info,
  Moon,
  Sun,
  Monitor,
  LayoutList,
  Download,
  X,
} from "lucide-react";
import { apiFetch, getMyProfile, getFollowers, getFollowing } from "@/lib/api";

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

interface FriendHit {
  id: number;
  fullName: string;
  imageUrl?: string;
}

interface MenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

const SearchOverlay: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const { logout: authLogout, token } = useAuth();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [friends, setFriends] = useState<FriendHit[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [userLatLng, setUserLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);


  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getMyProfile();
        const addr = data?.result?.addresses?.[0];
        const lat = addr?.latitude;
        const lng = addr?.longitude;
        if (mounted && typeof lat === "number" && typeof lng === "number") {
          setUserLatLng({ lat, lng });
        }
      } catch {
        // ignore, fallback will be used
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load friends (followers + following)
  const loadFriends = useCallback(async () => {
    if (!token) return;
    setLoadingFriends(true);
    try {
      const data = await getMyProfile();
      const myId = data?.result?.id;
      if (!myId) return;

      const [followersResp, followingResp] = await Promise.all([
        getFollowers(myId, 0, 20),
        getFollowing(myId, 0, 20),
      ]);

      const followers = followersResp?.results || [];
      const following = followingResp?.results || [];

      const combined = [...following, ...followers]
        .filter(
          (user, index, arr) => arr.findIndex((u) => u.id === user.id) === index
        )
        .filter((user) => user.id !== myId)
        .map(
          (user) =>
            ({
              id: user.id,
              fullName: user.name,
              imageUrl: user.profileImage,
            } as FriendHit)
        );

      setFriends(combined);
    } catch {
      // Error handling intentionally silent
    } finally {
      setLoadingFriends(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && token) {
      loadFriends();
    }
  }, [open, token, loadFriends]);

  // Setup PWA install detection
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

  const triggerInstall = () => {
    onClose();
    const pwaEl = document.getElementById("pwa-install") as (HTMLElement & {
      showDialog?: (forced?: boolean) => void;
    }) | null;
    pwaEl?.showDialog?.(true);
  };

  // Menu actions
  const menuActions: MenuAction[] = [
    {
      id: "theme-light",
      label: "Light",
      icon: <Sun className="h-4 w-4" />,
      onClick: () => setTheme("light"),
    },
    {
      id: "theme-dark",
      label: "Dark",
      icon: <Moon className="h-4 w-4" />,
      onClick: () => setTheme("dark"),
    },
    {
      id: "theme-system",
      label: "System",
      icon: <Monitor className="h-4 w-4" />,
      onClick: () => setTheme("system"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      onClick: () => {
        onClose();
        navigateToProfile(navigate, "/profile");
      },
    },
    {
      id: "feed",
      label: "Feed",
      icon: <LayoutList className="h-4 w-4" />,
      onClick: () => {
        onClose();
        navigateWithTransition(navigate, "/feed");
      },
    },
    {
      id: "add-match",
      label: "Add Match",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => {
        onClose();
        navigateWithTransition(navigate, "/record-match");
      },
    },
    {
      id: "about",
      label: "About",
      icon: <Info className="h-4 w-4" />,
      onClick: () => {
        onClose();
        navigateWithTransition(navigate, "/about");
      },
    },
    {
      id: "logout",
      label: "Log out",
      icon: <LogOut className="h-4 w-4" />,
      onClick: () => {
        onClose();
        authLogout();
        navigateWithTransition(navigate, "/login");
      },
      color: "text-red-600",
    },
  ];

  if (!isInstalled && canInstall) {
    menuActions.splice(3, 0, {
      id: "install",
      label: "Install App",
      icon: <Download className="h-4 w-4" />,
      onClick: triggerInstall,
    });
  }

  // Filter actions and friends based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return menuActions;
    return menuActions.filter(action =>
      action.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [menuActions, query]);

  const filteredFriends = useMemo(() => {
    if (!query.trim()) return friends;
    return friends.filter(friend =>
      friend.fullName.toLowerCase().includes(query.toLowerCase())
    );
  }, [friends, query]);

  // Search players
  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setHits([]);
        return;
      }

      try {
        const body = {
          offset: 0,
          limit: 25,
          query,
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
          (hit: any) => ({
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
        setHits(newHits);
      } catch {
        setHits([]);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, userLatLng]);

  const formatRating = (value: unknown): string => {
    if (value == null) return "-";
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toFixed(3) : "-";
    }
    const text = String(value).trim();
    return text.length > 0 && text !== "NR" ? text : "-";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col safe-area-inset-top">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search actions, friends, or players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 pr-4 h-12 text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Actions Section */}
        {(filteredActions.length > 0 || query.trim()) && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {query.trim() ? `Actions matching "${query}"` : "Quick Actions"}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg transition-colors hover:bg-accent min-w-[80px] ${
                    action.color ? action.color : 'text-foreground'
                  }`}
                >
                  {action.icon}
                  <span className="text-xs text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Friends Section */}
        {(filteredFriends.length > 0 || (!query.trim() && friends.length > 0)) && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {query.trim() ? `Friends matching "${query}"` : "Friends"}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {loadingFriends ? (
                <div className="flex gap-3">
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
                    onClick={() => {
                      onClose();
                      navigateToProfile(navigate, `/player/${friend.id}`);
                    }}
                    className="flex-shrink-0 text-center group"
                  >
                    <div className="w-16 h-16 mb-2 group-hover:scale-105 transition-transform">
                      <Avatar
                        src={friend.imageUrl}
                        name={friend.fullName}
                        size="lg"
                      />
                    </div>
                    <div className="w-16 min-h-[2.5rem] flex items-center justify-center">
                      <p className="text-xs font-medium text-foreground leading-tight text-center hyphens-auto whitespace-pre-line">
                        {(() => {
                          const words = friend.fullName.split(" ");
                          if (words.length === 1) {
                            if (friend.fullName.length > 4) {
                              const mid = Math.ceil(friend.fullName.length / 2);
                              return (
                                friend.fullName.slice(0, mid) +
                                "\n" +
                                friend.fullName.slice(mid)
                              );
                            }
                            return friend.fullName + "\n ";
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

        {/* Search Results Section */}
        {query.trim() && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Player Results
            </h3>
            {hits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No players found for "{query}"
              </p>
            ) : (
              <div className="space-y-2">
                {hits.map((hit) => (
                  <button
                    key={hit.id}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border cursor-pointer hover:bg-accent"
                    onClick={() => {
                      onClose();
                      navigateToProfile(navigate, `/player/${hit.id}`);
                    }}
                  >
                    <Avatar src={hit.imageUrl} name={hit.fullName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {hit.fullName?.trim().replace(/\s+/g, " ")}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-mono font-medium">
                            {formatRating(hit.ratings?.singles)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <LayoutList className="h-3 w-3" />
                          <span className="font-mono font-medium">
                            {formatRating(hit.ratings?.doubles)}
                          </span>
                        </div>
                        {hit.shortAddress && (
                          <div className="text-xs truncate ml-auto">
                            {hit.shortAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!query.trim() && filteredActions.length === 0 && friends.length === 0 && !loadingFriends && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-2">
              Start typing to search actions, friends, or players
            </p>
            <p className="text-sm text-muted-foreground">
              Use the search bar above to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;