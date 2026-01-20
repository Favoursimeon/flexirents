import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // If there's a hash in the URL (like #section), let the browser handle it
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant", // Use instant for immediate scroll on navigation
      });
    }
  }, [pathname, hash, key]); // Added key to detect same-route navigation

  return null;
};

// Helper function to scroll to top - can be used with onClick handlers
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });
};
