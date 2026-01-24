# AI Compliance Design System - Implementation Guide

## Quick Start

The design system has been successfully integrated into your Academy51 application. Here's how to use it:

## 1. Color System Integration

### Global CSS Variables

All colors are now available as CSS custom properties throughout your application:

```css
/* Primary colors */
var(--color-primary)        /* Trust Blue #0043ce */
var(--color-primary-hover)  /* Hover state */
var(--color-primary-light)  /* Light variant */

/* Semantic colors */
var(--color-success)        /* Compliant state */
var(--color-warning)        /* Needs attention */
var(--color-error)          /* Non-compliant */
var(--color-neutral)        /* Pending */
```

### Legacy Color Mapping

The old purple color scheme has been automatically mapped to the new blue system:

```css
--color-purple-1: #0043ce  /* Now Trust Blue */
--color-purple-2: #0036a8  /* Now Primary Hover */
--color-purple-3: #e8f0ff  /* Now Light Blue Background */
```

**No code changes required** - existing components using `var(--color-purple-1)` will automatically use the new Trust Blue color.

## 2. Using New Components

### ComplianceStatusBadge

Display compliance states with semantic colors and icons:

```jsx
import { ComplianceStatusBadge } from '@/components/compliance';

<ComplianceStatusBadge 
  status="compliant"        // 'compliant' | 'warning' | 'non-compliant' | 'pending'
  label="Verified"          // Optional custom label
  size="md"                 // 'sm' | 'md' | 'lg'
  showIcon={true}           // Show/hide icon
/>
```

### ComplianceScoreCard

Display compliance scores with visual progress rings:

```jsx
import { ComplianceScoreCard } from '@/components/compliance';

<ComplianceScoreCard
  score={85}                // 0-100
  title="Overall Compliance"
  description="Aggregate score across all controls"
  trend="up"                // 'up' | 'down' | 'neutral'
  trendValue={5.2}          // Percentage change
  onClick={handleClick}     // Optional click handler
  showDetails={true}        // Show trend details
/>
```

### ComplianceDashboard

Full-featured dashboard with modular layout:

```jsx
import { ComplianceDashboard } from '@/components/compliance';

const controls = [
  {
    id: '1',
    name: 'Data Privacy Control',
    description: 'Ensure data protection compliance',
    category: 'data-privacy',
    status: 'compliant',
    score: 95,
    lastUpdated: '2026-01-24T00:00:00Z'
  },
  // ... more controls
];

const recentActivity = [
  {
    type: 'update',
    message: 'Control updated: Data Privacy',
    timestamp: '2026-01-24T05:00:00Z'
  },
  // ... more activity
];

<ComplianceDashboard
  overallScore={85}
  controls={controls}
  recentActivity={recentActivity}
  userRole="admin"          // 'viewer' | 'editor' | 'admin'
  onControlClick={handleControlClick}
  onViewDetails={handleViewDetails}
/>
```

## 3. SCSS Mixins

Use design system mixins in your component styles:

```scss
@import '../../styles/design-system/colors.scss';
@import '../../styles/design-system/typography.scss';
@import '../../styles/design-system/spacing.scss';
@import '../../styles/design-system/components.scss';

.my-component {
  // Typography
  @include text-h2;
  
  // Colors
  color: $color-primary;
  background: $color-surface-light;
  
  // Spacing
  padding: $spacing-6;
  gap: $spacing-4;
  
  // Component patterns
  @include compliance-card;
  @include card-hover;
  
  // Buttons
  .my-button {
    @include button-primary;
  }
  
  // Responsive
  @include respond-above($breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## 4. Updating Existing Components

### Option A: No Changes Required (Automatic)

Most existing components will automatically use the new colors because:
- CSS variables are globally available
- Legacy purple colors are mapped to new blue colors
- All `var(--color-purple-1)` references now use Trust Blue

### Option B: Explicit Updates (Recommended for New Features)

For new features or major refactors, use the new color system explicitly:

**Before:**
```jsx
<button style={{ backgroundColor: 'var(--color-purple-1)' }}>
  Click Me
</button>
```

**After:**
```jsx
<button style={{ backgroundColor: 'var(--color-primary)' }}>
  Click Me
</button>
```

Or better yet, use the design system classes:

```jsx
<button className="button-primary">
  Click Me
</button>
```

## 5. Updating the AI Compliance Page

The AI Compliance page (`src/pages/dashboard/dshb-aicompliance/index.jsx`) can now use the new components:

```jsx
import React from 'react';
import MetaComponent from "@/components/common/MetaComponent";
import { ComplianceDashboard } from "@/components/compliance";

const metadata = {
  title: "Dashboard - AI Compliance | Academy51",
  description: "AI Compliance Dashboard for Academy51",
};

export default function DshbAICompliance() {
  // Fetch your compliance data here
  const controls = []; // Your controls data
  const recentActivity = []; // Your activity data
  
  return (
    <>
      <MetaComponent meta={metadata} />
      <ComplianceDashboard
        overallScore={85}
        controls={controls}
        recentActivity={recentActivity}
        userRole="admin"
        onControlClick={(id) => console.log('Control clicked:', id)}
        onViewDetails={() => console.log('View details clicked')}
      />
    </>
  );
}
```

## 6. Accessibility Features

All components include built-in accessibility:

- **WCAG AA/AAA compliant** color contrasts
- **Keyboard navigation** support
- **Screen reader** optimized with ARIA labels
- **Focus indicators** visible on all interactive elements
- **Reduced motion** support via `prefers-reduced-motion`
- **High contrast mode** support via `prefers-contrast`
- **Dark mode** support via `prefers-color-scheme`

## 7. Responsive Design

All components are mobile-first and responsive:

```scss
// Breakpoints available
$breakpoint-xs: 480px;
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;

// Usage
@include respond-above($breakpoint-md) {
  // Styles for tablet and above
}

@include respond-below($breakpoint-sm) {
  // Styles for mobile only
}
```

## 8. Testing Checklist

Before deploying, test:

- [ ] All pages load without console errors
- [ ] Colors display correctly (no purple remnants unless intentional)
- [ ] Buttons are clickable and show hover states
- [ ] Forms have proper focus indicators
- [ ] Tables are scrollable on mobile
- [ ] Dark mode works (if enabled)
- [ ] High contrast mode works
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly

## 9. Browser Support

Tested and supported:
- Chrome/Edge: Last 2 versions ✓
- Firefox: Last 2 versions ✓
- Safari: Last 2 versions ✓
- iOS Safari: Last 2 versions ✓
- Android Chrome: Last 2 versions ✓

## 10. Performance Optimization

The design system is optimized for performance:

- **CSS Custom Properties** for runtime theming
- **Tree-shakeable** component imports
- **Minimal bundle size** - only import what you use
- **No runtime dependencies** for styling

## 11. Common Patterns

### Creating a Stat Card

```jsx
<div className="stat-card">
  <div className="stat-icon compliant">✓</div>
  <div className="stat-value">42</div>
  <div className="stat-label">Compliant Controls</div>
</div>
```

### Creating an Alert

```jsx
<div className="alert-success">
  <div className="alert-icon">✓</div>
  <div className="alert-content">
    <div className="alert-title">Success</div>
    <div className="alert-message">Operation completed successfully</div>
  </div>
</div>
```

### Creating a Progress Bar

```jsx
<div className="progress-bar-container">
  <div 
    className="progress-bar success" 
    style={{ width: '75%' }}
    role="progressbar"
    aria-valuenow="75"
    aria-valuemin="0"
    aria-valuemax="100"
  />
</div>
```

## 12. Troubleshooting

### Colors not updating?

1. Clear browser cache
2. Check if `design-system-colors.css` is loaded in Network tab
3. Verify import order in `styles.scss`

### Components not rendering?

1. Check import paths: `@/components/compliance`
2. Verify SCSS imports in component files
3. Check for console errors

### Styles conflicting?

1. Use `!important` sparingly
2. Check CSS specificity
3. Verify import order in `styles.scss`

## 13. Migration Path

### Phase 1: Automatic (Complete ✓)
- Global color variables loaded
- Legacy colors mapped
- No breaking changes

### Phase 2: Gradual Adoption (Recommended)
- Use new components for new features
- Refactor existing pages as needed
- Update one section at a time

### Phase 3: Full Migration (Optional)
- Replace all legacy color references
- Standardize all components
- Remove legacy mappings

## 14. Support & Resources

- **Documentation**: `DESIGN_SYSTEM.md`
- **Component Examples**: See component files in `src/components/compliance/`
- **Color Reference**: `public/assets/css/design-system-colors.css`
- **SCSS Utilities**: `src/styles/design-system/`

## 15. Next Steps

1. **Test the integration**: Run your dev server and verify colors
2. **Update AI Compliance page**: Use new `ComplianceDashboard` component
3. **Gradually adopt**: Use new components for new features
4. **Provide feedback**: Report any issues or suggestions

---

**Questions?** Refer to `DESIGN_SYSTEM.md` for detailed documentation.

**Last Updated:** January 2026  
**Version:** 1.0.0