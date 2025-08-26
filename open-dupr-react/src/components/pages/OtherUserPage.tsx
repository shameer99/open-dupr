import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOtherUserStats,
  getOtherUserFollowInfo,
  getOtherUserMatchHistory,
  getPlayerById,
  getMyProfile,
} from "@/lib/api";
import PlayerProfile from "../player/PlayerProfile";
import {
  PlayerProfileSkeleton,
  LoadingPage,
} from "@/components/ui/loading-skeletons";
import { usePageLoading } from "@/lib/loading-context";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import type { Player } from "@/lib/types";

const OtherUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();

  const fetchUserProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      startPageLoad(["Checking user", "Fetching profile", "Loading user data"]);

      completeLoadingStep("Checking user");
      const myProfile = await getMyProfile();
      const currentUserId = myProfile?.result?.id;

      if (currentUserId && currentUserId === parseInt(id)) {
        finishPageLoad();
        navigate("/profile", { replace: true });
        return;
      }

      completeLoadingStep("Fetching profile");

      const [, , matchHistoryData, playerDetail] = await Promise.all([
        getOtherUserStats(parseInt(id)).catch(() => null),
        getOtherUserFollowInfo(parseInt(id)).catch(() => null),
        getOtherUserMatchHistory(parseInt(id), 0, 1).catch(() => null),
        getPlayerById(parseInt(id)).catch(() => null),
      ]);

      let userProfile: Player | null = null;

      if (matchHistoryData?.result?.hits?.[0]?.teams) {
        const userId = parseInt(id);
        const teams = matchHistoryData.result.hits[0].teams;

        for (const team of teams) {
          if (team.player1?.id === userId) {
            userProfile = {
              id: userId,
              fullName: team.player1.fullName,
              imageUrl: team.player1.imageUrl,
              location: "Unknown location",
              stats: {
                singles: "NR",
                doubles: "NR",
                singlesReliabilityScore: undefined,
                doublesReliabilityScore: undefined,
              },
            };
            break;
          } else if (team.player2?.id === userId) {
            userProfile = {
              id: userId,
              fullName: team.player2.fullName,
              imageUrl: team.player2.imageUrl,
              location: "Unknown location",
              stats: {
                singles: "NR",
                doubles: "NR",
                singlesReliabilityScore: undefined,
                doublesReliabilityScore: undefined,
              },
            };
            break;
          }
        }
      }

      if (!userProfile) {
        userProfile = {
          id: parseInt(id),
          fullName: `User ${id}`,
          imageUrl: "",
          location: "Unknown location",
          stats: {
            singles: "0.0",
            doubles: "0.0",
            singlesReliabilityScore: undefined,
            doublesReliabilityScore: undefined,
          },
        };
      }

      const ratings = playerDetail?.result?.ratings;
      if (playerDetail?.result) {
        userProfile = {
          ...userProfile,
          fullName: playerDetail?.result?.fullName ?? userProfile.fullName,
          imageUrl: playerDetail?.result?.imageUrl ?? userProfile.imageUrl,
          location: playerDetail?.result?.shortAddress ?? userProfile.location,
          birthdate: playerDetail?.result?.birthdate ?? userProfile.birthdate,
          gender: playerDetail?.result?.gender ?? userProfile.gender,
          age:
            typeof playerDetail?.result?.age === "number"
              ? playerDetail?.result?.age
              : userProfile.age,
          stats: {
            singles: ratings?.singles ?? userProfile.stats.singles,
            doubles: ratings?.doubles ?? userProfile.stats.doubles,
            singlesReliabilityScore:
              ratings?.singlesReliabilityScore ??
              userProfile.stats.singlesReliabilityScore,
            doublesReliabilityScore:
              ratings?.doublesReliabilityScore ??
              userProfile.stats.doublesReliabilityScore,
          },
        };
      }

      completeLoadingStep("Loading user data");
      setPlayer(userProfile);
      finishPageLoad();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load user profile"
      );
      finishPageLoad();
    } finally {
      setLoading(false);
    }
  }, [id, navigate, startPageLoad, completeLoadingStep, finishPageLoad]);

  useEffect(() => {
    void fetchUserProfile();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <LoadingPage>
        <PlayerProfileSkeleton />
      </LoadingPage>
    );
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!player) {
    return <div className="container mx-auto p-4">User not found</div>;
  }

  return (
    <PullToRefresh onRefresh={fetchUserProfile} disabled={loading}>
      <div className="container mx-auto p-4">
        <PlayerProfile player={player} isSelf={false} />
      </div>
    </PullToRefresh>
  );
};

export default OtherUserPage;
