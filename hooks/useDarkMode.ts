import { useState, useEffect, useCallback } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  const setDark = useCallback((value: boolean) => {
    setIsDark(value);
    localStorage.setItem('theme', value ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no manual preference is stored
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { isDark, toggle, setDark };
};

// Hook for theme-aware colors
export const useThemeColors = () => {
  const { isDark } = useDarkMode();

  const colors = {
    background: isDark ? 'var(--color-neutral-900)' : 'var(--color-neutral-0)',
    surface: isDark ? 'var(--color-neutral-800)' : 'var(--color-neutral-50)',
    text: isDark ? 'var(--color-neutral-100)' : 'var(--color-neutral-900)',
    textSecondary: isDark ? 'var(--color-neutral-400)' : 'var(--color-neutral-600)',
    border: isDark ? 'var(--color-neutral-700)' : 'var(--color-neutral-200)',
    primary: 'var(--color-primary-600)',
    success: 'var(--color-success-600)',
    error: 'var(--color-error-600)',
    warning: 'var(--color-warning-600)',
  };

  return colors;
};

// Hook for theme-aware shadows
export const useThemeShadows = () => {
  const { isDark } = useDarkMode();

  const shadows = {
    sm: isDark ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: isDark
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  return shadows;
};


