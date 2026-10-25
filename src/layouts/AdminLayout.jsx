import { Outlet } from "react-router-dom";
import { useState } from "react";
import { AppBar, Box, Drawer, IconButton, Toolbar, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { clearPermissions, clearUserData } from "../utils/permissions";
import { clearAuthTokens } from "../utils/auth";
import SidebarNavigation from "../components/SidebarNavigation";
import UserDropdown from "../components/UserDropdown";

const NAV_WIDTH = 280;

const drawerPaperSx = {
  width: NAV_WIDTH,
  bgcolor: '#071f35',
  color: 'rgba(255,255,255,.78)',
  borderRight: 0,
};

export default function AdminLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    clearAuthTokens();
    clearPermissions();
    clearUserData();
    window.location.href = "/login";
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Box
          component="img"
          src={`${import.meta.env.BASE_URL}sarth-logo.png`}
          alt="Sarth — Grow Business"
          sx={{ display: 'block', width: 170, height: 'auto', p: 1, borderRadius: 2, bgcolor: '#fff' }}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        <SidebarNavigation closeSidebar={() => setMobileOpen(false)} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { lg: `calc(100% - ${NAV_WIDTH}px)` },
          ml: { lg: `${NAV_WIDTH}px` },
          bgcolor: 'rgba(255,255,255,.86)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            aria-label="Open navigation"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { lg: 'none' } }}
          >
            <i className="fas fa-bars" aria-hidden="true" />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />

          {/* Right side */}
          <UserDropdown logout={logout} />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { lg: NAV_WIDTH }, flexShrink: { lg: 0 } }} aria-label="Main navigation">
        {!isDesktop && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', lg: 'none' },
              '& .MuiDrawer-paper': drawerPaperSx,
            }}
          >
            {drawerContent}
          </Drawer>
        )}
        {isDesktop && (
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: 'none', lg: 'block' },
              '& .MuiDrawer-paper': drawerPaperSx,
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { lg: `calc(100% - ${NAV_WIDTH}px)` },
          p: { xs: 2, md: 3 },
          pt: { xs: 10, md: 11 },
        }}
      >
        {/* 🔥 Important */}
        <Outlet />
      </Box>
    </Box>
  );
}
