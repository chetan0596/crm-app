import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    success: {
      main: '#2e7d32',
      dark: '#1b5e20',
      lighter: '#e8f5e9',
    },
    error: {
      main: '#d32f2f',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      dark: '#e65100',
      lighter: '#fff3e0',
    },
    info: {
      main: '#0288d1',
      dark: '#01579b',
      lighter: '#e1f5fe',
    },
    grey: {
      200: '#f5f5f5',
      500: '#9e9e9e',
      900: '#212121',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      neutral: '#f5f5f5',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9e9e9e',
    },
    common: {
      white: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
