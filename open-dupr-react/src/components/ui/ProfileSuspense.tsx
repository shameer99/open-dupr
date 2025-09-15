import React, { Suspense } from "react";
import {
  PlayerProfileSkeleton,
  LoadingPage,
} from "@/components/ui/loading-skeletons";

interface ProfileSuspenseProps {
  children: React.ReactNode;
}

const ProfileSuspense: React.FC<ProfileSuspenseProps> = ({ children }) => {
  return (
    <Suspense
      fallback={
        <LoadingPage>
          <PlayerProfileSkeleton />
        </LoadingPage>
      }
    >
      <div className="min-h-[400px]">
        {children}
      </div>
    </Suspense>
  );
};

export default ProfileSuspense;