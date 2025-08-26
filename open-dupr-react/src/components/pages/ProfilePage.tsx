import React, { useEffect, useState, useCallback } from "react";
import { getMyProfile } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/utils";
import PlayerProfile from "../player/PlayerProfile";
import {
  PlayerProfileSkeleton,
  LoadingPage,
} from "@/components/ui/loading-skeletons";
import { usePageLoading } from "@/lib/loading-context";
import PullToRefresh from "@/components/ui/pull-to-refresh";
import type { Player } from "@/lib/types";

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startPageLoad, completeLoadingStep, finishPageLoad } =
    usePageLoading();

  const fetchProfile = useCallback(async () => {
    try {
      // Start loading with defined steps
      startPageLoad(["Fetching profile", "Loading profile data"]);

      completeLoadingStep("Fetching profile");
      const data = await getMyProfile();

      completeLoadingStep("Loading profile data");
      setProfile(data.result);

      finishPageLoad();
    } catch (err) {
      setError(extractApiErrorMessage(err, "An error occurred"));
      finishPageLoad(); // Complete loading even on error
    } finally {
      setLoading(false);
    }
  }, [startPageLoad, completeLoadingStep, finishPageLoad]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    <PullToRefresh onRefresh={fetchProfile} disabled={loading}>
      <div className="container mx-auto p-4">
        {profile && <PlayerProfile player={profile} isSelf />}
      </div>
    </PullToRefresh>
  );
};

export default ProfilePage;
