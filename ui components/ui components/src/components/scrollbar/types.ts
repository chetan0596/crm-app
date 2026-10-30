import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export type ScrollbarProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
  ref?: React.RefObject<any>;
  fillContent?: boolean;
  slotProps?: {
    wrapperSx?: React.CSSProperties;
    contentWrapperSx?: React.CSSProperties;
    contentSx?: React.CSSProperties;
  };
};
