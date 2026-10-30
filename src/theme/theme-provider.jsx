import { useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { createTheme } from './create-theme';

export function ThemeProvider({ children, themeOverrides }) {
  const theme = useMemo(() => createTheme({ themeOverrides }), [themeOverrides]);

  return (
    <MuiThemeProvider theme={theme} disableTransitionOnChange>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
