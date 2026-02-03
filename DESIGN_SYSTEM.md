# AI Compliance Design System Documentation

## Overview

This design system provides a comprehensive UI/UX framework for AI compliance tools serving diverse users including SMBs, educators, IT administrators, and engineers. It balances enterprise-grade compliance rigor with consumer-grade usability.

## Design Principles

### 1. **Trustworthiness First**
- Blue-dominant color scheme conveying security and reliability
- Consistent visual language across all compliance states
- Clear, unambiguous status indicators

### 2. **Progressive Disclosure**
- Information hierarchy serving multiple skill levels
- Role-based views (viewer, editor, admin)
- Expandable details for technical users

### 3. **Accessibility by Default**
- WCAG AA/AAA compliance throughout
- Color-blind safe combinations
- Keyboard navigation support
- Screen reader optimized

### 4. **Cross-Cultural Safety**
- Colors tested for Middle Eastern and Western markets
- Universal iconography
- Culturally neutral visual language

---

## Color System

### Primary Palette

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| **Trust Blue** | `#0043ce` | 7:1 (AAA) | Brand identity, primary CTAs |
| **Deep Blue** | `#001d6c` | 12:1 (AAA) | Headers, navigation, hover states |
| **Sky Blue** | `#a6c8ff` | 3.2:1 on dark | Highlights, active states |
| **Teal** | `#007d79` | 4.5:1 (AA) | Data visualization, secondary actions |

### Semantic Colors - Compliance States

| State | Color | Hex | Application |
|-------|-------|-----|-------------|
| **Compliant** | Green | `#198038` | Passing controls, verified status |
| **Warning** | Amber | `#ff832b` | Needs review, approaching deadline |
| **Non-Compliant** | Red | `#da1e28` | Failed checks, critical issues |
| **Pending** | Gray | `#8d8d8d` | Not started, not applicable |

### Neutral System

**Light Mode:**
- Background: `#f4f4f4`
- Surface/Cards: `#ffffff`
- Border: `#c6c6c6`
- Text Primary: `#161616` (18:1 contrast - AAA)
- Text Secondary: `#525252` (8:1 contrast - AAA)

**Dark Mode:**
- Background: `#161616`
- Surface/Cards: `#262626`
- Border: `rgba(255,255,255,0.15)`
- Text Primary: `#f5f5f5`
- Text Secondary: `#a8a8a8`

### Color-Blind Safety

All color combinations are tested for:
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)

**Key Pairing:** Blue + Orange remains distinguishable across all forms of color blindness.

**Never rely on color alone** - always pair with:
- Icons
- Labels
- Patterns
- Text descriptions

---

## Typography

### Font Stack

```scss
Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu'
Monospace: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Roboto Mono'
```

### Type Scale (Modular Scale 1.250)

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display 1 | 48px | Bold | 1.25 | Hero sections |
| Display 2 | 36px | Bold | 1.25 | Page titles |
| H1 | 30px | Semibold | 1.25 | Section headers |
| H2 | 24px | Semibold | 1.5 | Subsection headers |
| H3 | 20px | Semibold | 1.5 | Card titles |
| H4 | 18px | Medium | 1.5 | Small headers |
| Body Large | 18px | Regular | 1.75 | Intro text |
| Body | 16px | Regular | 1.5 | Default text |
| Body Small | 14px | Regular | 1.5 | Secondary text |
| Caption | 12px | Regular | 1.5 | Metadata, timestamps |
| Label | 14px | Medium | 1.5 | Form labels, uppercase |

### Accessibility Requirements

- Minimum 16px for body text
- 4.5:1 contrast for normal text (AA)
- 3:1 contrast for large text (18pt+)
- 7:1 contrast for AAA compliance

---

## Spacing System

### 8px Base Unit

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-0` | 0 | No spacing |
| `spacing-1` | 4px | Tight spacing |
| `spacing-2` | 8px | Base unit |
| `spacing-3` | 12px | Small gaps |
| `spacing-4` | 16px | Default spacing |
| `spacing-5` | 20px | Medium spacing |
| `spacing-6` | 24px | Large spacing |
| `spacing-8` | 32px | Section spacing |
| `spacing-10` | 40px | Major sections |
| `spacing-12` | 48px | Page sections |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small elements |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 12px | Cards, containers |
| `radius-xl` | 16px | Large surfaces |
| `radius-full` | 9999px | Pills, badges |

---

## Components

### 1. Compliance Status Badge

**Purpose:** Visual indicator for compliance states

**Variants:**
- `compliant` - Green with checkmark
- `warning` - Amber with warning icon
- `non-compliant` - Red with X icon
- `pending` - Gray with circle icon

**Sizes:** `sm`, `md`, `lg`

**Usage:**
```jsx
<ComplianceStatusBadge 
  status="compliant" 
  label="Verified"
  size="md"
  showIcon={true}
/>
```

**Accessibility:**
- `role="status"` for screen readers
- `aria-label` with full status description
- Icons are `aria-hidden="true"`

---

### 2. Compliance Score Card

**Purpose:** Display compliance metrics with visual indicators

**Features:**
- Circular progress ring (0-100%)
- Color-coded by score threshold:
  - 90-100%: Green (Excellent)
  - 75-89%: Blue (Good)
  - 60-74%: Amber (Warning)
  - 0-59%: Red (Critical)
- Trend indicators (up/down/neutral)
- Optional click interaction

**Usage:**
```jsx
<ComplianceScoreCard
  score={85}
  title="Overall Compliance"
  description="Aggregate score across all controls"
  trend="up"
  trendValue={5.2}
  onClick={handleClick}
/>
```

**Accessibility:**
- Keyboard navigable when clickable
- `role="button"` for interactive cards
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for progress

---

### 3. Compliance Dashboard

**Purpose:** Modular dashboard for AI compliance monitoring

**Features:**
- Responsive grid layout
- Category breakdown cards
- Controls table with filtering
- Recent activity feed
- Role-based views

**Layout Breakpoints:**
- Mobile: 1 column
- Tablet (768px+): 2 columns
- Desktop (1024px+): 3 columns
- Large (1280px+): 4 columns

**Usage:**
```jsx
<ComplianceDashboard
  overallScore={85}
  controls={controlsData}
  recentActivity={activityData}
  userRole="admin"
  onControlClick={handleControlClick}
  onViewDetails={handleViewDetails}
/>
```

---

## Buttons

### Primary Button
- Background: Trust Blue (`#0043ce`)
- Text: White
- Hover: Deep Blue (`#0036a8`)
- Use for: Primary actions, CTAs

### Secondary Button
- Background: Transparent
- Border: 2px Trust Blue
- Text: Trust Blue
- Use for: Secondary actions

### Ghost Button
- Background: Transparent
- Text: Trust Blue
- Hover: Light overlay
- Use for: Tertiary actions, table actions

### Danger Button
- Background: Red (`#da1e28`)
- Text: White
- Use for: Destructive actions

**Sizes:** `sm`, `md` (default), `lg`

---

## Form Inputs

### Text Input
- Border: 2px solid `#c6c6c6`
- Focus: Border `#0043ce` with 3px ring
- Error: Border `#da1e28` with error ring
- Disabled: Gray background, 60% opacity

### Select Dropdown
- Same styling as text input
- Chevron icon on right

### Accessibility:
- Labels always visible (no placeholder-only)
- Helper text for guidance
- Error messages with `role="alert"`
- Minimum 44x44px touch targets

---

## Tables

### Compliance Table

**Features:**
- Sticky header on scroll
- Hover row highlighting
- Sortable columns
- Responsive horizontal scroll

**Structure:**
```jsx
<table className="controls-table">
  <thead>
    <tr>
      <th>Control</th>
      <th>Status</th>
      <th>Score</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {/* rows */}
  </tbody>
</table>
```

---

## Alerts & Notifications

### Alert Types

**Success:**
- Background: `#f0fdf4`
- Border: Green left border
- Icon: Checkmark

**Warning:**
- Background: `#fffbf5`
- Border: Amber left border
- Icon: Warning triangle

**Error:**
- Background: `#fff5f5`
- Border: Red left border
- Icon: Error X

**Structure:**
```jsx
<div className="alert alert-success">
  <div className="alert-icon">✓</div>
  <div className="alert-content">
    <div className="alert-title">Success</div>
    <div className="alert-message">Operation completed</div>
  </div>
</div>
```

---

## Progressive Disclosure Patterns

### 1. Summary → Details
- Show high-level metrics first
- Expand for technical details
- Use accordion or modal patterns

### 2. Role-Based Views
- **Viewer:** Read-only, simplified metrics
- **Editor:** Can update controls, see more details
- **Admin:** Full access, advanced settings

### 3. Contextual Help
- Tooltips for definitions
- Info icons for explanations
- "Learn more" links to documentation

---

## Responsive Design

### Breakpoints

| Name | Min Width | Columns | Usage |
|------|-----------|---------|-------|
| XS | 0px | 1 | Mobile portrait |
| SM | 640px | 2 | Mobile landscape |
| MD | 768px | 2-3 | Tablet |
| LG | 1024px | 3-4 | Desktop |
| XL | 1280px | 4+ | Large desktop |
| 2XL | 1536px | 4+ | Wide screens |

### Mobile-First Approach
- Start with mobile layout
- Progressively enhance for larger screens
- Touch targets minimum 44x44px
- Simplified navigation on mobile

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

- [ ] Color contrast ratios meet 4.5:1 minimum
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (2px outline)
- [ ] Form labels always visible
- [ ] Error messages descriptive and linked to fields
- [ ] Images have alt text
- [ ] Semantic HTML structure
- [ ] ARIA labels for dynamic content
- [ ] Skip navigation links
- [ ] Responsive text sizing (no fixed px for body)

### Screen Reader Support

- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA landmarks for page regions
- `aria-label` for icon-only buttons
- `aria-live` for dynamic updates
- `role="status"` for status indicators

### Keyboard Navigation

- Tab order follows visual order
- Enter/Space activate buttons
- Escape closes modals/dropdowns
- Arrow keys for menus/lists
- Focus trap in modals

---

## Dark Mode Support

All components support dark mode via `prefers-color-scheme: dark` media query.

**Implementation:**
```scss
@include dark-mode {
  background: $color-surface-dark;
  color: $color-text-primary-dark;
}
```

**Key Changes:**
- Inverted text/background colors
- Reduced shadow intensity
- Adjusted border opacity
- Maintained contrast ratios

---

## Animation & Motion

### Transition Timing

| Property | Duration | Easing |
|----------|----------|--------|
| Color | 0.2s | ease-in-out |
| Transform | 0.2s | ease-in-out |
| Opacity | 0.15s | ease-in-out |
| Box Shadow | 0.2s | ease-in-out |

### Reduced Motion

Respect `prefers-reduced-motion: reduce`:
```scss
@include reduced-motion {
  transition: none;
  animation: none;
}
```

---

## File Structure

```
src/
├── styles/
│   └── design-system/
│       ├── colors.scss          # Color palette & variables
│       ├── typography.scss      # Font system & mixins
│       ├── spacing.scss         # Spacing scale & layout
│       └── components.scss      # Component mixins
│
└── components/
    └── compliance/
        ├── ComplianceStatusBadge.jsx
        ├── ComplianceStatusBadge.scss
        ├── ComplianceScoreCard.jsx
        ├── ComplianceScoreCard.scss
        ├── ComplianceDashboard.jsx
        └── ComplianceDashboard.scss
```

---

## Usage Examples

### Importing Design System

```scss
@import '../../styles/design-system/colors.scss';
@import '../../styles/design-system/typography.scss';
@import '../../styles/design-system/spacing.scss';
@import '../../styles/design-system/components.scss';
```

### Using Mixins

```scss
.my-button {
  @include button-primary;
  @include button-lg;
}

.my-card {
  @include compliance-card;
  @include card-hover;
}

.my-text {
  @include text-h2;
  color: $color-primary;
}
```

### Using Color Functions

```scss
.element {
  background: color-alpha($color-primary, 0.1);
  color: text-contrast($color-primary);
}
```

---

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- iOS Safari: Last 2 versions
- Android Chrome: Last 2 versions

**Progressive Enhancement:**
- CSS Grid with flexbox fallback
- CSS custom properties with SCSS fallback
- Modern features with graceful degradation

---

## Performance Considerations

### CSS Optimization
- Use CSS containment for isolated components
- Minimize repaints with `will-change` sparingly
- Lazy load non-critical styles

### Component Optimization
- Memoize expensive calculations
- Use React.memo for pure components
- Virtualize long lists (tables with 100+ rows)

---

## Testing Guidelines

### Visual Regression Testing
- Test all components in light/dark mode
- Test at all breakpoints
- Test with different content lengths

### Accessibility Testing
- Automated: axe-core, Lighthouse
- Manual: Keyboard navigation
- Screen reader: NVDA, JAWS, VoiceOver

### Cross-Browser Testing
- Test in all supported browsers
- Test on real devices when possible
- Use BrowserStack for coverage

---

## Maintenance & Updates

### Version Control
- Semantic versioning for design system
- Changelog for breaking changes
- Migration guides for major updates

### Documentation Updates
- Update when adding new components
- Document breaking changes
- Include usage examples

### Feedback Loop
- Collect user feedback
- Monitor analytics
- Iterate based on data

---

## Resources

### Design Tools
- Figma: Component library
- Storybook: Component documentation
- Chromatic: Visual testing

### References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [IBM Carbon Design System](https://carbondesignsystem.com/)
- [Material Design](https://material.io/design)

### Color Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colorblind Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

---

## Support

For questions or contributions:
- GitHub Issues: [Project Repository]
- Design Team: design@academy51.com
- Documentation: [Internal Wiki]

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Maintained by:** Academy51 Design Team