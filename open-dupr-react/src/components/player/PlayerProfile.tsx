import React, { useEffect, useState } from "react";
import PlayerHeader from "./PlayerHeader";
import PlayerRatings from "./PlayerRatings";
import MatchHistory from "./MatchHistory";
import PlayerStats from "./PlayerStats";
import { followUser, getFollowInfo, unfollowUser } from "@/lib/api";
import type { Player, FollowInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";

interface PlayerProfileProps {
  player: Player;
  isSelf?: boolean;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({
  player,
  isSelf = false,
}) => {
  const [followInfo, setFollowInfo] = useState<FollowInfo | null>(null);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);

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

  const actionNode = (
    <div className="flex items-stretch gap-2 w-full sm:w-auto">
      {isSelf ? (
        <>
          <Button
            variant="outline"
            onClick={() => setShowEditInfo(true)}
            className="w-full sm:w-auto"
            data-testid="edit-profile-button"
          >
            Edit profile
          </Button>
        </>
      ) : followInfo ? (
        <Button
          variant="outline"
          disabled={isProcessingFollow}
          className="w-full sm:w-auto"
          onClick={async () => {
            try {
              setIsProcessingFollow(true);
              if (followInfo.isFollowed) {
                await unfollowUser(player.id);
                setFollowInfo({
                  ...followInfo,
                  isFollowed: false,
                  followers: Math.max(0, (followInfo.followers ?? 0) - 1),
                });
              } else {
                await followUser(player.id);
                setFollowInfo({
                  ...followInfo,
                  isFollowed: true,
                  followers: (followInfo.followers ?? 0) + 1,
                });
              }
            } catch (err) {
              console.warn("Failed to toggle follow:", err);
            } finally {
              setIsProcessingFollow(false);
            }
          }}
        >
          {followInfo.isFollowed ? "Unfollow" : "Follow"}
        </Button>
      ) : null}
    </div>
  );

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
        birthdate={player.birthdate}
        gender={player.gender}
        age={player.age}
        followInfo={followInfo}
        action={actionNode}
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

      <Modal
        open={showEditInfo}
        onClose={() => setShowEditInfo(false)}
        ariaLabel="Edit profile info"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Edit profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Not yet available on Open DUPR. Please edit your profile on the
            official DUPR site/app for now.
          </p>
          <div className="flex justify-end">
            <Button variant="default" onClick={() => setShowEditInfo(false)}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlayerProfile;
