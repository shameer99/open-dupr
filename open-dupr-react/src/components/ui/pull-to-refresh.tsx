import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);
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
      setShowSuccessPulse(false); // Reset success state
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
        // Show success pulse after refresh completes
        setShowSuccessPulse(true);
        setTimeout(() => setShowSuccessPulse(false), 1000);
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
  const leftWidth = isRefreshing || showSuccessPulse ? 50 : 50 - progress * 50;
  const rightWidth = isRefreshing || showSuccessPulse ? 50 : 50 - progress * 50;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{
        touchAction: "pan-y", // Allow vertical scrolling
        WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
      }}
    >
      {/* Progress bar - similar to navigation progress */}
      {(isPulling || isRefreshing || showSuccessPulse) && (
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden z-50"
          style={{
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {/* Left side of progress bar */}
          <div
            className={cn(
              "absolute top-0 right-1/2 h-full bg-blue-600 transition-all duration-300 ease-out",
              showSuccessPulse && "animate-pulse bg-green-500"
            )}
            style={{
              width: `${leftWidth}%`,
              transformOrigin: "right center",
            }}
          />

          {/* Right side of progress bar */}
          <div
            className={cn(
              "absolute top-0 left-1/2 h-full bg-blue-600 transition-all duration-300 ease-out",
              showSuccessPulse && "animate-pulse bg-green-500"
            )}
            style={{
              width: `${rightWidth}%`,
              transformOrigin: "left center",
            }}
          />
        </div>
      )}

      {/* Content - no transforms to avoid scroll interference */}
      <div className="relative">{children}</div>
    </div>
  );
};

export default PullToRefresh;
