import { type Theme, type SxProps } from '@mui/material/styles';
import { varAlpha } from 'minimal-shared/utils';

/**
 * Consistent overlay menu props for dropdowns and autocompletes
 * Provides backdrop blur and consistent styling
 */
export const getOverlayMenuProps = (theme: Theme): SxProps<Theme> => ({
  PaperProps: {
    sx: {
      mt: 0.75,
      overflow: 'hidden',
      borderRadius: 1.5,
      bgcolor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(18px)',
      border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
      boxShadow: `0 18px 44px ${varAlpha(theme.vars.palette.grey['900Channel'], 0.12)}`,
      '&::before': {
        zIndex: 0,
        opacity: 0.12,
        content: "''",
        position: 'absolute',
        inset: 0,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundImage: 'url(/assets/background/overlay.jpg)',
      },
      '& .MuiList-root': {
        position: 'relative',
        zIndex: 1,
        py: 0.75,
      },
      '& .MuiMenuItem-root': {
        minHeight: 42,
        mx: 0.75,
        my: 0.25,
        borderRadius: 1,
        fontSize: 14,
        color: 'text.secondary',
        '&:hover, &.Mui-selected': {
          bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
        },
        '&.Mui-selected:hover': {
          bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
        },
      },
    },
  },
});
