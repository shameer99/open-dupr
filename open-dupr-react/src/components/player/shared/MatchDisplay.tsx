import Avatar from "@/components/ui/avatar";

export type PostMatchRating = {
  singles?: number | string | null;
  doubles?: number | string | null;
};

export type PlayerRef = {
  id?: number;
  fullName: string;
  imageUrl?: string;
  rating?: string;
  preRating?: string;
  previousRating?: string;
  oldRating?: string;
  preMatchRating?: string | number | null;
  postRating?: string;
  newRating?: string;
  afterRating?: string;
  postMatchRating?: PostMatchRating | null;
  delta?: string | number | null;
  ratingDelta?: string | number | null;
  validatedMatch?: boolean;
};

export type MatchTeam = {
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

export type Match = {
  id: number;
  venue?: string;
  location?: string;
  tournament?: string;
  eventDate?: string;
  eventFormat?: string;
  eventName?: string;
  teams: MatchTeam[];
  noOfGames?: number;
  confirmed?: boolean;
  status?: string;
};

export function getDisplayName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(" ");
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.charAt(0) ?? "";
  return `${first} ${lastInitial}.`;
}

export function toNumber(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  return Number.isFinite(num) ? num : null;
}

export function parseDelta(delta?: string | number | null): number | null {
  if (delta === undefined || delta === null) return null;
  if (typeof delta === "number") return delta;
  const cleaned = delta.replace(/[+]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function getGamePairs(teamA?: MatchTeam, teamB?: MatchTeam) {
  const pairs: { a: number; b: number }[] = [];
  if (!teamA || !teamB) return pairs;
  const indices = [1, 2, 3, 4, 5] as const;
  for (const i of indices) {
    const left = teamA[`game${i}` as keyof MatchTeam] as number | undefined;
    const right = teamB[`game${i}` as keyof MatchTeam] as number | undefined;
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

export function getScoreClasses(
  games: { a: number; b: number }[],
  currentUserId?: number
) {
  const isUserContext = Boolean(currentUserId);

  if (games.length === 0) {
    return { aClass: "text-muted-foreground", bClass: "text-muted-foreground" };
  }

  // Determine overall match winner by counting games won
  const aGamesWon = games.filter((g) => g.a > g.b).length;
  const bGamesWon = games.filter((g) => g.b > g.a).length;
  const aIsMatchWinner = aGamesWon > bGamesWon;
  const bIsMatchWinner = bGamesWon > aGamesWon;

  const aClass = isUserContext
    ? aIsMatchWinner
      ? "text-emerald-600"
      : bIsMatchWinner
      ? "text-rose-600"
      : "text-foreground"
    : aIsMatchWinner
    ? "text-foreground"
    : "text-muted-foreground";

  const bClass = isUserContext
    ? "text-muted-foreground"
    : bIsMatchWinner
    ? "text-foreground"
    : "text-muted-foreground";

  return { aClass, bClass };
}

export function TeamHeader({ team }: { team: MatchTeam }) {
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
        <div className="truncate text-sm font-medium">
          {isDoubles
            ? `${getDisplayName(team.player1.fullName)} & ${getDisplayName(
                team.player2!.fullName
              )}`
            : getDisplayName(team.player1.fullName)}
        </div>
      </div>
    </div>
  );
}

interface MatchScoreDisplayProps {
  games: { a: number; b: number }[];
  currentUserId?: number;
  size?: "small" | "large";
}

export function MatchScoreDisplay({
  games,
  currentUserId,
  size = "large",
}: MatchScoreDisplayProps) {
  const isUserContext = Boolean(currentUserId);

  if (games.length === 0) {
    return <div className="text-muted-foreground text-xl">—</div>;
  }

  if (games.length === 1) {
    // For single games, use overall match winner logic
    const { aClass, bClass } = getScoreClasses(games, currentUserId);
    const g = games[0];
    const sizeClass = size === "small" ? "text-5xl md:text-6xl" : "text-6xl";
    const spacingClass = size === "small" ? "mx-1" : "mx-2";

    return (
      <div className={`${sizeClass} font-bold leading-none tabular-nums`}>
        <span className={aClass}>{g.a}</span>
        <span className={`${spacingClass} text-foreground`}>–</span>
        <span className={bClass}>{g.b}</span>
      </div>
    );
  }

  // For multi-game matches, use per-game coloring
  const sizeClass =
    size === "small" ? "text-base md:text-lg" : "text-xl md:text-2xl";
  const spacingClass = size === "small" ? "mx-1" : "mx-2";

  return (
    <div className={`grid gap-1 ${sizeClass} font-semibold tabular-nums`}>
      {games.map((g, i) => {
        // Per-game winner logic
        const aWonGame = g.a > g.b;
        const bWonGame = g.b > g.a;
        
        const aGameClass = isUserContext
          ? aWonGame
            ? "text-emerald-600"
            : bWonGame
            ? "text-rose-600"
            : "text-foreground"
          : aWonGame
          ? "text-foreground"
          : "text-muted-foreground";
          
        const bGameClass = isUserContext
          ? "text-muted-foreground"
          : bWonGame
          ? "text-foreground"
          : "text-muted-foreground";

        return (
          <div key={i} className="text-center">
            <span className={aGameClass}>{g.a}</span>
            <span className={`${spacingClass} text-foreground`}>–</span>
            <span className={bGameClass}>{g.b}</span>
          </div>
        );
      })}
    </div>
  );
}

export function computeUserDeltaForTeam(
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

export function arrangeTeamsForUser(
  teams: MatchTeam[],
  currentUserId?: number
): { teamA: MatchTeam; teamB: MatchTeam } {
  const originalA = teams[0];
  const originalB = teams[1];
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

  return { teamA, teamB };
}
