# UI Component Reference Guide

This document provides a comprehensive reference of all UI components from the **heaven-custormer-app-admin** reference project, along with their source locations and usage details for the **ui components** target project.

## Component Catalog

### 1. Modal Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/Modal.tsx`

**Description:** A reusable modal dialog with ESC key support, focus management, and scroll lock.

**Key Features:**
- ESC key to close
- Focus trap and restoration
- Body scroll lock when open
- Overlay click to close
- Customizable maxWidth
- Orange close button (#ff5733)
- Desktop density responsive sizing

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
}
```

**Usage Context:** Used throughout the app for create, edit, view, and delete operations.

---

### 2. Create Form Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/createForm.tsx`

**Description:** A comprehensive form builder supporting multiple field types with validation.

**Supported Field Types:**
- `text` - Standard text input
- `email` - Email input
- `number` - Numeric input
- `textarea` - Multi-line text
- `select` - Dropdown selection
- `autocomplete` - Searchable autocomplete
- `toggle` - Toggle button group
- `image` - Image upload with drag & drop
- `switch` - Toggle switch
- `date` - Date picker
- `video` - Video upload
- `color` - Color picker with hex input
- `checkboxGrid` - Checkbox grid (via MultiSelectDropdownList)

**Key Features:**
- Zod schema validation
- Image/video upload with drag & drop
- File size validation
- Autocomplete with server-side search
- Responsive design
- Field-level error handling
- Custom styling exports: `formLabelSx`, `formErrorSx`, `responsiveControlSx`, `responsiveButtonSx`

**Props:**
```typescript
{
  fields: Field[];
  schema?: z.ZodType<Record<string, unknown>>;
  onSubmit: (values: Record<string, string>, files: Record<string, File>) => void;
  onClose?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}
```

**Sub-components:**
- `FormFieldLabel` - Field label with required indicator
- `FormField` - Standard text/email/textarea field
- `ImageUploadField` - Single image upload
- `MultiFileUploadField` - Multiple file upload
- `VideoUploadField` - Video upload
- `ColorField` - Color picker
- `SwitchField` - Toggle switch

---

### 3. Edit Form Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/EditForm.tsx`

**Description:** Similar to CreateForm but designed for editing existing records with pre-populated values.

**Key Differences from CreateForm:**
- Accepts `initialValues` for pre-population
- Accepts `initialFiles` for existing images
- Includes `generateValue` and `generateLabel` for auto-generated fields
- Supports `checkboxGrid` field type

**Props:**
```typescript
{
  fields: Field[];
  initialValues?: Record<string, string>;
  initialFiles?: Record<string, File>;
  schema?: z.ZodType<Record<string, unknown>>;
  onSubmit: (values: Record<string, string>, files: Record<string, File>) => void;
  onClose?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}
```

---

### 4. View Modal Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/view.tsx`

**Description:** A detail view modal for displaying read-only information in sections.

**Key Features:**
- Section-based organization
- Support for text, boolean, status, and custom field types
- Loading states with linear progress
- Compact and dense layout options
- Empty state handling
- Snapshot on close to prevent flicker
- Responsive typography using desktop density

**Props:**
```typescript
{
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sections: ViewSection[];
  loading?: boolean;
  emptyText?: string;
  maxWidth?: number;
  footer?: ReactNode;
  compact?: boolean;
  reducedHorizontalSpacing?: boolean;
  onExited?: () => void;
  disableEnforceFocus?: boolean;
}
```

**Types:**
```typescript
type ViewField = {
  label: string;
  value?: ReactNode;
  type?: 'text' | 'boolean' | 'status' | 'custom';
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  span?: 1 | 2;
  hidden?: boolean;
};

type ViewSection = {
  title: string;
  fields?: ViewField[];
  content?: ReactNode;
  hidden?: boolean;
  compact?: boolean;
  dense?: boolean;
};
```

**Sub-components:**
- `ViewDetailSection` - Renders a single section
- `BooleanValue` - Renders yes/no with color coding
- `StatusValue` - Renders status with tone-based coloring

---

### 5. Delete Alert Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/delete.tsx`

**Description:** A confirmation dialog for destructive operations with loading state.

**Key Features:**
- Loading state with spinner
- Customizable confirm button color
- Customizable labels
- 1-second delay simulation
- Responsive button sizing
- Prevents double-clicks

**Props:**
```typescript
{
  alertMsg: string;
  onDelete?: () => void;
  onClose?: () => void;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmColor?: string;
}
```

---

### 6. Autocomplete Field Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/AutocompleteField.tsx`

**Description:** A searchable autocomplete field with client-side and server-side search support.

**Key Features:**
- Client-side filtering with options array
- Server-side search with debounced API calls
- Minimum search length requirement
- Loading indicator
- Search icon (optional)
- Custom overlay styling with backdrop blur
- Preserves selected option even if not in current search results
- Keyboard navigation support

**Props:**
```typescript
{
  value: string;
  options?: AutocompleteFieldOption[];
  onChange: (value: string) => void;
  onSearch?: (term: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  minSearchLength?: number;
  showSearchIcon?: boolean;
}
```

**Types:**
```typescript
type AutocompleteFieldOption = {
  value: string;
  label?: string;
  description?: string;
};
```

---

### 7. Dropdown List Component
**Location:** `heaven-custormer-app-admin/apps/web/src/common-models/DropdownList.tsx`

**Description:** A standard dropdown select component.

**Key Features:**
- Single selection
- Placeholder option
- Error states
- Custom styling support
- Overlay menu styling

**Props:**
```typescript
{
  value: string;
  options?: DropdownListOption[];
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}
```

---

### 8. Number Field Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/NumberField.tsx`

**Description:** A numeric input field with increment/decrement buttons.

**Key Features:**
- Increment/decrement buttons with icons
- Label support
- Error states
- Form validation integration
- SSR-compatible

**Props:**
```typescript
{
  id?: string;
  label?: React.ReactNode;
  size?: 'small' | 'medium';
  error?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
}
```

---

### 9. Multi-Select Dropdown List Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/common-models/MultiSelectDropdownList.tsx`

**Description:** A multi-select dropdown with checkboxes.

**Key Features:**
- Multiple selection with checkboxes
- "Select All" option
- Customizable chip display
- Error handling

---

### 10. Common Table Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/table-fields/common-table.tsx`

**Description:** A reusable data table with sorting, pagination, and actions.

**Key Features:**
- Column sorting
- Pagination (5, 10, 25 rows)
- Optional row selection
- Action column
- Sticky header
- Scrollable with custom scrollbar
- Custom column rendering
- Max height control

**Props:**
```typescript
{
  columns: Column[];
  data: any[];
  selectable?: boolean;
  actions?: boolean;
  maxHeight?: number;
}
```

**Types:**
```typescript
type Column = {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
};
```

**Related Components:**
- `common-table-head.tsx` - Table header with sort controls
- `common-table-row.tsx` - Table row with checkbox and actions
- `common-table-toolbar.tsx` - Table toolbar with search
- `table-empty-rows.tsx` - Empty row placeholder
- `table-no-data.tsx` - No data state

---

### 11. Stat Tile Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/stat-tile/stat-tile.tsx`

**Description:** A dashboard metric tile with icon, value, and optional trend.

**Key Features:**
- Metric display with icon
- Trend indicators (up/down/neutral)
- Loading skeleton states
- Color variants (primary, secondary, info, success, warning, error)
- Responsive sizing
- Custom value color

**Props:**
```typescript
{
  title: string;
  value: ReactNode;
  icon: ReactNode;
  subtitle?: ReactNode;
  trend?: StatTileTrend;
  color?: StatTileColor;
  valueColor?: string;
  loading?: boolean;
  sx?: SxProps;
}
```

**Types:**
```typescript
type StatTileTrend = {
  direction: 'up' | 'down' | 'neutral';
  label: string;
};

type StatTileColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
```

---

### 12. Conversion Funnel Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/conversion-funnel/conversion-funnel.tsx`

**Description:** A visual conversion funnel with animated progress bars.

**Key Features:**
- Multi-stage funnel visualization
- Percentage calculation
- Animated progress bars with reveal effect
- Custom color palette
- Loading states
- Empty state handling
- Custom value formatter
- Header action button

**Props:**
```typescript
{
  title?: string;
  stages: ConversionFunnelStage[];
  total?: number;
  actionLabel?: string;
  onAction?: () => void;
  headerAction?: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  valueFormatter?: (value: number) => string;
  sx?: SxProps;
}
```

**Types:**
```typescript
type ConversionFunnelStage = {
  id: string;
  label: string;
  value: number;
  color?: string;
  colorShade?: 'lighter' | 'light' | 'main' | 'dark';
};
```

**Palette:**
```typescript
{
  base: '#96C458',
  highlight: '#EFA02A',
  terminal: '#3B6D0B',
}
```

---

### 13. Payout Queue Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/payout-queue/payout-queue.tsx`

**Description:** A list widget for displaying pending payouts with total calculation.

**Key Features:**
- List of payout items
- Total amount display (compact format)
- Indian currency formatting
- Clickable items
- Process all action
- Loading states
- Empty state handling
- Custom amount formatter

**Props:**
```typescript
{
  payouts: PayoutQueueItem[];
  totalAmount?: number;
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  processLabel?: string;
  onProcessAll?: () => void;
  onPayoutClick?: (payout: PayoutQueueItem) => void;
  amountFormatter?: (amount: number) => string;
  sx?: SxProps;
}
```

**Types:**
```typescript
type PayoutQueueItem = {
  requestID: number;
  leadName: string | null;
  sarthiName: string | null;
  capacity?: string | null;
  requestedPaymentMode?: string | null;
  amount: number;
};
```

---

### 14. Label Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/label/label.tsx`

**Description:** A status label component with variants and colors.

**Key Features:**
- Variants: 'soft', 'filled', 'outlined'
- Color options: default, primary, secondary, info, success, warning, error
- Start and end icons
- Disabled state
- Auto-capitalization

**Props:**
```typescript
{
  children: ReactNode;
  color?: string;
  variant?: 'soft' | 'filled' | 'outlined';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  disabled?: boolean;
  sx?: SxProps;
  className?: string;
}
```

---

### 15. Iconify Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/iconify/iconify.tsx`

**Description:** Icon wrapper using @iconify/react with offline icon registration.

**Key Features:**
- Icon name type safety
- Offline icon registration
- Warning for unregistered icons
- SSR support
- Size customization

**Props:**
```typescript
{
  icon: IconifyName;
  width?: number;
  height?: number;
  sx?: SxProps;
  className?: string;
}
```

---

### 16. Scrollbar Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/scrollbar/scrollbar.tsx`

**Description:** Custom scrollbar using simplebar-react.

**Key Features:**
- Custom scrollbar styling
- Fill content option
- Slot props for wrapper/content styling
- Responsive behavior

**Props:**
```typescript
{
  children: ReactNode;
  sx?: SxProps;
  className?: string;
  ref?: React.RefObject<any>;
  fillContent?: boolean;
  slotProps?: {
    wrapperSx?: React.CSSProperties;
    contentWrapperSx?: React.CSSProperties;
    contentSx?: React.CSSProperties;
  };
}
```

---

### 17. Portal Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/Portal.tsx`

**Description:** React Portal wrapper for rendering modals outside the DOM hierarchy.

**Usage:** Used by Modal component to render at document.body level.

---

### 18. Dashboard Loader Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/dashboard-loader.tsx`

**Description:** Loading skeleton for dashboard pages.

---

### 19. Mobile Preview Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/mobile-preview.tsx`

**Description:** Mobile device frame for previewing responsive layouts.

---

### 20. Pending Approvals Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/pending-approvals/pending-approvals.tsx`

**Description:** Widget for displaying pending approval items.

---

### 21. Top Sarthis Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/top-sarthis/top-sarthis.tsx`

**Description:** Leaderboard widget for top performers.

---

### 22. Bug Report Widget
**Location:** `heaven-custormer-app-admin/apps/web/src/components/bug-report/bug-report-widget.tsx`

**Description:** In-app bug reporting widget.

---

### 23. Logo Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/logo/logo.tsx`

**Description:** Application logo component.

---

### 24. SVG Color Component
**Location:** `heaven-custormer-app-admin/apps/web/src/components/svg-color/svg-color.tsx`

**Description:** SVG color manipulation utilities.

---

## Design System Constants

### Desktop Density
**Location:** `heaven-custormer-app-admin/apps/web/src/theme/desktop-density.ts`

The project uses a desktop density system for responsive sizing. Key functions:
- `desktopFont(px)` - Responsive font sizes
- `desktopSize(px)` - Responsive sizes
- `desktopSpacing(px)` - Responsive spacing
- `desktopDensityQuery` - Media query for desktop breakpoints
- `desktopFontSize(px)` - Font size with fallback
- `desktopSizeMin(px)` - Minimum size

### Z-Index Constants
**Location:** `heaven-custormer-app-admin/apps/web/src/constants/z-index.ts`

- `MODAL_OVERLAY_Z_INDEX` - Modal overlay z-index
- `MODAL_POPOVER_Z_INDEX` - Popover z-index

### Overlay Menu Props
**Location:** `heaven-custormer-app-admin/apps/web/src/utils/overlay-menu-props.ts`

Utility for consistent dropdown/autocomplete overlay styling with backdrop blur.

---

## Theme Configuration

The project uses Material UI with custom theme configuration:
- Custom color palette
- Typography scale
- Spacing system
- Breakpoints
- Component overrides

---

## Responsive Design Patterns

All components follow a consistent responsive pattern:
- Mobile-first approach
- Breakpoints: xs, sm, md, lg, xl
- Desktop density query for large screens
- Font sizes, spacing, and dimensions scale responsively

---

## Common Patterns

### Modal Pattern
```typescript
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Title"
  maxWidth={500}
>
  {/* Content */}
</Modal>
```

### Form Pattern
```typescript
<CreateForm
  fields={fields}
  schema={schema}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  onClose={handleClose}
/>
```

### View Pattern
```typescript
<ViewModal
  open={isOpen}
  onClose={handleClose}
  title="View Details"
  sections={sections}
  loading={loading}
/>
```

### Delete Pattern
```typescript
<Modal isOpen={isOpen} onClose={handleClose} title="Confirm Delete">
  <DeleteAlert
    alertMsg="Are you sure you want to delete this item?"
    onDelete={handleDelete}
    onClose={handleClose}
  />
</Modal>
```

---

## File Structure Reference

```
components/
├── Modal.tsx                          # Base modal
├── Portal.tsx                         # React portal
├── common-models/                     # Shared form/modal components
│   ├── createForm.tsx                # Create form builder
│   ├── EditForm.tsx                  # Edit form builder
│   ├── view.tsx                      # View modal
│   ├── delete.tsx                    # Delete confirmation
│   ├── AutocompleteField.tsx         # Searchable autocomplete
│   ├── DropdownList.tsx              # Dropdown select
│   ├── NumberField.tsx               # Number input
│   ├── MultiSelectDropdownList.tsx   # Multi-select dropdown
│   └── responsive-styles.ts          # Responsive style utilities
├── table-fields/                      # Table components
│   ├── common-table.tsx              # Main table
│   ├── common-table-head.tsx         # Table header
│   ├── common-table-row.tsx          # Table row
│   ├── common-table-toolbar.tsx      # Table toolbar
│   ├── table-empty-rows.tsx          # Empty rows
│   ├── table-no-data.tsx             # No data state
│   └── utils.ts                      # Table utilities
├── stat-tile/                         # Dashboard metric tile
│   └── stat-tile.tsx
├── conversion-funnel/                 # Funnel visualization
│   └── conversion-funnel.tsx
├── payout-queue/                      # Payout list widget
│   └── payout-queue.tsx
├── pending-approvals/                 # Approvals widget
│   └── pending-approvals.tsx
├── top-sarthis/                       # Leaderboard widget
│   └── top-sarthis.tsx
├── label/                             # Status label
│   ├── label.tsx
│   ├── styles.tsx
│   └── types.ts
├── iconify/                           # Icon wrapper
│   ├── iconify.tsx
│   ├── register-icons.ts
│   └── classes.ts
├── scrollbar/                         # Custom scrollbar
│   ├── scrollbar.tsx
│   ├── types.ts
│   └── classes.ts
├── logo/                              # App logo
│   └── logo.tsx
├── svg-color/                         # SVG utilities
│   └── svg-color.tsx
├── bug-report/                        # Bug report widget
│   └── bug-report-widget.tsx
├── dashboard-loader.tsx               # Loading skeleton
└── mobile-preview.tsx                # Mobile preview frame
```

---

## Dependencies

Key external dependencies:
- `@mui/material` - Material UI components
- `@iconify/react` - Icon library
- `simplebar-react` - Custom scrollbar
- `zod` - Schema validation
- `@base-ui/react/number-field` - Number field component
- `minimal-shared` - Shared utilities

---

## Usage Guidelines

1. **Always import from the component paths shown** - Don't copy code, import the actual components
2. **Follow the responsive pattern** - Use desktop density utilities for responsive sizing
3. **Preserve existing styles** - Use the exported style utilities (formLabelSx, formErrorSx, etc.)
4. **Match color scheme** - Use the existing color palette (success.dark, error.dark, etc.)
5. **Use Modal for dialogs** - Don't create custom modal implementations
6. **Use common-form components** - Reuse CreateForm, EditForm, ViewModal for consistency
7. **Follow loading patterns** - Use Skeleton components for loading states
8. **Preserve accessibility** - Maintain ARIA labels and keyboard navigation

---

## Notes

- All components use TypeScript with strict typing
- Components are designed for a monorepo structure
- The project uses Turborepo for build optimization
- Mobile responsiveness is maintained across all components
- Desktop density is applied for larger screens (typically > 1280px)
