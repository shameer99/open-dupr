/**
 * Utility functions for handling View Transition API
 */

// Define types for View Transition API
interface ViewTransitionAPI {
  startViewTransition(callback: () => void | Promise<void>): {
    finished: Promise<void>;
  };
}

/**
 * Performs a view transition if the API is supported, otherwise executes the callback immediately
 */
export function startViewTransition(callback: () => void | Promise<void>): Promise<void> {
  if (!('startViewTransition' in document)) {
    // Fallback for browsers that don't support View Transition API
    const result = callback();
    return Promise.resolve(result);
  }

  const documentWithTransition = document as unknown as ViewTransitionAPI;
  const transition = documentWithTransition.startViewTransition(callback);
  return transition.finished.catch(() => {
    // Handle transition interruption gracefully
  });
}

/**
 * Navigates to a new route with view transition
 */
export function navigateWithTransition(
  navigate: (to: string, options?: Record<string, unknown>) => void,
  to: string,
  options?: Record<string, unknown>
): Promise<void> {
  return startViewTransition(() => {
    navigate(to, options);
  });
}

/**
 * Navigates to a profile page with slide transition
 */
export function navigateToProfile(
  navigate: (to: string, options?: Record<string, unknown>) => void,
  to: string,
  options?: Record<string, unknown>
): Promise<void> {
  return startViewTransition(() => {
    // Add profile transition class to document root
    document.documentElement.classList.add('profile-transition');
    
    // Remove the class after transition completes
    setTimeout(() => {
      document.documentElement.classList.remove('profile-transition');
    }, 600); // Slightly longer than animation duration
    
    navigate(to, options);
  });
}

/**
 * Navigates back with slide transition
 */
export function navigateBack(
  navigate: (delta: number) => void,
  delta: number = -1
): Promise<void> {
  return startViewTransition(() => {
    // Add back transition class to document root
    document.documentElement.classList.add('back-transition');
    
    // Remove the class after transition completes
    setTimeout(() => {
      document.documentElement.classList.remove('back-transition');
    }, 500); // Slightly longer than animation duration
    
    navigate(delta);
  });
}

/**
 * Checks if View Transition API is supported
 */
export function isViewTransitionSupported(): boolean {
  return 'startViewTransition' in document;
}

/**
 * Sets up view transition names for specific elements
 */
export function setViewTransitionName(element: HTMLElement, name: string): void {
  if (isViewTransitionSupported()) {
    (element.style as unknown as Record<string, string>).viewTransitionName = name;
  }
}

/**
 * Removes view transition name from an element
 */
export function removeViewTransitionName(element: HTMLElement): void {
  if (isViewTransitionSupported()) {
    (element.style as unknown as Record<string, string>).viewTransitionName = '';
  }
}