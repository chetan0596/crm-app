# Project Structure

```
ui-components/
├── .gitignore                      # Git ignore file
├── .devin/                        # Devin configuration
├── package.json                   # Root package.json (UI library)
├── tsconfig.json                  # TypeScript configuration for library
├── rollup.config.js               # Rollup build configuration
├── README.md                      # Main documentation
├── COMPONENT_REFERENCE.md         # Component reference from original project
├── DESIGN_SYSTEM.md               # Design system documentation
│
├── src/                           # UI library source code
│   ├── index.ts                  # Main export file
│   │
│   ├── components/                # React components
│   │   ├── Modal.tsx             # Base modal component
│   │   ├── Portal.tsx            # React portal wrapper
│   │   │
│   │   ├── common-models/        # Form and modal components
│   │   │   ├── createForm.tsx    # Create form builder
│   │   │   ├── EditForm.tsx      # Edit form builder
│   │   │   ├── view.tsx          # View modal
│   │   │   ├── delete.tsx        # Delete confirmation
│   │   │   ├── AutocompleteField.tsx  # Searchable autocomplete
│   │   │   ├── DropdownList.tsx  # Dropdown select
│   │   │   ├── NumberField.tsx   # Number input
│   │   │   ├── MultiSelectDropdownList.tsx  # Multi-select
│   │   │   └── responsive-styles.ts  # Responsive style utilities
│   │   │
│   │   ├── table-fields/         # Table components
│   │   │   ├── common-table.tsx  # Main table
│   │   │   ├── common-table-head.tsx  # Table header
│   │   │   └── common-table-row.tsx   # Table row
│   │   │
│   │   ├── stat-tile/            # Dashboard widget
│   │   │   └── stat-tile.tsx
│   │   │
│   │   ├── conversion-funnel/    # Funnel visualization
│   │   │   └── conversion-funnel.tsx
│   │   │
│   │   ├── payout-queue/         # Payout list widget
│   │   │   └── payout-queue.tsx
│   │   │
│   │   ├── label/                # Status label
│   │   │   ├── label.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── iconify/              # Icon wrapper
│   │   │   ├── iconify.tsx
│   │   │   ├── register-icons.ts
│   │   │   └── classes.ts
│   │   │
│   │   └── scrollbar/            # Custom scrollbar
│   │       ├── scrollbar.tsx
│   │       └── types.ts
│   │
│   ├── theme/                    # Theme utilities
│   │   └── desktop-density.ts    # Desktop density system
│   │
│   ├── constants/                # Constants
│   │   └── z-index.ts            # Z-index values
│   │
│   └── utils/                    # Utility functions
│       └── overlay-menu-props.ts # Overlay menu styling
│
└── web/                          # Demo application
    ├── package.json              # Demo dependencies
    ├── vite.config.ts            # Vite configuration
    ├── tsconfig.json             # TypeScript configuration
    ├── vite-env.d.ts             # Vite type definitions
    ├── index.html                # HTML entry point
    │
    └── src/                      # Demo source code
        ├── main.tsx              # React entry point
        └── App.tsx               # Demo app component
```

## Key Directories

### `/src` - UI Library Source
Contains all the reusable UI components that will be published as a package.

### `/web` - Demo Application
A Vite + React application that demonstrates all the UI components.

### Documentation Files
- `README.md` - Main documentation and usage guide
- `COMPONENT_REFERENCE.md` - Detailed component reference from the original project
- `DESIGN_SYSTEM.md` - Complete design system with responsive dimensions
- `PROJECT_STRUCTURE.md` - This file

## Build Outputs

When you run `npm run build`, the library will be compiled to:
- `dist/index.js` - CommonJS build
- `dist/index.esm.js` - ES Module build
- `dist/index.d.ts` - TypeScript type definitions
- `dist/*.d.ts` - Component type definitions

## Development Workflow

1. **Library Development**: Work in `/src` directory
2. **Demo Development**: Work in `/web/src` directory
3. **Build Library**: Run `npm run build` from root
4. **Test Demo**: Run `cd web && npm run dev`
