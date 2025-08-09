import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlayerProfile } from "@/lib/api";
import PlayerProfile from "../player/PlayerProfile";
import type { Player } from "@/lib/types";

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!id) return;
      try {
        const data = await getPlayerProfile(id);
        setPlayer(data.result);
      } catch {
        // TODO: Handle error properly
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div>{player && <PlayerProfile player={player} />}</div>;
};

export default PlayerPage;
