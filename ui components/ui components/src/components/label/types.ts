import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export type LabelProps = {
  children: ReactNode;
  color?: string;
  variant?: 'soft' | 'filled' | 'outlined';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};
