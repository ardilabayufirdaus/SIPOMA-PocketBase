import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [theme, setTheme] = useState<Theme>('system');

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = () => {
      root.classList.remove('light', 'dark');
      // Always use light theme for consistency
      root.classList.add('light');
      setIsDark(false);
    };

    updateTheme();
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('sipoma-theme', newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Theme Toggle Component - Disabled since we only use system theme (light mode)
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  // Return null since we only have one theme now
  return null;
};

// Theme Selector Dropdown Component - Also disabled
export const ThemeSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  // Return null since we only have one theme now
  return null;
};
