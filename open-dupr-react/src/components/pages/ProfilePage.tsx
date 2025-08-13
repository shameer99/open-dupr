import React, { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/api";
import PlayerProfile from "../player/PlayerProfile";
import {
  PlayerProfileSkeleton,
  LoadingPage,
} from "@/components/ui/loading-skeletons";
import { usePageLoading } from "@/lib/loading-context";
import type { Player } from "@/lib/types";

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Start loading with defined steps
        startPageLoad(["Fetching profile", "Loading profile data"]);

        completeLoadingStep("Fetching profile");
        const data = await getMyProfile();

        completeLoadingStep("Loading profile data");
        setProfile(data.result);

        finishPageLoad();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        finishPageLoad(); // Complete loading even on error
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [startPageLoad, completeLoadingStep, finishPageLoad]);

  if (loading) {
    return (
      <LoadingPage>
        <PlayerProfileSkeleton />
      </LoadingPage>
    );
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
