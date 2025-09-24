import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLoading } from "@/lib/loading-context";

interface NavigationProgressProps {
  className?: string;
}

export const NavigationProgress: React.FC<NavigationProgressProps> = ({
  className = "",
}) => {
  const location = useLocation();
  const { loadingState, isLoading } = useLoading();
  const [isVisible, setIsVisible] = useState(false);
  const [prevPathname, setPrevPathname] = useState("");

  // Handle navigation detection and loading visibility
  useEffect(() => {
    // Initialize with current pathname
    if (prevPathname === "") {
      setPrevPathname(location.pathname);
      return;
    }

    // Detect route change by comparing pathname
    if (location.pathname !== prevPathname) {
      setPrevPathname(location.pathname);

      // Don't show progress bar immediately - wait to see if loading actually starts
      // If no loading state becomes active within 150ms, don't show progress at all
      const showProgressTimer = setTimeout(() => {
        if (!isLoading) {
          // Loading is taking long enough that we should show some feedback
          setIsVisible(true);
          setTimeout(() => {
            setIsVisible(false);
          }, 200);
        }
      }, 150);

      return () => clearTimeout(showProgressTimer);
    }
  }, [location.pathname, prevPathname, isLoading]);

  // Handle loading state changes
  useEffect(() => {
    if (isLoading) {
      // Only show progress if loading takes more than 500ms
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 500);

      return () => clearTimeout(showTimer);
    } else if (!isLoading && isVisible) {
      // Delay hiding to show completion
      setTimeout(() => {
        setIsVisible(false);
      }, 200);
    }
  }, [isLoading, isVisible]);

  if (!isVisible) return null;

  const progress = isLoading ? loadingState.progress : 100;

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-1 overflow-hidden z-50 ${className}`}
      style={{
        backgroundColor: "var(--input)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="h-full transition-all duration-200 ease-out shadow-sm"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--primary)",
          transition: isLoading ? "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : "width 0.1s ease-out", // Faster with ease-out-expo
        }}
      />
    </div>
  );
};

export default NavigationProgress;
