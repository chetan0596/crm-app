import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#062849',
      dark: '#03192e',
      light: '#33546e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6528e8',
      dark: '#4b16b4',
      light: '#9d75f5',
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e',
      dark: '#118d57',
      light: '#77ed8b',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffab00',
      dark: '#b76e00',
      light: '#ffd666',
      contrastText: '#1c252e',
    },
    error: {
      main: '#ff5630',
      dark: '#b71d18',
      light: '#ffac82',
      contrastText: '#ffffff',
    },
    info: {
      main: '#00b8d9',
      dark: '#006c9c',
      light: '#61f3f3',
      contrastText: '#ffffff',
    },
    grey: {
      50: '#fafbfc',
      100: '#f4f6f8',
      200: '#f1f5f9',
      300: '#dfe3e8',
      400: '#c4cdd5',
      500: '#919eab',
      600: '#637381',
      700: '#454f5b',
      800: '#1c252e',
      900: '#141a21',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1c252e',
      secondary: '#637381',
      disabled: '#919eab',
    },
    divider: 'rgba(145, 158, 171, 0.2)',
    action: {
      hover: 'rgba(145, 158, 171, 0.08)',
      selected: 'rgba(101, 40, 232, 0.12)',
      focus: 'rgba(145, 158, 171, 0.12)',
      disabled: 'rgba(145, 158, 171, 0.4)',
      disabledBackground: 'rgba(145, 158, 171, 0.12)',
    },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  typography: {
    fontFamily: '"Inter", "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.25 },
    h2: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.25 },
    h3: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 },
    h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.35 },
    h5: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4 },
    h6: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.45 },
    subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' },
    button: {
      fontSize: '0.875rem',
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
          borderColor: 'rgba(145, 158, 171, 0.24)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 700,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: '#062849',
          '&:hover': { backgroundColor: '#103d70' },
        },
        outlined: {
          borderColor: 'rgba(145, 158, 171, 0.32)',
          color: '#1c252e',
          '&:hover': {
            borderColor: '#919eab',
            backgroundColor: 'rgba(145, 158, 171, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { paddingBottom: 24 },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#919eab',
          '&.Mui-checked': { color: '#062849' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 0,
          backgroundImage: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#637381',
          '&.Mui-focused': { color: '#062849' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 4,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#6528e8',
          fontWeight: 600,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          color: '#637381',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(145, 158, 171, 0.2)',
          boxShadow: '0 12px 32px rgba(28,37,46,.14)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 38,
          fontSize: 14,
          '&:hover': { backgroundColor: 'rgba(145, 158, 171, 0.08)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#919eab',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#062849',
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: 'rgba(145, 158, 171, 0.32)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#919eab',
          '&.Mui-checked': { color: '#062849' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#637381',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(145, 158, 171, 0.2)',
        },
        head: {
          color: '#637381',
          fontSize: 12,
          fontWeight: 700,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f4f6f8',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          minHeight: 52,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'rgba(6,40,73,.035)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1c252e',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
        },
        arrow: {
          color: '#1c252e',
        },
      },
    },
  },
});

export default theme;
