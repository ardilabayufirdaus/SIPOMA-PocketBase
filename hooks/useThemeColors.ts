import { useTheme } from '../contexts/ThemeContext';
import { colors as designColors } from '../utils/designSystem';

export const useThemeColors = () => {
  const { theme } = useTheme();

  // For now, return the same colors - can be extended for theme-specific variants
  return {
    ...designColors,
    // Override neutral colors based on theme
    neutral:
      theme === 'dark'
        ? {
            0: '#ffffff',
            50: '#0f172a',
            100: '#1e293b',
            200: '#334155',
            300: '#475569',
            400: '#64748b',
            500: '#94a3b8',
            600: '#cbd5e1',
            700: '#e2e8f0',
            800: '#f1f5f9',
            900: '#f8fafc',
            950: '#ffffff',
          }
        : designColors.neutral,
  };
};
