import { forwardRef } from 'react';
import { Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const Logo = forwardRef(function Logo(
  { width = 40, height = 'auto', href = '/', symbol = false, sx, ...other },
  ref
) {
  const logo = (
    <Box
      ref={ref}
      component="img"
      alt="Sarth"
      src={symbol ? '/sarth-logo-symbol.png' : '/sarth-logo.png'}
      sx={{
        display: 'block',
        width: height === 'auto' ? width : 'auto',
        height,
        objectFit: 'contain',
        flexShrink: 0,
        cursor: 'pointer',
        ...sx,
      }}
      {...other}
    />
  );

  if (href) {
    return (
      <Link component={RouterLink} to={href} sx={{ display: 'contents' }}>
        {logo}
      </Link>
    );
  }

  return logo;
});
