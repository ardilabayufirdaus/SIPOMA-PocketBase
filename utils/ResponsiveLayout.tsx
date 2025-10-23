/**
 * Responsive Layout Components
 * Optimized layout system for multi-device compatibility
 */

import React, { useState, useEffect } from 'react';
import { forwardRef } from 'react';

// =============================================================================
// RESPONSIVE UTILITIES (LOCAL DEFINITIONS)
// =============================================================================

const DESIGN_TOKENS = {
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

const useBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= DESIGN_TOKENS.breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= DESIGN_TOKENS.breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= DESIGN_TOKENS.breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= DESIGN_TOKENS.breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

const useResponsiveValue = <T,>(values: {
  default: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}): T => {
  const breakpoint = useBreakpoint();
  return values[breakpoint] || values.default;
};

// =============================================================================
// RESPONSIVE CONTAINER
// =============================================================================

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  centerContent?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  centerContent = true,
  className = '',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-12',
  };

  const alignmentClass = centerContent ? 'mx-auto' : '';

  return (
    <div
      className={`w-full ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${alignmentClass} ${className}`}
    >
      {children}
    </div>
  );
};

// =============================================================================
// RESPONSIVE GRID
// =============================================================================

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  const getGridCols = (breakpoint: string) => {
    const colCount = columns[breakpoint as keyof typeof columns] || columns.default;
    return `grid-cols-${colCount}`;
  };

  const gridClasses = [
    'grid',
    getGridCols('default'),
    columns.sm ? `sm:${getGridCols('sm')}` : '',
    columns.md ? `md:${getGridCols('md')}` : '',
    columns.lg ? `lg:${getGridCols('lg')}` : '',
    columns.xl ? `xl:${getGridCols('xl')}` : '',
    gapClasses[gap],
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={`${gridClasses} ${className}`}>{children}</div>;
};

// =============================================================================
// RESPONSIVE FLEX
// =============================================================================

interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: {
    default: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  className?: string;
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = { default: 'row' },
  align = 'center',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className = '',
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  const getDirectionClass = (breakpoint: string) => {
    const dir = direction[breakpoint as keyof typeof direction] || direction.default;
    return directionClasses[dir];
  };

  const flexClasses = [
    'flex',
    getDirectionClass('default'),
    direction.sm ? `sm:${getDirectionClass('sm')}` : '',
    direction.md ? `md:${getDirectionClass('md')}` : '',
    direction.lg ? `lg:${getDirectionClass('lg')}` : '',
    alignClasses[align],
    justifyClasses[justify],
    gapClasses[gap],
    wrap ? 'flex-wrap' : 'flex-nowrap',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={`${flexClasses} ${className}`}>{children}</div>;
};

// =============================================================================
// RESPONSIVE SIDEBAR
// =============================================================================

interface ResponsiveSidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: {
    default: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
  overlay?: boolean;
  className?: string;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  children,
  isOpen,
  onClose,
  position = 'left',
  width = { default: '280px', sm: '320px' },
  overlay = true,
  className = '',
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';

  const getWidth = () => {
    if (breakpoint === 'lg' || breakpoint === 'xl') return width.lg || width.md || width.default;
    if (breakpoint === 'md') return width.md || width.default;
    if (breakpoint === 'sm') return width.sm || width.default;
    return width.default;
  };

  const sidebarClasses = [
    'fixed top-0 h-full bg-white dark:bg-neutral-900 shadow-xl transition-transform duration-300 ease-in-out z-50',
    position === 'left' ? 'left-0' : 'right-0',
    isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full',
  ].join(' ');

  const overlayClasses = [
    'fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40',
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
  ].join(' ');

  return (
    <>
      {/* Overlay */}
      {overlay && isMobile && <div className={overlayClasses} onClick={onClose} />}

      {/* Sidebar */}
      <div className={`${sidebarClasses} ${className}`} style={{ width: getWidth() }}>
        {children}
      </div>
    </>
  );
};

// =============================================================================
// RESPONSIVE HEADER
// =============================================================================

interface ResponsiveHeaderProps {
  children: React.ReactNode;
  height?: {
    default: string;
    sm?: string;
  };
  sticky?: boolean;
  className?: string;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  children,
  height = { default: '64px', sm: '72px' },
  sticky = true,
  className = '',
}) => {
  const breakpoint = useBreakpoint();

  const getHeight = () => {
    if (breakpoint === 'sm' || breakpoint === 'xs') return height.sm || height.default;
    return height.default;
  };

  const headerClasses = [
    'w-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-all duration-200',
    sticky ? 'sticky top-0 z-40' : '',
  ].join(' ');

  return (
    <header className={`${headerClasses} ${className}`} style={{ height: getHeight() }}>
      <div className="h-full px-4 sm:px-6 flex items-center">{children}</div>
    </header>
  );
};

// =============================================================================
// RESPONSIVE CARD GRID
// =============================================================================

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  minCardWidth?: {
    default: string;
    sm?: string;
    md?: string;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveCardGrid: React.FC<ResponsiveCardGridProps> = ({
  children,
  minCardWidth = { default: '280px', sm: '320px', md: '360px' },
  gap = 'md',
  className = '',
}) => {
  const breakpoint = useBreakpoint();

  const getMinWidth = () => {
    if (breakpoint === 'md' || breakpoint === 'lg' || breakpoint === 'xl') {
      return minCardWidth.md || minCardWidth.sm || minCardWidth.default;
    }
    if (breakpoint === 'sm') {
      return minCardWidth.sm || minCardWidth.default;
    }
    return minCardWidth.default;
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div
      className={`grid ${gapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${getMinWidth()}, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

// =============================================================================
// RESPONSIVE TEXT
// =============================================================================

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    default: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { default: 'base' },
  weight = 'normal',
  align = 'left',
  className = '',
}) => {
  const breakpoint = useBreakpoint();

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const getSizeClass = () => {
    if (breakpoint === 'md' || breakpoint === 'lg' || breakpoint === 'xl') {
      return sizeClasses[size.md || size.sm || size.default];
    }
    if (breakpoint === 'sm') {
      return sizeClasses[size.sm || size.default];
    }
    return sizeClasses[size.default];
  };

  const textClasses = [getSizeClass(), weightClasses[weight], alignClasses[align]].join(' ');

  return <div className={`${textClasses} ${className}`}>{children}</div>;
};

// =============================================================================
// RESPONSIVE MODAL
// =============================================================================

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: {
    default: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    sm?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  };
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  size = { default: 'md', sm: 'full' },
  className = '',
}) => {
  const breakpoint = useBreakpoint();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const getSizeClass = () => {
    if (breakpoint === 'sm' || breakpoint === 'xs') {
      return sizeClasses[size.sm || size.default];
    }
    return sizeClasses[size.default];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl ${getSizeClass()} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// RESPONSIVE NAVIGATION
// =============================================================================

interface ResponsiveNavigationProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  children,
  orientation = 'horizontal',
  className = '',
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';

  const navClasses = [
    'flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    isMobile && orientation === 'horizontal' ? 'flex-col space-y-2' : '',
    !isMobile && orientation === 'horizontal' ? 'space-x-4' : 'space-y-2',
  ].join(' ');

  return <nav className={`${navClasses} ${className}`}>{children}</nav>;
};

// =============================================================================
// HOOKS FOR RESPONSIVE BEHAVIOR
// =============================================================================

export const useResponsiveLayout = () => {
  const breakpoint = useBreakpoint();

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';

  const getResponsiveValue = useResponsiveValue;

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveValue,
  };
};

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

export const responsiveUtils = {
  // Hide/show utilities
  hideOnMobile: 'hidden sm:block',
  hideOnTablet: 'block md:hidden',
  hideOnDesktop: 'lg:hidden',
  showOnMobile: 'block sm:hidden',
  showOnTablet: 'hidden md:block',
  showOnDesktop: 'hidden lg:block',

  // Text utilities
  textResponsive: 'text-sm sm:text-base md:text-lg',
  headingResponsive: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',

  // Spacing utilities
  spacingResponsive: 'p-4 sm:p-6 md:p-8',
  marginResponsive: 'm-2 sm:m-4 md:m-6',

  // Flex utilities
  flexResponsive: 'flex-col sm:flex-row',
  flexGapResponsive: 'gap-4 sm:gap-6 md:gap-8',
};

// =============================================================================
// EXPORT ALL RESPONSIVE COMPONENTS
// =============================================================================

export default {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveFlex,
  ResponsiveSidebar,
  ResponsiveHeader,
  ResponsiveCardGrid,
  ResponsiveText,
  ResponsiveModal,
  ResponsiveNavigation,
  useResponsiveLayout,
  responsiveUtils,
};


