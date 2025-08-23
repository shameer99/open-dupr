import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MatchCard from "@/components/player/MatchCard";
import {
  ValidationQueueSkeleton,
  LoadingPage,
} from "@/components/ui/loading-skeletons";
import { usePageLoading } from "@/lib/loading-context";
import { getPendingMatches, getMyProfile } from "@/lib/api";
import { ArrowLeft, CheckCircle } from "lucide-react";
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

const ValidationQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingMatches, setPendingMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();

  const loadPendingMatches = useCallback(async () => {
    try {
      setLoading(true);
      startPageLoad([
        "Getting profile",
        "Loading matches",
        "Filtering matches",
      ]);
      completeLoadingStep("Getting profile");
      const profile = await getMyProfile();
      const userId = profile?.result?.id;
      if (!userId) throw new Error("Unable to get user profile");

      setCurrentUserId(userId);
      completeLoadingStep("Loading matches");
      const matches = await getPendingMatches();

      // Filter matches where the current user needs to validate
      const userPendingMatches = matches.filter((match: MatchData) => {
        return match.teams.some((team) =>
          [team.player1, team.player2].some(
            (player) =>
              player && player.id === userId && player.validatedMatch === false
          )
        );
      }) as MatchData[];

      completeLoadingStep("Filtering matches");
      setPendingMatches(userPendingMatches);
      finishPageLoad();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load pending matches"));
      finishPageLoad();
    } finally {
      setLoading(false);
    }
  }, [startPageLoad, completeLoadingStep, finishPageLoad]);

  useEffect(() => {
    loadPendingMatches();
  }, [loadPendingMatches]);

  if (loading) {
    return (
      <LoadingPage>
        <ValidationQueueSkeleton />
      </LoadingPage>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Validation Queue</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {pendingMatches.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold">All caught up!</h3>
                  <p className="text-muted-foreground">
                    You have no matches pending validation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {pendingMatches.length}{" "}
              {pendingMatches.length === 1 ? "match" : "matches"} awaiting your
              validation
            </div>

            {pendingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                perspectiveUserId={currentUserId || undefined}
                loggedInUserId={currentUserId || undefined}
                onMatchUpdate={() => {
                  // Reload pending matches when a match is updated
                  loadPendingMatches();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationQueuePage;
