import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { confirmMatch, rejectMatch } from "@/lib/api";
import { MatchScoreDisplay } from "./shared/MatchDisplay";
import {
  getDisplayName,
  getGamePairs,
  computeUserDeltaForTeam,
  arrangeTeamsForUser,
  type Match,
  type MatchTeam,
} from "./shared/match-utils";

interface MatchCardProps {
  match: Match;
  currentUserId?: number;
  onMatchUpdate?: () => void;
}

function TeamStack({ team }: { team: MatchTeam }) {
  const navigate = useNavigate();
  const isDoubles = Boolean(team.player2);

  const handlePlayerClick = (e: React.MouseEvent, playerId?: number) => {
    e.stopPropagation();
    if (playerId) {
      navigate(`/player/${playerId}`);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-2">
        <button
          type="button"
          onClick={(e) => handlePlayerClick(e, team.player1.id)}
          className="hover:ring-2 hover:ring-primary/20 transition-all"
        >
          <Avatar
            name={team.player1.fullName}
            src={team.player1.imageUrl}
            size="sm"
            className="ring-2 ring-background"
          />
        </button>
        {isDoubles && (
          <button
            type="button"
            onClick={(e) => handlePlayerClick(e, team.player2!.id)}
            className="hover:ring-2 hover:ring-primary/20 transition-all"
          >
            <Avatar
              name={team.player2!.fullName}
              src={team.player2!.imageUrl}
              size="sm"
              className="ring-2 ring-background"
            />
          </button>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => handlePlayerClick(e, team.player1.id)}
            className="font-medium truncate text-left hover:underline hover:text-primary transition-colors"
          >
            {getDisplayName(team.player1.fullName)}
          </button>
          {isDoubles && (
            <button
              type="button"
              onClick={(e) => handlePlayerClick(e, team.player2!.id)}
              className="font-medium truncate text-left hover:underline hover:text-primary transition-colors"
            >
              {getDisplayName(team.player2!.fullName)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  currentUserId,
  onMatchUpdate,
}) => {
  const navigate = useNavigate();
  const { teamA, teamB } = arrangeTeamsForUser(match.teams, currentUserId);
  const teamAWon = Boolean(teamA?.winner);
  const teamBWon = Boolean(teamB?.winner);
  const gamePairs = getGamePairs(teamA, teamB);
  const userDelta = computeUserDeltaForTeam(teamA, currentUserId);

  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user needs to validate this match
  const needsValidation =
    currentUserId &&
    !match.confirmed &&
    match.teams.some((team) =>
      [team.player1, team.player2].some(
        (player) =>
          player &&
          player.id === currentUserId &&
          player.validatedMatch === false
      )
    );

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isProcessing) return;

    try {
      setIsProcessing(true);
      await confirmMatch(match.id);
      onMatchUpdate?.();
    } catch (err) {
      console.error("Failed to confirm match:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isProcessing) return;

    try {
      setIsProcessing(true);
      await rejectMatch(match.id);
      onMatchUpdate?.();
    } catch (err) {
      console.error("Failed to reject match:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card
      className="p-4 cursor-pointer transition hover:bg-accent/40"
      onClick={() => {
        const path = currentUserId
          ? `/match/${match.id}/player/${currentUserId}`
          : `/match/${match.id}`;
        navigate(path, {
          state: {
            match,
            perspectiveUserId: currentUserId,
          },
        });
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const path = currentUserId
            ? `/match/${match.id}/player/${currentUserId}`
            : `/match/${match.id}`;
          navigate(path, {
            state: {
              match,
              perspectiveUserId: currentUserId,
            },
          });
        }
      }}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              {userDelta !== null && (
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono">
                  {userDelta >= 0 ? (
                    <ChevronUp className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-rose-600" />
                  )}
                  <span
                    className={
                      userDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                    }
                  >
                    {Math.abs(userDelta).toFixed(3)}
                  </span>
                </span>
              )}
              {!match.confirmed && (
                <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 font-medium">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {match.eventDate && <span>{match.eventDate}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div
              className={`${
                teamAWon ? "text-emerald-700" : "text-rose-700"
              } min-w-0 md:justify-self-start`}
            >
              <TeamStack team={teamA} />
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <MatchScoreDisplay
                games={gamePairs}
                currentUserId={currentUserId}
                size="small"
              />
            </div>
            <div
              className={`${
                teamBWon ? "text-emerald-700" : "text-rose-700"
              } min-w-0 self-end md:justify-self-end`}
            >
              <TeamStack team={teamB} />
            </div>
          </div>

          {needsValidation && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Validating..." : "Validate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
