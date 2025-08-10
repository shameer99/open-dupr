import React from "react";
import Modal from "@/components/ui/modal";
import Avatar from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

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
  status?: string;
};

function getDisplayName(fullName: string) {
  const parts = fullName.split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]?.charAt(0) ?? ""}.`;
}

function toNumber(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  return Number.isFinite(num) ? num : null;
}

function extractImpactDelta(
  team: MatchTeam,
  playerIndex: 1 | 2,
  eventFormat?: string
): number | null {
  const impact = (team as any).preMatchRatingAndImpact || {};
  const keysToTry: string[] = [];
  if (eventFormat === "DOUBLES") {
    keysToTry.push(
      playerIndex === 1
        ? "matchDoubleRatingImpactPlayer1"
        : "matchDoubleRatingImpactPlayer2"
    );
  } else if (eventFormat === "SINGLES") {
    keysToTry.push(
      playerIndex === 1
        ? "matchSingleRatingImpactPlayer1"
        : "matchSingleRatingImpactPlayer2"
    );
  }
  // also try both in case eventFormat missing
  keysToTry.push(
    playerIndex === 1
      ? "matchDoubleRatingImpactPlayer1"
      : "matchDoubleRatingImpactPlayer2"
  );
  keysToTry.push(
    playerIndex === 1
      ? "matchSingleRatingImpactPlayer1"
      : "matchSingleRatingImpactPlayer2"
  );

  for (const key of keysToTry) {
    const val = toNumber(impact?.[key] as any);
    if (val !== null) return val;
  }
  return null;
}

function getPostMatchRating(
  player: PlayerRef,
  eventFormat?: string
): number | null {
  const pmr: any = (player as any).postMatchRating;
  if (pmr && typeof pmr === "object") {
    if (eventFormat === "DOUBLES" && pmr.doubles != null)
      return toNumber(pmr.doubles);
    if (eventFormat === "SINGLES" && pmr.singles != null)
      return toNumber(pmr.singles);
    // fallback: prefer doubles if present else singles
    if (pmr.doubles != null) return toNumber(pmr.doubles);
    if (pmr.singles != null) return toNumber(pmr.singles);
  }
  return toNumber((player as any).postRating ?? player.rating);
}

function getPreMatchRating(
  team: MatchTeam,
  playerIndex: 1 | 2,
  eventFormat?: string,
  player?: PlayerRef
): number | null {
  const pri: any = (team as any).preMatchRatingAndImpact;
  if (pri && typeof pri === "object") {
    const preKey =
      eventFormat === "DOUBLES"
        ? playerIndex === 1
          ? "preMatchDoubleRatingPlayer1"
          : "preMatchDoubleRatingPlayer2"
        : playerIndex === 1
        ? "preMatchSingleRatingPlayer1"
        : "preMatchSingleRatingPlayer2";
    const fallbacks = [
      playerIndex === 1
        ? "preMatchDoubleRatingPlayer1"
        : "preMatchDoubleRatingPlayer2",
      playerIndex === 1
        ? "preMatchSingleRatingPlayer1"
        : "preMatchSingleRatingPlayer2",
    ];
    const keys = [preKey, ...fallbacks];
    for (const k of keys) {
      const v = toNumber(pri[k]);
      if (v !== null) return v;
    }
  }
  if (player) {
    const pre = toNumber(
      (player as any).preMatchRating ?? (player as any).preRating
    );
    if (pre !== null) return pre;
  }
  return null;
}

function computePrePost(
  team: MatchTeam,
  player: PlayerRef,
  playerIndex: 1 | 2,
  eventFormat?: string
) {
  const post = getPostMatchRating(player, eventFormat);
  const preFromTeam = getPreMatchRating(team, playerIndex, eventFormat, player);
  const impact = extractImpactDelta(team, playerIndex, eventFormat);
  const pre =
    preFromTeam !== null
      ? preFromTeam
      : post !== null && impact !== null
      ? post - impact
      : null;
  const delta = pre !== null && post !== null ? post - pre : impact ?? null;
  return { pre, post, delta };
}

function TeamBlock({
  team,
  onClickPlayer,
  eventFormat,
}: {
  team: MatchTeam;
  onClickPlayer: (id?: number) => void;
  eventFormat?: string;
}) {
  const players = [team.player1, team.player2].filter(Boolean) as PlayerRef[];
  return (
    <div className="grid gap-2">
      {players.map((p, idx) => {
        const { pre, post, delta } = computePrePost(
          team,
          p,
          idx === 0 ? 1 : 2,
          eventFormat
        );
        const deltaClass =
          delta === null
            ? ""
            : delta >= 0
            ? "text-emerald-600"
            : "text-rose-600";
        return (
          <button
            key={p.id ?? p.fullName}
            type="button"
            onClick={() => onClickPlayer(p.id)}
            className="group flex items-center justify-between gap-3 rounded-md border p-2 text-left hover:bg-accent"
          >
            <span className="flex items-center gap-3 min-w-0">
              <Avatar
                name={p.fullName}
                src={p.imageUrl}
                size="md"
                className="ring-2 ring-background"
              />
              <span className="truncate group-hover:underline">
                {getDisplayName(p.fullName)}
              </span>
            </span>
            <span className="text-sm font-mono whitespace-nowrap">
              {pre !== null && post !== null ? (
                <span>
                  <span className="text-muted-foreground">
                    {pre.toFixed(3)}
                  </span>
                  <span className="mx-1">→</span>
                  <span className={deltaClass}>{post.toFixed(3)}</span>
                </span>
              ) : post !== null ? (
                <span className={deltaClass}>{post.toFixed(3)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TeamHeader({ team }: { team: MatchTeam }) {
  const isDoubles = Boolean(team.player2);
  return (
    <div className="flex items-center gap-3">
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

interface MatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match;
  currentUserId?: number;
}

const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  open,
  onOpenChange,
  match,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const onClose = () => onOpenChange(false);

  // Ensure the current user's team is the left/top for coherence with cards
  const a0 = match.teams[0];
  const b0 = match.teams[1];
  const aHasUser =
    currentUserId && [a0.player1?.id, a0.player2?.id].includes(currentUserId);
  const bHasUser =
    currentUserId && [b0.player1?.id, b0.player2?.id].includes(currentUserId);
  const teamA = !aHasUser && bHasUser ? b0 : a0;
  const teamB = !aHasUser && bHasUser ? a0 : b0;

  const handleClickPlayer = (id?: number) => {
    if (!id) return;
    onClose();
    navigate(`/player/${id}`);
  };

  // Build game chips prominently
  const games = [1, 2, 3, 4, 5]
    .map((i) => {
      const l = (teamA as any)[`game${i}`] as number | undefined;
      const r = (teamB as any)[`game${i}`] as number | undefined;
      if (typeof l === "number" && l >= 0 && typeof r === "number" && r >= 0) {
        return { l, r };
      }
      return null;
    })
    .filter(Boolean) as { l: number; r: number }[];

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Match details">
      <Card className="rounded-xl border-0 shadow-none">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {match.venue}
                {match.location ? ` • ${match.location}` : ""}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {match.eventDate}
                {match.tournament ? ` • ${match.tournament}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-6">
            <div className="justify-self-start">
              <TeamHeader team={teamA} />
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              {games.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {games.map((g, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold border ${
                        g.l > g.r
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {g.l}-{g.r}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="justify-self-end">
              <TeamHeader team={teamB} />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TeamBlock
              team={teamA}
              onClickPlayer={handleClickPlayer}
              eventFormat={match.eventFormat}
            />
            <TeamBlock
              team={teamB}
              onClickPlayer={handleClickPlayer}
              eventFormat={match.eventFormat}
            />
          </div>
        </CardContent>
      </Card>
    </Modal>
  );
};

export default MatchDetailsModal;
