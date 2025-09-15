import Avatar from "@/components/ui/avatar";
import { type MatchTeam, getDisplayName, getScoreClasses } from "./match-utils";

interface TeamHeaderProps {
  team: MatchTeam;
  onClickPlayer?: (id?: number) => void;
}

export function TeamHeader({ team, onClickPlayer }: TeamHeaderProps) {
  const isDoubles = Boolean(team.player2);

  const handlePlayerClick = (e: React.MouseEvent, playerId?: number) => {
    e.stopPropagation();
    if (onClickPlayer && playerId) {
      onClickPlayer(playerId);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-2">
        <button
          type="button"
          onClick={(e) => handlePlayerClick(e, team.player1.id)}
          className="rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
          disabled={!onClickPlayer}
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
            className="rounded-full transition-all cursor-pointer disabled:cursor-not-allowed"
            disabled={!onClickPlayer}
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
            className="font-medium truncate text-left hover:underline hover:text-primary transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
            disabled={!onClickPlayer}
          >
            {getDisplayName(team.player1.fullName)}
          </button>
          {isDoubles && (
            <button
              type="button"
              onClick={(e) => handlePlayerClick(e, team.player2!.id)}
              className="font-medium truncate text-left hover:underline hover:text-primary transition-colors text-sm cursor-pointer disabled:cursor-not-allowed"
              disabled={!onClickPlayer}
            >
              {getDisplayName(team.player2!.fullName)}
            </button>
          )}
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
          <div key={i} className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              Game {i + 1}:
            </div>
            <div className="flex-1 text-center">
              <span className={aGameClass}>{g.a}</span>
              <span className={`${spacingClass} text-foreground`}>–</span>
              <span className={bGameClass}>{g.b}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
