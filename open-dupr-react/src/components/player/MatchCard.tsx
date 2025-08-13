import React, { useState } from "react";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MatchDetailsModal from "@/components/player/MatchDetailsModal";
import { CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { confirmMatch, rejectMatch } from "@/lib/api";

type PostMatchRating = {
  singles?: number | string | null;
  doubles?: number | string | null;
};

type PlayerRef = {
  id?: number;
  fullName: string;
  imageUrl?: string;
  rating?: string;
  preRating?: string;
  previousRating?: string;
  oldRating?: string;
  postRating?: string;
  newRating?: string;
  afterRating?: string;
  postMatchRating?: PostMatchRating | null;
  delta?: string | number | null;
  ratingDelta?: string | number | null;
  validatedMatch?: boolean;
};

type MatchTeam = {
  id?: number;
  serial?: number;
  player1: PlayerRef;
  player2?: PlayerRef | null;
  winner?: boolean;
  delta?: string;
  teamRating?: string;
  game1?: number;
  game2?: number;
  game3?: number;
  game4?: number;
  game5?: number;
  preMatchRatingAndImpact?: Record<string, string | number | null | undefined>;
};

type Match = {
  id: number;
  venue?: string;
  location?: string;
  tournament?: string;
  eventDate?: string;
  eventFormat?: string;
  teams: MatchTeam[];
  noOfGames?: number;
  confirmed?: boolean;
};

interface MatchCardProps {
  match: Match;
  currentUserId?: number;
  onMatchUpdate?: () => void;
}

function getDisplayName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(" ");
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.charAt(0) ?? "";
  return `${first} ${lastInitial}.`;
}

function toNumber(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  return Number.isFinite(num) ? num : null;
}

function parseDelta(delta?: string | number | null): number | null {
  if (delta === undefined || delta === null) return null;
  if (typeof delta === "number") return delta;
  const cleaned = delta.replace(/[+]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function computeUserDeltaForTeam(
  team: MatchTeam,
  userId?: number
): number | null {
  if (!userId) return null;
  const player = [team.player1, team.player2].find((p) => p && p.id === userId);
  if (!player) return null;
  const preFromField = toNumber(
    player.preRating ?? player.previousRating ?? player.oldRating
  );
  const postMatch = player.postMatchRating ?? null;
  const postFromField = postMatch
    ? toNumber(postMatch.doubles ?? postMatch.singles)
    : toNumber(
        player.postRating ??
          player.newRating ??
          player.afterRating ??
          player.rating
      );
  if (preFromField !== null && postFromField !== null)
    return postFromField - preFromField;
  const playerDelta = parseDelta(player.delta ?? player.ratingDelta);
  if (playerDelta !== null) return playerDelta;
  const idx = team.player1?.id === userId ? 1 : 2;
  const impact = team.preMatchRatingAndImpact || {};
  const doublesKey =
    idx === 1
      ? "matchDoubleRatingImpactPlayer1"
      : "matchDoubleRatingImpactPlayer2";
  const singlesKey =
    idx === 1
      ? "matchSingleRatingImpactPlayer1"
      : "matchSingleRatingImpactPlayer2";
  const impactVal =
    toNumber(impact[doublesKey]) ?? toNumber(impact[singlesKey]);
  if (impactVal !== null) return impactVal;
  const teamDelta = parseDelta(team.delta);
  if (teamDelta !== null) return teamDelta;
  return null;
}

function TeamStack({ team }: { team: MatchTeam }) {
  const isDoubles = Boolean(team.player2);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-2">
        <Avatar
          name={team.player1.fullName}
          src={team.player1.imageUrl}
          size="sm"
          className="ring-2 ring-background"
        />
        {isDoubles && (
          <Avatar
            name={team.player2!.fullName}
            src={team.player2!.imageUrl}
            size="sm"
            className="ring-2 ring-background"
          />
        )}
      </div>
      <div className="min-w-0">
        <span className="font-medium truncate">
          {isDoubles
            ? `${getDisplayName(team.player1.fullName)} & ${getDisplayName(
                team.player2!.fullName
              )}`
            : getDisplayName(team.player1.fullName)}
        </span>
      </div>
    </div>
  );
}

function getGamePairs(a?: MatchTeam, b?: MatchTeam) {
  const pairs: { a: number; b: number }[] = [];
  if (!a || !b) return pairs;
  const indices = [1, 2, 3, 4, 5] as const;
  for (const i of indices) {
    const left = a[`game${i}` as keyof MatchTeam] as number | undefined;
    const right = b[`game${i}` as keyof MatchTeam] as number | undefined;
    if (
      typeof left === "number" &&
      left >= 0 &&
      typeof right === "number" &&
      right >= 0
    ) {
      pairs.push({ a: left, b: right });
    }
  }
  return pairs;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  currentUserId,
  onMatchUpdate,
}) => {
  const originalA = match.teams[0];
  const originalB = match.teams[1];
  let teamA = originalA;
  let teamB = originalB;

  if (currentUserId && originalA && originalB) {
    const aHasUser = [originalA.player1?.id, originalA.player2?.id].includes(
      currentUserId
    );
    const bHasUser = [originalB.player1?.id, originalB.player2?.id].includes(
      currentUserId
    );
    if (!aHasUser && bHasUser) {
      teamA = originalB;
      teamB = originalA;
    }
  }

  const teamAWon = Boolean(teamA?.winner);
  const teamBWon = Boolean(teamB?.winner);

  const gamePairs = getGamePairs(teamA, teamB);
  const isUserContext = Boolean(currentUserId);
  const userDelta = computeUserDeltaForTeam(teamA, currentUserId);

  const [open, setOpen] = useState(false);
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
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
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
              {gamePairs.length === 1 && (
                <div className="text-5xl md:text-6xl font-bold leading-none tabular-nums">
                  {(() => {
                    const g = gamePairs[0];
                    const aWon = g.a > g.b;
                    const aClass = isUserContext
                      ? aWon
                        ? "text-emerald-600"
                        : "text-rose-600"
                      : aWon
                      ? "text-foreground"
                      : "text-muted-foreground";
                    const bClass = isUserContext
                      ? "text-muted-foreground"
                      : !aWon
                      ? "text-foreground"
                      : "text-muted-foreground";
                    return (
                      <>
                        <span className={aClass}>{g.a}</span>
                        <span className="mx-1 text-foreground">–</span>
                        <span className={bClass}>{g.b}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              {gamePairs.length > 1 && (
                <div className="grid gap-1 text-base md:text-lg font-semibold tabular-nums">
                  {gamePairs.map((g, i) => {
                    const aWon = g.a > g.b;
                    const aClass = isUserContext
                      ? aWon
                        ? "text-emerald-600"
                        : "text-rose-600"
                      : aWon
                      ? "text-foreground"
                      : "text-muted-foreground";
                    const bClass = isUserContext
                      ? "text-muted-foreground"
                      : !aWon
                      ? "text-foreground"
                      : "text-muted-foreground";
                    return (
                      <div key={i} className="text-center">
                        <span className={aClass}>{g.a}</span>
                        <span className="mx-1 text-foreground">–</span>
                        <span className={bClass}>{g.b}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {gamePairs.length === 0 && (
                <div className="text-muted-foreground">—</div>
              )}
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
      <MatchDetailsModal
        open={open}
        onOpenChange={setOpen}
        match={match}
        currentUserId={currentUserId}
        onMatchUpdate={onMatchUpdate}
      />
    </Card>
  );
};

export default MatchCard;
