import React, { useEffect, useState } from "react";
import PlayerHeader from "./PlayerHeader";
import PlayerRatings from "./PlayerRatings";
import MatchHistory from "./MatchHistory";
import PlayerStats from "./PlayerStats";
import { getFollowInfo } from "@/lib/api";
import type { Player, FollowInfo } from "@/lib/types";

interface PlayerProfileProps {
  player: Player;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player }) => {
  const [followInfo, setFollowInfo] = useState<FollowInfo | null>(null);

  useEffect(() => {
    const fetchFollowInfo = async () => {
      try {
        const data = await getFollowInfo(player.id);
        setFollowInfo(data.result);
      } catch (err) {
        console.warn("Failed to load follow info:", err);
      }
    };

    fetchFollowInfo();
  }, [player.id]);

  return (
    <div>
      <PlayerHeader
        name={player.fullName}
        imageUrl={player.imageUrl}
        location={
          player.location ||
          player.addresses?.[0]?.formattedAddress ||
          "Unknown location"
        }
        playerId={player.id}
        followInfo={followInfo}
      />
      <div className="mt-8">
        <PlayerRatings
          singles={player.stats?.singles ?? null}
          doubles={player.stats?.doubles ?? null}
        />
      </div>
      <div className="mt-8">
        <PlayerStats playerId={player.id} />
      </div>
      <div className="mt-8">
        <MatchHistory playerId={player.id} />
      </div>
    </div>
  );
};

export default PlayerProfile;
