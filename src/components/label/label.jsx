import { forwardRef } from 'react';
import { Box } from '@mui/material';
import { varAlpha } from '../../theme/utils';

const COLOR_DEFAULTS = {
  default: 'grey',
  primary: 'primary',
  secondary: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export const Label = forwardRef(function Label(
  { color = 'default', variant = 'soft', startIcon, endIcon, sx, children, ...other },
  ref
) {
  const paletteKey = COLOR_DEFAULTS[color] || 'grey';

  return (
    <Box
      ref={ref}
      component="span"
      className="component-label"
      sx={[
        (theme) => {
          const paletteVars = theme.vars.palette;
          const isDefault = paletteKey === 'grey';
          const pal = isDefault
            ? {
                main: paletteVars.grey[800],
                dark: paletteVars.grey[800],
                darker: paletteVars.grey[800],
                mainChannel: paletteVars.grey['500Channel'],
                contrastText: paletteVars.common.white,
              }
            : paletteVars[paletteKey];
          const base = {
            height: 24,
            minWidth: 24,
            lineHeight: 0,
            borderRadius: 6,
            cursor: 'default',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            justifyContent: 'center',
            textTransform: 'capitalize',
            padding: theme.spacing(0, 0.75),
            fontSize: theme.typography.pxToRem(12),
            fontWeight: theme.typography.fontWeightBold,
            transition: theme.transitions.create(['all'], { duration: theme.transitions.duration.shorter }),
          };
          const variants = {
            soft: {
              color: isDefault ? paletteVars.text.secondary : pal.darker ?? pal.dark,
              backgroundColor: varAlpha(pal.mainChannel, 0.16),
            },
            inverted: {
              color: isDefault ? paletteVars.common.white : pal.contrastText,
              backgroundColor: pal.main,
            },
            outlined: {
              color: pal.dark,
              border: `1px solid ${varAlpha(pal.mainChannel, 0.48)}`,
              backgroundColor: 'transparent',
            },
            filled: {
              color: pal.contrastText,
              backgroundColor: pal.main,
            },
          };
          return { ...base, ...(variants[variant] || variants.soft) };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {startIcon && (
        <Box component="span" sx={{ mr: 0.75, width: 16, height: 16, display: 'inline-flex' }}>
          {startIcon}
        </Box>
      )}
      {children}
      {endIcon && (
        <Box component="span" sx={{ ml: 0.75, width: 16, height: 16, display: 'inline-flex' }}>
          {endIcon}
        </Box>
      )}
    </Box>
  );
});
