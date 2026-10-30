# Heaven UI Components - Design System Documentation

This document captures all responsive dimensions, font sizes, padding, and margin values used across the UI component library.

---

## Table of Contents
- [Common Responsive Breakpoints](#common-responsive-breakpoints)
- [Common Spacing System](#common-spacing-system)
- [Common Font Sizes](#common-font-sizes)
- [Component-Specific Dimensions](#component-specific-dimensions)
- [Color System](#color-system)
- [Z-Index Values](#z-index-values)

---

## Common Responsive Breakpoints

All components use the following breakpoint system:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `xs` | 0px | Mobile phones (default) |
| `sm` | 600px | Small tablets |
| `md` | 900px | Tablets |
| `lg` | 1200px | Small laptops |
| `xl` | 1280px+ | Desktop (Desktop Density) |

**Desktop Density Query:** `@media (min-width: 1280px)`

---

## Common Spacing System

### Button Spacing
```typescript
responsiveButtonSx = {
  minHeight: { xs: 40, sm: 40, md: 36, xl: 36 },
  fontSize: { xs: 14, sm: 14, md: 14, xl: 14 },
  px: { xs: 2, sm: 2, md: 2, xl: 2 },
}
```

### Form Control Spacing
```typescript
responsiveControlSx = {
  height: { xs: 40, sm: 40, md: 40, xl: 40 },
  inputPadding: { xs: 1, sm: 1.25, md: 1.25, xl: 1.25 },
  iconSize: { xs: 20, md: 22, xl: 22 },
}
```

### Form Label Spacing
```typescript
formLabelSx = {
  fontSize: 11,
  fontWeight: 500,
  mb: { xs: 0.5, md: 0.5, xl: 0.5 },
}
```

### Form Error Spacing
```typescript
formErrorSx = {
  fontSize: 10.5,
  color: '#e24b4a',
  mt: { xs: 0.5, md: 0.5, xl: 0.5 },
}
```

---

## Common Font Sizes

### Helper Text
- Size: `10.5px` (all breakpoints)
- Margin Left: `0`

### Labels
- Size: `11px` (all breakpoints)
- Weight: `500`

### Body Text
- Mobile: `14-15px`
- Desktop (LG): `16px` (via `desktopFontSize`)
- Desktop (XL): `16px`

---

## Component-Specific Dimensions

### 1. Modal Component

#### Overall Dimensions
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Max Width | Custom | Custom | Custom | Custom | Custom |
| Max Height | `calc(100dvh - 64px)` | `calc(100dvh - 64px)` | `calc(100dvh - 64px)` | `calc(100dvh - 64px)` | `calc(100dvh - 64px)` |
| Border Radius | `2.25` | `2.25` | `2.25` | `2.25` | `2.25` |

#### Header
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Min Height | `44px` | `48px` | `44px` | `50px` | `50px` |
| Padding X | `2` | `2.5` | `2` | `20px` | `2.5` |
| Padding Y | `1` | `1` | `1` | `8px` | `1` |
| Font Size | `15px` | `16px` | `14px` | `17px` | `17px` |

#### Close Button
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Width | `28px` | `28px` | `24px` | `28px` | `28px` |
| Height | `28px` | `28px` | `24px` | `28px` | `28px` |
| Border Radius | `1.2` | `1.2` | `1.2` | `1` | `1.2` |
| Icon Size | `20px` | `20px` | `20px` | `20px` | `20px` |

#### Content
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding X | `2` | `2.5` | `2` | `20px` | `2.5` |
| Padding Y | `2` | `2` | `2` | `16px` | `2` |

---

### 2. Create Form / Edit Form

#### Image Upload Preview
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Width | `100px` | `100px` | `100px` | `100px` | `100px` |
| Height | `100px` | `100px` | `100px` | `100px` | `100px` |
| Border Radius | `1` | `1` | `1` | `1` | `1` |

#### Image Upload Container
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding | `18px 16px` | `18px 16px` | `18px 16px` | `18px 16px` | `18px 16px` |
| Border Radius | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |

#### Remove Button
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Width | `22px` | `22px` | `22px` | `22px` | `22px` |
| Height | `22px` | `22px` | `22px` | `22px` | `22px` |
| Font Size | `14px` | `14px` | `14px` | `14px` | `14px` |

#### Color Picker
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Picker Size | `30px` | `30px` | `30px` | `30px` | `30px` |
| Border Radius | `1` | `1` | `1` | `1` | `1` |

#### Switch Field
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding X | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |
| Padding Y | `1` | `1` | `1` | `1` | `1` |
| Border Radius | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |
| Label Font Size | `12.5px` | `12.5px` | `12.5px` | `12.5px` | `12.5px` |
| Description Font Size | `11px` | `11px` | `11px` | `11px` | `11px` |

---

### 3. View Modal

#### Overall Dimensions
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Max Width | Custom | Custom | Custom | Custom | Custom |
| Max Height | `calc(100dvh - 24px)` | `calc(100dvh - 40px)` | `calc(100dvh - 48px)` | `calc(100dvh - 64px)` | `calc(100dvh - 64px)` |
| Margin | `1.5` | `2` | `1.5` | `16px` | `2` |
| Border Radius | `1.5` | `2` | `1.75` | `18px` | `2.25` |

#### Header
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Min Height | `46px` | `48px` | `44px` | `50px` | `50px` |
| Padding X | `1.5` | `1.75` | `1.75` | `17.2px` | `2.15` |
| Padding Y | `0.75` | `0.85` | `0.65` | `8px` | `1` |
| Font Size | `15px` | `16px` | `14px` | `17px` | `17px` |

#### Close Button
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Width | `26px` | `27px` | `24px` | `28px` | `28px` |
| Height | `26px` | `27px` | `24px` | `28px` | `28px` |
| Border Radius | `1` | - | `0.9` | `9.6px` | `1.2` |
| Icon Size | `18px` | - | `17px` | `20px` | `20px` |

#### Content (Standard)
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding X | `1.5` | `2.25` | `2` | `20px` | `2.5` |
| Padding Y | `1.75` | `2.25` | `2` | `20px` | `2.5` |

#### Content (Compact)
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding X | `1.5` | `2` | `1.75` | `17.2px` | `2.15` |
| Padding Y | `1.5` | `1.75` | `1.5` | `16px` | `2` |

#### Content (Reduced Horizontal Spacing)
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding X | `0.75` | `1` | `0.75` | `8px` | `1` |

#### Detail Field Grid
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Columns | `1fr` | `minmax(150px, 46%) minmax(0, 1fr)` | `minmax(150px, 46%) minmax(0, 1fr)` | Custom | Custom |
| Gap | `0.25` | `1` | `0.9` | `10px` | `1.25` |
| Font Size | `14px` | `15px` | `14px` | `16px` | `16px` |
| Line Height | `1.45` | `1.45` | `1.45` | `1.55` | `1.55` |

#### Section Title
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Margin Bottom (Dense) | `0.75` | `0.75` | `0.75` | `8px` | `1` |
| Margin Bottom (Standard) | `1.5` | `1.5` | `1.5` | `18px` | `2.25` |
| Padding Top (Dense) | `0.5` | `0.5` | `0.5` | `6px` | `0.75` |
| Padding Top (Standard) | `1.25` | `1.25` | `1.25` | `16px` | `2` |
| Padding X | `1.25` | `1.5` | `1.25` | `14px` | `1.75` |
| Padding Y | `0.35` | `0.3` | `0.3` | `3.6px` | `0.45` |
| Font Size | `14px` | `15px` | `14px` | `16px` | `16px` |

#### Section Content Grid (Dense)
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Column Gap | - | `2` | `2.25` | `24px` | `3` |
| Row Gap | `0.35` | `0.3` | `0.3` | `2.8px` | `0.35` |
| Padding X | - | `2` | `2.25` | `24px` | `3` |
| Padding Bottom | `1.25` | `1.25` | `1.25` | `12px` | `1.5` |

#### Section Content Grid (Standard)
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Column Gap | - | `4` | `3.5` | `40px` | `5` |
| Row Gap | `1` | `0.9` | `0.9` | `10px` | `1.25` |
| Padding X | - | `4` | `3.5` | `40px` | `5` |
| Padding Bottom | `2` | `2.25` | `2.25` | `24px` | `3` |

#### Footer
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Min Height (Compact) | `56px` | `60px` | `54px` | `64px` | `64px` |
| Min Height (Standard) | `64px` | `68px` | `60px` | `72px` | `72px` |
| Padding X | `1.5` | `2.25` | `2` | `20px` | `2.5` |
| Padding Y (Compact) | `0.75` | `0.75` | `0.75` | `8px` | `1` |
| Padding Y (Standard) | `1` | `1` | `1` | `12px` | `1.5` |

---

### 4. Delete Alert

#### Button Dimensions
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Min Height | `36px` | `36px` | `32px` | `32px` | `36px` |
| Font Size | `14px` | `14px` | `12px` | `12px` | `14px` |
| Padding X | `2` | `2` | `2` | `1.5` | `2` |

#### Alert Message
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `16px` | `16px` | `16px` | `16px` | `16px` |
| Margin Bottom | `3` | `3` | `3` | `3` | `3` |
| Line Height | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |

#### Button Gap
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Gap | `2` | `2` | `2` | `2` | `2` |

---

### 5. Autocomplete Field

#### Overlay Paper
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Margin Top | `1` | `0.75` | `0.75` | `0.75` | `1` |
| Border Radius | `1.5` | `1.2` | `1.2` | `1.2` | `1.5` |

#### List Item
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Min Height | `42px` | `34px` | `34px` | `34px` | `42px` |
| Margin X | `1` | `0.75` | `0.75` | `0.75` | `1` |
| Margin Y | `0.25` | `0.2` | `0.2` | `0.2` | `0.25` |
| Border Radius | `1` | `0.8` | `0.8` | `0.8` | `1` |
| Font Size | `14px` | `12px` | `12px` | `12px` | `14px` |

#### List Padding
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding Y | `1` | `0.75` | `0.75` | `0.75` | `1` |

---

### 6. Stat Tile

#### Overall Dimensions
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Min Height | `154px` | `154px` | `104px` | `104px` | `124px` |
| Max Height | `154px` | `154px` | `104px` | `104px` | `124px` |
| Padding | `3.5` | `3.5` | `1.75` | `1.75` | `2.5` |

#### Title
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `14px` | `14px` | `12px` | `12.5px` | `14px` |

#### Value
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `28px` | `28px` | `19px` | `19px` | `24px` |

#### Subtitle
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `12px` | `12px` | `12px` | `12px` | `12px` |

#### Trend Label
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `15px` | `15px` | `13px` | `13px` | `15px` |

#### Icon Container
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Width | `42px` | `42px` | `34px` | `34px` | `42px` |
| Height | `42px` | `42px` | `34px` | `34px` | `42px` |
| Border Radius | `1.4` | `1.4` | `1` | `1` | `1.4` |
| Icon Size | `24px` | `24px` | `20px` | `20px` | `24px` |

#### Content Spacing
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Stack Spacing (with subtitle) | `0.55` | `0.55` | `0.55` | `0.55` | `0.55` |
| Stack Spacing (without subtitle) | `1.25` | `1.25` | `1.25` | `1.25` | `1.25` |

---

### 7. Conversion Funnel

#### Overall Dimensions
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding | `2.5` | `2.5` | `2.5` | `2.5` | `2.5` |

#### Title
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `16px` | `16px` | `15px` | `15px` | `18px` |

#### Stage Label
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `16px` | `16px` | `13.5px` | `13.5px` | `16px` |

#### Stage Value
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `16px` | `16px` | `12px` | `12px` | `14px` |

#### Progress Bar
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Height | `20px` | `22px` | `18px` | `18px` | `22px` |
| Border Radius | `1` | `1` | `0.65` | `0.65` | `1` |

#### Stage Spacing
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Stack Spacing | `1.75` | `1.75` | `1` | `1` | `1.75` |

---

### 8. Payout Queue

#### Overall Dimensions
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding | `2.5` | `3` | `2.5` | `2.5` | `3` |

#### Title
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `16px` | `18px` | `14.5px` | `14.5px` | `18px` |

#### Process Link
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `14px` | `14px` | `12.5px` | `12.5px` | `14px` |

#### Payout Item
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Padding Y | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |
| Padding X (clickable) | `1` | `1` | `1` | `1` | `1` |
| Border Radius | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |

#### Icon Container
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Width | `46px` | `46px` | `36px` | `36px` | `46px` |
| Height | `46px` | `46px` | `36px` | `36px` | `46px` |
| Border Radius | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |
| Icon Size | `22px` | `22px` | `18px` | `18px` | `22px` |

#### Item Name
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `15px` | `15px` | `13px` | `13px` | `15px` |

#### Item Metadata
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `13px` | `13px` | `11px` | `11px` | `14px` |

#### Item Amount
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Font Size | `15px` | `15px` | `13px` | `13px` | `15px` |

#### Item Spacing
| Property | XS | SM | MD | LG | XL |
|----------|----|----|----|----|----|
| Item Gap | `1.5` | `1.5` | `1.5` | `1.5` | `1.5` |

---

### 9. Label Component

#### Default Dimensions
| Property | Value |
|----------|-------|
| Height | `24px` |
| Padding X | `0.75` (theme spacing) |
| Font Size | `12px` |
| Font Weight | `600` |
| Border Radius | `6px` |

---

### 10. Table Components

#### Table Max Height
- Default: `500px` (configurable)

#### Pagination Rows Per Page Options
- `[5, 10, 25]`

---

## Color System

### Status Colors
| Tone | Color Value |
|------|-------------|
| Default | `text.primary` |
| Primary | `primary.main` |
| Success | `success.dark` |
| Warning | `warning.dark` |
| Error | `error.dark` |

### Modal Colors
| Element | Color |
|---------|-------|
| Overlay Background | `rgba(46, 57, 68, 0.48)` |
| Header Background | `grey.200` |
| Close Button | `#ff5733` (hover: `#e94725`) |
| Close Button Text | `common.white` |

### Conversion Funnel Palette
| Color | Value |
|-------|-------|
| Base | `#96C458` |
| Highlight | `#EFA02A` |
| Terminal | `#3B6D0B` |

### Form Colors
| Element | Color |
|---------|-------|
| Error Text | `#e24b4a` |
| Remove Button Background | `#fee2e2` (hover: `#fca5a5`) |
| Remove Button Text | `#a32d2d` |

---

## Z-Index Values

| Element | Z-Index |
|---------|---------|
| Drawer | `1200` |
| Modal Overlay | `1300` |
| Modal Popover | `1400` |
| Tooltip | `1500` |

---

## Common Patterns

### Desktop Density Scaling

All desktop density values (1280px+) use the following scaling:
- Desktop sizes are typically `1.2x - 1.4x` of mobile sizes
- Font sizes on desktop: `16px` (vs `14-15px` on mobile)
- Spacing on desktop: `20px - 24px` (vs `2 - 3` on mobile)

### Animation Timing

- Modal transitions: `160ms ease`
- Conversion funnel animation: `720ms cubic-bezier(0.22, 1, 0.36, 1)`
- Funnel stage delay: `70ms per stage` (max `350ms`)

### Border Radius Patterns

- Small elements (buttons, icons): `0.8 - 1.2`
- Medium elements (inputs, cards): `1.5 - 2`
- Large elements (modals): `2.25 - 2.5`

### Spacing Patterns

- Tight spacing: `0.25 - 0.5`
- Normal spacing: `1 - 2`
- Loose spacing: `2.5 - 3`
- Extra loose spacing: `4 - 5`

---

## Usage Notes

1. **Responsive Design**: All components follow mobile-first approach with explicit breakpoints
2. **Desktop Density**: Applied at `1280px+` for enhanced readability
3. **Typography**: Line heights typically `1.45 - 1.55` for body text
4. **Touch Targets**: Minimum `36px` height for clickable elements
5. **Animations**: Respect `prefers-reduced-motion` media query

---

## Future Enhancements

- Add more breakpoint-specific values for intermediate sizes
- Standardize animation timings across components
- Create a theme provider for centralized design tokens
- Add dark mode color variants
