import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ui/avatar";
import Modal from "@/components/ui/modal";
import { X } from "lucide-react";
import type { FollowInfo } from "@/lib/types";
import EnlargedAvatar from "./EnlargedAvatar";

interface PlayerHeaderProps {
  name: string;
  imageUrl: string;
  location: string;
  playerId: number;
  birthdate?: string;
  gender?: string;
  age?: number;
  followInfo?: FollowInfo | null;
  action?: React.ReactNode;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  name,
  imageUrl,
  location,
  playerId,
  birthdate,
  gender,
  age: providedAge,
  followInfo,
  action,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleFollowersClick = () => {
    navigate(`/user/${playerId}/social?tab=followers`);
  };

  const handleFollowingClick = () => {
    navigate(`/user/${playerId}/social?tab=following`);
  };

  const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    const birth = new Date(dateString);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age >= 0 && age < 130 ? age : null;
  };

  const formatGender = (value?: string): string | null => {
    if (!value) return null;
    const normalized = value.toUpperCase();
    if (normalized === "MALE") return "Male";
    if (normalized === "FEMALE") return "Female";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const age = providedAge ?? calculateAge(birthdate ?? undefined);
  const genderLabel = formatGender(gender ?? undefined);
  const metaParts = [location, age ? `${age}` : null, genderLabel].filter(
    Boolean
  ) as string[];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-start space-x-4">
          <Avatar
            src={imageUrl}
            name={name}
            size="xl"
            onClick={() => setIsModalOpen(true)}
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">
              {name?.trim().replace(/\s+/g, " ")}
            </h1>
            <p className="text-muted-foreground mb-3">
              {metaParts.join(" · ")}
            </p>

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
        {action ? <div className="w-full">{action}</div> : null}
      </div>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="bg-transparent shadow-none border-none w-auto max-w-none"
      >
        <div className="relative">
          <EnlargedAvatar src={imageUrl} name={name} />
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-2 right-2 p-1 bg-gray-800/50 text-white rounded-full hover:bg-gray-800/80 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
      </Modal>
    </>
  );
};

export default PlayerHeader;
