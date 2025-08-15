import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { followUser, unfollowUser } from "@/lib/api";
import type { FollowUser } from "@/lib/types";

interface FollowButtonProps {
  user: FollowUser;
  onFollowStateChange: (userId: number, isFollowed: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  user,
  onFollowStateChange,
}) => {
  const [isFollowed, setIsFollowed] = useState(user.isFollow);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    setIsFollowed(user.isFollow);
  }, [user.isFollow]);

  const handleFollow = async () => {
    setIsProcessingFollow(true);
    try {
      await followUser(user.id);
      setIsFollowed(true);
      onFollowStateChange(user.id, true);
    } catch (error) {
      console.error("Failed to follow user:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsProcessingFollow(false);
    }
  };

  const handleUnfollow = async () => {
    setShowConfirmModal(false);
    setIsProcessingFollow(true);
    try {
      await unfollowUser(user.id);
      setIsFollowed(false);
      onFollowStateChange(user.id, false);
    } catch (error) {
      console.error("Failed to unfollow user:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsProcessingFollow(false);
    }
  };

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const buttonText = isFollowed ? "Following" : "Follow";

  return (
    <>
      <Button
        variant={isFollowed ? "outline" : "default"}
        disabled={isProcessingFollow}
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click event
          if (isFollowed) {
            openConfirmModal();
          } else {
            handleFollow();
          }
        }}
        className="w-24"
      >
        {isProcessingFollow ? "..." : buttonText}
      </Button>

      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        ariaLabel="Confirm unfollow"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Unfollow {user.name}?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to unfollow {user.name}? They will no longer
            appear in your following list.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnfollow}>
              Unfollow
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FollowButton;
