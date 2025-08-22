import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        const response = await searchPlayers({
          offset: 0,
          limit: 10,
          query: query.trim(),
          filter: {
            lat: 30.2672,
            lng: -97.7431,
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
      <div className="flex flex-col items-center space-y-2 relative">
        <div className="relative">
          <Avatar src={player.imageUrl} name={player.fullName} size="lg" />
          {canRemove && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>
        <div className="min-h-[2.5rem] flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 text-center leading-tight hyphens-auto whitespace-pre-line">
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
          className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center"
        >
          <span className="text-gray-400 text-xl">+</span>
        </button>
        <span className="text-xs text-gray-500 text-center leading-tight">
          {label}
        </span>
      </div>

      {/* Player Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {getModalTitle()}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-600 text-lg">×</span>
              </button>
            </div>
          </div>

          {/* Search Box with Icon */}
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                className="pl-10 text-base h-12"
                autoFocus
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="p-6 border-b border-gray-100">
                {isSearching ? (
                  <div className="text-center py-8 text-gray-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((playerData) => (
                      <button
                        key={playerData.id}
                        type="button"
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        onClick={() => handlePlayerClick(playerData)}
                      >
                        <Avatar
                          src={playerData.imageUrl}
                          name={playerData.fullName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">
                            {playerData.fullName}
                          </p>
                          {playerData.location && (
                            <p className="text-xs text-gray-500 truncate">
                              {playerData.location}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No players found
                  </div>
                )}
              </div>
            )}

            {/* Recent Opponents */}
            {!searchQuery.trim() && recentOpponents.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Recent Opponents
                </h4>
                <div className="flex space-x-4 overflow-x-auto pb-2 -mx-6 px-6">
                  {isLoadingRecent ? (
                    <div className="flex space-x-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-2" />
                          <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
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
                        <div className="w-16 h-16 mb-2 group-hover:scale-105 transition-transform">
                          <Avatar
                            src={playerData.imageUrl}
                            name={playerData.fullName}
                            size="lg"
                          />
                        </div>
                        <div className="w-16 min-h-[2.5rem] flex items-center justify-center">
                          <p className="text-xs font-medium text-gray-900 leading-tight text-center hyphens-auto whitespace-pre-line">
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

            {/* Friends - Horizontal scrolling for mobile space efficiency */}
            {!searchQuery.trim() && friends.length > 0 && (
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Friends
                </h4>
                <div className="flex space-x-4 overflow-x-auto pb-2 -mx-6 px-6">
                  {isLoadingFriends ? (
                    <div className="flex space-x-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-2" />
                          <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    friends.map((playerData) => (
                      <button
                        key={playerData.id}
                        type="button"
                        className="flex-shrink-0 text-center group"
                        onClick={() => handlePlayerClick(playerData)}
                      >
                        <div className="w-16 h-16 mb-2 group-hover:scale-105 transition-transform">
                          <Avatar
                            src={playerData.imageUrl}
                            name={playerData.fullName}
                            size="lg"
                          />
                        </div>
                        <div className="w-16 min-h-[2.5rem] flex items-center justify-center">
                          <p className="text-xs font-medium text-gray-900 leading-tight text-center hyphens-auto whitespace-pre-line">
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

            {/* Empty State */}
            {!searchQuery.trim() &&
              friends.length === 0 &&
              recentOpponents.length === 0 &&
              !isLoadingFriends &&
              !isLoadingRecent && (
                <div className="p-6 text-center text-gray-500">
                  <p>No recent players or friends found</p>
                  <p className="text-sm mt-1">
                    Try searching for a player above
                  </p>
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full"
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
  onChange: (value: number) => void;
  max?: number;
}

const ScoreInput: React.FC<ScoreInputProps> = ({
  value,
  onChange,
  max = 999,
}) => {
  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > 0) onChange(value - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numeric input
    if (!/^\d*$/.test(inputValue)) return;

    const newValue = parseInt(inputValue) || 0;
    if (newValue >= 0 && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused for easy overwriting
    e.target.select();
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-10 h-10 rounded-full p-0 text-lg font-bold text-gray-600 hover:bg-gray-100"
        onClick={handleDecrement}
        disabled={value <= 0}
      >
        −
      </Button>

      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        className="w-16 h-16 text-3xl font-bold text-center border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        inputMode="numeric"
        pattern="[0-9]*"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-10 h-10 rounded-full p-0 text-lg font-bold text-gray-600 hover:bg-gray-100"
        onClick={handleIncrement}
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
  const [myTeammate, setMyTeammate] = useState<Player | null>(null);
  const [opponent1, setOpponent1] = useState<Player | null>(null);
  const [opponent2, setOpponent2] = useState<Player | null>(null);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Player | undefined>();
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      myTeammate !== null ||
      opponent1 !== null ||
      opponent2 !== null ||
      myScore > 0 ||
      opponentScore > 0
    );
  }, [myTeammate, opponent1, opponent2, myScore, opponentScore]);

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-sm mx-auto lg:max-w-4xl space-y-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 md:flex-col md:items-start md:space-x-0 md:space-y-1">
            <Label
              htmlFor="eventDate"
              className="text-sm font-medium text-gray-700 shrink-0 md:mb-0"
            >
              Date
            </Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="flex-1 md:w-full"
            />
          </div>

          {/* Mobile Layout - Stacked */}
          <div className="lg:hidden space-y-4">
            <div className="flex justify-center space-x-4">
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

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex flex-col space-y-3 justify-center items-center">
                <ScoreInput value={myScore} onChange={setMyScore} />
                <div className="text-xl font-bold text-gray-400">VS</div>
                <ScoreInput value={opponentScore} onChange={setOpponentScore} />
              </div>
            </div>

            <div className="flex justify-center space-x-4">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Score
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex flex-col space-y-6 items-center">
                  <ScoreInput value={myScore} onChange={setMyScore} />
                  <div className="text-3xl font-bold text-gray-400">VS</div>
                  <ScoreInput
                    value={opponentScore}
                    onChange={setOpponentScore}
                  />
                </div>
              </div>
            </div>

            {/* Team 2 - Right Side */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Confirm Match
              </h3>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
                  {error}
                </div>
              )}

              {/* Match Card Style Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                    <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 font-medium">
                      Pending
                    </span>
                    <span>{eventDate}</span>
                  </div>

                  <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
                    {/* My Team */}
                    <div
                      className={`${
                        myScore > opponentScore
                          ? "text-emerald-700"
                          : "text-rose-700"
                      } min-w-0 md:justify-self-start`}
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
                          <span className="font-medium truncate">
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
                      className={`${
                        opponentScore > myScore
                          ? "text-emerald-700"
                          : "text-rose-700"
                      } min-w-0 self-end md:justify-self-end`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="font-medium truncate">
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
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={onSubmit}
                  className="flex-1"
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
