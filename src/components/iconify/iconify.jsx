import { forwardRef } from 'react';
import { Box } from '@mui/material';
import { Icon } from '@iconify/react';

export const Iconify = forwardRef(function Iconify({ icon, width = 20, sx, ...other }, ref) {
  return (
    <Box
      ref={ref}
      component={Icon}
      className="component-iconify"
      icon={icon}
      sx={{ width, height: width, flexShrink: 0, display: 'inline-flex', lineHeight: 1, ...sx }}
      {...other}
    />
  );
});
