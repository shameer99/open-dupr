import React, { useCallback, useEffect, useState } from "react";
import MatchCard from "@/components/player/MatchCard";
import { LoadingPage, FeedSkeleton } from "@/components/ui/loading-skeletons";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { usePageLoading } from "@/lib/loading-context";
import { useHeader } from "@/lib/header-context";
import { getFeed, getMyProfile } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/utils";
import type { Match, MatchTeam } from "@/components/player/shared/match-utils";

interface PostResponse {
  id: string;
  activityId: string;
  actor: {
    id: number;
    name: string;
    profileImage: string;
    isFollow: boolean;
  };
  verb: string;
  content: string;
  reactionCounts: Record<string, number>;
  ownReactions: Record<string, unknown[]>;
  tags: unknown[];
  hashtags: string[];
  images: string[];
  matches: FeedMatch[];
  location: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

interface FeedPlayer {
  id: number;
  fullName: string;
  email?: string;
  verifiedEmail?: boolean;
  imageUrl?: string | null;
  status?: string;
  referralCode?: string;
  allowSubstitution?: boolean;
  postMatchRating?: unknown;
  validatedMatch?: unknown;
}

interface FeedTeam {
  id: number;
  priority?: number;
  player1?: unknown;
  player2?: unknown;
  game1: number;
  game2: number;
  game3: number;
  game4: number;
  game5: number;
  winner: boolean;
  delta?: unknown;
  player1SinglesRating?: unknown;
  player1DoublesRating?: unknown;
  player2SinglesRating?: unknown;
  player2DoublesRating?: unknown;
  teamRating?: unknown;
  teamPlayer1?: FeedPlayer | null;
  teamPlayer2?: FeedPlayer | null;
  leagueMatchTeamId?: number;
  preMatchRatingAndImpact?: Record<string, unknown>;
  playerIds?: number[];
}

interface FeedMatch {
  id: number;
  userId?: number;
  venue?: string | null;
  location?: string;
  matchScoreAdded?: boolean;
  tournament?: string | null;
  league?: string | null;
  eventDate: string;
  eventFormat: string;
  scoreFormat?: unknown;
  confirmed?: boolean;
  confirmationThreshold?: number;
  teams: FeedTeam[];
  status?: string;
  modified?: string;
  created?: string;
  event?: string;
  matchSource?: string;
  clubId?: unknown;
  leagueId?: unknown;
  bracketId?: unknown;
  leagueMatchId?: unknown;
  matchType?: string;
  usedInInitialization?: boolean;
  eloCalculated?: boolean;
  validator?: unknown;
  creator?: unknown;
  clientId?: unknown;
  isProMatch?: boolean;
  isEloRatedMatch?: boolean;
  isPreEloMatch?: boolean;
  playerIds?: number[];
}

// Transform feed API match data to MatchCard expected format
function transformFeedMatch(feedMatch: FeedMatch): Match {
  return {
    id: feedMatch.id,
    venue: feedMatch.venue || undefined,
    location: feedMatch.location,
    tournament: feedMatch.tournament || undefined,
    eventDate: feedMatch.eventDate,
    eventFormat: feedMatch.eventFormat,
    teams: feedMatch.teams
      .filter((team) => team.teamPlayer1) // Only include teams with player1
      .map(
        (team: FeedTeam): MatchTeam => ({
          id: team.id,
          player1: {
            id: team.teamPlayer1!.id,
            fullName: team.teamPlayer1!.fullName,
            imageUrl: team.teamPlayer1!.imageUrl || undefined,
            validatedMatch: Boolean(team.teamPlayer1!.validatedMatch),
            postMatchRating: team.teamPlayer1!.postMatchRating as { singles?: number; doubles?: number } | null,
          },
          player2: team.teamPlayer2
            ? {
                id: team.teamPlayer2.id,
                fullName: team.teamPlayer2.fullName,
                imageUrl: team.teamPlayer2.imageUrl || undefined,
                validatedMatch: Boolean(team.teamPlayer2.validatedMatch),
                postMatchRating: team.teamPlayer2.postMatchRating as { singles?: number; doubles?: number } | null,
              }
            : null,
          winner: team.winner,
          game1: team.game1,
          game2: team.game2,
          game3: team.game3,
          game4: team.game4,
          game5: team.game5,
          delta: team.delta as string | undefined,
          preMatchRatingAndImpact: team.preMatchRatingAndImpact as Record<string, string | number | null | undefined> | undefined,
        })
      ),
    confirmed: feedMatch.confirmed,
    status: feedMatch.status,
  };
}

const FeedPage: React.FC = () => {
  const { setTitle } = useHeader();
  const [feedPosts, setFeedPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();

  useEffect(() => {
    setTitle("Feed");
  }, [setTitle]);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      startPageLoad(["Getting profile", "Loading feed", "Processing matches"]);

      completeLoadingStep("Getting profile");
      const profile = await getMyProfile();
      const userId = profile?.result?.id;
      if (!userId) throw new Error("Unable to get user profile");

      setCurrentUserId(userId);
      completeLoadingStep("Loading feed");
      const feedData = await getFeed(userId);

      completeLoadingStep("Processing matches");
      const posts = feedData?.results || [];
      // Filter to only show MATCH verb posts (exclude POSTs)
      const matchPosts = posts.filter(
        (post: PostResponse) => post.verb === "MATCH"
      );
      setFeedPosts(matchPosts);

      finishPageLoad();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load feed"));
      finishPageLoad();
    } finally {
      setLoading(false);
    }
  }, [startPageLoad, completeLoadingStep, finishPageLoad]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Extract all matches from feed posts and transform them
  const allMatches = feedPosts.flatMap((post) =>
    post.matches.map((match) => transformFeedMatch(match))
  );

  if (loading) {
    return (
      <LoadingPage>
        <FeedSkeleton />
      </LoadingPage>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            Error Loading Feed
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadFeed}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadFeed}>
      <div className="space-y-4 p-4">
        {allMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">
                No matches in your feed
              </p>
              <p className="text-sm">
                Follow more players to see their matches here!
              </p>
            </div>
          </div>
        ) : (
          allMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId || undefined}
              onMatchUpdate={loadFeed}
            />
          ))
        )}
      </div>
    </PullToRefresh>
  );
};

export default FeedPage;
