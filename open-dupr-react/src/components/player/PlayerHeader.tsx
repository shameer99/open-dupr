import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ui/avatar";
import type { FollowInfo } from "@/lib/types";

interface PlayerHeaderProps {
  name: string;
  imageUrl: string;
  location: string;
  playerId: number;
  followInfo?: FollowInfo | null;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  name,
  imageUrl,
  location,
  playerId,
  followInfo,
}) => {
  const navigate = useNavigate();

  const handleFollowersClick = () => {
    navigate(`/user/${playerId}/followers`);
  };

  const handleFollowingClick = () => {
    navigate(`/user/${playerId}/following`);
  };

  return (
    <div className="flex items-start space-x-4">
      <Avatar src={imageUrl} name={name} size="xl" />
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-1">
          {name?.trim().replace(/\s+/g, " ")}
        </h1>
        <p className="text-muted-foreground mb-3">{location}</p>

        {followInfo && (
          <div className="flex space-x-6 text-sm">
            <button
              onClick={handleFollowersClick}
              className="hover:text-gray-600 transition-colors"
            >
              <span className="font-semibold">{followInfo.followers}</span>{" "}
              <span className="text-muted-foreground">followers</span>
            </button>
            <button
              onClick={handleFollowingClick}
              className="hover:text-gray-600 transition-colors"
            >
              <span className="font-semibold">{followInfo.followings}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHeader;
