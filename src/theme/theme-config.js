// Theme config — Minimal UI Kit structure with Sarth brand colors.

export const themeConfig = {
  classesPrefix: 'minimal',
  fontFamily: {
    primary: 'DM Sans Variable',
    secondary: 'Barlow',
  },
  palette: {
    // Sarth navy
    primary: {
      lighter: '#D9E5F2',
      light: '#6E90B8',
      main: '#062849',
      dark: '#041D36',
      darker: '#021224',
      contrastText: '#FFFFFF',
    },
    // Sarth purple
    secondary: {
      lighter: '#E8DDFC',
      light: '#A98BF4',
      main: '#6528E8',
      dark: '#4717B0',
      darker: '#2B0B78',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#CAFDF5',
      light: '#61F3F3',
      main: '#00B8D9',
      dark: '#006C9C',
      darker: '#003768',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#D3FCD2',
      light: '#77ED8B',
      main: '#22C55E',
      dark: '#118D57',
      darker: '#065E49',
      contrastText: '#FFFFFF',
    },
    warning: {
      lighter: '#FFF5CC',
      light: '#FFD666',
      main: '#FFAB00',
      dark: '#B76E00',
      darker: '#7A4100',
      contrastText: '#1C252E',
    },
    error: {
      lighter: '#FFE9D5',
      light: '#FFAC82',
      main: '#FF5630',
      dark: '#B71D18',
      darker: '#7A0916',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#FCFDFD',
      100: '#F9FAFB',
      200: '#F4F6F8',
      300: '#DFE3E8',
      400: '#C4CDD5',
      500: '#919EAB',
      600: '#637381',
      700: '#454F5B',
      800: '#1C252E',
      900: '#141A21',
    },
    common: { black: '#000000', white: '#FFFFFF' },
  },
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
};
