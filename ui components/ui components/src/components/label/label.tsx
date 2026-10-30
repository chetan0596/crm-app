import { upperFirst } from 'es-toolkit';
import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

import type { LabelProps } from './types';

const LabelRoot = styled('span')<LabelProps>(({ theme, color, variant, disabled }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 24,
  padding: theme.spacing(0, 0.75),
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  color: theme.palette.text.primary,
  backgroundColor: 'transparent',
  ...(variant === 'filled' && {
    color: theme.palette.common.white,
    backgroundColor: theme.palette[color as keyof typeof theme.palette].main,
  }),
  ...(variant === 'outlined' && {
    backgroundColor: 'transparent',
    color: theme.palette[color as keyof typeof theme.palette].main,
    border: `1px solid ${theme.palette[color as keyof typeof theme.palette].main}`,
  }),
  ...(variant === 'soft' && {
    color: theme.palette[color as keyof typeof theme.palette].dark,
    backgroundColor: theme.palette[color as keyof typeof theme.palette].lighter,
  }),
  ...(disabled && {
    opacity: 0.48,
    pointerEvents: 'none',
  }),
}));

export function Label({ sx, endIcon, children, startIcon, className, disabled, variant = 'soft', color = 'default', ...other }: LabelProps) {
  return (
    <LabelRoot color={color} variant={variant} disabled={disabled} className={className} sx={sx} {...other}>
      {startIcon}
      {typeof children === 'string' ? upperFirst(children) : children}
      {endIcon}
    </LabelRoot>
  );
}
