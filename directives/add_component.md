# Directive: Add React Component

## Goal
Create a new React component following the ContableBot Portal's design system and patterns.

## When to Use
- User requests new UI functionality
- Extracting repeated UI patterns
- Building new features

## Inputs
- **Component name** (PascalCase)
- **Component purpose** (what it does)
- **Props interface** (if any)
- **Styling requirements** (Tailwind classes)

## Process

### 1. Analyze Existing Components
Read components in `components/` to understand patterns:
- `components/Header.tsx` - Navigation patterns
- `components/HeroSection.tsx` - Section layout patterns
- Landing page components for styling conventions

### 2. Determine Component Type

**Presentational Component:**
- Pure UI, no business logic
- Takes props, renders JSX
- Example: `<Button />`, `<Card />`

**Container Component:**
- Manages state
- Handles data fetching
- Example: `<InvoiceList />`, `<ClientFilter />`

### 3. Create the Component File
Location: `components/[ComponentName].tsx`

**Presentational Component Template:**
```typescript
import React from 'react';

interface ComponentNameProps {
  // Define props
  title: string;
  onClick?: () => void;
  className?: string;
}

export default function ComponentName({
  title,
  onClick,
  className = ''
}: ComponentNameProps) {
  return (
    <div className={`/* base styles */ ${className}`}>
      {/* Component JSX */}
    </div>
  );
}
```

**Container Component Template:**
```typescript
'use client'; // If using hooks

import React, { useState, useEffect } from 'react';

interface ComponentNameProps {
  // Define props
}

export default function ComponentName({ }: ComponentNameProps) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### 4. Apply Design System

**Color Palette:**
- Background: `bg-slate-950`, `bg-slate-900`, `bg-slate-800`
- Primary: `bg-sky-500`, `text-sky-500`, `border-sky-500`
- Text: `text-slate-100`, `text-slate-300`, `text-slate-400`
- Borders: `border-slate-700`, `border-slate-600`

**Typography:**
- Headings: `text-4xl font-bold`, `text-3xl font-semibold`
- Body: `text-base`, `text-sm`
- Font: System uses Geist (already configured)

**Spacing:**
- Sections: `py-12`, `px-4`, `max-w-7xl mx-auto`
- Cards: `p-6`, `rounded-lg`
- Gaps: `gap-4`, `gap-6`, `gap-8`

**Responsive Design:**
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Example: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 5. Integration Patterns

**Using PrimeReact Components:**
```typescript
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';

// PrimeReact components are already styled in globals.css
<Button label="Click me" className="custom-class" />
```

**Using shadcn/ui-style Components:**
```typescript
import { cn } from '@/lib/utils'; // If utils exist

const className = cn(
  'base-classes',
  condition && 'conditional-classes',
  props.className
);
```

### 6. State Management Patterns

**Local State:**
```typescript
const [isOpen, setIsOpen] = useState(false);
```

**API Data:**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/endpoint')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

## Tools to Use
- **Read tool**: Study existing components
- **Write tool**: Create new component file
- **Glob tool**: Find similar components

## Edge Cases

### Case: Component Needs Authentication State
Use the `/api/me` endpoint to get current user:
```typescript
useEffect(() => {
  fetch('/api/me')
    .then(res => res.json())
    .then(data => setUser(data.user));
}, []);
```

### Case: Component Needs to be Server-Side
- Remove `'use client'` directive
- Use `getServerSideProps` or `getStaticProps` in the page
- Pass data as props

### Case: Component is Page-Specific
- Consider putting it in the same file as the page
- Or create `components/[PageName]/` subdirectory

## Success Criteria
- [ ] Component file created with proper naming
- [ ] TypeScript interface for props defined
- [ ] Follows design system (colors, spacing, typography)
- [ ] Responsive design implemented
- [ ] No TypeScript errors
- [ ] Component exported as default

## Common Mistakes
1. Not defining prop types → type errors
2. Inconsistent styling → doesn't match design system
3. Not handling loading/error states
4. Missing `'use client'` when using hooks
5. Not making component reusable (too specific)

## Learning Notes
(This section gets updated as we discover new patterns)

- PrimeReact theme is customized in `styles/globals.css`
- Dark theme uses `slate-950` as base background
- All components should support `className` prop for flexibility
- Use `max-w-7xl mx-auto` for content containers
