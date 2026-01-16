# Glassmorphic Design System - Quick Reference

## 🎨 CSS Variables

```css
/* Use these in your components */
var(--glass-white)    /* Glass background color */
var(--glass-border)   /* Glass border color */
var(--glass-shadow)   /* Glass shadow */
var(--primary-gradient)  /* Primary gradient */
var(--accent-gradient)   /* Accent gradient */
var(--bg-pattern)        /* Background pattern */
```

## 🧩 Ready-to-Use Components

### GlassCard
```tsx
<GlassCard variant="default|elevated|bordered|flat"
           hover="none|lift|glow|scale"
           rounded="sm|md|lg|xl|2xl">
  Content
</GlassCard>
```

### Button
```tsx
<Button variant="glass|gradient|glow">Click me</Button>
```

### Input
```tsx
<Input variant="glass" placeholder="..." />
```

### ProgressRing
```tsx
<ProgressRing value={75} max={100} size="sm|md|lg|xl" />
<UsageRing used={150} limit={200} glowEffect />
```

### Skeleton
```tsx
<Skeleton variant="glass|shimmer" />
<SkeletonCard />
<SkeletonTable rows={5} />
```

### StatsCard
```tsx
<StatsCard title="Revenue" value={1250}
           icon={Icon} animate={true} />
```

## 🎯 Utility Classes

```css
/* Transitions */
.transition-smooth    /* 200ms basic transition */
.transition-glass     /* Glass-specific transition */

/* Hover Effects */
.hover-lift          /* Lift on hover */

/* Background */
.page-background     /* Full page gradient + pattern */
```

## 📐 Common Patterns

### Glass Container
```tsx
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
```

### Glass Card with Hover
```tsx
<div className="
  bg-[var(--glass-white)]
  backdrop-blur-md
  border border-[var(--glass-border)]
  rounded-2xl
  p-6
  hover:shadow-lg
  hover-lift
  transition-glass
">
  Interactive content
</div>
```

### Glass Button
```tsx
<button className="
  bg-[var(--glass-white)]
  backdrop-blur-md
  border border-[var(--glass-border)]
  px-4 py-2
  rounded-lg
  hover:scale-[1.02]
  transition-all
">
  Click me
</button>
```

### Glass Input
```tsx
<input className="
  bg-[var(--glass-white)]
  backdrop-blur-md
  border border-[var(--glass-border)]
  rounded-lg
  px-3 py-2
  focus:border-primary/50
  focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]
  transition-glass
" />
```

## 🎭 Backdrop Blur Levels

```tsx
backdrop-blur-xs    /* 2px  - Very subtle */
backdrop-blur-sm    /* 4px  - Light */
backdrop-blur       /* 12px - Default */
backdrop-blur-md    /* 16px - Medium */
backdrop-blur-lg    /* 24px - Heavy */
backdrop-blur-xl    /* 40px - Very heavy */
```

## 🎨 When to Use Each Blur Level

- **xs/sm (2-4px)**: Background elements, subtle overlays
- **default/md (12-16px)**: Cards, containers, main content
- **lg/xl (24-40px)**: Modals, drawers, important overlays

## 📱 Layout Components

### Page Layout
```tsx
<DashboardLayout title="Page Title" showUserStats={true}>
  {(userData, refreshUserData) => (
    <div>{/* Your content */}</div>
  )}
</DashboardLayout>
```

### Header
```tsx
<AdminHeader
  firmName="Company"
  userEmail="user@example.com"
  usedThisMonth={150}
  planLimit={500}
  showUserStats={true}
/>
```

### Mobile Navigation
```tsx
<MobileSidenav
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  userData={userData}
/>
```

## 🎯 Color-Coded Progress

ProgressRing automatically color-codes based on percentage:
- **Green**: < 50%
- **Blue**: 50-75%
- **Yellow**: 75-90%
- **Red**: ≥ 90%

## 🎨 Gradient Usage

```tsx
/* Button with gradient */
<button className="bg-gradient-to-r from-primary to-[hsl(221_83%_63%)]">
  Gradient Button
</button>

/* Icon background with gradient */
<div className="bg-gradient-to-br from-primary/30 to-primary/10">
  <Icon />
</div>
```

## 🚀 Quick Start Templates

### Glass Card Page Section
```tsx
<section className="
  bg-[var(--glass-white)]
  backdrop-blur-md
  border border-[var(--glass-border)]
  rounded-2xl
  p-6
  shadow-[var(--glass-shadow)]
">
  <h2 className="text-xl font-bold mb-4">Section Title</h2>
  {/* Content */}
</section>
```

### Glass Action Cards Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {items.map(item => (
    <GlassCard hover="lift" key={item.id}>
      <div className="p-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/10
                        rounded-xl flex items-center justify-center mb-4">
          <item.icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-bold mb-2">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
    </GlassCard>
  ))}
</div>
```

### Glass Stats Row
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <StatsCard title="Total" value={1250} icon={TrendingUp} />
  <StatsCard title="Active" value={840} icon={Users} />
  <StatsCard title="Pending" value={125} icon={Clock} />
  <StatsCard title="Complete" value={95} icon={CheckCircle} />
</div>
```

## 💡 Pro Tips

1. **Always use CSS variables** instead of hardcoded colors
2. **Consistent blur levels** create better visual hierarchy
3. **Subtle animations** (200ms) feel more professional
4. **Test dark mode** for all glassmorphic elements
5. **Layer blur intensities** from light (background) to heavy (modals)

## 🎯 Dos and Don'ts

### ✅ Do
- Use existing components when possible
- Keep animations subtle (200ms, scale 1.02)
- Test on mobile devices
- Respect reduced motion preferences
- Use semantic HTML

### ❌ Don't
- Nest too many blurred elements
- Use excessive animations
- Ignore color contrast
- Hardcode glass colors
- Skip accessibility testing

## 🐛 Quick Fixes

### Blur not visible?
Add both properties:
```css
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```

### Low contrast?
Increase opacity:
```css
--glass-white: rgba(255, 255, 255, 0.85); /* Higher = more opaque */
```

### Animations too fast?
Adjust duration:
```css
transition: all 300ms ease; /* Slower */
```

---

**For detailed documentation, see**: [GLASSMORPHIC_DESIGN_SYSTEM.md](./GLASSMORPHIC_DESIGN_SYSTEM.md)
