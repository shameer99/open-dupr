import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { useHeader } from "@/lib/header-context";
import { MatchScoreDisplay } from "@/components/player/shared/MatchDisplay";
import { getDisplayName } from "@/components/player/shared/match-utils";
import { extractApiErrorMessage } from "@/lib/utils";
import {
  saveMatch,
  type SaveMatchRequestBody,
  getMyProfile,
  searchPlayers,
  getFollowers,
  getFollowing,
  getMyMatchHistory,
  type PlayerSearchHit,
} from "@/lib/api";

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Player {
  id: number;
  fullName: string;
  imageUrl?: string;
}

interface PlayerSlotProps {
  player: Player | null;
  onPlayerSelect: (player: Player | null) => void;
  myId?: number;
  canRemove?: boolean;
  label?: string;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({
  player,
  onPlayerSelect,
  myId,
  canRemove = true,
  label = "Add Player",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchHit[]>([]);
  const [friends, setFriends] = useState<PlayerSearchHit[]>([]);
  const [recentOpponents, setRecentOpponents] = useState<PlayerSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load friends (followers + following)
  const loadFriends = useCallback(async () => {
    if (!myId) return;
    setIsLoadingFriends(true);
    try {
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
            } as PlayerSearchHit)
        );

      setFriends(combined);
    } catch {
      // Error handling intentionally silent
    } finally {
      setIsLoadingFriends(false);
    }
  }, [myId]);

  // Load recent opponents from match history
  const loadRecentOpponents = useCallback(async () => {
    if (!myId) return;
    setIsLoadingRecent(true);
    try {
      const response = await getMyMatchHistory(0, 20);
      const matches = response?.result?.hits || [];

      const opponentIds = new Set<number>();
      const recentPlayers: PlayerSearchHit[] = [];

      for (const match of matches) {
        if (match.team1?.player1 && match.team1.player1 !== myId) {
          if (!opponentIds.has(match.team1.player1)) {
            opponentIds.add(match.team1.player1);
            recentPlayers.push({
              id: match.team1.player1,
              fullName: match.team1.player1Name || "Unknown Player",
              imageUrl: match.team1.player1Image,
            });
          }
        }
        if (match.team1?.player2 && match.team1.player2 !== myId) {
          if (!opponentIds.has(match.team1.player2)) {
            opponentIds.add(match.team1.player2);
            recentPlayers.push({
              id: match.team1.player2,
              fullName: match.team1.player2Name || "Unknown Player",
              imageUrl: match.team1.player2Image,
            });
          }
        }
        if (match.team2?.player1 && match.team2.player1 !== myId) {
          if (!opponentIds.has(match.team2.player1)) {
            opponentIds.add(match.team2.player1);
            recentPlayers.push({
              id: match.team2.player1,
              fullName: match.team2.player1Name || "Unknown Player",
              imageUrl: match.team2.player1Image,
            });
          }
        }
        if (match.team2?.player2 && match.team2.player2 !== myId) {
          if (!opponentIds.has(match.team2.player2)) {
            opponentIds.add(match.team2.player2);
            recentPlayers.push({
              id: match.team2.player2,
              fullName: match.team2.player2Name || "Unknown Player",
              imageUrl: match.team2.player2Image,
            });
          }
        }
      }

      setRecentOpponents(recentPlayers.slice(0, 10));
    } catch {
      // Error handling intentionally silent
    } finally {
      setIsLoadingRecent(false);
    }
  }, [myId]);

  useEffect(() => {
    loadFriends();
    loadRecentOpponents();
  }, [loadFriends, loadRecentOpponents]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        let userLat: number | undefined;
        let userLng: number | undefined;
        try {
          const profile = await getMyProfile();
          const addr = profile?.result?.addresses?.[0];
          if (
            typeof addr?.latitude === "number" &&
            typeof addr?.longitude === "number"
          ) {
            userLat = addr.latitude;
            userLng = addr.longitude;
          }
        } catch {
          // ignore, will use fallback coordinates
        }

        const response = await searchPlayers({
          offset: 0,
          limit: 10,
          query: query.trim(),
          filter: {
            lat: userLat ?? 30.2672,
            lng: userLng ?? -97.7431,
            radiusInMeters: 5_000_000,
            rating: { min: 1.0, max: 8.0 },
          },
          includeUnclaimedPlayers: false,
        });

        const results = (response?.result?.hits || []) as PlayerSearchHit[];
        setSearchResults(
          results.filter((player: PlayerSearchHit) => player.id !== myId)
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [myId]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) {
      return friends;
    }
    return friends.filter((friend) =>
      friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  const handlePlayerClick = (playerData: PlayerSearchHit) => {
    onPlayerSelect({
      id: playerData.id,
      fullName: playerData.fullName,
      imageUrl: playerData.imageUrl,
    });
    setShowModal(false);
    setSearchQuery("");
  };

  const handleRemove = () => {
    onPlayerSelect(null);
  };

  // Get contextual title based on label
  const getModalTitle = () => {
    if (label.includes("Teammate")) return "Add Teammate";
    if (label.includes("Opponent")) return "Add Opponent";
    return "Add Player";
  };

  if (player) {
    return (
      <div className="flex flex-col items-center space-y-3 relative">
        <div className="relative">
          <Avatar src={player.imageUrl} name={player.fullName} size="lg" />
          {canRemove && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--destructive)" }}
            >
              ×
            </button>
          )}
        </div>
        <div className="min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center">
          <span className="text-sm sm:text-base font-bold text-foreground text-center leading-tight hyphens-auto whitespace-pre-line">
            {(() => {
              const words = player.fullName.split(" ");
              if (words.length === 1) {
                // Single word: split in middle if long enough
                if (player.fullName.length > 4) {
                  const mid = Math.ceil(player.fullName.length / 2);
                  return (
                    player.fullName.slice(0, mid) +
                    "\n" +
                    player.fullName.slice(mid)
                  );
                }
                return player.fullName + "\n ";
              } else if (words.length === 2) {
                // Two words: put each on separate line
                return words[0] + "\n" + words[1];
              } else {
                // Multiple words: put first word on first line, rest on second
                return words[0] + "\n" + words.slice(1).join(" ");
              }
            })()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center space-y-3 relative">
        <button
          onClick={() => setShowModal(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed transition-colors flex items-center justify-center hover:bg-accent bg-muted/25"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-muted-foreground text-xl sm:text-2xl">+</span>
        </button>
        <span className="text-xs sm:text-sm text-muted-foreground text-center leading-tight">
          {label}
        </span>
      </div>

      {/* Player Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col safe-area-inset-top">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-foreground">
                {getModalTitle()}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-muted/30"
              >
                <span className="text-muted-foreground text-xl">×</span>
              </button>
            </div>
          </div>

          {/* Search Box with Icon */}
          <div className="p-6 border-b border-border">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                placeholder="Search for player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-11 text-base sm:text-lg h-12 sm:h-14 ${
                  searchQuery.trim() ? "pr-10" : ""
                }`}
                autoFocus
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground hover:opacity-80 transition-colors"
                  type="button"
                  aria-label="Clear search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Friends - Show when there are filtered friends or when search is empty */}
            {filteredFriends.length > 0 && (
              <div className="p-6 border-b border-border">
                <h4 className="text-base font-medium text-foreground mb-4">
                  {searchQuery.trim()
                    ? `Friends matching "${searchQuery}"`
                    : "Friends"}
                </h4>
                <div className="flex space-x-4 sm:space-x-5 overflow-x-auto pb-2 -mx-6 px-6">
                  {isLoadingFriends ? (
                    <div className="flex space-x-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full animate-pulse mb-2 bg-muted" />
                          <div className="w-16 sm:w-20 h-3 rounded animate-pulse bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredFriends.map((playerData) => (
                      <button
                        key={playerData.id}
                        type="button"
                        className="flex-shrink-0 text-center group"
                        onClick={() => handlePlayerClick(playerData)}
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 group-hover:scale-105 transition-transform">
                          <Avatar
                            src={playerData.imageUrl}
                            name={playerData.fullName}
                            size="lg"
                          />
                        </div>
                        <div className="w-16 sm:w-20 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center">
                          <p className="text-xs sm:text-sm font-medium text-foreground leading-tight text-center hyphens-auto whitespace-pre-line">
                            {(() => {
                              const words = playerData.fullName.split(" ");
                              if (words.length === 1) {
                                // Single word: split in middle if long enough
                                if (playerData.fullName.length > 4) {
                                  const mid = Math.ceil(
                                    playerData.fullName.length / 2
                                  );
                                  return (
                                    playerData.fullName.slice(0, mid) +
                                    "\n" +
                                    playerData.fullName.slice(mid)
                                  );
                                }
                                return playerData.fullName + "\n ";
                              } else if (words.length === 2) {
                                // Two words: put each on separate line
                                return words[0] + "\n" + words[1];
                              } else {
                                // Multiple words: put first word on first line, rest on second
                                return (
                                  words[0] + "\n" + words.slice(1).join(" ")
                                );
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

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="p-6 border-b border-border">
                <h4 className="text-base font-medium text-foreground mb-4">
                  Search Results
                </h4>
                {isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((playerData) => (
                      <button
                        key={playerData.id}
                        type="button"
                        className="w-full flex items-center space-x-4 p-4 rounded-xl transition-colors text-left hover:bg-accent"
                        onClick={() => handlePlayerClick(playerData)}
                      >
                        <Avatar
                          src={playerData.imageUrl}
                          name={playerData.fullName}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-base">
                            {playerData.fullName}
                          </p>
                          {playerData.location && (
                            <p className="text-sm text-muted-foreground truncate">
                              {playerData.location}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No players found
                  </div>
                )}
              </div>
            )}

            {/* Recent Opponents - Only show when no search query */}
            {!searchQuery.trim() && recentOpponents.length > 0 && (
              <div className="p-6 border-b border-border">
                <h4 className="text-base font-medium text-foreground mb-4">
                  Recent Opponents
                </h4>
                <div className="flex space-x-4 sm:space-x-5 overflow-x-auto pb-2 -mx-6 px-6">
                  {isLoadingRecent ? (
                    <div className="flex space-x-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full animate-pulse mb-2 bg-muted" />
                          <div className="w-16 sm:w-20 h-3 rounded animate-pulse bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    recentOpponents.map((playerData) => (
                      <button
                        key={playerData.id}
                        type="button"
                        className="flex-shrink-0 text-center group"
                        onClick={() => handlePlayerClick(playerData)}
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 group-hover:scale-105 transition-transform">
                          <Avatar
                            src={playerData.imageUrl}
                            name={playerData.fullName}
                            size="lg"
                          />
                        </div>
                        <div className="w-16 sm:w-20 min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center">
                          <p className="text-xs sm:text-sm font-medium text-foreground leading-tight text-center hyphens-auto whitespace-pre-line">
                            {(() => {
                              const words = playerData.fullName.split(" ");
                              if (words.length === 1) {
                                // Single word: split in middle if long enough
                                if (playerData.fullName.length > 4) {
                                  const mid = Math.ceil(
                                    playerData.fullName.length / 2
                                  );
                                  return (
                                    playerData.fullName.slice(0, mid) +
                                    "\n" +
                                    playerData.fullName.slice(mid)
                                  );
                                }
                                return playerData.fullName + "\n ";
                              } else if (words.length === 2) {
                                // Two words: put each on separate line
                                return words[0] + "\n" + words[1];
                              } else {
                                // Multiple words: put first word on first line, rest on second
                                return (
                                  words[0] + "\n" + words.slice(1).join(" ")
                                );
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

            {/* Empty State - Show when no search query and no content */}
            {!searchQuery.trim() &&
              filteredFriends.length === 0 &&
              recentOpponents.length === 0 &&
              !isLoadingFriends &&
              !isLoadingRecent && (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No recent players or friends found</p>
                  <p className="text-sm mt-1">
                    Try searching for a player above
                  </p>
                </div>
              )}

            {/* No friends match search */}
            {searchQuery.trim() &&
              filteredFriends.length === 0 &&
              searchResults.length === 0 &&
              !isSearching && (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No friends or players found matching "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full h-12 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

interface ScoreInputProps {
  value: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
  max?: number;
  layout?: "horizontal" | "vertical";
}

const ScoreInput: React.FC<ScoreInputProps> = ({
  value,
  onChange,
  max = 999,
  layout = "horizontal",
}) => {
  const holdIntervalRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const currentActionRef = useRef<(() => void) | null>(null);

  const handleIncrement = () => {
    onChange((prev) => (prev < max ? prev + 1 : prev));
  };

  const handleDecrement = () => {
    onChange((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const stopHold = () => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    currentActionRef.current = null;
  };

  const startHold = (action: () => void) => {
    currentActionRef.current = action;
    // Start repeating after a short delay to avoid double-firing with onClick
    holdTimeoutRef.current = window.setTimeout(() => {
      // Run once when hold engages, then repeat
      currentActionRef.current?.();
      holdIntervalRef.current = window.setInterval(() => {
        currentActionRef.current?.();
      }, 120);
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!/^\d*$/.test(inputValue)) return;
    const parsed = parseInt(inputValue);
    const newValue = Number.isNaN(parsed) ? 0 : parsed;
    if (newValue < 0) return;
    onChange(() => (newValue > max ? max : newValue));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused for easy overwriting
    e.target.select();
  };

  if (layout === "vertical") {
    return (
      <div className="flex flex-col items-center space-y-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-10 h-10 rounded-full p-0 text-lg font-bold select-none text-muted-foreground bg-muted/20"
          onClick={handleIncrement}
          onMouseDown={(e) => {
            e.preventDefault();
            startHold(handleIncrement);
          }}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={(e) => {
            e.preventDefault();
            startHold(handleIncrement);
          }}
          onTouchEnd={stopHold}
          onTouchCancel={stopHold}
          disabled={value >= max}
        >
          +
        </Button>

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-16 h-16 text-3xl font-bold text-center border-2 rounded-xl bg-background focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-border"
          inputMode="numeric"
          pattern="[0-9]*"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-10 h-10 rounded-full p-0 text-lg font-bold select-none text-muted-foreground bg-muted/20"
          onClick={handleDecrement}
          onMouseDown={(e) => {
            e.preventDefault();
            startHold(handleDecrement);
          }}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={(e) => {
            e.preventDefault();
            startHold(handleDecrement);
          }}
          onTouchEnd={stopHold}
          onTouchCancel={stopHold}
          disabled={value <= 0}
        >
          −
        </Button>
      </div>
    );
  }

  // Default horizontal layout (mobile)
  return (
    <div className="flex items-center space-x-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-12 h-12 rounded-full p-0 text-2xl font-bold select-none text-muted-foreground bg-muted/20"
        onClick={handleDecrement}
        onMouseDown={(e) => {
          e.preventDefault();
          startHold(handleDecrement);
        }}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={(e) => {
          e.preventDefault();
          startHold(handleDecrement);
        }}
        onTouchEnd={stopHold}
        onTouchCancel={stopHold}
        disabled={value <= 0}
      >
        −
      </Button>

      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        className="w-20 h-20 text-4xl font-bold text-center border-2 rounded-xl bg-background focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-border"
        inputMode="numeric"
        pattern="[0-9]*"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-12 h-12 rounded-full p-0 text-2xl font-bold select-none text-muted-foreground bg-muted/20"
        onClick={handleIncrement}
        onMouseDown={(e) => {
          e.preventDefault();
          startHold(handleIncrement);
        }}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={(e) => {
          e.preventDefault();
          startHold(handleIncrement);
        }}
        onTouchEnd={stopHold}
        onTouchCancel={stopHold}
        disabled={value >= max}
      >
        +
      </Button>
    </div>
  );
};

const RecordMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    setTitle,
    setShowBackButton,
    setOnBackClick,
    setActionButton,
    setShowHamburgerMenu,
  } = useHeader();
  const [eventDate, setEventDate] = useState<string>(todayStr());
  const [eventName, setEventName] = useState<string>("");
  const [myTeammate, setMyTeammate] = useState<Player | null>(null);
  const [opponent1, setOpponent1] = useState<Player | null>(null);
  const [opponent2, setOpponent2] = useState<Player | null>(null);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Player | undefined>();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);

  const format = useMemo(() => {
    const hasMyTeammate = myTeammate !== null;
    const hasOpponent2 = opponent2 !== null;
    return hasMyTeammate || hasOpponent2 ? "DOUBLES" : "SINGLES";
  }, [myTeammate, opponent2]);

  const canSubmit = useMemo(() => {
    const hasOpponent = opponent1 !== null;
    const hasScore = myScore > 0 || opponentScore > 0;

    if (format === "SINGLES") {
      return hasOpponent && hasScore;
    } else {
      const hasAllPlayers = myTeammate !== null && opponent2 !== null;
      return hasOpponent && hasAllPlayers && hasScore;
    }
  }, [opponent1, myTeammate, opponent2, myScore, opponentScore, format]);

  const hasAnyInput = useMemo(() => {
    return (
      eventName.trim() !== "" ||
      myTeammate !== null ||
      opponent1 !== null ||
      opponent2 !== null ||
      myScore > 0 ||
      opponentScore > 0
    );
  }, [eventName, myTeammate, opponent1, opponent2, myScore, opponentScore]);

  const handleBackClick = useCallback(() => {
    if (hasAnyInput) {
      if (
        confirm(
          "Are you sure you want to leave? Any unsaved changes will be lost."
        )
      ) {
        navigate("/profile");
      }
    } else {
      navigate("/profile");
    }
  }, [hasAnyInput, navigate]);

  const handleSave = useCallback(() => {
    if (canSubmit) {
      setError(null);
      setShowConfirmation(true);
    }
  }, [canSubmit]);

  // Effect for setting up and tearing down header elements on mount/unmount
  useEffect(() => {
    setTitle("New Match");
    setShowBackButton(true);
    setShowHamburgerMenu(false);

    // Cleanup on unmount
    return () => {
      setTitle(null);
      setShowBackButton(false);
      setShowHamburgerMenu(true);
      setOnBackClick(undefined);
      setActionButton(undefined);
    };
  }, [
    setTitle,
    setShowBackButton,
    setShowHamburgerMenu,
    setOnBackClick,
    setActionButton,
  ]);

  // Effect for updating the handlers/button when their dependencies change
  useEffect(() => {
    setOnBackClick(() => handleBackClick);
    setActionButton({
      text: "Save",
      onClick: handleSave,
      disabled: !canSubmit || isSubmitting,
    });
  }, [
    setOnBackClick,
    handleBackClick,
    setActionButton,
    handleSave,
    canSubmit,
    isSubmitting,
  ]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getMyProfile();
        const profile = data?.result;
        if (!cancelled && profile) {
          const myPlayer: Player = {
            id: profile.id,
            fullName: profile.fullName,
            imageUrl: profile.imageUrl,
          };
          setMyProfile(myPlayer);
        }
      } catch {
        // Error handling intentionally silent
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async () => {
    if (!myProfile || !opponent1) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const myTeamWon = myScore > opponentScore;
      const body: SaveMatchRequestBody = {
        eventDate,
        location: "",
        event: eventName.trim() || undefined,
        matchType: "SIDE_ONLY",
        format,
        notify: true,
        scores: [{ first: myScore, second: opponentScore }],
        team1: {
          player1: myProfile.id,
          player2: format === "DOUBLES" && myTeammate ? myTeammate.id : "",
          game1: myScore,
          game2: -1,
          game3: -1,
          game4: -1,
          game5: -1,
          winner: myTeamWon,
        },
        team2: {
          player1: opponent1.id,
          player2: format === "DOUBLES" && opponent2 ? opponent2.id : "",
          game1: opponentScore,
          game2: -1,
          game3: -1,
          game4: -1,
          game5: -1,
          winner: !myTeamWon,
        },
      };

      await saveMatch(body);
      navigate("/profile");
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, "Failed to save match"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto lg:max-w-4xl space-y-6 sm:space-y-7">
        <div className="space-y-6">
          <div>
            <Input
              id="eventName"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (optional)"
              className="w-full h-12 text-base"
            />
          </div>

          {/* Mobile Layout - Stacked */}
          <div className="lg:hidden space-y-4">
            <div className="flex justify-center space-x-4 sm:space-x-5">
              {myProfile && (
                <PlayerSlot
                  player={myProfile}
                  onPlayerSelect={() => {}}
                  canRemove={false}
                />
              )}
              <PlayerSlot
                player={myTeammate}
                onPlayerSelect={setMyTeammate}
                myId={myProfile?.id}
                label="Add Teammate"
              />
            </div>

            <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4">
              <div className="flex flex-col space-y-4 justify-center items-center">
                <ScoreInput
                  value={myScore}
                  onChange={setMyScore}
                  layout="horizontal"
                />
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground select-none">
                  VS
                </div>
                <ScoreInput
                  value={opponentScore}
                  onChange={setOpponentScore}
                  layout="horizontal"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4 sm:space-x-5">
              <PlayerSlot
                player={opponent1}
                onPlayerSelect={setOpponent1}
                myId={myProfile?.id}
                label="Add Opponent"
              />
              <PlayerSlot
                player={opponent2}
                onPlayerSelect={setOpponent2}
                myId={myProfile?.id}
                label="Add Opponent"
              />
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-12 lg:items-start">
            {/* Team 1 - Left Side */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  My Team
                </h3>
              </div>
              <div className="flex flex-col items-center space-y-6">
                {myProfile && (
                  <PlayerSlot
                    player={myProfile}
                    onPlayerSelect={() => {}}
                    canRemove={false}
                  />
                )}
                <PlayerSlot
                  player={myTeammate}
                  onPlayerSelect={setMyTeammate}
                  myId={myProfile?.id}
                  label="Add Teammate"
                />
              </div>
            </div>

            {/* Scores - Center */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Score
                </h3>
              </div>
              <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-7">
                <div className="flex items-center space-x-10">
                  <ScoreInput
                    value={myScore}
                    onChange={setMyScore}
                    layout="vertical"
                  />
                  <div className="text-4xl font-bold text-muted-foreground select-none">
                    VS
                  </div>
                  <ScoreInput
                    value={opponentScore}
                    onChange={setOpponentScore}
                    layout="vertical"
                  />
                </div>
              </div>
            </div>

            {/* Team 2 - Right Side */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Opponents
                </h3>
              </div>
              <div className="flex flex-col items-center space-y-6">
                <PlayerSlot
                  player={opponent1}
                  onPlayerSelect={setOpponent1}
                  myId={myProfile?.id}
                  label="Add Opponent"
                />
                <PlayerSlot
                  player={opponent2}
                  onPlayerSelect={setOpponent2}
                  myId={myProfile?.id}
                  label="Add Opponent"
                />
              </div>
            </div>
          </div>
        </div>

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-xl p-7 max-w-md w-full">
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                Confirm Match
              </h3>

              {error && (
                <div
                  className="rounded-lg p-3 text-base mb-4"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--destructive) 10%, transparent)",
                    border:
                      "1px solid color-mix(in oklab, var(--destructive) 25%, transparent)",
                    color: "var(--destructive)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Match Card Style Display */}
              <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-5 mb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-medium"
                      style={{
                        backgroundColor:
                          "color-mix(in oklab, var(--warning) 20%, transparent)",
                        color: "var(--warning-foreground)",
                      }}
                    >
                      Pending
                    </span>
                    {isEditingDate ? (
                      <Input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        onBlur={() => setIsEditingDate(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            setIsEditingDate(false);
                          }
                        }}
                        className="h-7 text-sm w-auto"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setIsEditingDate(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      >
                        {eventDate}
                      </button>
                    )}
                  </div>
                  {eventName.trim() && (
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-foreground">
                        {eventName}
                      </h4>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
                    {/* My Team */}
                    <div
                      className="min-w-0 md:justify-self-start"
                      style={{
                        color:
                          myScore > opponentScore
                            ? "var(--success)"
                            : "var(--destructive)",
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex -space-x-2">
                          {myProfile && (
                            <Avatar
                              src={myProfile.imageUrl}
                              name={myProfile.fullName}
                              size="sm"
                              className="ring-2 ring-background"
                            />
                          )}
                          {myTeammate && (
                            <Avatar
                              src={myTeammate.imageUrl}
                              name={myTeammate.fullName}
                              size="sm"
                              className="ring-2 ring-background"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium truncate text-base">
                            {myTeammate
                              ? `${getDisplayName(
                                  myProfile?.fullName || ""
                                )} & ${getDisplayName(myTeammate.fullName)}`
                              : getDisplayName(myProfile?.fullName || "")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <MatchScoreDisplay
                        games={[{ a: myScore, b: opponentScore }]}
                        size="small"
                      />
                    </div>

                    {/* Opponent Team */}
                    <div
                      className="min-w-0 self-end md:justify-self-end"
                      style={{
                        color:
                          opponentScore > myScore
                            ? "var(--success)"
                            : "var(--destructive)",
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="font-medium truncate text-base">
                            {opponent2
                              ? `${getDisplayName(
                                  opponent1?.fullName || ""
                                )} & ${getDisplayName(opponent2.fullName)}`
                              : getDisplayName(opponent1?.fullName || "")}
                          </span>
                        </div>
                        <div className="flex -space-x-2">
                          {opponent1 && (
                            <Avatar
                              src={opponent1.imageUrl}
                              name={opponent1.fullName}
                              size="sm"
                              className="ring-2 ring-background"
                            />
                          )}
                          {opponent2 && (
                            <Avatar
                              src={opponent2.imageUrl}
                              name={opponent2.fullName}
                              size="sm"
                              className="ring-2 ring-background"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConfirmation(false);
                    setError(null);
                  }}
                  className="flex-1 h-12 text-base"
                  disabled={isSubmitting}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={onSubmit}
                  className="flex-1 h-12 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordMatchPage;
