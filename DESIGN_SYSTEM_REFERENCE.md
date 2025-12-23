# Design System & CSS Utilities - Quick Reference

**A comprehensive guide to the modern design system used in Renuga CRM UI enhancements.**

---

## 🎨 Color System

### **Primary Palette**

```
Blue (Primary Accent):
- blue-500: #3B82F6 (Focus, hover states)
- blue-600: #2563EB (Default primary)
- blue-700: #1D4ED8 (Hover, pressed)

Purple (Secondary Accent):
- purple-600: #9333EA (Secondary actions)
- purple-700: #7E22CE (Hover state)

Slate (Neutral Base - Dark Theme):
- slate-800: #1E293B (Cards, inputs)
- slate-900: #0F172A (Main background)
- slate-600: #475569 (Subtle borders)
- slate-500: #64748B (Muted text)
- slate-400: #94A3B8 (Secondary text)

Text Colors:
- white: #FFFFFF (Primary text on dark)
- slate-50: #F8FAFC (High contrast text)
- slate-400: #94A3B8 (Secondary text)
- slate-500: #64748B (Muted text)
```

### **Semantic Colors**

```
Success: #10B981 (Green)
- Used for: Confirmations, active states, positive actions

Warning: #F59E0B (Amber)
- Used for: Alerts, cautions, validation warnings

Error: #EF4444 (Red)
- Used for: Errors, destructive actions, invalid states

Info: #3B82F6 (Blue)
- Used for: Information, help text, secondary actions
```

### **Color Usage in Modernized Components**

**Login Page:**
```
Background: bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
Logo Ring: bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500
Logo Badge: bg-gradient-to-br from-blue-600 to-purple-600
Card: bg-slate-800/80 with border-white/10
Button: bg-gradient-to-r from-blue-600 to-purple-600
Input Focus: focus:border-blue-500/50 focus:ring-blue-500/30
```

**Change Password Dialog:**
```
Strength Bars (Weak): bg-red-500
Strength Bars (Medium): bg-yellow-500
Strength Bars (Strong): bg-green-500
Mismatch Alert: bg-amber-500/10 border-amber-500/30
Button: bg-gradient-to-r from-blue-600 to-purple-600
```

---

## 🔲 Component Sizing

### **Touch Target Sizes (Mobile Friendly)**

```
Minimum Touch Target: 44px × 44px (recommended by WCAG)

Button Heights:
- size="sm": h-9 (36px)
- default: h-10 (40px)
- size="lg": h-12 (48px)
- Form Submit: h-11 (44px)

Icon Sizes:
- Small: h-3 w-3 (12px)
- Default: h-4 w-4 (16px)
- Large: h-5 w-5 (20px)
- XL: h-6 w-6 (24px)

Input Heights:
- Default: h-10 (40px)
- Input with icons: pl-10 pr-10 (padding for icons)
```

---

## 📏 Spacing Scale (Tailwind)

```
0: 0
0.5: 0.125rem (2px)
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)         ← Base unit
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)

Applied in Components:
- Page padding: p-4 (mobile) → p-6 (desktop)
- Card spacing: space-y-4 to space-y-5
- Section gaps: gap-6 to gap-8
- Dialog spacing: space-y-4 py-4
```

---

## 🎯 Typography System

### **Font Stack**

```
Display Font (Headings):
font-display (sans-serif, modern)

Body Font (Text):
Default system font (Inter, Helvetica, sans-serif)

Implementation:
<h1 className="text-2xl font-display font-bold">
<h2 className="text-xl font-display font-semibold">
<p className="text-base font-normal">
<span className="text-sm text-muted-foreground">
<p className="text-xs font-medium tracking-wide">
```

### **Text Sizes & Weights**

```
Display/Large: text-2xl (28px), font-bold, font-display
- Usage: Page titles, main headings

Heading 2: text-xl (20px), font-semibold, font-display
- Usage: Section titles, dialog titles

Heading 3: text-lg (18px), font-semibold
- Usage: Card titles, subsection titles

Body: text-base (16px), font-normal
- Usage: Regular paragraph text

Small: text-sm (14px), font-normal
- Usage: Helper text, labels, descriptions

Tiny: text-xs (12px), font-normal
- Usage: Timestamps, secondary info, footer

Weight Options:
- font-light: 300 (rarely used)
- font-normal: 400 (default body)
- font-medium: 500 (labels, emphasis)
- font-semibold: 600 (headings, strong emphasis)
- font-bold: 700 (display titles)
```

### **Letter Spacing**

```
tracking-normal: 0 (default)
tracking-wide: 0.05em (0.8px at base size)
- Usage: Labels, small headings, decorative text

tracking-wider: 0.1em
- Usage: Very prominent labels

tracking-tight: -0.025em
- Usage: Large headings (optional)
```

---

## ✨ Shadow & Depth System

### **Box Shadows**

```
shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05)
- Usage: Subtle depth, hover effects

shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1)
- Usage: Floating elements, buttons

shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1)
- Usage: Cards, modals, prominent elements

shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.25)
- Usage: Dialogs, alerts, maximum depth

Colored Shadows (Hover states):
shadow-blue-500/20: Blue-tinted shadow (20% opacity)
shadow-purple-500/20: Purple-tinted shadow
- Usage: Hover states on gradient elements
- Creates premium "glowing" effect
```

### **Layering with Z-Index**

```
relative: z-10 (components within layout)
fixed: z-20 (sticky headers, alerts)
Dialog/Modal: z-50 (absolute on top)

Login Page:
- Background blobs: absolute (no z-index, behind)
- Content: relative z-10 (on top)
- Dialog: automatic z-50
```

---

## 🎬 Animation & Transitions

### **Built-in Animations**

```
animate-pulse:
- Used for: Logo ring, gradient blobs, loading states
- Effect: opacity 100% → 50% → 100% (2s loop)

animate-spin:
- Used for: Loading spinner
- Effect: Full 360° rotation

transition-all:
- Used for: Hover effects, color changes
- Duration: duration-200 (200ms) to duration-300 (300ms)
- Easing: ease-in-out (default)

Applied Examples:
- Button: transition-all duration-200 hover:shadow-xl
- Input: transition-all focus:border-blue-500
- Icon: transition-colors hover:text-blue-400
```

### **Opacity Classes**

```
opacity-0 to opacity-100 (11 levels)

Used for:
- Glass-morphism: bg-slate-800/80 (80% opacity)
- Borders: border-white/10 (10% opacity)
- Text: text-slate-500/70 (70% opacity)
- Overlays: bg-black/50 (50% opacity)
```

---

## 🔗 Common CSS Patterns Used

### **Glass-Morphism Effect**

```css
.card {
  backdrop-blur-xl;        /* Blur background */
  bg-slate-800/80;         /* Semi-transparent dark background */
  border: 1px solid;       /* Border needed */
  border-color: white/10;  /* Very subtle border */
  shadow-xl;               /* Adds depth */
}

Result: Frosted glass appearance, modern premium look
```

### **Gradient Overlays**

```css
.button {
  bg-gradient-to-r from-blue-600 to-purple-600;
  transition: all 200ms;
}

.button:hover {
  from-blue-700;
  to-purple-700;
  shadow-blue-500/30;      /* Tinted shadow */
}

Result: Smooth color transition with depth
```

### **Focus States (Accessibility)**

```css
.input {
  border: 1px solid slate-600;
  ring: 0;                 /* No ring by default */
}

.input:focus-visible {
  border-color: blue-500;
  ring-blue-500/30;        /* Subtle blue ring */
  outline: none;           /* Remove default outline */
}

Result: Clear focus state, accessible, professional
```

### **Disabled States**

```css
.button:disabled {
  opacity-50;              /* Reduce visibility */
  cursor-not-allowed;      /* Show disabled cursor */
  pointer-events-none;     /* Prevent interaction */
}

Result: Clear disabled indication
```

---

## 📐 Layout Patterns

### **Centered Form Layout**

```jsx
<div className="min-h-screen flex items-center justify-center p-4">
  <div className="w-full max-w-md space-y-6">
    {/* Content */}
  </div>
</div>

Breakdown:
- min-h-screen: Full viewport height
- flex items-center justify-center: Perfect centering
- p-4: Padding on mobile
- w-full: Full width (constrained by parent)
- max-w-md: Max width 448px
- space-y-6: 24px vertical spacing between children
```

### **Card Layout**

```jsx
<Card className="border-white/10 bg-slate-800/80 backdrop-blur-xl shadow-2xl">
  <CardHeader className="border-b border-white/5">
    {/* Header content */}
  </CardHeader>
  <CardContent className="space-y-4 py-4">
    {/* Content */}
  </CardContent>
  <CardFooter className="gap-2">
    {/* Footer buttons */}
  </CardFooter>
</Card>

Key Classes:
- border-white/10: Subtle border
- bg-slate-800/80: 80% opaque dark background
- backdrop-blur-xl: Glass effect
- shadow-2xl: Maximum depth
```

### **Input Group (Icon + Input)**

```jsx
<div className="relative group">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 
                    text-slate-500 group-focus-within:text-blue-400" />
  <Input className="pl-10 bg-slate-700/50 focus:border-blue-500/50" />
</div>

Features:
- Absolute positioned icon
- -translate-y-1/2: Vertical centering
- pl-10: Left padding for icon (40px)
- group-focus-within: Color changes when input focused
```

---

## 🎛️ Component Customization Examples

### **Creating a Secondary Button**

```jsx
<Button 
  variant="outline"
  className="border-slate-600/50 text-slate-200 hover:bg-slate-700"
>
  Secondary Action
</Button>
```

### **Creating a Gradient Button**

```jsx
<Button className="bg-gradient-to-r from-blue-600 to-purple-600 
                    hover:from-blue-700 hover:to-purple-700 
                    shadow-lg hover:shadow-blue-500/30">
  Premium Action
</Button>
```

### **Styling a Text Input**

```jsx
<Input
  className="bg-slate-700/50 border-slate-600/50 text-white 
             placeholder:text-slate-500 
             focus:border-blue-500/50 focus:ring-blue-500/30"
/>
```

### **Creating a Section Title**

```jsx
<h2 className="text-xl font-display font-semibold text-white mb-4">
  Section Title
</h2>
```

---

## 📋 Component Class Reference

### **Button Variants**

```
Default: bg-primary text-primary-foreground
Outline: border border-input bg-background text-foreground
Ghost: bg-transparent text-foreground hover:bg-accent
Destructive: bg-destructive text-destructive-foreground
Secondary: bg-secondary text-secondary-foreground

In Dark Theme:
Default: Blue/Purple gradient
Outline: Subtle borders on dark
Ghost: Transparent with hover effect
Destructive: Red background
```

### **Input States**

```
Default: bg-background border-input
Hover: border-input/50
Focus: border-blue-500 ring-blue-500/30
Error: border-red-500 ring-red-500/30
Disabled: opacity-50 cursor-not-allowed
```

---

## 🚀 Performance Tips

### **CSS Optimization**

```
✅ DO:
- Use Tailwind classes (pre-compiled)
- Group related classes: className={cn(baseClass, stateClass)}
- Use CSS variables for theming
- Leverage GPU acceleration: transform, opacity, etc.

❌ DON'T:
- Write custom CSS in components
- Use inline styles
- Create unnecessary divs for styling
- Use !important flags
```

### **Animation Best Practices**

```
✅ Animate: opacity, transform, colors
✅ Duration: 200-300ms for most interactions
✅ Easing: ease-in-out for natural feel

❌ Avoid: Animating layout properties
❌ Avoid: Duration > 500ms (feels sluggish)
❌ Avoid: Complex animations on scroll
```

---

## 📱 Responsive Design Considerations

```
Mobile First Approach:
- Default (mobile): Space-y-4, text-base
- md: Increase spacing slightly
- lg: Add more breathing room

Typography Scale:
Mobile: text-lg, sm: text-xl, md: text-2xl

Spacing Scale:
Mobile: gap-4, sm: gap-5, md: gap-6

Touch Targets:
Minimum: 44px × 44px (all platforms)
```

---

## ✅ Quick Checklist for New Components

- [ ] Use proper color palette
- [ ] Maintain 44px+ touch targets
- [ ] Apply consistent spacing
- [ ] Include focus states
- [ ] Add hover states
- [ ] Test on mobile
- [ ] Check contrast ratios
- [ ] Use semantic HTML
- [ ] Add ARIA labels
- [ ] Test with keyboard
- [ ] Test with screen reader

---

**Last Updated:** December 21, 2025

**For Questions:** Refer to main UI_UX_MODERNIZATION_GUIDE.md for detailed implementation context.
