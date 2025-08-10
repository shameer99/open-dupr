import React, { useState } from "react";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import MatchDetailsModal from "@/components/player/MatchDetailsModal";
import { ChevronDown, ChevronUp } from "lucide-react";

type PlayerRef = {
  id?: number;
  fullName: string;
  imageUrl?: string;
  rating?: string;
  preRating?: string;
  postRating?: string;
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
  preMatchRatingAndImpact?: Record<string, unknown>;
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
  const player = [team.player1, team.player2].find(
    (p) => p && p.id === userId
  ) as PlayerRef | undefined;
  if (!player) return null;
  // Try direct player pre/post fields
  const preFromField = toNumber(
    (player as any).preRating ??
      (player as any).previousRating ??
      (player as any).oldRating
  );
  const postMatch = (player as any).postMatchRating;
  const postFromField = postMatch
    ? toNumber(postMatch?.doubles ?? postMatch?.singles)
    : toNumber(
        (player as any).postRating ??
          (player as any).newRating ??
          (player as any).afterRating ??
          player.rating
      );
  if (preFromField !== null && postFromField !== null)
    return postFromField - preFromField;
  // Try explicit delta fields on player
  const playerDelta = parseDelta(
    (player as any).delta ?? (player as any).ratingDelta
  );
  if (playerDelta !== null) return playerDelta;
  // Try team preMatchRatingAndImpact
  const idx = team.player1?.id === userId ? 1 : 2;
  const impact = (team as any).preMatchRatingAndImpact || {};
  const doublesKey =
    idx === 1
      ? "matchDoubleRatingImpactPlayer1"
      : "matchDoubleRatingImpactPlayer2";
  const singlesKey =
    idx === 1
      ? "matchSingleRatingImpactPlayer1"
      : "matchSingleRatingImpactPlayer2";
  const impactVal =
    toNumber((impact as any)[doublesKey]) ??
    toNumber((impact as any)[singlesKey]);
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

function ScoreChips({ a, b }: { a: MatchTeam; b: MatchTeam }) {
  const gamesLeft = [a.game1, a.game2, a.game3, a.game4, a.game5].filter(
    (g) => typeof g === "number" && g >= 0
  ) as number[];
  const gamesRight = [b.game1, b.game2, b.game3, b.game4, b.game5].filter(
    (g) => typeof g === "number" && g >= 0
  ) as number[];
  const len = Math.min(gamesLeft.length, gamesRight.length);

  if (len === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: len }).map((_, i) => {
        const left = gamesLeft[i]!;
        const right = gamesRight[i]!;
        const leftWin = left > right;
        return (
          <span
            key={i}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
              leftWin
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {left}-{right}
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
            <div className="text-sm text-muted-foreground min-w-0 truncate">
              {match.venue}
              {match.eventDate ? ` • ${match.eventDate}` : ""}
            </div>
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
          </div>

          <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
            <div className={`${teamAWon ? "opacity-100" : "opacity-70"}`}>
              <TeamStack team={teamA} />
            </div>

            <div className="flex flex-col items-center justify-center gap-2 px-1">
              <ScoreChips a={teamA} b={teamB} />
              <div className="text-xs font-medium text-muted-foreground">
                vs
              </div>
            </div>

            <div
              className={`${
                teamBWon ? "opacity-100" : "opacity-70"
              } md:justify-self-end`}
            >
              <TeamStack team={teamB} />
            </div>
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
