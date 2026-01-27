# XVALIDATEAI Design System - Implementation Guide

## 🚀 Quick Start

The new XVALIDATEAI design system is now active! All colors and fonts are configured and ready to use.

---

## ✅ What's Already Working

### Fonts
✓ **Inter** is now the default font across the entire application  
✓ **Georgia** available for editorial content  
✓ **JetBrains Mono** available for code blocks  

The fonts are automatically applied via `var(--font-primary)` in the CSS.

### Colors
✓ All CSS variables are updated with XVALIDATEAI brand colors  
✓ Legacy variables mapped for backward compatibility  
✓ Components using CSS variables will automatically use new colors  

---

## 🎨 Using the New Colors

### In CSS/SCSS

```css
/* Primary Navy (from logo shield) */
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

/* Secondary Cyan (from logo mark) */
.button-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-foreground);
}

/* Accent Slate Gray */
.text-muted {
  color: var(--color-accent);
}

/* Semantic colors */
.success { color: var(--color-success); }
.warning { color: var(--color-warning); }
.error { color: var(--color-destructive); }
```

### In React/JSX (Inline Styles)

```jsx
// Using CSS variables
<div style={{ 
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-primary-foreground)'
}}>
  Navy Button
</div>

<div style={{ 
  backgroundColor: 'var(--color-secondary)',
  color: 'var(--color-secondary-foreground)'
}}>
  Cyan Button
</div>
```

---

## 📝 Using the New Fonts

### In CSS

```css
/* Sans-serif (default) */
.body-text {
  font-family: var(--font-sans);
  /* or */
  font-family: var(--font-primary);
}

/* Serif for editorial */
.article-content {
  font-family: var(--font-serif);
}

/* Monospace for code */
.code-block {
  font-family: var(--font-mono);
}
```

### Font Weights

```css
.light { font-weight: var(--font-light); }      /* 300 */
.regular { font-weight: var(--font-regular); }  /* 400 */
.medium { font-weight: var(--font-medium); }    /* 500 */
.semibold { font-weight: var(--font-semibold); }/* 600 */
.bold { font-weight: var(--font-bold); }        /* 700 */
.extrabold { font-weight: var(--font-extrabold); } /* 800 */
```

---

## 🎯 Common Patterns

### Primary Button (Navy)

```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-sans);
  font-weight: var(--font-semibold);
  box-shadow: var(--shadow-1);
  transition: all var(--ease-medium);
}

.btn-primary:hover {
  background: #1A4066; /* Lighter navy */
  box-shadow: var(--shadow-2);
}
```

### Secondary Button (Cyan Outlined)

```css
.btn-secondary {
  background: transparent;
  border: 2px solid var(--color-secondary);
  color: var(--color-secondary);
  border-radius: var(--radius);
  padding: calc(var(--space-3) - 2px) calc(var(--space-5) - 2px);
  font-family: var(--font-sans);
  font-weight: var(--font-semibold);
}

.btn-secondary:hover {
  background: rgba(88, 191, 206, 0.08);
}
```

### Card Component

```css
.card {
  background: var(--color-card);
  color: var(--color-card-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-1);
}
```

### Status Badges

```css
.badge-success {
  background: #D1FAE5;
  color: var(--color-success);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.badge-warning {
  background: #FEF3C7;
  color: var(--color-warning);
}

.badge-error {
  background: #FEE2E2;
  color: var(--color-destructive);
}
```

---

## 🔄 Migrating Existing Components

### Step 1: Replace Hardcoded Colors

**Before:**
```css
.button {
  background: #6440FB;
  color: #FFFFFF;
}
```

**After:**
```css
.button {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}
```

### Step 2: Update Font References

**Before:**
```css
.text {
  font-family: 'Poppins', sans-serif;
}
```

**After:**
```css
.text {
  font-family: var(--font-sans);
}
```

### Step 3: Use Design Tokens

**Before:**
```css
.card {
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

**After:**
```css
.card {
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-1);
}
```

---

## 📊 Color Reference Chart

| Use Case | Variable | Color | Example |
|----------|----------|-------|---------|
| Primary buttons | `--color-primary` | #0F3053 | Navy shield |
| Trust badges | `--color-secondary` | #58BFCE | Cyan mark |
| Secondary text | `--color-accent` | #64748B | Slate gray |
| Success states | `--color-success` | #10B981 | Green |
| Warnings | `--color-warning` | #F59E0B | Amber |
| Errors | `--color-destructive` | #EF4444 | Red |
| Background | `--color-background` | #FAFAFA | Off-white |
| Text | `--color-foreground` | #0F172A | Deep navy |
| Borders | `--color-border` | #EEEEEE | Light gray |

---

## 🎨 Component Examples

### Navigation Bar (Navy Background)

```css
.navbar {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: var(--space-4) var(--space-6);
  box-shadow: var(--shadow-1);
}

.navbar-link {
  color: rgba(255, 255, 255, 0.8);
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
}

.navbar-link:hover {
  color: var(--color-primary-foreground);
}

.navbar-link.active {
  color: var(--color-secondary);
}
```

### Dashboard Card

```css
.dashboard-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-1);
  transition: all var(--ease-medium);
}

.dashboard-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
}

.dashboard-card-title {
  font-family: var(--font-sans);
  font-weight: var(--font-semibold);
  font-size: var(--text-xl);
  color: var(--color-foreground);
  margin-bottom: var(--space-2);
}

.dashboard-card-value {
  font-family: var(--font-sans);
  font-weight: var(--font-bold);
  font-size: var(--text-2xl);
  color: var(--color-primary);
}
```

### Form Input

```css
.form-input {
  background: var(--color-input);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-foreground);
  transition: all var(--ease-fast);
}

.form-input::placeholder {
  color: var(--color-ring);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(88, 191, 206, 0.15);
}

.form-input.error {
  border-color: var(--color-destructive);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

---

## 🧪 Testing Checklist

After implementing the new design system:

- [ ] Check all buttons render with correct colors
- [ ] Verify text is readable (contrast)
- [ ] Test hover states on interactive elements
- [ ] Confirm fonts load correctly
- [ ] Check responsive behavior
- [ ] Test in different browsers
- [ ] Verify accessibility (focus states, contrast)
- [ ] Check dark mode (if applicable)

---

## 📚 Resources

- **Full Design System**: See [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- **CSS Tokens**: [`public/assets/css/style-guide/_tokens.scss`](public/assets/css/style-guide/_tokens.scss)
- **Update Summary**: [`COLOR_SCHEME_UPDATE_SUMMARY.md`](COLOR_SCHEME_UPDATE_SUMMARY.md)

---

## 💡 Tips

1. **Always use CSS variables** instead of hardcoded colors
2. **Use semantic color names** (primary, secondary, success) not color names (blue, red)
3. **Leverage spacing tokens** for consistent padding/margins
4. **Use font weight variables** for consistent typography
5. **Apply shadow tokens** for consistent elevation

---

## 🆘 Need Help?

If you encounter issues:
1. Check if CSS variables are defined in `_tokens.scss`
2. Verify the tokens file is imported in `main.css`
3. Ensure fonts are loaded in `index.html`
4. Review the [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) for specifications

---

**Ready to use!** The design system is fully configured and active across your application. Start using the new colors and fonts in your components! 🎉