import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFollowing } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import type { FollowUser } from "@/lib/types";

const FollowingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const followingData = await getFollowing(parseInt(id), 0, 50);
        setFollowing(followingData.results || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load following"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUserClick = (userId: number) => {
    navigate(`/player/${userId}`);
  };

  const handleBackClick = () => {
    navigate("/profile");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={handleBackClick} className="mr-4">
          ← Back
        </Button>
        <h1 className="text-xl font-bold">Following</h1>
      </div>

      {following.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No following to display.
        </p>
      ) : (
        <div className="space-y-3">
          {following.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border"
              onClick={() => handleUserClick(user.id)}
            >
              <Avatar src={user.profileImage} name={user.name} size="md" />
              <div className="flex-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">
                  Click to view profile
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowingPage;
