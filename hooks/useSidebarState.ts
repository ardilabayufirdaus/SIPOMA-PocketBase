import { useState, useEffect } from "react";

interface UseSidebarStateOptions {
  isMobile: boolean;
  isOpen: boolean;
  autoHide?: boolean;
}

interface UseSidebarStateReturn {
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  showSidebar: boolean;
  shouldCollapse: boolean;
}

/**
 * Custom hook untuk mengelola state sidebar dengan auto-hide functionality
 * @param options - Options untuk konfigurasi sidebar
 * @returns Object berisi state sidebar
 */
export const useSidebarState = ({
  isMobile,
  isOpen,
  autoHide = true,
}: UseSidebarStateOptions): UseSidebarStateReturn => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!autoHide || isMobile);

  useEffect(() => {
    if (isMobile) {
      setShowSidebar(isOpen);
      return;
    }

    if (!autoHide) {
      setShowSidebar(true);
      return;
    }

    // Untuk desktop dengan auto-hide, selalu tampilkan collapsed version
    setShowSidebar(true);
  }, [isMobile, autoHide, isOpen, isHovered]);

  const shouldCollapse = !isMobile && autoHide && !isHovered;

  return {
    isHovered,
    setIsHovered,
    showSidebar,
    shouldCollapse,
  };
};
