import React, { useState, useEffect, useRef, ReactNode } from "react";

interface LazyChartProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

const LazyChart: React.FC<LazyChartProps> = ({
  children,
  fallback = (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
      <div className="animate-pulse text-gray-500">Loading chart...</div>
    </div>
  ),
  rootMargin = "50px",
  threshold = 0.1,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          // Once visible, stop observing to prevent unnecessary re-renders
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {hasBeenVisible ? children : fallback}
    </div>
  );
};

export default LazyChart;
