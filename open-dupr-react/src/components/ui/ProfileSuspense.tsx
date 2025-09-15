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
      {children}
    </Suspense>
  );
};

export default ProfileSuspense;