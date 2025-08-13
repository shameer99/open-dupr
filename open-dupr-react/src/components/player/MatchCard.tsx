import React, { useState } from "react";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import MatchDetailsModal from "@/components/player/MatchDetailsModal";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  // Try direct player pre/post fields
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
  // Try explicit delta fields on player
  const playerDelta = parseDelta(player.delta ?? player.ratingDelta);
  if (playerDelta !== null) return playerDelta;
  // Try team preMatchRatingAndImpact
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
  // Fallback to team delta if available
  const teamDelta = parseDelta(team.delta);
  if (teamDelta !== null) return teamDelta;
  // Fallback to derive from rating + team delta if rating present
  const ratingNow = toNumber(player.rating);
  if (ratingNow !== null && teamDelta !== null) return teamDelta;
  return null;
}

function TeamStack({ team }: { team: MatchTeam }) {
  const isDoubles = Boolean(team.player2);
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
      <div className="flex -space-x-2 md:-space-x-3">
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
      <div className="flex flex-col leading-tight md:min-w-0">
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

function TeamScoreChips({
  team,
  opponent,
  maxGames,
}: {
  team: MatchTeam;
  opponent: MatchTeam;
  maxGames: number;
}) {
  const teamGames = [
    team.game1,
    team.game2,
    team.game3,
    team.game4,
    team.game5,
  ].filter((g) => typeof g === "number" && g >= 0) as number[];
  const opponentGames = [
    opponent.game1,
    opponent.game2,
    opponent.game3,
    opponent.game4,
    opponent.game5,
  ].filter((g) => typeof g === "number" && g >= 0) as number[];

  const len = Math.min(teamGames.length, opponentGames.length);
  const effective = Math.max(maxGames, len);
  if (effective === 0) return null;

  return (
    <div
      className="grid justify-end gap-1.5 md:gap-2"
      style={{ gridTemplateColumns: `repeat(${effective}, 2rem)` }}
    >
      {Array.from({ length: effective }).map((_, i) => {
        const mine = teamGames[i] as number | undefined;
        const theirs = opponentGames[i] as number | undefined;
        if (mine === undefined || theirs === undefined) {
          return (
            <span
              key={i}
              className="w-8 h-6 md:h-7 rounded-full border bg-muted/40"
            />
          );
        }
        const won = mine > theirs;
        return (
          <span
            key={i}
            className={`w-8 h-6 md:h-7 inline-flex items-center justify-center rounded-full text-[10px] md:text-xs font-semibold border ${
              won
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
            title={`Game ${i + 1}: ${mine}-${theirs}`}
          >
            {mine}
          </span>
        );
      })}
    </div>
  );
}

const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId }) => {
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
  const userDelta = computeUserDeltaForTeam(teamA, currentUserId);
  const gamesA = [
    teamA?.game1,
    teamA?.game2,
    teamA?.game3,
    teamA?.game4,
    teamA?.game5,
  ].filter((g) => typeof g === "number" && (g as number) >= 0) as number[];
  const gamesB = [
    teamB?.game1,
    teamB?.game2,
    teamB?.game3,
    teamB?.game4,
    teamB?.game5,
  ].filter((g) => typeof g === "number" && (g as number) >= 0) as number[];
  const declaredNoOfGames =
    typeof match.noOfGames === "number" && match.noOfGames > 0
      ? match.noOfGames
      : 0;
  const maxGames = Math.max(declaredNoOfGames, gamesA.length, gamesB.length);

  const [open, setOpen] = useState(false);

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
          <div className="flex items-center justify-between gap-3">
            <div className="shrink-0">
              <div
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold border ${
                  teamAWon || teamBWon
                    ? teamAWon
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-muted text-muted-foreground"
                }`}
                title={teamAWon ? "Win" : teamBWon ? "Loss" : "Pending"}
              >
                <span>{teamAWon ? "W" : teamBWon ? "L" : "-"}</span>
                {userDelta !== null && (
                  <span className="ml-1 inline-flex items-center font-mono">
                    {userDelta >= 0 ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(userDelta).toFixed(3)}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 truncate text-right">
              {!match.confirmed && (
                <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">
                  Pending Validation
                </span>
              )}
              <span className="truncate">
                {match.venue}
                {match.eventDate ? ` • ${match.eventDate}` : ""}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
            <div
              className={`${
                teamAWon ? "opacity-100" : "opacity-70"
              } flex items-center gap-3`}
            >
              <TeamStack team={teamA} />
            </div>
            <TeamScoreChips team={teamA} opponent={teamB} maxGames={maxGames} />

            <div
              className={`${
                teamBWon ? "opacity-100" : "opacity-70"
              } flex items-center gap-3`}
            >
              <TeamStack team={teamB} />
            </div>
            <TeamScoreChips team={teamB} opponent={teamA} maxGames={maxGames} />
          </div>
        </div>
      </CardContent>
      <MatchDetailsModal
        open={open}
        onOpenChange={setOpen}
        match={match}
        currentUserId={currentUserId}
      />
    </Card>
  );
};

export default MatchCard;
