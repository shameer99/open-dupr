import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Avatar from "@/components/ui/avatar";
import { useHeader } from "@/lib/header-context";
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

interface PlayerSlotProps {
  player: Player | null;
  onPlayerSelect: (player: Player | null) => void;
  myId?: number;
  canRemove?: boolean;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({
  player,
  onPlayerSelect,
  myId,
  canRemove = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<PlayerSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handlePlayerClick = (playerData: PlayerSearchHit) => {
    onPlayerSelect({
      id: playerData.id,
      fullName: playerData.fullName,
      imageUrl: playerData.imageUrl,
    });
    setShowDropdown(false);
    setSearchQuery("");
  };

  const handleRemove = () => {
    onPlayerSelect(null);
  };

  const displayResults = searchQuery.trim() ? searchResults : suggestions;

  if (player) {
    return (
      <div className="flex flex-col items-center space-y-3 relative">
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
        <span className="text-sm font-bold text-gray-900 text-center leading-tight">
          {player.fullName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3 relative">
      <button
        onClick={() => setShowDropdown(true)}
        className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center"
      >
        <span className="text-gray-400 text-xl">+</span>
      </button>
      <span className="text-xs text-gray-500 text-center leading-tight">
        Add Player
      </span>

      {showDropdown && (
        <Card className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 max-h-80 overflow-y-auto bg-white shadow-xl z-50 md:absolute md:inset-x-auto md:top-full md:left-1/2 md:-translate-x-1/2 md:translate-y-0 md:mt-2 md:w-72">
          <div className="p-4 border-b">
            <Input
              placeholder="Search for player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          )}

          {!isSearching &&
            displayResults.length === 0 &&
            searchQuery.trim() && (
              <div className="p-4 text-center text-sm text-gray-500">
                No players found
              </div>
            )}

          {!searchQuery.trim() && suggestions.length > 0 && (
            <div className="p-3 text-xs font-medium text-gray-500 border-b bg-gray-50">
              From your network
            </div>
          )}

          {displayResults.map((playerData) => (
            <button
              key={playerData.id}
              type="button"
              className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors text-left"
              onClick={() => handlePlayerClick(playerData)}
            >
              <Avatar
                src={playerData.imageUrl}
                name={playerData.fullName}
                size="sm"
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

          <div className="p-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
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
        className="w-10 h-10 rounded-full p-0 text-lg font-bold text-gray-600 hover:bg-gray-100"
        onClick={handleDecrement}
        disabled={value <= 0}
      >
        −
      </Button>

      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        className="w-16 h-16 text-3xl font-bold text-center border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
        min="0"
        max={max}
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
  const { setTitle, setShowBackButton, setOnBackClick, setActionButton } =
    useHeader();
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

  const handleBackClick = () => {
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
  };

  const handleSave = () => {
    if (canSubmit) {
      setShowConfirmation(true);
    }
  };

  useEffect(() => {
    setTitle("New Match");
    setShowBackButton(true);
    setOnBackClick(() => handleBackClick);

    return () => {
      setTitle(null);
      setShowBackButton(false);
      setOnBackClick(undefined);
      setActionButton(undefined);
    };
  }, [setTitle, setShowBackButton, setOnBackClick, setActionButton]);

  useEffect(() => {
    setActionButton({
      text: "Save",
      onClick: handleSave,
      disabled: !canSubmit || isSubmitting,
    });
  }, [setActionButton, canSubmit, isSubmitting]);

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

  const generateConfirmationText = () => {
    if (!myProfile || !opponent1) return "";

    const myTeam = myTeammate
      ? `${myProfile.fullName} and ${myTeammate.fullName}`
      : myProfile.fullName;

    const opponentTeam = opponent2
      ? `${opponent1.fullName} and ${opponent2.fullName}`
      : opponent1.fullName;

    const winner = myScore > opponentScore ? myTeam : opponentTeam;
    const loser = myScore > opponentScore ? opponentTeam : myTeam;
    const winScore = Math.max(myScore, opponentScore);
    const loseScore = Math.min(myScore, opponentScore);

    const matchType = format === "SINGLES" ? "singles" : "doubles";

    return `Confirm ${matchType} match: ${winner} beat ${loser} ${winScore}-${loseScore}`;
  };

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-sm mx-auto space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

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

          <div className="flex justify-center space-x-6">
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
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 justify-center items-center">
              <ScoreInput value={myScore} onChange={setMyScore} />
              <div className="text-2xl font-bold text-gray-400">vs</div>
              <ScoreInput value={opponentScore} onChange={setOpponentScore} />
            </div>
          </div>

          <div className="flex justify-center space-x-6">
            <PlayerSlot
              player={opponent1}
              onPlayerSelect={setOpponent1}
              myId={myProfile?.id}
            />
            <PlayerSlot
              player={opponent2}
              onPlayerSelect={setOpponent2}
              myId={myProfile?.id}
            />
          </div>
        </div>

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Confirm Match
              </h3>
              <p className="text-gray-700 mb-6">{generateConfirmationText()}</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
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
