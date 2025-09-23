# UX Pattern Guidelines - SIPOMA

## User Flow Consistency

### Navigation Patterns

- **Header Navigation**: Logo (left), main nav (center), user menu (right)
- **Sidebar Navigation**: Collapsible, icon + text, active state highlighting
- **Breadcrumb**: Home > Section > Sub-section > Current page
- **Tab Navigation**: Horizontal tabs for related content sections

### Page Layout Structure

```
┌─────────────────────────────────────┐
│ Header (fixed height)               │
├─────────────────────────────────────┤
│ Sidebar (collapsible) │ Main Content │
│                       │             │
│ Navigation Items      │ Page Title  │
│ Active Highlight      │ ┌─────────┐ │
│                       │ │ Content  │ │
│                       │ │ Cards    │ │
│                       │ └─────────┘ │
└───────────────────────┴─────────────┘
```

## Error Handling Patterns

### Error States

- **Inline Validation**: Red border, error message below input
- **Toast Notifications**: Top-right corner, auto-dismiss after 5 seconds
- **Modal Errors**: For critical errors requiring user action
- **Page-level Errors**: Full page error state with retry option

### Error Message Guidelines

- **Clear**: Explain what went wrong
- **Actionable**: Suggest how to fix it
- **Concise**: Keep under 50 characters
- **Consistent**: Use standard error colors and icons

### Error Recovery

- **Retry Buttons**: For network errors
- **Reset Forms**: For validation errors
- **Alternative Actions**: Suggest different approaches
- **Help Links**: Point to documentation or support

## Loading States

### Loading Patterns

- **Skeleton Screens**: Match content structure
- **Progress Bars**: For multi-step processes
- **Spinners**: For quick actions (< 3 seconds)
- **Full Page Loading**: For initial page loads

### Loading Guidelines

- **Show loading within 100ms** of action
- **Skeleton height matches content**
- **Maintain layout stability**
- **Include descriptive text when possible**

## Feedback Patterns

### Success Feedback

- **Toast notifications**: Green background, checkmark icon
- **Inline confirmation**: Green text, checkmark
- **Page redirect**: After successful form submission
- **Status updates**: Real-time progress indicators

### Status Indicators

- **Colors**: Green (success), Yellow (warning), Red (error), Blue (info)
- **Icons**: Checkmark (success), Exclamation (warning), X (error), Info (info)
- **Animation**: Subtle pulse for active states

## Form Design Patterns

### Form Structure

```
Form Title
├── Input Field (with label)
├── Helper Text (optional)
├── Error Message (conditional)
├── Input Field (with label)
└── Action Buttons (Cancel | Submit)
```

### Input Field States

- **Default**: Neutral border, placeholder text
- **Focus**: Blue border, focus ring
- **Error**: Red border, error message
- **Success**: Green border, success message
- **Disabled**: Gray background, not editable

### Button Placement

- **Primary Action**: Right side, primary color
- **Secondary Action**: Left side, outline style
- **Destructive Action**: Separate from primary actions

## Data Display Patterns

### Table Patterns

- **Sortable columns**: Clickable headers with sort indicators
- **Pagination**: Bottom of table, consistent sizing
- **Empty states**: Clear messaging, call-to-action
- **Loading states**: Skeleton rows matching table structure

### Card Patterns

- **Header**: Title + optional actions (3-dot menu)
- **Content**: Key information, metrics
- **Footer**: Action buttons or metadata
- **Consistent padding**: 24px internal spacing

### Chart Patterns

- **Loading skeletons**: Match chart dimensions
- **Empty states**: Clear messaging with data requirements
- **Error states**: Retry options, fallback to table view
- **Responsive**: Stack on mobile, maintain aspect ratios

## Mobile Responsiveness

### Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md to lg)
- **Desktop**: > 1024px (xl+)

### Mobile Patterns

- **Collapsed navigation**: Hamburger menu
- **Stacked layouts**: Vertical card arrangement
- **Touch targets**: Minimum 44px height
- **Swipe gestures**: For table pagination, card navigation

### Responsive Tables

- **Horizontal scroll**: For wide tables
- **Card view**: Alternative layout for mobile
- **Priority columns**: Show most important data first
- **Expandable rows**: For detailed information

## Accessibility Standards (WCAG 2.1 AA)

### Keyboard Navigation

- **Tab order**: Logical, no keyboard traps
- **Focus indicators**: Visible 2px outline, 3:1 contrast
- **Skip links**: Jump to main content
- **Keyboard shortcuts**: Documented and consistent

### Screen Reader Support

- **Semantic HTML**: Proper headings, landmarks
- **ARIA labels**: For complex interactions
- **Alt text**: Descriptive image descriptions
- **Live regions**: For dynamic content updates

### Color and Contrast

- **Text contrast**: 4.5:1 minimum for normal text
- **Large text**: 3:1 minimum for 18pt+ text
- **Interactive elements**: 3:1 contrast minimum
- **Color independence**: Don't rely on color alone

### Motion and Animation

- **Reduced motion**: Respect user preferences
- **Animation duration**: 200-300ms for micro-interactions
- **Purposeful motion**: Enhances understanding, not decoration
- **Pause controls**: For auto-playing content

## Performance Considerations

### Loading Performance

- **Progressive loading**: Show above-the-fold content first
- **Lazy loading**: Images and below-the-fold content
- **Caching strategy**: Appropriate cache headers
- **Bundle splitting**: Route-based code splitting

### Interaction Performance

- **Debounced inputs**: 300ms delay for search
- **Throttled scroll**: 16ms for scroll handlers
- **Virtual scrolling**: For large lists
- **Optimistic updates**: Immediate UI feedback

## Content Guidelines

### Writing Style

- **Clear and concise**: Avoid jargon, explain terms
- **Active voice**: "Save changes" not "Changes saved"
- **Consistent terminology**: Use same words for same concepts
- **Progressive disclosure**: Show basic info first, details on demand

### Icon Usage

- **Consistent library**: Use single icon set (Heroicons)
- **Meaningful icons**: Support but don't replace text
- **Size consistency**: 16px, 20px, 24px standard sizes
- **Color inheritance**: Match parent text color

## Testing Guidelines

### User Testing

- **Usability testing**: 5 users minimum per feature
- **A/B testing**: For major UX changes
- **Accessibility testing**: Automated + manual testing
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge

### Automated Testing

- **Visual regression**: Screenshot comparison
- **Accessibility audit**: Axe, Lighthouse, WAVE
- **Performance testing**: Core Web Vitals
- **Cross-device testing**: Responsive design validation
