import { forwardRef } from 'react';
import { Box } from '@mui/material';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

export const Scrollbar = forwardRef(function Scrollbar({ sx, children, ...other }, ref) {
  return (
    <Box
      ref={ref}
      component={SimpleBar}
      className="component-scrollbar"
      sx={{ flexGrow: 1, maxHeight: '100%', ...sx }}
      {...other}
    >
      {children}
    </Box>
  );
});
