import React from "react";
import { Skeleton } from "./skeleton";
import { Card, CardContent } from "./card";

// Re-export navigation progress for convenience
export { NavigationProgress } from "./navigation-progress";

export const PlayerProfileSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-16 mb-4" />
          <Skeleton className="h-10 w-20" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-10 w-20" />
        </CardContent>
      </Card>
    </div>

    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export const MatchCardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Skeleton className="h-6 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const SearchResultSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    ))}
  </div>
);

export const ValidationQueueSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-40" />
    </div>
    <Skeleton className="h-4 w-48 mb-4" />
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const PlayerStatsSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-24 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-8 w-12 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export const LoadingPage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="container mx-auto p-4">
    <div className="max-w-2xl mx-auto">{children}</div>
  </div>
);

export const FollowUserListSkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center mb-6">
      <Skeleton className="h-10 w-16 mr-4" />
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

export const MatchDetailsSkeleton: React.FC = () => (
  <div className="container mx-auto p-4 max-w-4xl">
    <div className="mb-4">
      <Skeleton className="h-10 w-20" />
    </div>

    <Card className="rounded-xl">
      <CardContent className="px-6 pt-6 pb-4">
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
          <div className="justify-self-start">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex -space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="min-w-0">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <Skeleton className="h-16 w-24" />
          </div>

          <div className="justify-self-end">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex -space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="min-w-0">
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-md border p-2"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </span>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-md border p-2"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </span>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-md border"
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
