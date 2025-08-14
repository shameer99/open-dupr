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
    } catch {
      // Error handling intentionally silent
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
                  {!(teamLabel === "Your Team" && index === 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePlayer(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddPlayer(index)}
                  className="w-full flex items-center space-x-3 p-4 bg-white rounded-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-gray-400 text-xl">+</span>
                  </div>
                  <span className="font-medium text-gray-400">Add Player</span>
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
  const [eventDate, setEventDate] = useState<string>(todayStr());
  const [team1, setTeam1] = useState<(Player | null)[]>([null, null]);
  const [team2, setTeam2] = useState<(Player | null)[]>([null, null]);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Player | undefined>();

  const format = useMemo(() => {
    const team1PlayerCount = team1.filter(Boolean).length;
    const team2PlayerCount = team2.filter(Boolean).length;
    return team1PlayerCount > 1 || team2PlayerCount > 1 ? "DOUBLES" : "SINGLES";
  }, [team1, team2]);

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
      } catch {
        // Error handling intentionally silent
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
  };

  const handleTeam2PlayerSelect = (index: number, player: Player | null) => {
    const newTeam2 = [...team2];
    newTeam2[index] = player;
    setTeam2(newTeam2);
  };

  const canSubmit = useMemo(() => {
    if (team1Score === 0 && team2Score === 0) return false;

    const team1PlayerCount = team1.filter(Boolean).length;
    const team2PlayerCount = team2.filter(Boolean).length;

    if (team1PlayerCount === 0 || team2PlayerCount === 0) return false;
    if (team1PlayerCount !== team2PlayerCount) return false;

    return true;
  }, [team1, team2, team1Score, team2Score]);

  const onSubmit = async () => {
    if (!myProfile || !team2[0]) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const team1Won = team1Score > team2Score;
      const body: SaveMatchRequestBody = {
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Match</h1>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <TeamSelector
            players={team1}
            onPlayerSelect={handleTeam1PlayerSelect}
            maxPlayers={2}
            teamLabel="Your Team"
            myId={myProfile?.id}
          />

          <div className="space-y-6">
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

            <div className="border-t border-gray-200"></div>

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

          <TeamSelector
            players={team2}
            onPlayerSelect={handleTeam2PlayerSelect}
            maxPlayers={2}
            teamLabel="Opponent Team"
            myId={myProfile?.id}
          />

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
