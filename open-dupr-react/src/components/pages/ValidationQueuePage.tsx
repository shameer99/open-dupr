import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MatchCard from "@/components/player/MatchCard";
import {
  ValidationQueueSkeleton,
  LoadingPage,
} from "@/components/ui/loading-skeletons";
import PullToRefresh from "@/components/ui/pull-to-refresh";
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

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <PullToRefresh onRefresh={loadPendingMatches} disabled={loading}>
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
          <h1 className="text-2xl font-bold">Validation Queue</h1>
        </div>

        {loading ? (
          <LoadingPage>
            <ValidationQueueSkeleton />
          </LoadingPage>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadPendingMatches}>Try Again</Button>
          </div>
        ) : pendingMatches.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">All Caught Up!</h2>
            <p className="text-muted-foreground">
              No pending matches to validate.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={currentUserId || undefined}
                onMatchUpdate={loadPendingMatches}
              />
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default ValidationQueuePage;
