import { useState, useCallback } from 'react';

// Enhanced accessibility utilities for WCAG 2.1 AA compliance
export const useAccessibility = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announceToScreenReader = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      setAnnouncements((prev) => [...prev, message]);

      // Clear announcement after screen reader processes it
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((msg) => msg !== message));
      }, 1000);
    },
    []
  );

  const generateAriaDescribedBy = useCallback((ids: string[]) => {
    return ids.filter(Boolean).join(' ');
  }, []);

  const getAriaLabel = useCallback((label?: string, required?: boolean, error?: string) => {
    if (error) return `${label || ''} Error: ${error}`;
    if (required) return `${label || ''} Required`;
    return label;
  }, []);

  return {
    announcements,
    announceToScreenReader,
    generateAriaDescribedBy,
    getAriaLabel,
  };
};

// Screen reader announcement component
interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  priority = 'polite',
  className = '',
}) => {
  return (
    <div role="status" aria-live={priority} aria-atomic="true" className={`sr-only ${className}`}>
      {message}
    </div>
  );
};

// Skip links hook
export const useSkipLinks = () => {
  const skipToContent = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return { skipToContent };
};

// Enhanced keyboard navigation hook
export const useEnhancedKeyboardNavigation = (
  items: any[],
  onSelect: (item: any) => void,
  loop = true
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev + 1;
            return loop ? next % items.length : Math.min(next, items.length - 1);
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev - 1;
            return loop ? (next + items.length) % items.length : Math.max(next, 0);
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onSelect(items[focusedIndex]);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
      }
    },
    [items, focusedIndex, onSelect, loop]
  );

  return { focusedIndex, handleKeyDown };
};

