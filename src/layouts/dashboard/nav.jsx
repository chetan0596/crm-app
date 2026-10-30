import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Avatar, Box, Collapse, Drawer, IconButton, ListItemButton, ListItemText, Tooltip, Typography } from '@mui/material';

import { varAlpha } from '../../theme/utils';
import { canView, getUserData, getUserRoles } from '../../utils/permissions';
import { Scrollbar } from '../../components/scrollbar';
import { Iconify } from '../../components/iconify';
import { Logo } from '../../components/logo';

import { NAV_DATA } from './nav-config';
import { NAV_WIDTH, NAV_WIDTH_MOBILE } from './layout-vars';

// ----------------------------------------------------------------------

function isPathActive(pathname, path, exact) {
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavItem({ item, pathname, onClick, depth = 0 }) {
  const active = isPathActive(pathname, item.path, item.exact);

  return (
    <ListItemButton
      component={RouterLink}
      to={item.path}
      onClick={onClick}
      disableGutters
      sx={[
        (theme) => ({
          pl: 1.5,
          pr: 1.5,
          minHeight: depth ? 32 : 40,
          borderRadius: 1,
          typography: 'body2',
          color: 'text.secondary',
          fontWeight: 'fontWeightMedium',
          transition: theme.transitions.create(['background-color', 'color'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            bgcolor: 'action.hover',
            color: 'text.primary',
          },
          ...(active && {
            color: 'primary.main',
            fontWeight: 'fontWeightSemiBold',
            bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
            '&:hover': {
              bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
            },
          }),
        }),
      ]}
    >
      {depth === 0 ? (
        <Box component="span" sx={{ width: 20, height: 20, mr: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.icon}
        </Box>
      ) : (
        <Box component="span" sx={{ width: 20, height: 20, mr: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              bgcolor: 'currentColor',
              transition: (theme) => theme.transitions.create(['transform'], { duration: theme.transitions.duration.shorter }),
              ...(active && { transform: 'scale(2)', bgcolor: 'primary.main' }),
            }}
          />
        </Box>
      )}
      <ListItemText
        primary={item.title}
        slotProps={{ primary: { noWrap: true, sx: { typography: 'body2', fontWeight: 'inherit' } } }}
        sx={{ flex: '1 1 auto' }}
      />
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function NavGroupItem({ item, pathname, onNavigate }) {
  const visibleChildren = (item.children || []).filter((child) => canView(child.permission));
  const childActive = visibleChildren.some((child) => isPathActive(pathname, child.path, child.exact));
  // null = auto (open when a child route is active); a click stores an explicit override
  const [toggled, setToggled] = useState(null);
  const open = toggled ?? childActive;

  if (visibleChildren.length === 0) return null;

  return (
    <>
      <ListItemButton
        onClick={() => setToggled(!open)}
        disableGutters
        sx={[
          (theme) => ({
            pl: 1.5,
            pr: 1.5,
            minHeight: 40,
            borderRadius: 1,
            typography: 'body2',
            color: childActive ? 'text.primary' : 'text.secondary',
            fontWeight: childActive ? 'fontWeightSemiBold' : 'fontWeightMedium',
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            ...(childActive && !open && {
              color: 'primary.main',
              bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
            }),
          }),
        ]}
      >
        <Box component="span" sx={{ width: 20, height: 20, mr: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.icon}
        </Box>
        <ListItemText
          primary={item.title}
          slotProps={{ primary: { noWrap: true, sx: { typography: 'body2', fontWeight: 'inherit' } } }}
          sx={{ flex: '1 1 auto' }}
        />
        <Iconify
          icon="eva:arrow-ios-downward-fill"
          width={16}
          sx={{
            transition: (theme) => theme.transitions.create(['transform'], { duration: theme.transitions.duration.shorter }),
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, pl: 1.4 }}>
          {visibleChildren.map((child) => (
            <Box component="li" key={child.path} sx={{ display: 'flex' }}>
              <NavItem item={child} pathname={pathname} onClick={onNavigate} depth={1} />
            </Box>
          ))}
        </Box>
      </Collapse>
    </>
  );
}

// ----------------------------------------------------------------------

function NavUserFooter({ onLogout }) {
  const userData = getUserData();
  const userRoles = getUserRoles();
  const userName = userData?.name || 'User';
  const primaryRole = userRoles[0] || 'User';
  const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Box sx={{ px: 2, pb: 2, mt: 'auto' }}>
      <Box
        sx={[
          (theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            border: `dashed 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
          }),
        ]}
      >
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0, lineHeight: 1.3 }}>
          <Typography variant="subtitle2" noWrap>
            {userName}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
            {primaryRole}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton
            size="small"
            aria-label="Logout"
            onClick={onLogout}
            sx={{ color: 'error.main', flexShrink: 0 }}
          >
            <Iconify icon="solar:logout-2-bold-duotone" width={18} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function NavContent({ onNavigate, onLogout }) {
  const { pathname } = useLocation();
  const [permTick, setPermTick] = useState(0);

  // Re-render when permissions change
  useEffect(() => {
    const onChange = () => setPermTick((t) => t + 1);
    window.addEventListener('permissions-changed', onChange);
    return () => window.removeEventListener('permissions-changed', onChange);
  }, []);

  return (
    <>
      <Box
        sx={{
          px: 2.5,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        }}
      >
        <Logo height={32} href="/dashboard" />
      </Box>

      <Scrollbar sx={{ px: 1.5, flexGrow: 1 }}>
        <Box key={permTick} component="nav" sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', pb: 3 }}>
          {NAV_DATA.map((group) => {
            const items = group.items.filter((item) =>
              item.children ? item.children.some((child) => canView(child.permission)) : true
            );
            if (items.length === 0) return null;

            return (
              <Box key={group.subheader} component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 1 }}>
                <Typography
                  variant="overline"
                  component="li"
                  sx={{
                    display: 'block',
                    px: 1.5,
                    mb: 0.75,
                    mt: 1.5,
                    fontSize: 11,
                    color: 'text.disabled',
                  }}
                >
                  {group.subheader}
                </Typography>

                {items.map((item) => (
                  <Box component="li" key={item.title} sx={{ display: 'flex', flexDirection: 'column' }}>
                    {item.children ? (
                      <NavGroupItem item={item} pathname={pathname} onNavigate={onNavigate} />
                    ) : (
                      <NavItem item={item} pathname={pathname} onClick={onNavigate} />
                    )}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      </Scrollbar>

      {onLogout && <NavUserFooter onLogout={onLogout} />}
    </>
  );
}

// ----------------------------------------------------------------------

export function NavDesktop({ onLogout }) {
  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        position: 'fixed',
        top: 0,
        left: 0,
        width: NAV_WIDTH,
        height: 1,
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRight: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <NavContent onLogout={onLogout} />
    </Box>
  );
}

export function NavMobile({ open, onClose, onLogout }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: NAV_WIDTH_MOBILE,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
        <IconButton onClick={onClose} aria-label="Close navigation" size="small" sx={{ color: 'text.secondary' }}>
          <Iconify icon="eva:close-fill" width={18} />
        </IconButton>
      </Box>
      <NavContent onNavigate={onClose} onLogout={onLogout} />
    </Drawer>
  );
}
