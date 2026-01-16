# Glassmorphic Design System Documentation

## Overview

ContableBot Portal now features a complete glassmorphic (frosted glass) design inspired by macOS/iOS interfaces. This document provides a comprehensive guide to using and extending the design system.

## 🎨 Design Principles

1. **Frosted Glass Effect**: Translucent backgrounds with backdrop blur
2. **Subtle Motion**: 200ms transitions with professional animations
3. **Visual Depth**: Layered blur intensities and shadows
4. **Accessibility**: Full support for `prefers-reduced-motion`
5. **Consistency**: Shared CSS variables ensure uniform styling

## 📁 File Structure

```
contablebot-portal/
├── styles/
│   ├── globals.css          # Glassmorphism CSS variables & utilities
│   └── table.css            # PrimeReact glassmorphic styling
├── components/
│   ├── ui/
│   │   ├── glass-card.tsx   # Reusable glass container
│   │   ├── skeleton.tsx     # Loading states
│   │   ├── progress-ring.tsx # Circular progress
│   │   ├── button.tsx       # Enhanced with glass variants
│   │   └── input.tsx        # Enhanced with glass variant
│   ├── StatsCard.tsx        # Animated stat cards
│   ├── AdminHeader.tsx      # Sticky glass navbar
│   ├── MobileSidenav.tsx    # Glass drawer
│   └── DashboardLayout.tsx  # Layout with background pattern
└── pages/
    └── dashboard.tsx        # Example implementation
```

## 🎯 Core CSS Variables

### Glassmorphism Colors (globals.css)

```css
/* Light Mode */
--glass-white: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.18);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);

/* Dark Mode */
--glass-white: rgba(0, 0, 0, 0.4);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

### Gradient Variables

```css
--primary-gradient: linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(221 83% 63%) 100%);
--accent-gradient: linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(221 83% 53%) 100%);
```

### Background Pattern

```css
--bg-pattern: radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
```

## 🧩 Component Usage

### 1. GlassCard

Reusable glassmorphic container with multiple variants.

```tsx
import { GlassCard } from "@/components/ui/glass-card"

// Basic usage
<GlassCard>
  <p>Content here</p>
</GlassCard>

// With variants
<GlassCard variant="elevated" hover="lift" rounded="2xl">
  <p>Elevated card with lift effect</p>
</GlassCard>
```

**Variants:**
- `default` - Standard glass effect
- `elevated` - Enhanced shadow
- `bordered` - Gradient border
- `flat` - Minimal shadow

**Hover Effects:**
- `none` - No hover effect
- `lift` - translateY(-4px) on hover
- `glow` - Blue glow shadow
- `scale` - Scale to 1.02

**Rounded Options:** `none`, `sm`, `md`, `lg`, `xl`, `2xl`, `full`

### 2. Button Variants

Enhanced button component with glassmorphic variants.

```tsx
import { Button } from "@/components/ui/button"

// Glass variant
<Button variant="glass">Click me</Button>

// Gradient variant
<Button variant="gradient">Submit</Button>

// Glow variant
<Button variant="glow">Save</Button>
```

**New Variants:**
- `glass` - Translucent with backdrop blur
- `gradient` - Primary gradient background
- `glow` - Glowing hover effect

**All variants include:**
- Subtle scale animation on hover (1.02)
- Smooth 200ms transitions

### 3. Input Component

Enhanced input with glass variant.

```tsx
import { Input } from "@/components/ui/input"

// Default input
<Input type="text" placeholder="Enter text" />

// Glass variant
<Input variant="glass" type="email" placeholder="Email" />
```

**Glass variant features:**
- Backdrop blur effect
- Enhanced focus glow (blue shadow)
- Increased blur on focus

### 4. ProgressRing

Circular progress indicator with color-coded states.

```tsx
import { ProgressRing, UsageRing } from "@/components/ui/progress-ring"

// Basic progress ring
<ProgressRing value={75} max={100} />

// Usage ring (for stats)
<UsageRing used={150} limit={200} size="lg" glowEffect />
```

**Features:**
- Color-coded: green < 50%, blue < 75%, yellow < 90%, red >= 90%
- Smooth 1-second animation
- Glassmorphic center label
- Optional glow effect at high usage

**Sizes:** `sm` (64px), `md` (96px), `lg` (128px), `xl` (160px)

### 5. Skeleton Loaders

Loading states with glassmorphic styling.

```tsx
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"

// Basic skeleton
<Skeleton variant="glass" className="h-10 w-full" />

// Preset skeletons
<SkeletonCard />
<SkeletonTable rows={5} />
```

**Variants:**
- `default` - Standard pulse animation
- `glass` - Glass effect with pulse
- `shimmer` - Shimmer animation

### 6. StatsCard

Animated statistics card with glassmorphic background.

```tsx
import StatsCard from "@/components/StatsCard"
import { TrendingUp } from "lucide-react"

<StatsCard
  title="Revenue"
  value={1250}
  subtitle="This month"
  icon={TrendingUp}
  iconBgColor="bg-primary/20"
  iconColor="text-primary"
  animate={true}
  trend={{
    value: 12,
    label: "vs last month",
    isPositive: true
  }}
/>
```

**Features:**
- Animated number counting (1-second count-up)
- GlassCard wrapper with lift effect
- Gradient icon backgrounds
- Trend indicators with arrows

## 🎨 Utility Classes

### Transitions

```css
.transition-smooth    /* 200ms ease for basic transitions */
.transition-glass     /* Multi-property transition for glass effects */
```

### Hover Effects

```css
.hover-lift           /* translateY(-4px) on hover */
.hover-lift:hover     /* Applied automatically */
```

### Page Background

```css
.page-background      /* Gradient + pattern background */
```

**Usage:**
```tsx
<div className="min-h-screen page-background">
  {/* Page content */}
</div>
```

## 🖼️ Layout Components

### AdminHeader

Sticky glassmorphic header with scroll-activated blur.

```tsx
import AdminHeader from "@/components/AdminHeader"

<AdminHeader
  firmName="Company Name"
  userEmail="user@example.com"
  usedThisMonth={150}
  planLimit={500}
  showUserStats={true}
  userRole="admin"
  planKey="pro"
/>
```

**Features:**
- Sticky positioning with scroll detection
- Glassmorphic blur activates after 10px scroll
- Navigation links with glass active states
- UsageRing component for usage stats
- Gradient user avatar

### MobileSidenav

Glassmorphic mobile drawer navigation.

```tsx
import MobileSidenav from "@/components/MobileSidenav"

<MobileSidenav
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  userData={{
    firm_name: "Company",
    email: "user@example.com",
    role: "admin",
    plan: "pro"
  }}
  isAdmin={true}
  hasProPlan={true}
/>
```

**Features:**
- Backdrop blur with reduced opacity
- Glass drawer with backdrop-blur-xl
- Navigation links with scale hover
- Glassmorphic user info card
- Destructive logout button styling

### DashboardLayout

Main layout wrapper with background pattern.

```tsx
import DashboardLayout from "@/components/DashboardLayout"

<DashboardLayout
  title="Dashboard - ContableBot"
  showUserStats={true}
>
  {(userData, refreshUserData) => (
    <div>
      {/* Your content */}
    </div>
  )}
</DashboardLayout>
```

**Features:**
- Automatic page-background pattern
- Glassmorphic loading state
- Smooth transitions on content
- User data fetching and passing

## 🎭 PrimeReact Styling

All PrimeReact components are automatically styled with glassmorphism via `table.css`:

### DataTable
- Glass container with backdrop blur
- Row hover with scale animation
- Glassmorphic paginator buttons
- Glass dropdowns and inputs

### Dialogs & Modals
- Confirm dialogs with heavy blur (24px)
- Glassmorphic toast notifications
- Color-coded toast borders

### Dropdowns
- Glass panels with blur
- Hover states with blue tint
- Active item highlighting

## 🎨 Custom Glassmorphic Elements

### Creating Glass Elements

```tsx
// Basic glass container
<div className="
  bg-[var(--glass-white)]
  backdrop-blur-md
  border border-[var(--glass-border)]
  rounded-xl
  shadow-[var(--glass-shadow)]
  transition-glass
">
  Content
</div>

// With hover effect
<div className="
  bg-[var(--glass-white)]
  backdrop-blur-md
  border border-[var(--glass-border)]
  rounded-xl
  shadow-[var(--glass-shadow)]
  hover:shadow-lg
  hover-lift
  transition-glass
">
  Interactive content
</div>
```

### Backdrop Blur Utilities (Tailwind)

```tsx
backdrop-blur-xs   // 2px
backdrop-blur-sm   // 4px
backdrop-blur      // 12px (default)
backdrop-blur-md   // 16px
backdrop-blur-lg   // 24px
backdrop-blur-xl   // 40px
```

## ♿ Accessibility

### Reduced Motion Support

All animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Semantic HTML
- All interactive elements use proper semantic tags
- ARIA labels on icon-only buttons
- Focus states with visible indicators

## 🎯 Best Practices

### 1. Use Existing Components

Always prefer using existing glassmorphic components:

```tsx
// ✅ Good
<GlassCard>Content</GlassCard>

// ❌ Avoid (unless necessary)
<div className="bg-white/70 backdrop-blur-md ...">Content</div>
```

### 2. Consistent Blur Levels

Follow the blur hierarchy:
- **Light blur (4-8px)**: Secondary elements, inputs
- **Medium blur (12-16px)**: Cards, containers
- **Heavy blur (24-40px)**: Modals, drawers, overlays

### 3. Hover State Animations

Keep animations subtle and professional:
- Use `hover:scale-[1.02]` for clickable elements
- Use `hover-lift` for cards
- Avoid excessive or jarring movements

### 4. Color Contrast

Ensure sufficient contrast on glass backgrounds:
- Use semibold or bold fonts when needed
- Test with both light and dark modes
- Use colored borders for important elements

### 5. Performance

Optimize backdrop-filter usage:
- Avoid nesting too many blurred elements
- Use `will-change: backdrop-filter` sparingly
- Test on lower-end devices

## 🔧 Customization

### Adjusting Glass Opacity

Edit `globals.css`:

```css
:root {
  --glass-white: rgba(255, 255, 255, 0.7); /* Increase for more opaque */
}

.dark {
  --glass-white: rgba(0, 0, 0, 0.4); /* Adjust for dark mode */
}
```

### Changing Blur Intensity

```css
/* Stronger blur */
backdrop-blur-lg  /* 24px */

/* Lighter blur */
backdrop-blur-sm  /* 4px */
```

### Custom Gradients

Add new gradients in `globals.css`:

```css
:root {
  --my-gradient: linear-gradient(135deg, #color1 0%, #color2 100%);
}
```

## 📱 Responsive Design

All components are mobile-first and responsive:

- GlassCard adjusts padding on mobile
- AdminHeader collapses to mobile menu
- MobileSidenav is touch-optimized
- Tables scroll horizontally on mobile

## 🚀 Next Steps

### Optional Enhancements

1. **Additional Pages**: Apply glassmorphic styling to:
   - Reportes page
   - Configuración page
   - QA Review page
   - Clientes/Usuarios pages

2. **Chart Integration**: Add Chart.js with glassmorphic containers

3. **More Components**: Create additional glassmorphic components as needed:
   - Glass badges
   - Glass alerts
   - Glass tabs
   - Glass select dropdowns

### Extending the System

To create new glassmorphic components:

1. Use GlassCard as a wrapper
2. Apply consistent blur levels
3. Add subtle hover effects
4. Test in both light/dark modes
5. Ensure accessibility compliance

## 📚 Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Class Variance Authority**: https://cva.style/docs
- **PrimeReact**: https://primereact.org
- **Lucide Icons**: https://lucide.dev

## 🐛 Troubleshooting

### Issue: Blur not working in Safari
**Solution**: Ensure both `backdrop-filter` and `-webkit-backdrop-filter` are applied

### Issue: Animations too fast/slow
**Solution**: Adjust transition duration in `transition-glass` utility class

### Issue: Low contrast on glass elements
**Solution**: Increase opacity in `--glass-white` variable or use colored backgrounds

### Issue: Performance issues on mobile
**Solution**: Reduce blur intensity on smaller screens using responsive utilities

---

**Version**: 1.0.0
**Last Updated**: January 2026
**Maintained By**: ContableBot Development Team
