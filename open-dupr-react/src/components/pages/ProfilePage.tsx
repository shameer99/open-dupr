import React, { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/api";
import PlayerProfile from "../player/PlayerProfile";
import type { Player } from "@/lib/types";

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();


        setProfile(data.result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {profile && <PlayerProfile player={profile} isSelf />}
    </div>
  );
};

export default ProfilePage;
