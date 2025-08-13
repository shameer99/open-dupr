import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOtherUserStats,
  getOtherUserFollowInfo,
  getOtherUserMatchHistory,
  getPlayerById,
  getMyProfile,
} from "@/lib/api";
import PlayerProfile from "../player/PlayerProfile";
import type { Player } from "@/lib/types";

const OtherUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);

        const myProfile = await getMyProfile();
        const currentUserId = myProfile?.result?.id;

        if (currentUserId && currentUserId === parseInt(id)) {
          navigate("/profile", { replace: true });
          return;
        }

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
            },
          };
        }

        const ratings = playerDetail?.result?.ratings;
        if (playerDetail?.result) {
          userProfile = {
            ...userProfile,
            fullName: playerDetail?.result?.fullName ?? userProfile.fullName,
            imageUrl: playerDetail?.result?.imageUrl ?? userProfile.imageUrl,
            location:
              playerDetail?.result?.shortAddress ?? userProfile.location,
            birthdate: playerDetail?.result?.birthdate ?? userProfile.birthdate,
            gender: playerDetail?.result?.gender ?? userProfile.gender,
            age:
              typeof playerDetail?.result?.age === "number"
                ? playerDetail?.result?.age
                : userProfile.age,
            stats: {
              singles: ratings?.singles ?? userProfile.stats.singles,
              doubles: ratings?.doubles ?? userProfile.stats.doubles,
            },
          };
        }

        setPlayer(userProfile);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load user profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, navigate]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!player) {
    return <div className="container mx-auto p-4">User not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <PlayerProfile player={player} isSelf={false} />
    </div>
  );
};

export default OtherUserPage;
