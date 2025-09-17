# Typography & Color Guidelines - SIPOMA

## 🎨 Color Palette

### Primary Colors (Red Theme)

- **Primary 600**: `#dc2626` - Main brand color
- **Primary 700**: `#b91c1c` - Hover states
- **Primary 500**: `#ef4444` - Light accents

### Text Colors (High Contrast)

#### Light Theme

- **Primary Text**: `text-slate-900` (#0f172a) - 21:1 contrast on white
- **Secondary Text**: `text-slate-600` (#475569) - 8.6:1 contrast on white
- **Tertiary Text**: `text-slate-500` (#64748b) - 6.1:1 contrast on white

#### Dark Theme

- **Primary Text**: `text-slate-100` (#f1f5f9) - 19.2:1 contrast on dark
- **Secondary Text**: `text-slate-400` (#94a3b8) - 8.9:1 contrast on dark
- **Tertiary Text**: `text-slate-500` (#64748b) - 6.8:1 contrast on dark

### Status Colors

- **Success**: `text-green-700` (light) / `text-green-400` (dark)
- **Warning**: `text-amber-700` (light) / `text-amber-400` (dark)
- **Error**: `text-red-700` (light) / `text-red-400` (dark)
- **Info**: `text-blue-700` (light) / `text-blue-400` (dark)

## 📝 Typography Scale

### Headings

```tsx
<H1>text-3xl font-bold</H1>        // 30px - Main titles
<H2>text-2xl font-semibold</H2>    // 24px - Section titles
<H3>text-xl font-semibold</H3>     // 20px - Subsection titles
<H4>text-lg font-semibold</H4>     // 18px - Card titles
<H5>text-base font-semibold</H5>   // 16px - Small titles
<H6>text-sm font-semibold</H6>     // 14px - Labels
```

### Body Text

```tsx
<Body size="large">text-lg leading-relaxed</Body>    // 18px - Large body
<Body size="base">text-base leading-relaxed</Body>   // 16px - Regular body
<Body size="small">text-sm leading-relaxed</Body>    // 14px - Small body
<Body size="xs">text-xs leading-relaxed</Body>       // 12px - Extra small
```

### UI Text

```tsx
<UIText variant="label">text-sm font-medium</UIText>      // Form labels
<UIText variant="caption">text-xs text-slate-500</UIText> // Captions
<UIText variant="overline">text-xs uppercase</UIText>     // Overline text
```

## 🎯 Usage Guidelines

### ✅ Do's

- Always use semantic color tokens (`primary`, `secondary`, `tertiary`)
- Maintain minimum contrast ratio of 4.5:1 for normal text, 3:1 for large text
- Use consistent spacing with the design system
- Prefer Typography components over raw Tailwind classes

### ❌ Don'ts

- Don't use arbitrary color values (e.g., `text-blue-600` for non-info content)
- Don't use `text-gray-*` classes - use `text-slate-*` instead
- Don't create custom font sizes - use the established scale
- Don't use low contrast combinations

## 🔧 Implementation

### Using Typography Components

```tsx
import { H1, H2, Body, Link, StatusText } from '../components/ui/Typography';

// Headings
<H1>Main Title</H1>
<H2 theme="dark">Dark Theme Section</H2>

// Body text
<Body size="large" color="secondary">Large secondary text</Body>
<Body color="tertiary">Regular tertiary text</Body>

// Links
<Link href="/dashboard">Dashboard Link</Link>

// Status text
<StatusText status="success">Operation successful</StatusText>
```

### Using Utility Functions

```tsx
import { getTextColor, getHeadingClasses } from '../utils/typographyUtils';

// Direct class generation
const headingClasses = getHeadingClasses(1, 'primary', 'light');
const textColor = getTextColor('accent', 'primary', 'dark');
```

## 📊 Contrast Ratio Compliance

| Text Color       | Background     | Ratio  | WCAG AA | WCAG AAA |
| ---------------- | -------------- | ------ | ------- | -------- |
| `text-slate-900` | `bg-white`     | 21:1   | ✅      | ✅       |
| `text-slate-600` | `bg-white`     | 8.6:1  | ✅      | ✅       |
| `text-slate-500` | `bg-white`     | 6.1:1  | ✅      | ❌       |
| `text-slate-100` | `bg-slate-900` | 19.2:1 | ✅      | ✅       |
| `text-slate-400` | `bg-slate-900` | 8.9:1  | ✅      | ✅       |
| `text-red-600`   | `bg-white`     | 5.2:1  | ✅      | ❌       |

## 🚀 Migration Guide

### From Old Classes to New System

```tsx
// Old (avoid)
<h1 className="text-2xl font-bold text-gray-900">Title</h1>
<p className="text-blue-600">Link text</p>

// New (recommended)
<H1>Title</H1>
<Link>Link text</Link>
```

### Color Migration

- `text-gray-*` → `text-slate-*`
- `text-blue-600` → `text-red-600` (for primary actions)
- `text-blue-400` → `text-red-400` (for primary actions in dark mode)

## 🛠️ Development Tools

### Contrast Checker

Use the `validateContrast` utility for development:

```tsx
import { validateContrast } from '../utils/typographyUtils';

const isValid = validateContrast('text-slate-900', 'bg-white'); // true
```

### Typography Playground

Test combinations in Storybook or create test components to verify contrast ratios.

## 📈 Benefits

1. **Improved Accessibility**: WCAG AA compliant contrast ratios
2. **Consistent Branding**: Unified color scheme across the app
3. **Better Maintainability**: Centralized typography system
4. **Enhanced Readability**: Optimized font sizes and spacing
5. **Future-Proof**: Easy to update colors and typography globally
