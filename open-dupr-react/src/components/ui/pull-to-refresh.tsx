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
  const currentY = useRef<number>(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const scrollTop = containerRef.current?.scrollTop || 0;
      if (scrollTop > 0) return; // Only allow pull when at top

      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      isDragging.current = true;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || disabled || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY * 0.6, threshold * 2);
        setPullDistance(distance);
        setIsPulling(distance > 10);
      }
    },
    [disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || disabled || isRefreshing) return;

    isDragging.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
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
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const scale = 0.8 + progress * 0.2;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ touchAction: "pan-y" }}
    >
      {/* Pull indicator - positioned absolutely above content */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all duration-300 ease-out pointer-events-none",
          isPulling ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          height: threshold,
          marginTop: `-${threshold}px`,
        }}
      >
        <div className="flex flex-col items-center gap-3 text-gray-500 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm">
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              isRefreshing && "animate-pulse"
            )}
            style={{
              transform: isRefreshing ? undefined : `scale(${scale})`,
            }}
          >
            <RefreshCw
              className={cn(
                "w-8 h-8 transition-transform duration-300",
                isRefreshing && "animate-spin"
              )}
              style={{
                transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-center">
            {isRefreshing ? "Refreshing..." : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          "transition-transform duration-300 ease-out",
          isPulling && "transform"
        )}
        style={{
          transform: isPulling
            ? `translateY(${Math.min(pullDistance * 0.3, threshold * 0.3)}px)`
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
