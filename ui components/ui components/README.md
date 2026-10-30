# Heaven UI Components

A comprehensive React UI component library built with Material UI, inspired by the heaven-custormer-app-admin reference project.

## 📦 Installation

```bash
npm install @heaven/ui-components
```

## 🚀 Quick Start

```tsx
import { Modal, CreateForm, StatTile } from '@heaven/ui-components';

function App() {
  return (
    <Modal isOpen={true} onClose={() => {}} title="Hello">
      <div>Content here</div>
    </Modal>
  );
}
```

## 📚 Components

### Core Components

- **Modal** - Responsive modal with ESC key, focus management, and scroll lock
- **Portal** - React portal wrapper
- **Iconify** - Icon wrapper with offline support

### Form Components

- **CreateForm** - Form builder with 12+ field types, validation, and file uploads
- **EditForm** - Edit form with pre-populated values
- **ViewModal** - Read-only detail view with sections
- **DeleteAlert** - Confirmation dialog with loading state
- **AutocompleteField** - Searchable autocomplete with client/server search
- **DropdownList** - Standard dropdown select
- **NumberField** - Numeric input with increment/decrement
- **MultiSelectDropdownList** - Multi-select with checkboxes

### Data Display

- **CommonTable** - Sortable, paginated data table
- **StatTile** - Dashboard metric tile with trends
- **ConversionFunnel** - Visual funnel with animated progress bars
- **PayoutQueue** - List widget for pending items

### Utility Components

- **Label** - Status label with variants
- **Scrollbar** - Custom scrollbar component

## 🎨 Design System

The library follows a comprehensive design system documented in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

### Responsive Breakpoints

- `xs`: 0px (Mobile)
- `sm`: 600px (Small tablets)
- `md`: 900px (Tablets)
- `lg`: 1200px (Small laptops)
- `xl`: 1280px+ (Desktop with enhanced density)

### Theme Integration

The library uses Material UI's theme system. All components accept custom `sx` props for styling.

## 📖 Documentation

- [Component Reference](./COMPONENT_REFERENCE.md) - Detailed component documentation from the reference project
- [Design System](./DESIGN_SYSTEM.md) - Complete responsive dimensions, font sizes, and spacing data

## 🛠️ Development

### Setup

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run build:watch

# Type checking
npm run typecheck
```

### Web Demo

```bash
cd web
npm install
npm run dev
```

The web demo showcases all components with live examples.

## 📦 Project Structure

```
ui-components/
├── src/
│   ├── components/           # All UI components
│   │   ├── Modal.tsx
│   │   ├── common-models/   # Form components
│   │   ├── table-fields/    # Table components
│   │   ├── stat-tile/       # Dashboard widgets
│   │   ├── label/           # Status labels
│   │   ├── iconify/         # Icon wrapper
│   │   └── scrollbar/       # Custom scrollbar
│   ├── theme/               # Theme utilities
│   ├── constants/           # Constants (z-index, etc.)
│   ├── utils/               # Utility functions
│   └── index.ts            # Main export file
├── web/                     # Demo application
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── package.json
├── tsconfig.json
├── rollup.config.js
├── COMPONENT_REFERENCE.md
├── DESIGN_SYSTEM.md
└── README.md
```

## 🤝 Contributing

This library is based on the heaven-custormer-app-admin reference project. When making changes:

1. Follow the existing component patterns
2. Maintain responsive design across all breakpoints
3. Update the DESIGN_SYSTEM.md with any dimension changes
4. Test in the web demo application
5. Run type checking before committing

## 📄 License

MIT

## 🔗 Links

- Reference Project: heaven-custormer-app-admin
- Material UI: https://mui.com/
- Iconify: https://iconify.design/
