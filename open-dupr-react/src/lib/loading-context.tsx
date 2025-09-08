/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";

interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  loadingSteps: string[];
  completedSteps: string[];
}

interface LoadingContextType {
  loadingState: LoadingState;
  startLoading: (steps?: string[]) => void;
  completeStep: (step: string) => void;
  setProgress: (progress: number) => void;
  finishLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    loadingSteps: [],
    completedSteps: [],
  });

  const startLoading = useCallback((steps: string[] = []) => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      loadingSteps: steps,
      completedSteps: [],
    });
  }, []);

  const completeStep = useCallback((step: string) => {
    setLoadingState((prev) => {
      const newCompletedSteps = [...prev.completedSteps, step];
      const totalSteps = prev.loadingSteps.length;
      const progress =
        totalSteps > 0 ? (newCompletedSteps.length / totalSteps) * 100 : 0;

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        progress: Math.min(progress, 100),
      };
    });
  }, []);

  const setProgress = useCallback((progress: number) => {
    setLoadingState((prev) => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  const finishLoading = useCallback(() => {
    setLoadingState((prev) => ({
      ...prev,
      progress: 100,
    }));

    setTimeout(() => {
      setLoadingState({
        isLoading: false,
        progress: 0,
        loadingSteps: [],
        completedSteps: [],
      });
    }, 200);
  }, []);

  const value: LoadingContextType = {
    loadingState,
    startLoading,
    completeStep,
    setProgress,
    finishLoading,
    isLoading: loadingState.isLoading,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

// Hook for pages to easily manage their loading state
export const usePageLoading = () => {
  const { startLoading, completeStep, finishLoading, setProgress } =
    useLoading();

  const startPageLoad = useCallback(
    (steps: string[]) => {
      startLoading(steps);
    },
    [startLoading]
  );

  const completeLoadingStep = useCallback(
    (step: string) => {
      completeStep(step);
    },
    [completeStep]
  );

  const finishPageLoad = useCallback(() => {
    finishLoading();
  }, [finishLoading]);

  const startSimpleLoad = useCallback(() => {
    startLoading([]);
    setProgress(50); // Show some initial progress
  }, [startLoading, setProgress]);

  const updateProgress = useCallback(
    (progress: number) => {
      setProgress(progress);
    },
    [setProgress]
  );

  return {
    startPageLoad,
    completeLoadingStep,
    finishPageLoad,
    startSimpleLoad,
    updateProgress,
  };
};
