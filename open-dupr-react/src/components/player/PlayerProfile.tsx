import React from "react";
import PlayerHeader from "./PlayerHeader";
import PlayerRatings from "./PlayerRatings";
import MatchHistory from "./MatchHistory";
import SocialStats from "./SocialStats";
import type { Player } from "@/lib/types";

interface PlayerProfileProps {
  player: Player;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player }) => {
  return (
    <div className="container mx-auto p-4">
      <PlayerHeader
        name={player.fullName}
        imageUrl={player.imageUrl}
        location={
          player.location ||
          player.addresses?.[0]?.formattedAddress ||
          "Unknown location"
        }
      />
      <div className="mt-8">
        <PlayerRatings
          singles={player.stats.singles}
          doubles={player.stats.doubles}
        />
      </div>
      <div className="mt-8">
        <MatchHistory />
      </div>
      <div className="mt-8">
        <SocialStats />
      </div>
    </div>
  );
};

export default PlayerProfile;
