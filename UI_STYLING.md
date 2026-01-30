# UI Styling Documentation

## Overview

This document describes the UI styling system implemented for the FPPS (P2P File Transfer) application. The application uses a **dark theme** with a modern, intuitive interface that works seamlessly on both desktop and mobile devices.

## Design Philosophy

- **Dark Theme**: Single dark color scheme optimized for reduced eye strain
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Intuitive Layout**: Clear visual hierarchy and logical component organization
- **Accessibility**: High contrast ratios and clear interactive states
- **Performance**: CSS-only animations and transitions for smooth UX

## CSS Variables System

All styling parameters are defined as CSS variables in `/web/style.css` for easy customization and consistency.

### Color Palette

```css
--color-bg-primary: #0f0f14      /* Main background */
--color-bg-secondary: #1a1a24    /* Card backgrounds */
--color-bg-tertiary: #24242e     /* Input backgrounds */
--color-bg-elevated: #2d2d3a     /* Elevated elements */
--color-bg-hover: #363644        /* Hover states */
--color-bg-active: #3f3f4d       /* Active states */

--color-text-primary: #e8e8ee    /* Primary text */
--color-text-secondary: #b0b0bc  /* Secondary text */
--color-text-tertiary: #808090   /* Tertiary text */
--color-text-disabled: #5a5a66   /* Disabled text */

--color-accent: #5a5ff5          /* Primary accent */
--color-success: #22c55e         /* Success states */
--color-warning: #f59e0b         /* Warning states */
--color-error: #ef4444           /* Error states */
--color-info: #3b82f6            /* Info states */
```

### Spacing System

```css
--spacing-xs: 0.25rem   /* 4px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 1rem      /* 16px */
--spacing-lg: 1.5rem    /* 24px */
--spacing-xl: 2rem      /* 32px */
--spacing-2xl: 3rem     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.375rem   /* 6px */
--radius-md: 0.5rem     /* 8px */
--radius-lg: 0.75rem    /* 12px */
--radius-xl: 1rem       /* 16px */
```

### Typography

```css
--font-family-base: Inter, system-ui, -apple-system, ...
--font-family-mono: "JetBrains Mono", "Fira Code", ...

--font-size-xs: 0.75rem     /* 12px */
--font-size-sm: 0.875rem    /* 14px */
--font-size-base: 1rem      /* 16px */
--font-size-lg: 1.125rem    /* 18px */
--font-size-xl: 1.25rem     /* 20px */
--font-size-2xl: 1.5rem     /* 24px */
--font-size-3xl: 1.875rem   /* 30px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), ...
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), ...
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), ...
```

## Component Styling

### Room Page (`/web/pages/Room/`)

The main transfer interface with the following sections:

#### Peer Status
- Visual connection indicator with pulse animation
- Three states: connected (green), connecting (yellow), disconnected (gray)
- Error display area for connection issues

#### Share Section
- Displayed when waiting for peer connection
- Large, easy-to-copy share code with monospace font
- Clickable share link

#### Files Layout
- **Desktop (≥1024px)**: Side-by-side two-column grid
- **Mobile (<1024px)**: Single column, Peer files shown first, My files second

### Me Component (`/web/components/Me.tsx`)

Displays user's files and upload controls:

- File count and total size summary
- Upload status with colored badges
- Transfer progress with animated progress bar
- Folder upload button
- Files upload button
- Clear files button (secondary style)
- Stop upload button (danger style)

### Peer Component (`/web/components/Peer.tsx`)

Displays peer's files and download controls:

- File count and total size summary
- Download status with colored badges
- Transfer progress with animated progress bar
- Download as ZIP button
- Stop download button (danger style)

### Transfer Progress (`/web/components/TransferProgress.tsx`)

Visual progress indicator:

- File count progress (current/total)
- Data transfer progress (transferred/total)
- Animated progress bar with shimmer effect during active transfer
- Large percentage display

## Responsive Behavior

### Desktop (≥1024px)
- Two-column layout with Me and Peer side-by-side
- Maximum width: 1280px (centered)
- Generous spacing and padding
- Full-width buttons in action groups

### Tablet (768px - 1023px)
- Single column layout
- Peer files displayed first (order: 1)
- My files displayed second (order: 2)
- Reduced padding

### Mobile (<768px)
- Single column layout
- Peer files displayed first
- My files displayed second
- Minimal padding
- Stacked action buttons (full width)
- Reduced font sizes for share code

## Button Styles

### Primary Buttons
- Default style with accent color
- Used for: Download as ZIP, file upload actions
- Hover: Slight lift with shadow
- Disabled: Reduced opacity, gray background

### Secondary Buttons
- Tertiary background color
- Used for: Clear files
- `.secondary` class

### Danger Buttons
- Red background for destructive actions
- Used for: Stop upload, Stop download
- `.danger` class

## Animations

### Pulse Animation
- Used for connection status indicator
- 2-second cycle, fades between 100% and 50% opacity

### Shimmer Animation
- Used for active progress bars
- Moving gradient effect indicating active transfer
- 2-second cycle

### Transitions
- All interactive elements: 150ms ease
- Smooth color and transform changes
- Buttons lift slightly on hover

## File Input Styling

- Custom-styled file selector buttons
- Disabled state with reduced opacity
- Consistent with button design system
- Directory upload support (webkit/moz attributes)

## Status Badges

Visual indicators for transfer states:

- **Idle**: Gray background
- **Transfer**: Blue background with info color
- **Done**: Green background with success color
- **Aborted**: Red background with error color

## Typography Hierarchy

- **h2**: Main section titles (My Files, Peer's Files) - 1.5rem
- **h3**: Subsection titles - 1.25rem
- **Labels**: Small, uppercase, tertiary color - 0.75rem
- **Values**: Medium weight, primary color
- **Code**: Monospace font for share codes and links

## Accessibility Features

- High contrast text colors (WCAG AA compliant)
- Clear focus states on interactive elements
- Semantic HTML structure
- Disabled state styling
- Screen-reader friendly labels
- Proper heading hierarchy

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox layout
- CSS Custom Properties (variables)
- Webkit-specific scrollbar styling
- File input directory attributes with fallbacks

## Future Theming

The CSS variable system is designed to support easy theming:

1. All colors defined as variables in `:root`
2. Components reference variables, not hard-coded colors
3. To add light theme: Create alternate variable definitions
4. To add custom themes: Override color variables

Example for future light theme:
```css
[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #1a1a1a;
  /* ... other overrides ... */
}
```

## Files Modified

- `/web/style.css` - Global styles and CSS variables
- `/web/pages/Room/style.css` - Room-specific styles
- `/web/pages/Room/index.tsx` - Room component with styling
- `/web/components/Me.tsx` - My files component
- `/web/components/Peer.tsx` - Peer files component
- `/web/components/TransferProgress.tsx` - Progress indicator
- `/index.html` - Page title and color scheme meta tag

## Development Notes

- All spacing uses CSS variables for consistency
- Avoid magic numbers - use defined spacing values
- Keep specificity low - use classes, not IDs
- Mobile-first media queries
- Use semantic class names (BEM-like structure)
- Animations use CSS for performance