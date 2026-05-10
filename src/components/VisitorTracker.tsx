import { useVisitorTracking } from "@/hooks/useVisitorTracking";

/**
 * Invisible component that tracks page visits
 * Add this to App.tsx to track all page visits
 */
export const VisitorTracker = () => {
  useVisitorTracking();
  return null;
};
