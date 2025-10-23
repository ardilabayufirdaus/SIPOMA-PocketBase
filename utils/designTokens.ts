/**
 * Design Tokens Utility Functions
 * Provides type-safe access to design tokens and utility functions for consistent styling
 */

import { DESIGN_TOKENS } from '../components/ui/EnhancedComponents';

// Type definitions for design tokens
export type SpacingKey = keyof typeof DESIGN_TOKENS.spacing;
export type ColorKey = keyof typeof DESIGN_TOKENS.colors;
export type TypographyKey = 'fontSize' | 'fontWeight' | 'lineHeight';
export type BorderRadiusKey = keyof typeof DESIGN_TOKENS.borderRadius;
export type ShadowKey = keyof typeof DESIGN_TOKENS.shadows;
export type ZIndexKey = keyof typeof DESIGN_TOKENS.zIndex;
export type DurationKey = keyof typeof DESIGN_TOKENS.duration;
export type EasingKey = keyof typeof DESIGN_TOKENS.easing;

/**
 * Get spacing value from design tokens
 */
export const getSpacing = (key: SpacingKey): string => DESIGN_TOKENS.spacing[key];

/**
 * Get color value from design tokens
 */
export const getColor = (
  color: ColorKey,
  shade: keyof typeof DESIGN_TOKENS.colors.primary
): string => {
  return DESIGN_TOKENS.colors[color][shade];
};

/**
 * Get typography value from design tokens
 */
export const getTypography = (
  category: 'fontSize' | 'fontWeight' | 'lineHeight',
  key: string
): string => {
  const typography = DESIGN_TOKENS.typography[category];
  if (typeof typography === 'object' && typography !== null && key in typography) {
    return typography[key as keyof typeof typography] as string;
  }
  return key;
};

/**
 * Get border radius value from design tokens
 */
export const getBorderRadius = (key: BorderRadiusKey): string => DESIGN_TOKENS.borderRadius[key];

/**
 * Get shadow value from design tokens
 */
export const getShadow = (key: ShadowKey): string => DESIGN_TOKENS.shadows[key];

/**
 * Get z-index value from design tokens
 */
export const getZIndex = (key: ZIndexKey): number => DESIGN_TOKENS.zIndex[key];

/**
 * Get animation duration from design tokens
 */
export const getDuration = (key: DurationKey): string => DESIGN_TOKENS.duration[key];

/**
 * Get animation easing from design tokens
 */
export const getEasing = (key: EasingKey): string => DESIGN_TOKENS.easing[key];

/**
 * Utility function to create consistent class names using design tokens
 */
export const createDesignClass = (
  baseClass: string,
  options: {
    spacing?: { p?: SpacingKey; m?: SpacingKey; px?: SpacingKey; py?: SpacingKey };
    color?: { bg?: { color: ColorKey; shade: keyof typeof DESIGN_TOKENS.colors.primary } };
    typography?: {
      size?: keyof typeof DESIGN_TOKENS.typography.fontSize;
      weight?: keyof typeof DESIGN_TOKENS.typography.fontWeight;
    };
    borderRadius?: BorderRadiusKey;
    shadow?: ShadowKey;
  } = {}
): string => {
  const classes = [baseClass];

  // Add spacing classes
  if (options.spacing) {
    if (options.spacing.p) classes.push(`p-${getSpacing(options.spacing.p)}`);
    if (options.spacing.m) classes.push(`m-${getSpacing(options.spacing.m)}`);
    if (options.spacing.px) classes.push(`px-${getSpacing(options.spacing.px)}`);
    if (options.spacing.py) classes.push(`py-${getSpacing(options.spacing.py)}`);
  }

  // Add color classes
  if (options.color?.bg) {
    classes.push(`bg-${getColor(options.color.bg.color, options.color.bg.shade)}`);
  }

  // Add typography classes
  if (options.typography) {
    if (options.typography.size) classes.push(`text-${options.typography.size}`);
    if (options.typography.weight) classes.push(`font-${options.typography.weight}`);
  }

  // Add border radius
  if (options.borderRadius) {
    classes.push(`rounded-${options.borderRadius}`);
  }

  // Add shadow
  if (options.shadow) {
    classes.push(`shadow-${options.shadow}`);
  }

  return classes.join(' ');
};

/**
 * CSS Custom Properties for design tokens
 */
export const createCSSCustomProperties = (): string => {
  const properties: string[] = [];

  // Spacing
  Object.entries(DESIGN_TOKENS.spacing).forEach(([key, value]) => {
    properties.push(`  --spacing-${key}: ${value};`);
  });

  // Colors
  Object.entries(DESIGN_TOKENS.colors).forEach(([color, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      properties.push(`  --color-${color}-${shade}: ${value};`);
    });
  });

  // Typography
  Object.entries(DESIGN_TOKENS.typography).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        properties.push(`  --typography-${category}-${key}: ${value};`);
      });
    }
  });

  // Border radius
  Object.entries(DESIGN_TOKENS.borderRadius).forEach(([key, value]) => {
    properties.push(`  --border-radius-${key}: ${value};`);
  });

  // Shadows
  Object.entries(DESIGN_TOKENS.shadows).forEach(([key, value]) => {
    properties.push(`  --shadow-${key}: ${value};`);
  });

  // Z-index
  Object.entries(DESIGN_TOKENS.zIndex).forEach(([key, value]) => {
    properties.push(`  --z-index-${key}: ${value};`);
  });

  // Animations
  Object.entries(DESIGN_TOKENS.duration).forEach(([key, value]) => {
    properties.push(`  --duration-${key}: ${value};`);
  });

  Object.entries(DESIGN_TOKENS.easing).forEach(([key, value]) => {
    properties.push(`  --easing-${key}: ${value};`);
  });

  return `:root {\n${properties.join('\n')}\n}`;
};


