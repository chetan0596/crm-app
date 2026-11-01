import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import { clearPermissions, clearUserData } from '../../utils/permissions';
import { clearAuthTokens } from '../../utils/auth';

import { Header } from './header';
import { NavDesktop, NavMobile } from './nav';
import { NAV_WIDTH, NAV_WIDTH_MINI } from './layout-vars';

const NAV_MINI_KEY = 'sarth-nav-mini';

export function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [navMini, setNavMini] = useState(() => localStorage.getItem(NAV_MINI_KEY) === '1');

  const toggleNavMini = () => {
    setNavMini((prev) => {
      localStorage.setItem(NAV_MINI_KEY, prev ? '0' : '1');
      return !prev;
    });
  };

  const logout = () => {
    clearAuthTokens();
    clearPermissions();
    clearUserData();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavMobile open={navOpen} onClose={() => setNavOpen(false)} onLogout={logout} />
      <NavDesktop onLogout={logout} mini={navMini} onToggleMini={toggleNavMini} />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          pl: { lg: `${navMini ? NAV_WIDTH_MINI : NAV_WIDTH}px` },
          transition: (theme) =>
            theme.transitions.create(['padding-left'], { duration: theme.transitions.duration.shorter }),
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
