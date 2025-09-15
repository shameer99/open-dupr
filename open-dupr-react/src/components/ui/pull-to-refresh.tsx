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

  const isPageAtTop = () =>
    typeof window !== "undefined" && window.scrollY <= 0;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      if (scrollTop > 0) return;

      // Also require the page/window to be at the very top to avoid false triggers when body scrolls
      if (!isPageAtTop()) return;

      startY.current = e.touches[0].clientY;
      startScrollTop.current = scrollTop;
      currentY.current = startY.current;
      isDragging.current = true;
      hasPreventedDefault.current = false;
      setShowSuccessPulse(false);
    },
    [disabled, isRefreshing]
  );

  const cancelDrag = () => {
    isDragging.current = false;
    hasPreventedDefault.current = false;
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // If either the container or the page is no longer at the top, cancel
      if (container.scrollTop > 0 || !isPageAtTop()) {
        cancelDrag();
        return;
      }

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY <= 0) return;

      const shouldPreventDefault = startScrollTop.current <= 0 && deltaY > 5;

      if (shouldPreventDefault && !hasPreventedDefault.current) {
        e.preventDefault();
        hasPreventedDefault.current = true;
      }

      const distance = Math.min(deltaY * 0.7, threshold * 2.5);
      setPullDistance(distance);
      setIsPulling(distance > 10);
    },
    [disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0 || startScrollTop.current > 0) {
      cancelDrag();
      return;
    }

    // If page is not at top at release, do not trigger
    if (!isPageAtTop()) {
      cancelDrag();
      return;
    }

    isDragging.current = false;
    hasPreventedDefault.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setShowSuccessPulse(true);
        setTimeout(() => setShowSuccessPulse(false), 1000);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
      }}
    >
      {(isPulling || isRefreshing || showSuccessPulse) && (
        <div
          className="absolute top-0 left-0 right-0 h-1 overflow-hidden z-50"
          style={{
            backgroundColor: "var(--input)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            className={cn(
              "absolute top-0 right-1/2 h-full transition-all duration-300 ease-out",
              showSuccessPulse && "animate-pulse"
            )}
            style={{
              width: `${leftWidth}%`,
              transformOrigin: "right center",
              backgroundColor: showSuccessPulse ? "var(--success)" : "var(--primary)",
            }}
          />

          <div
            className={cn(
              "absolute top-0 left-1/2 h-full transition-all duration-300 ease-out",
              showSuccessPulse && "animate-pulse"
            )}
            style={{
              width: `${rightWidth}%`,
              transformOrigin: "left center",
              backgroundColor: showSuccessPulse ? "var(--success)" : "var(--primary)",
            }}
          />
        </div>
      )}

      <div className="relative">{children}</div>
    </div>
  );
};

export default PullToRefresh;
