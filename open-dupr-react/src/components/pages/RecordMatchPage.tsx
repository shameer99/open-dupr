import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Avatar from "@/components/ui/avatar";
import {
  saveMatch,
  type SaveMatchRequestBody,
  getMyProfile,
  searchPlayers,
  getFollowers,
  getFollowing,
  type PlayerSearchHit,
} from "@/lib/api";

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Player {
  id: number;
  fullName: string;
  imageUrl?: string;
}

interface TeamSelectorProps {
  players: (Player | null)[];
  onPlayerSelect: (index: number, player: Player | null) => void;
  maxPlayers: number;
  teamLabel: string;
  myId?: number;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  players,
  onPlayerSelect,
  maxPlayers,
  teamLabel,
  myId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<PlayerSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(
    null
  );

  const loadSuggestions = useCallback(async () => {
    if (!myId) return;
    try {
      const [followersResp, followingResp] = await Promise.all([
        getFollowers(myId, 0, 10),
        getFollowing(myId, 0, 10),
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

      setSuggestions(combined);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  }, [myId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

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
      } catch (error) {
        console.error("Search failed:", error);
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

  const handlePlayerClick = (player: PlayerSearchHit) => {
    if (activePlayerIndex !== null) {
      onPlayerSelect(activePlayerIndex, {
        id: player.id,
        fullName: player.fullName,
        imageUrl: player.imageUrl,
      });
      setActivePlayerIndex(null);
      setShowDropdown(false);
      setSearchQuery("");
    }
  };

  const handleAddPlayer = (index: number) => {
    setActivePlayerIndex(index);
    setShowDropdown(true);
  };

  const handleRemovePlayer = (index: number) => {
    onPlayerSelect(index, null);
  };

  const displayResults = searchQuery.trim() ? searchResults : suggestions;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{teamLabel}</h3>

      <div className="space-y-3">
        {Array.from({ length: maxPlayers }, (_, index) => {
          const player = players[index];
          const isAddingPlayer = activePlayerIndex === index && showDropdown;

          return (
            <div key={index} className="relative">
              {player ? (
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={player.imageUrl}
                      name={player.fullName}
                      size="sm"
                    />
                    <span className="font-medium text-gray-800">
                      {player.fullName}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePlayer(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddPlayer(index)}
                  className="w-full flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-lg font-bold">+</span>
                  </div>
                  <span className="text-gray-500 font-medium">
                    {index === 0 && teamLabel === "Your Team"
                      ? "Add Teammate"
                      : "Add Opponent"}
                  </span>
                </button>
              )}

              {isAddingPlayer && (
                <Card className="absolute z-10 w-full mt-2 max-h-64 overflow-y-auto bg-white shadow-lg">
                  <div className="p-3 border-b">
                    <Input
                      placeholder="Search for player..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                  </div>

                  {isSearching && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Searching...
                    </div>
                  )}

                  {!isSearching &&
                    displayResults.length === 0 &&
                    searchQuery.trim() && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        No players found
                      </div>
                    )}

                  {!searchQuery.trim() && suggestions.length > 0 && (
                    <div className="p-2 text-xs font-medium text-gray-500 border-b bg-gray-50">
                      From your network
                    </div>
                  )}

                  {displayResults.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => handlePlayerClick(player)}
                    >
                      <Avatar
                        src={player.imageUrl}
                        name={player.fullName}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {player.fullName}
                        </p>
                        {player.location && (
                          <p className="text-xs text-gray-500 truncate">
                            {player.location}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                  <div className="p-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActivePlayerIndex(null);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= 0 && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-10 h-10 rounded-full p-0"
        onClick={handleDecrement}
        disabled={value <= 0}
      >
        <span className="text-lg font-bold">−</span>
      </Button>

      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        className="w-16 h-16 text-3xl font-bold text-center border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        min="0"
        max={max}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-10 h-10 rounded-full p-0"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <span className="text-lg font-bold">+</span>
      </Button>
    </div>
  );
};

const RecordMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [eventDate, setEventDate] = useState<string>(todayStr());
  const [format, setFormat] = useState<"SINGLES" | "DOUBLES">("SINGLES");
  const [team1, setTeam1] = useState<(Player | null)[]>([null, null]);
  const [team2, setTeam2] = useState<(Player | null)[]>([null, null]);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Player | undefined>();

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
          setTeam1([myPlayer, null]);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTeam1PlayerSelect = (index: number, player: Player | null) => {
    const newTeam1 = [...team1];
    newTeam1[index] = player;
    setTeam1(newTeam1);

    // Auto-switch to doubles if adding a teammate
    if (index === 1 && player && format === "SINGLES") {
      setFormat("DOUBLES");
    }
  };

  const handleTeam2PlayerSelect = (index: number, player: Player | null) => {
    const newTeam2 = [...team2];
    newTeam2[index] = player;
    setTeam2(newTeam2);
  };

  const handleFormatChange = (newFormat: "SINGLES" | "DOUBLES") => {
    setFormat(newFormat);
    if (newFormat === "SINGLES") {
      // Remove teammates when switching to singles
      setTeam1([team1[0], null]);
      setTeam2([team2[0], null]);
    }
  };

  const canProceedToStep2 = useMemo(() => {
    const hasOpponent = team2[0] !== null;
    if (format === "SINGLES") {
      return hasOpponent;
    } else {
      const hasMyTeammate = team1[1] !== null;
      const hasOpponentTeammate = team2[1] !== null;
      return hasOpponent && hasMyTeammate && hasOpponentTeammate;
    }
  }, [team1, team2, format]);

  const canSubmit = useMemo(() => {
    return team1Score > 0 || team2Score > 0;
  }, [team1Score, team2Score]);

  const onSubmit = async () => {
    if (!myProfile || !team2[0]) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const team1Won = team1Score > team2Score;
      const body: SaveMatchRequestBody = {
        event: "Open DUPR match",
        eventDate,
        location: "",
        matchType: "SIDE_ONLY",
        format,
        notify: true,
        scores: [{ first: team1Score, second: team2Score }],
        team1: {
          player1: myProfile.id,
          player2: format === "DOUBLES" && team1[1] ? team1[1].id : "",
          game1: team1Score,
          game2: -1,
          game3: -1,
          game4: -1,
          game5: -1,
          winner: team1Won,
        },
        team2: {
          player1: team2[0].id,
          player2: format === "DOUBLES" && team2[1] ? team2[1].id : "",
          game1: team2Score,
          game2: -1,
          game3: -1,
          game4: -1,
          game5: -1,
          winner: !team1Won,
        },
      };

      await saveMatch(body);
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save match");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamDisplay = (team: (Player | null)[]) => {
    const activePlayers = team.filter((p) => p !== null) as Player[];
    if (activePlayers.length === 0) return "No players";
    if (activePlayers.length === 1) return activePlayers[0].fullName;
    return activePlayers.map((p) => p.fullName.split(" ")[0]).join(" + ");
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Match</h1>
            <p className="text-gray-600">Step 1 of 2</p>
          </div>

          <Card className="p-6 space-y-6 bg-white shadow-sm">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="eventDate"
                className="text-sm font-medium text-gray-700"
              >
                Match Date
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Format
              </Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleFormatChange("SINGLES")}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    format === "SINGLES"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Singles
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatChange("DOUBLES")}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    format === "DOUBLES"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Doubles
                </button>
              </div>
            </div>

            <TeamSelector
              players={team1}
              onPlayerSelect={handleTeam1PlayerSelect}
              maxPlayers={format === "SINGLES" ? 1 : 2}
              teamLabel="Your Team"
              myId={myProfile?.id}
            />

            <TeamSelector
              players={team2}
              onPlayerSelect={handleTeam2PlayerSelect}
              maxPlayers={format === "SINGLES" ? 1 : 2}
              teamLabel="Opponent Team"
              myId={myProfile?.id}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canProceedToStep2}
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Match Score</h1>
          <p className="text-gray-600">Step 2 of 2</p>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Team 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex -space-x-2">
                  {team1
                    .filter((p) => p !== null)
                    .map((player, idx) => (
                      <Avatar
                        key={player!.id}
                        src={player!.imageUrl}
                        name={player!.fullName}
                        size="sm"
                        className={idx > 0 ? "border-2 border-white" : ""}
                      />
                    ))}
                </div>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {getTeamDisplay(team1)}
                </span>
              </div>
              <ScoreInput value={team1Score} onChange={setTeam1Score} />
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200"></div>

            {/* Team 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex -space-x-2">
                  {team2
                    .filter((p) => p !== null)
                    .map((player, idx) => (
                      <Avatar
                        key={player!.id}
                        src={player!.imageUrl}
                        name={player!.fullName}
                        size="sm"
                        className={idx > 0 ? "border-2 border-white" : ""}
                      />
                    ))}
                </div>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {getTeamDisplay(team2)}
                </span>
              </div>
              <ScoreInput value={team2Score} onChange={setTeam2Score} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={onSubmit}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Match"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecordMatchPage;
