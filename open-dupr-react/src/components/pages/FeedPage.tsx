import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MatchCard from "@/components/player/MatchCard";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import { usePageLoading } from "@/lib/loading-context";
import { getMyProfile, getUserFeed } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { extractApiErrorMessage } from "@/lib/utils";

type PlayerRef = {
  id?: number;
  fullName: string;
  imageUrl?: string;
  rating?: string;
  preRating?: string;
  postRating?: string;
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

type MatchData = {
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

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      startPageLoad(["Getting profile", "Loading feed"]);
      completeLoadingStep("Getting profile");
      const profile = await getMyProfile();
      const userId = profile?.result?.id;
      if (!userId) throw new Error("Unable to get user profile");
      setCurrentUserId(userId);

      completeLoadingStep("Loading feed");
      const data = await getUserFeed(userId, 10);
      const activities = (data?.results ||
        data?.result?.hits ||
        []) as unknown[];

      // Filter to MATCH activities that involve followed users (actor or tags followed)
      const matchActivities = (activities as any[]).filter(
        (a) =>
          a?.verb === "MATCH" &&
          (a?.actor?.isFollow ||
            (Array.isArray(a?.tags) && a.tags.some((t: any) => t?.isFollow)))
      );

      // Flatten matches and transform into MatchCard-compatible shape
      const transformed: MatchData[] = matchActivities
        .flatMap((a: any) => (Array.isArray(a?.matches) ? a.matches : []))
        .map((m: any) => {
          const teams = Array.isArray(m?.teams) ? m.teams : [];
          const mappedTeams: MatchTeam[] = teams.map((t: any) => {
            const p1 = t?.teamPlayer1;
            const p2 = t?.teamPlayer2;
            const player1: PlayerRef = p1
              ? {
                  id: p1.id,
                  fullName: p1.fullName,
                  imageUrl: p1.imageUrl || undefined,
                }
              : {
                  id: (t?.playerIds && t.playerIds[0]) || undefined,
                  fullName: "",
                  imageUrl: undefined,
                };
            const player2: PlayerRef | null = p2
              ? {
                  id: p2.id,
                  fullName: p2.fullName,
                  imageUrl: p2.imageUrl || undefined,
                }
              : null;

            return {
              id: t?.id,
              serial: t?.priority,
              player1,
              player2: player2 || undefined,
              winner: t?.winner,
              delta: t?.delta ?? undefined,
              teamRating: t?.teamRating ?? undefined,
              game1: t?.game1,
              game2: t?.game2,
              game3: t?.game3,
              game4: t?.game4,
              game5: t?.game5,
              preMatchRatingAndImpact: t?.preMatchRatingAndImpact,
            } as MatchTeam;
          });

          return {
            id: m?.id,
            venue: m?.venue ?? undefined,
            location: m?.location ?? undefined,
            tournament: m?.tournament ?? m?.league ?? undefined,
            eventDate: m?.eventDate,
            eventFormat: m?.eventFormat,
            teams: mappedTeams,
            noOfGames: m?.noOfGames ?? undefined,
            confirmed: m?.confirmed,
          } as MatchData;
        });

      setFeed(transformed);
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

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <PullToRefresh onRefresh={loadFeed} disabled={loading}>
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Feed</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 h-24 animate-pulse" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadFeed}>Try Again</Button>
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent matches from people you follow.
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((match) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <MatchCard
                    match={match}
                    currentUserId={currentUserId || undefined}
                    onMatchUpdate={loadFeed}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default FeedPage;
