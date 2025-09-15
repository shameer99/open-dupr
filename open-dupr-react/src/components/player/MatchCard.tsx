import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { confirmMatch, rejectMatch } from "@/lib/api";
import { MatchScoreDisplay } from "./shared/MatchDisplay";
import { navigateWithTransition, navigateToProfile } from "@/lib/view-transitions";
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
  profileUserId?: number;
  onMatchUpdate?: () => void;
}

interface TeamStackProps {
  team: MatchTeam;
  profileUserId?: number;
  onExpandMatch?: () => void;
}

function TeamStack({ team, profileUserId, onExpandMatch }: TeamStackProps) {
  const navigate = useNavigate();
  const isDoubles = Boolean(team.player2);

  const handlePlayerClick = (e: React.MouseEvent, playerId?: number) => {
    e.stopPropagation();
    if (playerId) {
      // If we're already viewing this player's profile, expand the match instead of navigating
      if (profileUserId && playerId === profileUserId && onExpandMatch) {
        onExpandMatch();
        return;
      }
      navigateToProfile(navigate, `/player/${playerId}`);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-2">
        <button
          type="button"
          onClick={(e) => handlePlayerClick(e, team.player1.id)}
          className="rounded-full transition-all cursor-pointer"
        >
          <Avatar
            name={team.player1.fullName}
            src={team.player1.imageUrl}
            size="sm"
            className="ring-2 ring-background hover:ring-primary/20 transition-all"
          />
        </button>
        {isDoubles && (
          <button
            type="button"
            onClick={(e) => handlePlayerClick(e, team.player2!.id)}
            className="rounded-full transition-all cursor-pointer"
          >
            <Avatar
              name={team.player2!.fullName}
              src={team.player2!.imageUrl}
              size="sm"
              className="ring-2 ring-background hover:ring-primary/20 transition-all"
            />
          </button>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => handlePlayerClick(e, team.player1.id)}
            className="font-medium truncate text-left hover:underline hover:text-primary transition-colors cursor-pointer"
          >
            {getDisplayName(team.player1.fullName)}
          </button>
          {isDoubles && (
            <button
              type="button"
              onClick={(e) => handlePlayerClick(e, team.player2!.id)}
              className="font-medium truncate text-left hover:underline hover:text-primary transition-colors cursor-pointer"
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
  profileUserId,
  onMatchUpdate,
}) => {
  const navigate = useNavigate();

  const handleExpandMatch = () => {
    const path = profileUserId
      ? `/match/${match.id}/player/${profileUserId}`
      : `/match/${match.id}`;
    navigateWithTransition(navigate, path, {
      state: {
        match,
        perspectiveUserId: profileUserId,
        currentUserId: currentUserId,
      },
    });
  };

  // For display purposes, use profileUserId to arrange teams from the profile's perspective
  // This ensures matches are shown from the profile being viewed
  const { teamA, teamB } = arrangeTeamsForUser(match.teams, profileUserId);
  const teamAWon = Boolean(teamA?.winner);
  const teamBWon = Boolean(teamB?.winner);
  const gamePairs = getGamePairs(teamA, teamB);
  const userDelta = computeUserDeltaForTeam(teamA, profileUserId);

  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user needs to validate this match
  // Only show validation buttons if:
  // 1. Current user is logged in
  // 2. Current user is part of the match
  // 3. Match is not confirmed
  // 4. Current user hasn't already validated the match
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
      className="p-3 cursor-pointer transition-colors hover:bg-accent/50"
      onClick={handleExpandMatch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleExpandMatch();
        }
      }}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              {userDelta !== null && (
                <span className="inline-flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 font-mono">
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
                <span className="text-amber-600">Pending</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {match.eventDate && <span>{match.eventDate}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div
              className={`${
                teamAWon ? "text-emerald-700" : "text-rose-700"
              } min-w-0 md:justify-self-start`}
            >
              <TeamStack
                team={teamA}
                profileUserId={profileUserId}
                onExpandMatch={handleExpandMatch}
              />
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
              <TeamStack
                team={teamB}
                profileUserId={profileUserId}
                onExpandMatch={handleExpandMatch}
              />
            </div>
          </div>

          {needsValidation && (
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:opacity-90"
                style={{
                  color: "var(--success)",
                  backgroundColor:
                    "color-mix(in oklab, var(--success) 12%, transparent)",
                }}
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Validating..." : "Validate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:opacity-90"
                style={{
                  color: "var(--destructive)",
                  backgroundColor:
                    "color-mix(in oklab, var(--destructive) 12%, transparent)",
                }}
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
