# SIPOMA Enhanced Design System

## Overview

Design system modern dan vibrant untuk aplikasi SIPOMA dengan pendekatan colorful, gradient-rich, dan interactive components yang menciptakan pengalaman pengguna yang engaging dan professional.

## Enhanced Color Palette

### Primary Gradient Colors (Fire Theme)

```typescript
primary: {
  50: '#fef7ee',   // Warm cream
  100: '#fed7aa',  // Light peach
  200: '#fdb582',  // Soft orange
  300: '#fc8f54',  // Medium orange
  400: '#fb6b2a',  // Vibrant orange
  500: '#ea5234',  // Primary fire red
  600: '#dc2626',  // Deep red
  700: '#b91c1c',  // Darker red
  800: '#991b1b',  // Rich red
  900: '#7c2d12'   // Deepest red
}
```

### Secondary Gradient Colors (Ocean Theme)

```typescript
secondary: {
  50: '#f0f9ff',   // Lightest sky
  100: '#e0f2fe',  // Light cyan
  200: '#bae6fd',  // Soft blue
  300: '#7dd3fc',  // Medium blue
  400: '#38bdf8',  // Bright blue
  500: '#0ea5e9',  // Primary ocean
  600: '#0284c7',  // Deep blue
  700: '#0369a1',  // Navy blue
  800: '#075985',  // Rich navy
  900: '#0c4a6e'   // Deepest ocean
}
```

### Accent Colors (Rainbow Spectrum)

```typescript
accent: {
  purple: { 500: '#8b5cf6', gradient: 'from-purple-500 to-pink-500' },
  emerald: { 500: '#10b981', gradient: 'from-emerald-500 to-teal-500' },
  rose: { 500: '#f43f5e', gradient: 'from-rose-500 to-pink-500' },
  amber: { 500: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
  indigo: { 500: '#6366f1', gradient: 'from-indigo-500 to-purple-500' },
  lime: { 500: '#84cc16', gradient: 'from-lime-500 to-green-500' }
}
```

### Status Colors (Enhanced)

- **Success**: Emerald gradient (#10b981 → #059669)
- **Warning**: Amber gradient (#f59e0b → #d97706)
- **Error**: Red gradient (#ef4444 → #dc2626)
- **Info**: Blue gradient (#3b82f6 → #2563eb)
- **New**: Purple gradient (#8b5cf6 → #7c3aed)

### Neutral Colors

```typescript
neutral: {
  0: '#ffffff',   // Pure white
  50: '#f9fafb',   // Light gray
  500: '#6b7280',  // Medium gray
  900: '#111827'   // Dark gray
}
```

## Typography Scale

### Font Family

- **Sans**: Inter, system-ui, sans-serif
- **Mono**: JetBrains Mono, monospace

### Font Sizes

```typescript
fontSize: {
  xs: '0.75rem',   // 12px - Captions
  sm: '0.875rem',  // 14px - Small text
  base: '1rem',    // 16px - Body text
  lg: '1.125rem',  // 18px - Large body
  xl: '1.25rem',   // 20px - Headings
  '2xl': '1.5rem', // 24px - Subheadings
  '3xl': '1.875rem', // 30px - Section headers
  '4xl': '2.25rem',  // 36px - Page titles
  '5xl': '3rem'     // 48px - Hero titles
}
```

### Font Weights

```typescript
fontWeight: {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800'
}
```

## Spacing System (8pt Grid)

### Spacing Scale

```typescript
spacing: {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  24: '6rem'      // 96px
}
```

### Usage Guidelines

- Use multiples of 4px for all spacing
- Consistent padding: 16px (4) for cards, 24px (6) for sections
- Margin between elements: 8px (2) small, 16px (4) medium, 24px (6) large

## Component Library

### Enhanced Button Component

#### Variants

- **Primary**: Fire gradient (orange→red) dengan shadow & hover lift
- **Secondary**: Ocean gradient (blue→cyan) dengan ripple effect
- **Success**: Emerald gradient (green→teal) dengan success animation
- **Warning**: Sunset gradient (amber→orange) dengan pulse effect
- **Error**: Crimson gradient (red→rose) dengan shake animation
- **Purple**: Magic gradient (purple→pink) dengan glow effect
- **Rainbow**: Multi-color gradient dengan shifting colors
- **Glass**: Glassmorphism dengan backdrop blur & subtle gradients
- **Neon**: Bright colors dengan outer glow
- **Gradient**: Custom gradients dengan dynamic hover effects

#### Sizes

- **xs**: 32px height, small icons/buttons
- **sm**: 36px height, compact interfaces
- **md**: 44px height, standard buttons (recommended)
- **lg**: 52px height, prominent actions
- **xl**: 60px height, hero buttons

#### Elevation Levels

- **none**: Flat design
- **sm**: Subtle shadow
- **md**: Standard shadow
- **lg**: Prominent shadow
- **xl**: Strong shadow
- **2xl**: Maximum shadow

#### States

- **Default**: Normal state with gradient backgrounds
- **Hover**: Lift effect (-translate-y), enhanced shadow, color shift
- **Active**: Scale down (98%), instant feedback
- **Focus**: Enhanced ring with glow effect
- **Disabled**: Reduced opacity, no interactions
- **Loading**: Animated spinner, wait cursor, disabled state

#### Micro-interactions

- **Hover**: Smooth lift animation with shadow enhancement
- **Press**: Scale feedback with ripple effect
- **Focus**: Glowing ring with backdrop blur
- **Loading**: Smooth spinner animation
- **Ripple**: Material Design inspired ripple effect

### Input Component

#### Input Sizes

- **sm**: 36px height, compact forms
- **base**: 40px height, standard inputs
- **lg**: 44px height, prominent inputs

#### Input States

- **Default**: Neutral styling
- **Focus**: Blue ring, enhanced border
- **Error**: Red border, light red background
- **Success**: Green border, light green background
- **Disabled**: Gray background, not editable

### Enhanced Card Component

#### Card Variants

- **Elevated**: Multi-layer shadows dengan gradient background
- **Glass**: Glassmorphism dengan backdrop blur
- **Gradient**: Subtle background gradients
- **Neon**: Glowing borders dengan vibrant accents
- **Interactive**: Hover transforms dengan color transitions
- **Feature**: Hero cards dengan large gradients
- **Floating**: Enhanced shadows dengan hover lift

#### Padding Options

- **sm**: 16px padding
- **md**: 24px padding
- **lg**: 32px padding

## General Usage Guidelines

- **Primary**: Main brand actions, primary buttons
- **Secondary**: Secondary actions, links
- **Success**: Confirmations, positive feedback
- **Warning**: Warnings, caution states
- **Error**: Errors, destructive actions
- **Neutral**: Text, backgrounds, borders

### Typography Hierarchy

1. **Page Title**: 5xl bold (48px)
2. **Section Header**: 4xl semibold (36px)
3. **Subsection**: 3xl medium (30px)
4. **Card Title**: 2xl semibold (24px)
5. **Body Large**: lg normal (18px)
6. **Body**: base normal (16px)
7. **Body Small**: sm normal (14px)
8. **Caption**: xs normal (12px)

### Spacing Rules

- **Component padding**: 16px (4) minimum
- **Element spacing**: 8px (2) between related items
- **Section spacing**: 24px (6) between sections
- **Page margins**: 16px (4) on mobile, 24px (6) on desktop

## Accessibility

### Color Contrast

- All text meets WCAG AA standards (4.5:1 ratio)
- Interactive elements have 3:1 contrast minimum
- Focus indicators are clearly visible

### Focus Management

- Visible focus rings on all interactive elements
- Logical tab order
- Keyboard navigation support

### Semantic HTML

- Proper heading hierarchy (h1-h6)
- ARIA labels where needed
- Screen reader friendly

## Implementation

### CSS Custom Properties

```css
:root {
  --color-primary-500: #ef4444;
  --color-neutral-0: #ffffff;
  --spacing-4: 1rem;
  --font-size-base: 1rem;
}
```

### Tailwind Configuration

Colors and spacing are configured in `tailwind.config.js` to match the design system.

### Component Props

All components accept standard HTML attributes plus design system specific props:

- `variant`: Visual style variant
- `size`: Size variant
- `disabled`: Disabled state
- `loading`: Loading state

## Maintenance

### Adding New Components

1. Define variants and sizes in design system
2. Create component with TypeScript interfaces
3. Add to component library exports
4. Update documentation

### Updating Colors/Typography

1. Update design system constants
2. Update Tailwind config
3. Test across all components
4. Update documentation

### Version Control

- Design system changes require design review
- Component updates need accessibility testing
- Documentation must be updated with code changes
