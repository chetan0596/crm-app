import { SvgIcon } from '@mui/material';
import { varAlpha } from '../utils';

// ----------------------------------------------------------------------
// Ported from Minimal UI Kit `src/theme/core/components.tsx`, with a few
// additional overrides (dialog, popover, menu, tabs, tooltip, chip, pagination)
// following the same Minimal conventions.
// ----------------------------------------------------------------------

const MuiBackdrop = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: varAlpha(theme.vars.palette.grey['900Channel'], 0.8),
    }),
    invisible: { background: 'transparent' },
  },
};

const MuiButton = {
  defaultProps: { disableElevation: true },
  styleOverrides: {
    containedInherit: ({ theme }) => ({
      color: theme.vars.palette.common.white,
      backgroundColor: theme.vars.palette.grey[800],
      '&:hover': {
        color: theme.vars.palette.common.white,
        backgroundColor: theme.vars.palette.grey[800],
      },
    }),
    outlinedInherit: ({ theme }) => ({
      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
      '&:hover': { backgroundColor: theme.vars.palette.action.hover },
    }),
    textInherit: ({ theme }) => ({
      '&:hover': { backgroundColor: theme.vars.palette.action.hover },
    }),
    sizeLarge: { minHeight: 48 },
    sizeMedium: { minHeight: 36 },
    sizeSmall: { minHeight: 30 },
  },
};

const MuiCard = {
  styleOverrides: {
    root: ({ theme }) => ({
      zIndex: 0,
      position: 'relative',
      boxShadow: theme.vars.customShadows.card,
      borderRadius: theme.shape.borderRadius * 2,
    }),
  },
};

const MuiCardHeader = {
  defaultProps: {
    titleTypographyProps: { variant: 'h6' },
    subheaderTypographyProps: { variant: 'body2' },
  },
  styleOverrides: {
    root: ({ theme }) => ({ padding: theme.spacing(3, 3, 0) }),
  },
};

const MuiOutlinedInput = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.vars.palette.text.primary,
      },
    }),
    notchedOutline: ({ theme }) => ({
      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.2),
    }),
  },
};

const MuiInputLabel = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-focused': { color: theme.vars.palette.text.primary },
    }),
  },
};

const MuiPaper = {
  defaultProps: { elevation: 0 },
  styleOverrides: {
    root: { backgroundImage: 'none' },
    outlined: ({ theme }) => ({
      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
    }),
  },
};

const MuiTableCell = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderBottomStyle: 'dashed',
      borderBottomColor: theme.vars.palette.divider,
    }),
    head: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      color: theme.vars.palette.text.secondary,
      fontWeight: theme.typography.fontWeightSemiBold,
      backgroundColor: theme.vars.palette.background.neutral,
      borderBottom: 'none',
    }),
  },
};

const MuiTableRow = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-selected': {
        backgroundColor: theme.vars.palette.action.selected,
        '&:hover': { backgroundColor: theme.vars.palette.action.hover },
      },
      '&:last-of-type .MuiTableCell-root': { borderBottom: 'none' },
    }),
  },
};

const MuiTablePagination = {
  styleOverrides: {
    root: ({ theme }) => ({
      width: '100%',
      borderTop: `1px dashed ${theme.vars.palette.divider}`,
    }),
    toolbar: { minHeight: 64 },
    select: { paddingLeft: 8 },
  },
};

const MuiMenuItem = {
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.body2,
      padding: theme.spacing(0.75, 1),
      borderRadius: theme.shape.borderRadius * 0.75,
      '&:not(:last-of-type)': { marginBottom: 4 },
      '&.Mui-selected': {
        fontWeight: theme.typography.fontWeightSemiBold,
        backgroundColor: theme.vars.palette.action.selected,
        '&:hover': { backgroundColor: theme.vars.palette.action.hover },
      },
    }),
  },
};

const MuiMenu = {
  styleOverrides: {
    paper: ({ theme }) => ({
      padding: theme.spacing(0.5),
      boxShadow: theme.vars.customShadows.dropdown,
      borderRadius: theme.shape.borderRadius * 1.25,
    }),
    list: { padding: 0 },
  },
};

const MuiPopover = {
  styleOverrides: {
    paper: ({ theme }) => ({
      boxShadow: theme.vars.customShadows.dropdown,
      borderRadius: theme.shape.borderRadius * 1.25,
    }),
  },
};

const MuiDialog = {
  styleOverrides: {
    paper: ({ theme }) => ({
      boxShadow: theme.vars.customShadows.dialog,
      borderRadius: theme.shape.borderRadius * 2,
    }),
  },
};

const MuiDialogTitle = {
  styleOverrides: {
    root: ({ theme }) => ({ padding: theme.spacing(3) }),
  },
};

const MuiDialogContent = {
  styleOverrides: {
    root: ({ theme }) => ({ padding: theme.spacing(0, 3) }),
    dividers: ({ theme }) => ({
      borderTop: 0,
      borderBottomStyle: 'dashed',
      paddingBottom: theme.spacing(3),
    }),
  },
};

const MuiDialogActions = {
  defaultProps: { disableSpacing: true },
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      '& > :not(:first-of-type)': { marginLeft: theme.spacing(1.5) },
    }),
  },
};

const MuiDrawer = {
  styleOverrides: {
    paper: { backgroundImage: 'none' },
  },
};

const MuiTooltip = {
  defaultProps: { arrow: true },
  styleOverrides: {
    tooltip: ({ theme }) => ({
      backgroundColor: theme.vars.palette.grey[800],
      borderRadius: theme.shape.borderRadius,
    }),
    arrow: ({ theme }) => ({ color: theme.vars.palette.grey[800] }),
  },
};

const MuiChip = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: theme.typography.fontWeightMedium,
      borderRadius: theme.shape.borderRadius,
    }),
    sizeSmall: { height: 24 },
  },
};

const MuiTabs = {
  styleOverrides: {
    root: { minHeight: 48 },
    indicator: ({ theme }) => ({ backgroundColor: theme.vars.palette.text.primary }),
  },
};

const MuiTab = {
  defaultProps: { disableRipple: true },
  styleOverrides: {
    root: ({ theme }) => ({
      minHeight: 48,
      minWidth: 48,
      padding: theme.spacing(1, 0),
      marginRight: theme.spacing(3),
      textTransform: 'none',
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.vars.palette.text.secondary,
      '&.Mui-selected': {
        color: theme.vars.palette.text.primary,
        fontWeight: theme.typography.fontWeightSemiBold,
      },
    }),
  },
};

const MuiAlert = {
  styleOverrides: {
    root: ({ theme }) => ({ borderRadius: theme.shape.borderRadius }),
  },
};

const MuiLinearProgress = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 4,
      backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
    }),
    bar: { borderRadius: 4 },
  },
};

const MuiAvatar = {
  styleOverrides: {
    root: ({ theme }) => ({ fontSize: theme.typography.pxToRem(14), fontWeight: theme.typography.fontWeightSemiBold }),
  },
};

const MuiListItemIcon = {
  styleOverrides: {
    root: { minWidth: 'unset', marginRight: 16, color: 'inherit' },
  },
};

const MuiLink = {
  defaultProps: { underline: 'hover' },
};

const MuiFormControlLabel = {
  styleOverrides: {
    label: ({ theme }) => ({ ...theme.typography.body2 }),
  },
};

const MuiCheckbox = {
  defaultProps: {
    size: 'small',
    icon: (
      <SvgIcon>
        <path d="M17.9 2.318A5 5 0 0 1 22.895 7.1l.005.217v10a5 5 0 0 1-4.783 4.995l-.217.005h-10a5 5 0 0 1-4.995-4.783l-.005-.217v-10a5 5 0 0 1 4.783-4.996l.217-.004h10Zm-.5 1.5h-9a4 4 0 0 0-4 4v9a4 4 0 0 0 4 4h9a4 4 0 0 0 4-4v-9a4 4 0 0 0-4-4Z" />
      </SvgIcon>
    ),
    checkedIcon: (
      <SvgIcon>
        <path d="M17 2a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm-1.625 7.255-4.13 4.13-1.75-1.75a.881.881 0 0 0-1.24 0c-.34.34-.34.89 0 1.24l2.38 2.37c.17.17.39.25.61.25.23 0 .45-.08.62-.25l4.75-4.75c.34-.34.34-.89 0-1.24a.881.881 0 0 0-1.24 0Z" />
      </SvgIcon>
    ),
    indeterminateIcon: (
      <SvgIcon>
        <path d="M17,2 C19.7614,2 22,4.23858 22,7 L22,7 L22,17 C22,19.7614 19.7614,22 17,22 L17,22 L7,22 C4.23858,22 2,19.7614 2,17 L2,17 L2,7 C2,4.23858 4.23858,2 7,2 L7,2 Z M15,11 L9,11 C8.44772,11 8,11.4477 8,12 C8,12.5523 8.44772,13 9,13 L15,13 C15.5523,13 16,12.5523 16,12 C16,11.4477 15.5523,11 15,11 Z" />
      </SvgIcon>
    ),
  },
};

const MuiRadio = {
  defaultProps: {
    size: 'small',
    icon: (
      <SvgIcon>
        <path
          d="M12 2C13.9778 2 15.9112 2.58649 17.5557 3.6853C19.2002 4.78412 20.4819 6.3459 21.2388 8.17317C21.9957 10.0004 22.1937 12.0111 21.8079 13.9509C21.422 15.8907 20.4696 17.6725 19.0711 19.0711C17.6725 20.4696 15.8907 21.422 13.9509 21.8079C12.0111 22.1937 10.0004 21.9957 8.17317 21.2388C6.3459 20.4819 4.78412 19.2002 3.6853 17.5557C2.58649 15.9112 2 13.9778 2 12C2 6.477 6.477 2 12 2ZM12 3.5C9.74566 3.5 7.58365 4.39553 5.98959 5.98959C4.39553 7.58365 3.5 9.74566 3.5 12C3.5 14.2543 4.39553 16.4163 5.98959 18.0104C7.58365 19.6045 9.74566 20.5 12 20.5C14.2543 20.5 16.4163 19.6045 18.0104 18.0104C19.6045 16.4163 20.5 14.2543 20.5 12C20.5 9.74566 19.6045 7.58365 18.0104 5.98959C16.4163 4.39553 14.2543 3.5 12 3.5Z"
          fill="currentColor"
        />
      </SvgIcon>
    ),
    checkedIcon: (
      <SvgIcon>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 8C10.9391 8 9.92172 8.42143 9.17157 9.17157C8.42143 9.92172 8 10.9391 8 12C8 13.0609 8.42143 14.0783 9.17157 14.8284C9.92172 15.5786 10.9391 16 12 16C13.0609 16 14.0783 15.5786 14.8284 14.8284C15.5786 14.0783 16 13.0609 16 12C16 10.9391 15.5786 9.92172 14.8284 9.17157C14.0783 8.42143 13.0609 8 12 8Z"
          fill="currentColor"
        />
      </SvgIcon>
    ),
  },
};

export const components = {
  MuiCard,
  MuiLink,
  MuiPaper,
  MuiRadio,
  MuiButton,
  MuiBackdrop,
  MuiMenuItem,
  MuiMenu,
  MuiPopover,
  MuiCheckbox,
  MuiTableCell,
  MuiTableRow,
  MuiTablePagination,
  MuiCardHeader,
  MuiOutlinedInput,
  MuiInputLabel,
  MuiFormControlLabel,
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogActions,
  MuiDrawer,
  MuiTooltip,
  MuiChip,
  MuiTabs,
  MuiTab,
  MuiAlert,
  MuiLinearProgress,
  MuiAvatar,
  MuiListItemIcon,
};
