import { useEffect, useState } from "react";

export const ScrollProgressIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const calculateScrollProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      // Calculate the total scrollable height
      const scrollableHeight = documentHeight - windowHeight;
      
      // Calculate the scroll percentage
      const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
      
      setScrollProgress(progress);
    };

    // Calculate on mount
    calculateScrollProgress();

    // Add scroll event listener
    window.addEventListener("scroll", calculateScrollProgress, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", calculateScrollProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-muted/30">
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-150 ease-out"
        style={{
          width: `${scrollProgress}%`,
          boxShadow: scrollProgress > 0 ? "0 0 10px hsl(var(--accent) / 0.5)" : "none",
        }}
      />
    </div>
  );
};
