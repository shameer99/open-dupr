import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getOtherUserStats,
  getOtherUserFollowInfo,
  getOtherUserMatchHistory,
  getPlayerById,
} from "@/lib/api";
import PlayerProfile from "../player/PlayerProfile";
import type { Player } from "@/lib/types";

const OtherUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);

        // Fetch minimal details and match history; also fetch full player by id for ratings
        const [, , matchHistoryData, playerDetail] = await Promise.all([
          getOtherUserStats(parseInt(id)).catch(() => null),
          getOtherUserFollowInfo(parseInt(id)).catch(() => null),
          getOtherUserMatchHistory(parseInt(id), 0, 1).catch(() => null),
          getPlayerById(parseInt(id)).catch(() => null),
        ]);

        // Extract user profile information from match history if available
        // (since match history contains player info)
        let userProfile: Player | null = null;

        if (matchHistoryData?.result?.hits?.[0]?.teams) {
          // Find the user in the match teams
          const userId = parseInt(id);
          const teams = matchHistoryData.result.hits[0].teams;

          for (const team of teams) {
            if (team.player1?.id === userId) {
              userProfile = {
                id: userId,
                fullName: team.player1.fullName,
                imageUrl: team.player1.imageUrl,
                location: "Unknown location", // Match history doesn't include location
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

        // If we couldn't get user info from match history, create a minimal profile
        if (!userProfile) {
          // We can get basic info from followers/following data if available
          // For now, create a minimal profile with just the ID
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

        // Override ratings from player detail endpoint
        const ratings = playerDetail?.result?.ratings;
        if (ratings) {
          userProfile = {
            ...userProfile,
            fullName: playerDetail?.result?.fullName ?? userProfile.fullName,
            imageUrl: playerDetail?.result?.imageUrl ?? userProfile.imageUrl,
            location:
              playerDetail?.result?.shortAddress ?? userProfile.location,
            stats: {
              singles: ratings.singles ?? userProfile.stats.singles,
              doubles: ratings.doubles ?? userProfile.stats.doubles,
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
  }, [id]);

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
      <PlayerProfile player={player} />
    </div>
  );
};

export default OtherUserPage;
