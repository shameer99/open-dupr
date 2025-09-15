import React, { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { FollowInfo } from "@/lib/types";

interface FollowStatsProps {
  followInfo: FollowInfo | null;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const FollowStats: React.FC<FollowStatsProps> = ({
  followInfo,
  onFollowersClick,
  onFollowingClick,
}) => {
  const [animatedFollowers, setAnimatedFollowers] = useState<number | null>(null);
  const [animatedFollowing, setAnimatedFollowing] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevFollowInfo = useRef<FollowInfo | null>(null);

  useEffect(() => {
    if (followInfo) {
      // Check if this is an update to existing data
      const isUpdate = prevFollowInfo.current && 
        (prevFollowInfo.current.followers !== followInfo.followers || 
         prevFollowInfo.current.followings !== followInfo.followings);

      if (isUpdate) {
        // Animate number changes
        setIsTransitioning(true);
        
        const timer = setTimeout(() => {
          setAnimatedFollowers(followInfo.followers);
          setAnimatedFollowing(followInfo.followings);
          setIsTransitioning(false);
        }, 100);

        return () => clearTimeout(timer);
      } else {
        // Initial load
        const timer = setTimeout(() => {
          setAnimatedFollowers(followInfo.followers);
          setAnimatedFollowing(followInfo.followings);
          setIsLoaded(true);
        }, 150);

        return () => clearTimeout(timer);
      }
    }
    
    prevFollowInfo.current = followInfo;
  }, [followInfo]);

  const AnimatedCount: React.FC<{ 
    count: number | null; 
    isLoading: boolean; 
    isTransitioning: boolean;
  }> = ({ count, isLoading, isTransitioning }) => {
    if (isLoading) {
      return <Skeleton className="h-4 w-8 inline-block" />;
    }
    
    return (
      <span 
        className={`font-semibold transition-all duration-300 ease-out ${
          isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-1'
        } ${
          isTransitioning ? 'scale-110 text-primary' : 'scale-100'
        }`}
      >
        {count ?? 0}
      </span>
    );
  };

  return (
    <div className="flex space-x-6 text-sm">
      <button
        onClick={followInfo ? onFollowersClick : undefined}
        className={`transition-all duration-200 ${
          followInfo 
            ? 'hover:text-gray-600 cursor-pointer hover:scale-105' 
            : 'cursor-default'
        }`}
        disabled={!followInfo}
      >
        <AnimatedCount 
          count={animatedFollowers} 
          isLoading={!followInfo} 
          isTransitioning={isTransitioning}
        />
        <span className="text-muted-foreground ml-1">followers</span>
      </button>
      <button
        onClick={followInfo ? onFollowingClick : undefined}
        className={`transition-all duration-200 ${
          followInfo 
            ? 'hover:text-gray-600 cursor-pointer hover:scale-105' 
            : 'cursor-default'
        }`}
        disabled={!followInfo}
      >
        <AnimatedCount 
          count={animatedFollowing} 
          isLoading={!followInfo} 
          isTransitioning={isTransitioning}
        />
        <span className="text-muted-foreground ml-1">following</span>
      </button>
    </div>
  );
};

export default FollowStats;