# UniStay Logo Component

This document describes the UniStay logo assets and how to use the Logo component throughout the application.

## Logo Assets

The following logo assets are available in the `/public` directory:

### 1. Full Logo (`/unistay-logo.svg`)
- **Size**: 120x40px
- **Usage**: Headers, marketing materials, large displays
- **Features**: Complete logo with icon and text
- **Colors**: Blue gradient (#2563eb to #1d4ed8) with accent dot (#f59e0b)

### 2. Icon Only (`/unistay-icon.svg`)
- **Size**: 40x40px
- **Usage**: Favicons, small spaces, mobile apps
- **Features**: Square icon with house symbol
- **Colors**: Blue gradient background with white house icon

## Logo Component Usage

The `Logo` component provides a flexible way to display the UniStay logo with different variants and sizes.

### Basic Usage

```tsx
import Logo from '@/components/Logo'

// Full logo with default settings
<Logo />

// Icon only
<Logo variant="icon" />

// Text only
<Logo variant="text" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'full' \| 'icon' \| 'text'` | `'full'` | Logo variant to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the logo |
| `href` | `string` | `'/'` | Link destination (set to empty string to disable linking) |
| `className` | `string` | - | Additional CSS classes |
| `showAccent` | `boolean` | `true` | Whether to show the accent dot |

### Size Reference

| Size | Icon | Full Logo | Text |
|------|------|-----------|------|
| `sm` | 32x32px | 96x32px | text-lg |
| `md` | 40x40px | 120x40px | text-xl |
| `lg` | 48x48px | 144x48px | text-2xl |

### Examples

```tsx
// Dashboard header
<Logo variant="full" size="md" href="/dashboard" />

// Mobile navigation
<Logo variant="icon" size="sm" />

// Footer
<Logo variant="text" size="lg" href="" className="opacity-75" />

// Marketing page
<Logo variant="full" size="lg" className="hover:scale-105 transition-transform" />
```

### Convenience Exports

For common use cases, you can use the convenience exports:

```tsx
import { LogoIcon, LogoText, LogoFull } from '@/components/Logo'

<LogoIcon size="sm" />
<LogoText size="lg" />
<LogoFull href="/" />
```

## Design Guidelines

### Colors
- **Primary**: Blue gradient (#2563eb to #1d4ed8)
- **Accent**: Amber (#f59e0b)
- **Background**: White/transparent

### Usage Rules
1. Always maintain aspect ratio
2. Ensure sufficient contrast with background
3. Use appropriate size for context
4. Don't modify colors or proportions
5. Maintain clear space around logo

### Dark Mode
The logo automatically adapts to dark mode with appropriate color adjustments for the text variant.

## File Structure

```
public/
├── unistay-logo.svg     # Full logo
└── unistay-icon.svg     # Icon only

src/components/
└── Logo.tsx             # Logo component
```

## Accessibility

- All logo variants include proper `alt` text
- SVG assets are optimized for screen readers
- Color contrast meets WCAG guidelines
- Focus states are properly handled for interactive logos