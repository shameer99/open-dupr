import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import {
  getMatchDetails,
  confirmMatch,
  rejectMatch,
  getMyProfile,
} from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/utils";
import { MatchScoreDisplay, TeamHeader } from "../player/shared/MatchDisplay";
import {
  getDisplayName,
  toNumber,
  getGamePairs,
  arrangeTeamsForUser,
  type Match,
  type MatchTeam,
  type PlayerRef,
} from "../player/shared/match-utils";
import { MatchDetailsSkeleton } from "@/components/ui/loading-skeletons";
import { usePageLoading } from "@/lib/loading-context";
import { useHeader } from "@/lib/header-context";

function extractImpactDelta(
  team: MatchTeam,
  playerIndex: 1 | 2,
  eventFormat?: string
): number | null {
  const impact = team.preMatchRatingAndImpact || {};
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
    const val = toNumber(impact?.[key]);
    if (val !== null) return val;
  }
  return null;
}

function getPostMatchRating(
  player: PlayerRef,
  eventFormat?: string
): number | null {
  const pmr = player.postMatchRating;
  if (pmr && typeof pmr === "object") {
    if (eventFormat === "DOUBLES" && pmr.doubles != null)
      return toNumber(pmr.doubles);
    if (eventFormat === "SINGLES" && pmr.singles != null)
      return toNumber(pmr.singles);
    if (pmr.doubles != null) return toNumber(pmr.doubles);
    if (pmr.singles != null) return toNumber(pmr.singles);
  }
  return toNumber(player.postRating ?? player.rating);
}

function getPreMatchRating(
  team: MatchTeam,
  playerIndex: 1 | 2,
  eventFormat?: string,
  player?: PlayerRef
): number | null {
  const pri = team.preMatchRatingAndImpact;
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
    const pre = toNumber(player.preMatchRating ?? player.preRating);
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
            ? "text-[color:var(--success)]"
            : "text-[color:var(--destructive)]";
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

const MatchDetailsPage: React.FC = () => {
  const { id, playerId } = useParams<{ id: string; playerId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Try to get data from navigation state first
  const navigationState = location.state as {
    match?: Match;
    perspectiveUserId?: number;
    currentUserId?: number;
  } | null;
  const passedMatch = navigationState?.match;
  const passedPerspectiveUserId = navigationState?.perspectiveUserId;
  const passedCurrentUserId = navigationState?.currentUserId;

  const [match, setMatch] = useState<Match | null>(passedMatch || null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(
    passedCurrentUserId || null
  );
  const [perspectiveUserId] = useState<number | null>(
    passedPerspectiveUserId || (playerId ? parseInt(playerId) : null)
  );
  const [loading, setLoading] = useState(!passedMatch); // Skip loading if we have data
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();
  const { setTitle, setShowBackButton, setOnBackClick } = useHeader();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Invalid match ID");
        setLoading(false);
        finishPageLoad();
        return;
      }

      // If we already have match data from navigation, we only need to fetch user profile
      if (passedMatch) {
        try {
          startPageLoad(["Loading user profile"]);
          completeLoadingStep("Loading user profile");

          const profileData = await getMyProfile().then((r) => r?.result);
          if (profileData?.id) {
            setCurrentUserId(profileData.id);
          }

          finishPageLoad();
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          finishPageLoad();
        } finally {
          setLoading(false);
        }
        return;
      }

      // Otherwise, fetch both match details and user profile
      try {
        startPageLoad([
          "Fetching match details",
          "Loading user profile",
          "Processing match data",
        ]);

        setLoading(true);

        completeLoadingStep("Fetching match details");
        const matchResponse = getMatchDetails(parseInt(id));

        completeLoadingStep("Loading user profile");
        const profileResponse = getMyProfile();

        // Wait for both to complete
        const [matchData, profileData] = await Promise.all([
          matchResponse.then((r) => r?.result),
          profileResponse.then((r) => r?.result),
        ]);

        completeLoadingStep("Processing match data");

        if (matchData) {
          setMatch(matchData);
        } else {
          setError("Match not found");
        }

        if (profileData?.id) {
          setCurrentUserId(profileData.id);
        }

        finishPageLoad();
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(extractApiErrorMessage(err, "Failed to load match details"));
        finishPageLoad();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, passedMatch, startPageLoad, completeLoadingStep, finishPageLoad]);

  const handleConfirm = async () => {
    if (!match || !currentUserId || isProcessing) return;

    try {
      setIsProcessing(true);
      await confirmMatch(match.id);
      // Refresh match data
      const response = await getMatchDetails(match.id);
      const matchData = response?.result;
      if (matchData) {
        setMatch(matchData);
      }
    } catch (err) {
      console.error("Failed to confirm match:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!match || !currentUserId || isProcessing) return;

    try {
      setIsProcessing(true);
      await rejectMatch(match.id);
      navigate(-1);
    } catch (err) {
      console.error("Failed to reject match:", err);
      setIsProcessing(false);
    }
  };

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleClickPlayer = (id?: number) => {
    if (!id) return;
    navigate(`/player/${id}`);
  };

  useEffect(() => {
    setTitle("Match Details");
    setShowBackButton(true);
    setOnBackClick(() => handleBack);

    return () => {
      setTitle(null);
      setShowBackButton(false);
      setOnBackClick(undefined);
    };
  }, [setTitle, setShowBackButton, setOnBackClick, handleBack]);

  if (loading) {
    return <MatchDetailsSkeleton />;
  }

  if (error || !match) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="text-destructive mb-4">
              {error || "Match not found"}
            </div>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  // Use perspective user for team arrangement and colors, fallback to logged-in user
  // This ensures matches are shown from the perspective of the profile being viewed
  const effectiveUserId = perspectiveUserId || currentUserId;
  const { teamA, teamB } = arrangeTeamsForUser(
    match.teams,
    effectiveUserId || undefined
  );
  const games = getGamePairs(teamA, teamB);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <div className="space-y-1">
          {match.eventName && (
            <h1 className="text-lg font-semibold">{match.eventName}</h1>
          )}
          {match.venue && (
            <div className="text-sm text-muted-foreground">
              {match.location && match.location.trim() !== match.venue.trim()
                ? `${match.venue} • ${match.location}`
                : match.venue}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {match.eventDate}
            {match.tournament ? ` • ${match.tournament}` : ""}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
          <div className="justify-self-start">
            <TeamHeader team={teamA} onClickPlayer={handleClickPlayer} />
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <MatchScoreDisplay
              games={games}
              currentUserId={effectiveUserId || undefined}
              size="large"
            />
          </div>
          <div className="justify-self-end">
            <TeamHeader team={teamB} onClickPlayer={handleClickPlayer} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

        {!match.confirmed && (
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Awaiting Validation From
            </h3>
            <div className="space-y-2">
              {match.teams.map((team) =>
                [team.player1, team.player2]
                  .filter((p) => p && p.validatedMatch === false)
                  .map((p) => (
                    <button
                      key={p!.id}
                      type="button"
                      onClick={() => handleClickPlayer(p!.id)}
                      className="flex items-center gap-3 p-2 rounded-md border w-full text-left hover:bg-accent transition-colors"
                    >
                      <Avatar name={p!.fullName} src={p!.imageUrl} size="sm" />
                      <span className="text-sm font-medium hover:underline">
                        {p!.fullName}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        )}

        {needsValidation && (
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Action Required
            </h3>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 hover:opacity-90"
                style={{ color: "var(--success)", backgroundColor: "color-mix(in oklab, var(--success) 12%, transparent)" }}
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Validating..." : "Validate Match"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 hover:opacity-90"
                style={{ color: "var(--destructive)", backgroundColor: "color-mix(in oklab, var(--destructive) 12%, transparent)" }}
                onClick={handleReject}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Rejecting..." : "Reject Match"}
              </Button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground font-mono text-center">
            Match ID: {match.id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailsPage;
