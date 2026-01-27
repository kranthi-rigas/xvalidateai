# XVALIDATEAI Design System Documentation

## Overview
This document outlines the complete design system for the XVALIDATEAI AI Compliance application, based on the logo colors and brand identity.

---

## 🎨 Color Palette (Extracted from Logo)

### Primary Colors (Navy Shield from Logo)
- **Primary**: `#0F3053` (Navy Shield)
  - Usage: Main brand color, primary buttons, headers, navigation, logo shield
  - Foreground: `#FFFFFF` (White)
  - CSS Variable: `--color-primary`
  - RGB: rgb(15, 48, 83)
  - Contrast Ratio: 13.2:1 (AAA)

### Secondary Colors (Cyan Mark from Logo)
- **Secondary**: `#58BFCE` (Cyan/Turquoise Mark)
  - Usage: Verification icons, trust badges, interactive accents, logo mark
  - Foreground: `#0F172A` (Deep Navy)
  - CSS Variable: `--color-secondary`
  - RGB: rgb(88, 191, 206)
  - Contrast Ratio: 4.9:1 (AA)

### Accent Colors
- **Accent**: `#64748B` (Slate Gray)
  - Usage: Secondary text, inactive states, subtle UI elements
  - Foreground: `#FFFFFF` (White)
  - CSS Variable: `--color-accent`
  - RGB: rgb(100, 116, 139)
  - Contrast Ratio: 5.1:1 (AA)

### Neutral Colors
- **Background**: `#FAFAFA` (Off-White)
  - Usage: Main page background
  - CSS Variable: `--color-background`
  
- **Foreground**: `#0F172A` (Deep Navy)
  - Usage: Primary text color, headings
  - CSS Variable: `--color-foreground`
  - RGB: rgb(15, 23, 42)
  - Contrast Ratio: 16.8:1 (AAA)

### Card Colors
- **Card Background**: `#FFFFFF`
  - Usage: Card containers, panels, modals
  - CSS Variable: `--color-card`
  
- **Card Foreground**: `#0F172A`
  - Usage: Text on cards
  - CSS Variable: `--color-card-foreground`

- **Popover Background**: `#FFFFFF`
  - CSS Variable: `--color-popover`
  
- **Popover Foreground**: `#0F172A`
  - CSS Variable: `--color-popover-foreground`

### Border & Input Colors
- **Border**: `#EEEEEE` (Light Gray)
  - Usage: Dividers, input borders, card outlines
  - CSS Variable: `--color-border`
  
- **Input**: `#FFFFFF`
  - Usage: Input field backgrounds
  - CSS Variable: `--color-input`
  
- **Ring**: `#94A3B8` (Blue-Gray)
  - Usage: Focus rings, selection indicators
  - CSS Variable: `--color-ring`

### Semantic/Status Colors

**Success/Compliant**
- **Color**: `#10B981` (Green)
- **Usage**: Success states, compliant status, positive feedback
- **Badge Background**: `#D1FAE5`
- **CSS Variable**: `--color-success`

**Warning/Attention**
- **Color**: `#F59E0B` (Amber)
- **Usage**: Warnings, needs attention, partial compliance
- **Badge Background**: `#FEF3C7`
- **CSS Variable**: `--color-warning`

**Error/Failed (Destructive)**
- **Color**: `#EF4444` (Red)
- **Usage**: Error states, failed assessments, critical issues, delete actions
- **Foreground**: `#FFFFFF`
- **Badge Background**: `#FEE2E2`
- **CSS Variable**: `--color-destructive`

**Info**
- **Color**: `#3B82F6` (Blue)
- **Usage**: Information messages, neutral notifications
- **Badge Background**: `#DBEAFE`

---

## 📝 Typography

### Font Families

#### Sans-Serif (Primary)
- **Font**: Inter
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra Bold)
- **Usage**: All UI elements, body text, buttons, forms, navigation
- **CSS Variable**: `--font-sans`, `--font-primary`
- **Why Inter**: Designed specifically for digital interfaces, excellent readability, professional appearance

#### Serif
- **Font**: Georgia
- **Weights**: 400 (Regular), 700 (Bold)
- **Usage**: Long-form content, blog posts, documentation, emphasis
- **CSS Variable**: `--font-serif`

#### Monospace
- **Font**: JetBrains Mono
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Usage**: Code blocks, API documentation, technical data, file paths
- **CSS Variable**: `--font-mono`

### Font Sizes
| Size | Value | Pixels | Usage |
|------|-------|--------|-------|
| `--text-xs` | 0.75rem | 12px | Small labels, captions |
| `--text-sm` | 0.875rem | 14px | Secondary text, metadata |
| `--text-md` | 0.9375rem | 15px | Body text alternative |
| `--text-base` | 1rem | 16px | Primary body text |
| `--text-lg` | 1.125rem | 18px | Subheadings |
| `--text-xl` | 1.25rem | 20px | Section headings |
| `--text-2xl` | 1.5rem | 24px | Page titles |

### Font Weights
| Weight | Value | Usage |
|--------|-------|-------|
| `--font-light` | 300 | Light emphasis |
| `--font-regular` | 400 | Body text |
| `--font-medium` | 500 | Subtle emphasis |
| `--font-semibold` | 600 | Subheadings |
| `--font-bold` | 700 | Headings, strong emphasis |
| `--font-extrabold` | 800 | Hero text, major headings |

### Typography Scale & Usage

```css
/* Headings */
H1: Inter Bold, 48px/56px (3rem/3.5rem), #0F172A
H2: Inter Bold, 36px/44px (2.25rem/2.75rem), #0F172A
H3: Inter Semi-Bold, 30px/38px (1.875rem/2.375rem), #0F172A
H4: Inter Semi-Bold, 24px/32px (1.5rem/2rem), #0F172A
H5: Inter Medium, 20px/28px (1.25rem/1.75rem), #64748B
H6: Inter Medium, 18px/26px (1.125rem/1.625rem), #64748B

/* Body Text */
Body Large: Inter Regular, 18px/28px, #0F172A
Body: Inter Regular, 16px/24px, #0F172A
Body Small: Inter Regular, 14px/20px, #64748B
Caption: Inter Regular, 13px/18px, #94A3B8
Label: Inter Medium, 14px/20px, #0F172A
```

---

## 📏 Spacing Scale (8px Base Unit)

| Variable | Value | Pixels | Usage |
|----------|-------|--------|-------|
| `--space-0` | 0 | 0px | No spacing |
| `--space-0-5` | 0.25rem | 4px | Tight spacing |
| `--space-1` | 0.5rem | 8px | Small gaps |
| `--space-2` | 1rem | 16px | Standard spacing |
| `--space-3` | 1.5rem | 24px | Medium spacing |
| `--space-4` | 2rem | 32px | Large spacing |
| `--space-5` | 2.5rem | 40px | Extra large spacing |
| `--space-6` | 3rem | 48px | Section spacing |
| `--space-8` | 4rem | 64px | Major section spacing |
| `--space-10` | 5rem | 80px | Hero spacing |
| `--space-12` | 6rem | 96px | Large hero spacing |
| `--space-16` | 8rem | 128px | Extra large sections |

---

## 🔲 Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--radius-xs` | 2px | Minimal rounding |
| `--radius-sm` | 6px | Small elements |
| `--radius` | 10px | **Default radius** - buttons, cards, inputs |
| `--radius-md` | 10px | Medium elements |
| `--radius-lg` | 12px | Large containers |
| `--radius-pill` | 9999px | Fully rounded (pills, badges) |

**Note**: The default border radius is **10px** as specified in the design system.

---

## 🌑 Shadows & Elevation

### Shadow Specifications
- **X Offset**: -2px
- **Y Offset**: 4px
- **Blur**: 12px (base)
- **Spread**: 4px (base)
- **Color**: `#333333`

### Shadow Levels
| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-0` | none | Flat elements |
| `--shadow-1` | -2px 4px 12px 4px rgba(51, 51, 51, 0.2) | Cards, buttons |
| `--shadow-2` | -2px 4px 16px 6px rgba(51, 51, 51, 0.25) | Elevated panels |
| `--shadow-3` | -2px 4px 20px 8px rgba(51, 51, 51, 0.3) | Modals, popovers |
| `--shadow-custom` | -2px 4px 12px 4px #333333 | Custom shadow |

---

## 🎯 Z-Index Scale

| Variable | Value | Usage |
|----------|-------|-------|
| `--z-below` | -1 | Behind content |
| `--z-base` | 0 | Base layer |
| `--z-dropdown` | 100 | Dropdowns, tooltips |
| `--z-sticky` | 200 | Sticky headers |
| `--z-modal` | 1000 | Modals, overlays |
| `--z-max` | 9999 | Top layer |

---

## ⏱️ Transitions & Timing

| Variable | Value | Usage |
|----------|-------|-------|
| `--ease-fast` | 120ms | Quick interactions |
| `--ease-medium` | 220ms | Standard transitions |
| `--ease-slow` | 400ms | Smooth animations |
| `--ease-default` | cubic-bezier(0.215, 0.61, 0.355, 1) | Easing function |

---

## 📱 Breakpoints

| Variable | Value | Device |
|----------|-------|--------|
| `--bp-xs` | 479px | Extra small |
| `--bp-sm` | 575px | Small |
| `--bp-md` | 767px | Medium |
| `--bp-lg` | 991px | Large |
| `--bp-xl` | 1199px | Extra large |
| `--bp-xxl` | 1399px | 2X large |

---

## 🎨 Usage Guidelines

### Primary Color Usage (Navy Shield #0F3053)
Use for:
- Primary action buttons
- Navigation headers
- Logo shield background
- Dark UI backgrounds
- Active navigation items
- Important CTAs

### Secondary Color Usage (Cyan Mark #58BFCE)
Use for:
- Verification icons and trust badges
- Logo mark (X and checkmark)
- Interactive accents
- Success indicators
- Hover states on secondary elements
- Links and interactive text

### Accent Color Usage (Slate Gray #64748B)
Use for:
- Secondary text
- Inactive/disabled states
- Subtle backgrounds
- Supporting UI elements
- Muted content

### Destructive Color Usage (Red #EF4444)
Use for:
- Delete buttons
- Error messages
- Critical warnings
- Failed assessments
- Destructive actions

---

## 🧩 UI Component Specifications

### Buttons

**Primary Button (Navy Shield)**
```css
background: #0F3053
color: #FFFFFF
font: Inter Semi-Bold 16px/24px
padding: 12px 24px
border-radius: 10px
box-shadow: -2px 4px 12px 4px rgba(51, 51, 51, 0.1)

/* Hover State */
background: #1A4066
box-shadow: -2px 4px 16px 4px rgba(15, 48, 83, 0.25)
```

**Secondary Button (Cyan Outlined)**
```css
background: transparent
border: 2px solid #58BFCE
color: #58BFCE
font: Inter Semi-Bold 16px/24px
padding: 10px 22px
border-radius: 10px

/* Hover State */
background: rgba(88, 191, 206, 0.08)
border-color: #3FA5B5
```

### Navigation

**Sidebar Navigation (Navy Background)**
```css
background: #0F3053
width: 260px
padding: 24px 0

/* Navigation Item */
color: rgba(255, 255, 255, 0.8)
padding: 12px 24px
font: Inter Medium 15px/22px

/* Hover */
background: rgba(255, 255, 255, 0.08)
color: #FFFFFF

/* Active */
background: rgba(88, 191, 206, 0.15)
color: #FFFFFF
border-left: 3px solid #58BFCE
```

---

## 🔄 Legacy Color Mappings

For backward compatibility, legacy color variables are mapped to the new system:
- `--color-purple-1` → `--color-primary` (#0F3053 Navy Shield)
- `--color-purple-4` → `--color-secondary` (#58BFCE Cyan Mark)
- `--color-dark-1` → `--color-foreground` (#0F172A Deep Navy)
- `--color-light-3` → `--color-background` (#FAFAFA Off-White)

---

## 📦 Implementation

### CSS Variables
All design tokens are available as CSS custom properties in [`public/assets/css/style-guide/_tokens.scss`](public/assets/css/style-guide/_tokens.scss).

### Usage Example
```css
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-sans);
  font-weight: var(--font-semibold);
  box-shadow: var(--shadow-1);
  transition: all var(--ease-medium) var(--ease-default);
}

.button-primary:hover {
  box-shadow: var(--shadow-2);
}
```

---

## 🔍 Accessibility

### Color Contrast (WCAG 2.1 AA Verified)
All color combinations meet accessibility standards:
- Navy (#0F3053) on white: ✅ 13.2:1 (AAA)
- Foreground (#0F172A) on background (#FAFAFA): ✅ 16.8:1 (AAA)
- Cyan (#58BFCE) with navy text: ✅ 4.9:1 (AA)
- Slate (#64748B) on white: ✅ 5.1:1 (AA)

### Focus States
- Use `--color-ring` (#94A3B8) or `--color-secondary` (#58BFCE) for focus indicators
- Minimum focus ring width: 2px
- Focus rings should be visible on all interactive elements

---

## 📚 Resources

- **Font: Inter** - [Google Fonts](https://fonts.google.com/specimen/Inter)
- **Font: JetBrains Mono** - [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)
- **Icon Library: Lucide Icons** - [lucide.dev](https://lucide.dev/)
- **Color Contrast Checker** - [WebAIM](https://webaim.org/resources/contrastchecker/)

---

## 📄 Logo Usage

### Logo Colors (Extracted)
- **Navy Shield**: #0F3053 rgb(15, 48, 83)
- **Cyan Mark**: #58BFCE rgb(88, 191, 206)

### Clear Space
Maintain minimum clear space around logo equal to the height of the "X" in XVALIDATEAI.

### Minimum Size
- Digital: 120px width minimum
- Print: 1 inch (2.54cm) width minimum

---

**Last Updated**: January 27, 2026  
**Version**: 2.0.0 (XVALIDATEAI Brand)  
**Based on**: Logo color extraction and brand specification