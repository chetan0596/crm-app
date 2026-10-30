import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import { clearPermissions, clearUserData } from '../../utils/permissions';
import { clearAuthTokens } from '../../utils/auth';

import { Header } from './header';
import { NavDesktop, NavMobile } from './nav';
import { NAV_WIDTH } from './layout-vars';

export function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);

  const logout = () => {
    clearAuthTokens();
    clearPermissions();
    clearUserData();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavMobile open={navOpen} onClose={() => setNavOpen(false)} onLogout={logout} />
      <NavDesktop onLogout={logout} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          pl: { lg: `${NAV_WIDTH}px` },
        }}
      >
        <Header onOpenNav={() => setNavOpen(true)} onLogout={logout} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            maxWidth: '100%',
            px: { xs: 2, md: 3, lg: 5 },
            py: { xs: 3, md: 4 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
