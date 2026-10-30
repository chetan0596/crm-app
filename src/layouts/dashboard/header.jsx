import { Box, IconButton, Tooltip } from '@mui/material';

import { varAlpha } from '../../theme/utils';
import { Iconify } from '../../components/iconify';

import { Logo } from '../../components/logo';

import { Searchbar } from './searchbar';
import { AccountPopover } from './account-popover';
import { NotificationsPopover } from './notifications-popover';
import { HEADER_HEIGHT_MOBILE, HEADER_HEIGHT_DESKTOP } from './layout-vars';

export function Header({ onOpenNav, onLogout }) {
  return (
    <Box
      component="header"
      sx={[
        (theme) => ({
          top: 0,
          right: 0,
          width: 1,
          display: 'flex',
          position: 'sticky',
          alignItems: 'center',
          zIndex: theme.zIndex.appBar,
          px: { xs: 2, md: 3, lg: 5 },
          height: { xs: HEADER_HEIGHT_MOBILE, lg: HEADER_HEIGHT_DESKTOP },
          color: 'text.primary',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.8),
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
        }),
      ]}
    >
      <Tooltip title="Menu">
        <IconButton
          onClick={onOpenNav}
          aria-label="Open navigation"
          sx={{ mr: 1, color: 'text.primary', display: { lg: 'none' } }}
        >
          <Iconify icon="solar:hamburger-menu-broken" width={24} />
        </IconButton>
      </Tooltip>

      <Box sx={{ display: { lg: 'none' }, mr: 1 }}>
        <Logo height={30} symbol href="/" />
      </Box>

      <Searchbar />

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
        <NotificationsPopover />
        <AccountPopover onLogout={onLogout} />
      </Box>
    </Box>
  );
}
