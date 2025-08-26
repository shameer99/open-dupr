import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startScrollTop = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef(false);
  const hasPreventedDefault = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      // Allow pull-to-refresh from the top with more tolerance for padding/margins
      if (scrollTop > 20) return;

      startY.current = e.touches[0].clientY;
      startScrollTop.current = scrollTop;
      currentY.current = startY.current;
      isDragging.current = true;
      hasPreventedDefault.current = false;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      // Only handle pull-to-refresh for downward gestures
      if (deltaY <= 0) return;

      // Check if we should prevent default behavior
      // Only prevent if we're actually pulling down from the top
      const currentScrollTop = container.scrollTop;
      const shouldPreventDefault = currentScrollTop <= 20 && deltaY > 5;

      if (shouldPreventDefault && !hasPreventedDefault.current) {
        e.preventDefault();
        hasPreventedDefault.current = true;
      }

      // Calculate pull distance with less damping for better responsiveness
      const distance = Math.min(deltaY * 0.7, threshold * 2.5);
      setPullDistance(distance);
      setIsPulling(distance > 10); // Lower threshold to trigger pull state
    },
    [disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || disabled || isRefreshing) return;

    isDragging.current = false;
    hasPreventedDefault.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    // Smoothly animate back to original position
    setPullDistance(0);
    setIsPulling(false);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive listeners for better performance, but prevent default when needed
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{
        touchAction: "pan-y", // Allow vertical scrolling
        WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
      }}
    >
      {/* Pull indicator - fixed position above content */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all duration-200 ease-out pointer-events-none",
          isPulling || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: `translateY(${Math.min(pullDistance - threshold, 0)}px)`,
          height: threshold,
          marginTop: `-${threshold}px`,
        }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-600 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200">
          <RefreshCw
            className={cn(
              "w-7 h-7 transition-all duration-200",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${rotation}deg) scale(${0.8 + progress * 0.2})`,
              color: progress > 0.5 ? "#2563eb" : "#6b7280", // Blue when ready, gray when not
            }}
          />
          <span className="text-sm font-medium text-center leading-tight">
            {isRefreshing
              ? "Refreshing..."
              : progress > 0.8
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content - no transforms to avoid scroll interference */}
      <div className="relative">{children}</div>
    </div>
  );
};

export default PullToRefresh;
