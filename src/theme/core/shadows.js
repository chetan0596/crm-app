import { createTheme as getTheme } from '@mui/material/styles';
import { varAlpha } from '../utils';
import { grey } from './palette';

const defaultMuiTheme = getTheme();

// Re-tint MUI's 25 default elevations with the grey-500 channel (Minimal approach).
function createShadows(colorChannel) {
  return defaultMuiTheme.shadows.map((shadow) =>
    shadow === 'none'
      ? shadow
      : shadow.replace(/rgba\(0,0,0,([\d.]+)\)/g, (_, opacity) => varAlpha(colorChannel, Number(opacity)))
  );
}

export const shadows = {
  light: createShadows(grey['500Channel']),
};
