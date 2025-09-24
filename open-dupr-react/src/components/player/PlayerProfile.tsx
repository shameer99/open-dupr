import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/lib/header-context";
import PlayerHeader from "./PlayerHeader";
import MatchHistory from "./MatchHistory";
import PlayerStatsRatings from "./PlayerStatsRatings";
import {
  followUser,
  getFollowInfo,
  unfollowUser,
  getPendingMatches,
} from "@/lib/api";
import type { Player, FollowInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

interface PlayerProfileProps {
  player: Player;
  isSelf?: boolean;
  initialFollowInfo?: FollowInfo | null;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({
  player,
  isSelf = false,
  initialFollowInfo = null,
}) => {
  const { setTitle, setAvatarUrl, setPlayerName } = useHeader();
  const navigate = useNavigate();
  const [followInfo, setFollowInfo] = useState<FollowInfo | null>(
    initialFollowInfo
  );
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [pendingMatchesCount, setPendingMatchesCount] = useState<number>(0);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setTitle(entry.isIntersecting ? "" : player.fullName);
        setAvatarUrl(entry.isIntersecting ? null : player.imageUrl || null);
        setPlayerName(entry.isIntersecting ? null : player.fullName);
      },
      { rootMargin: "-80px 0px 0px 0px" }
    );

    const currentHeader = headerRef.current;

    if (currentHeader) {
      observer.observe(currentHeader);
    }

    return () => {
      if (currentHeader) {
        observer.unobserve(currentHeader);
      }
      setTitle(null);
      setAvatarUrl(null);
      setPlayerName(null);
    };
  }, [player.fullName, player.imageUrl, setTitle, setAvatarUrl, setPlayerName]);

  useEffect(() => {
    // Only fetch follow info if not provided as prop
    if (!initialFollowInfo) {
      const fetchFollowInfo = async () => {
        try {
          const data = await getFollowInfo(player.id);
          setFollowInfo(data.result);
        } catch {
          // Error handling intentionally silent
        }
      };

      fetchFollowInfo();
    }
  }, [player.id, initialFollowInfo]);

  useEffect(() => {
    const fetchPendingMatches = async () => {
      if (!isSelf) return;

      try {
        const pendingMatches = await getPendingMatches();

        const userPendingCount = pendingMatches.filter(
          (match: {
            confirmed?: boolean;
            teams: {
              player1?: { id?: number; validatedMatch?: boolean };
              player2?: { id?: number; validatedMatch?: boolean };
            }[];
          }) => {
            if (match.confirmed) return false;

            return match.teams.some((team) =>
              [team.player1, team.player2].some(
                (teamPlayer) =>
                  teamPlayer &&
                  teamPlayer.id === player.id &&
                  teamPlayer.validatedMatch === false
              )
            );
          }
        ).length;

        setPendingMatchesCount(userPendingCount);
      } catch {
        // Error handling intentionally silent
      }
    };

    fetchPendingMatches();
  }, [player.id, isSelf]);

  const actionNode = (
    <div className="flex items-stretch gap-2 w-full">
      {isSelf ? (
        <>
          <Button
            variant="outline"
            onClick={() => setShowEditInfo(true)}
            className="w-full"
            data-testid="edit-profile-button"
          >
            Edit Profile
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          disabled={isProcessingFollow || !followInfo}
          className="w-full profile-follow-button"
          onClick={async () => {
            if (!followInfo) return;
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
            } catch {
              // Error handling intentionally silent
            } finally {
              setIsProcessingFollow(false);
            }
          }}
        >
          {!followInfo
            ? "Loading..."
            : followInfo.isFollowed
            ? "Unfollow"
            : "Follow"}
        </Button>
      )}
    </div>
  );

  return (
    <div>
      {isSelf && pendingMatchesCount > 0 && (
        <div
          className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => navigate("/validation-queue")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/validation-queue");
            }
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {pendingMatchesCount}{" "}
                {pendingMatchesCount === 1 ? "match" : "matches"} pending
                validation
              </p>
              <p className="text-xs text-yellow-600">
                Click to review and validate your matches
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div ref={headerRef}>
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
        </div>
        <div className="mt-6 lg:mt-0">
          <PlayerStatsRatings
            playerId={player.id}
            singles={player.stats?.singles ?? null}
            doubles={player.stats?.doubles ?? null}
            singlesReliabilityScore={player.stats?.singlesReliabilityScore}
            doublesReliabilityScore={player.stats?.doublesReliabilityScore}
          />
        </div>
      </div>
      <div className="mt-6">
        <MatchHistory playerId={player.id} isSelf={isSelf} />
      </div>

      <Modal
        open={showEditInfo}
        onClose={() => setShowEditInfo(false)}
        ariaLabel="Edit Profile info"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Edit Profile</h2>
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
