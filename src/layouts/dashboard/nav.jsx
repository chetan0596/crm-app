import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Avatar, Box, Collapse, Drawer, IconButton, ListItemButton, ListItemText, Popover, Tooltip, Typography } from '@mui/material';

import { varAlpha } from '../../theme/utils';
import { canView, getUserData, getUserRoles } from '../../utils/permissions';
import { Scrollbar } from '../../components/scrollbar';
import { Iconify } from '../../components/iconify';
import { Label } from '../../components/label';
import { Logo } from '../../components/logo';

import { NAV_DATA } from './nav-config';
import { NAV_WIDTH, NAV_WIDTH_MINI, NAV_WIDTH_MOBILE } from './layout-vars';

// ----------------------------------------------------------------------

function isPathActive(pathname, path, exact) {
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavItem({ item, pathname, onClick, depth = 0, mini = false }) {
  const active = isPathActive(pathname, item.path, item.exact);
  const isMini = mini && depth === 0;

  const button = (
    <ListItemButton
      component={RouterLink}
      to={item.path}
      onClick={onClick}
      disableGutters
      aria-current={active ? 'page' : undefined}
      sx={[
        (theme) => ({
          pl: isMini ? 0 : 1.5,
          pr: isMini ? 0 : 1.5,
          minHeight: depth ? 32 : isMini ? 44 : 40,
          borderRadius: 1,
          typography: 'body2',
          color: 'text.secondary',
          fontWeight: 'fontWeightMedium',
          justifyContent: isMini ? 'center' : 'flex-start',
          position: 'relative',
          transition: theme.transitions.create(['background-color', 'color'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            bgcolor: 'action.hover',
            color: 'text.primary',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            width: 4,
            height: '60%',
            borderRadius: 2,
            bgcolor: 'secondary.main',
            transform: 'translateY(-50%) scaleY(0)',
            transition: theme.transitions.create(['transform'], {
              duration: theme.transitions.duration.shorter,
            }),
          },
          ...(active && {
            color: 'secondary.main',
            fontWeight: 'fontWeightSemiBold',
            bgcolor: varAlpha(theme.vars.palette.secondary.mainChannel, 0.16),
            '&:hover': {
              bgcolor: varAlpha(theme.vars.palette.secondary.mainChannel, 0.24),
            },
            '&::before': {
              transform: 'translateY(-50%) scaleY(1)',
            },
          }),
        }),
      ]}
    >
      {depth === 0 ? (
        <Box component="span" sx={{ width: 20, height: 20, mr: isMini ? 0 : 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              ...(active && { transform: 'scale(2)', bgcolor: 'secondary.main' }),
            }}
          />
        </Box>
      )}
      {!isMini && (
        <ListItemText
          primary={item.title}
          slotProps={{ primary: { noWrap: true, sx: { typography: 'body2', fontWeight: 'inherit' } } }}
          sx={{ flex: '1 1 auto' }}
        />
      )}
      {!isMini && item.info != null && (
        <Label
          color={item.infoColor || 'info'}
          variant="soft"
          sx={{ height: 20, minWidth: 20, fontSize: 11, flexShrink: 0, ml: 1 }}
        >
          {item.info}
        </Label>
      )}
    </ListItemButton>
  );

  return isMini ? (
    <Tooltip title={item.title} placement="right" arrow>
      {button}
    </Tooltip>
  ) : (
    button
  );
}

// ----------------------------------------------------------------------

function NavGroupItem({ item, pathname, onNavigate, mini = false }) {
  const visibleChildren = (item.children || []).filter((child) => canView(child.permission));
  const childActive = visibleChildren.some((child) => isPathActive(pathname, child.path, child.exact));
  // null = auto (open when a child route is active); a click stores an explicit override
  const [toggled, setToggled] = useState(null);
  const open = toggled ?? childActive;
  const [flyoutAnchor, setFlyoutAnchor] = useState(null);

  if (visibleChildren.length === 0) return null;

  if (mini) {
    return (
      <>
        <Tooltip title={item.title} placement="right" arrow>
          <ListItemButton
            onClick={(e) => setFlyoutAnchor((prev) => (prev ? null : e.currentTarget))}
            disableGutters
            aria-expanded={Boolean(flyoutAnchor)}
            aria-haspopup="true"
            sx={[
              (theme) => ({
                pl: 0,
                pr: 0,
                minHeight: 44,
                borderRadius: 1,
                justifyContent: 'center',
                typography: 'body2',
                color: childActive ? 'secondary.main' : 'text.secondary',
                fontWeight: childActive ? 'fontWeightSemiBold' : 'fontWeightMedium',
                transition: theme.transitions.create(['background-color', 'color'], {
                  duration: theme.transitions.duration.shorter,
                }),
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: 4,
                  height: '60%',
                  borderRadius: 2,
                  bgcolor: 'secondary.main',
                  transform: 'translateY(-50%) scaleY(0)',
                  transition: theme.transitions.create(['transform'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                },
                ...(childActive && {
                  bgcolor: varAlpha(theme.vars.palette.secondary.mainChannel, 0.16),
                  '&:hover': {
                    color: 'secondary.main',
                    bgcolor: varAlpha(theme.vars.palette.secondary.mainChannel, 0.24),
                  },
                  '&::before': {
                    transform: 'translateY(-50%) scaleY(1)',
                  },
                }),
              }),
            ]}
          >
            <Box component="span" sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </Box>
          </ListItemButton>
        </Tooltip>

        <Popover
          open={Boolean(flyoutAnchor)}
          anchorEl={flyoutAnchor}
          onClose={() => setFlyoutAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { ml: 0.5, p: 1, width: 220 } } }}
        >
          <Typography variant="overline" sx={{ display: 'block', px: 1.5, pt: 0.5, pb: 1, color: 'text.disabled' }}>
            {item.title}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {visibleChildren.map((child) => (
              <Box component="li" key={child.path} sx={{ display: 'flex' }}>
                <NavItem
                  item={child}
                  pathname={pathname}
                  depth={1}
                  onClick={() => {
                    setFlyoutAnchor(null);
                    onNavigate?.();
                  }}
                />
              </Box>
            ))}
          </Box>
        </Popover>
      </>
    );
  }

  return (
    <>
      <ListItemButton
        onClick={() => setToggled(!open)}
        disableGutters
        aria-expanded={open}
        sx={[
          (theme) => ({
            pl: 1.5,
            pr: 1.5,
            minHeight: 40,
            borderRadius: 1,
            typography: 'body2',
            color: childActive ? 'secondary.main' : 'text.secondary',
            fontWeight: childActive ? 'fontWeightSemiBold' : 'fontWeightMedium',
            transition: theme.transitions.create(['background-color', 'color'], {
              duration: theme.transitions.duration.shorter,
            }),
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              width: 4,
              height: '60%',
              borderRadius: 2,
              bgcolor: 'secondary.main',
              transform: 'translateY(-50%) scaleY(0)',
              transition: theme.transitions.create(['transform'], {
                duration: theme.transitions.duration.shorter,
              }),
            },
            ...(childActive && !open && {
              color: 'secondary.main',
              bgcolor: varAlpha(theme.vars.palette.secondary.mainChannel, 0.16),
              '&::before': {
                transform: 'translateY(-50%) scaleY(1)',
              },
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
        {item.info != null && (
          <Label
            color={item.infoColor || 'info'}
            variant="soft"
            sx={{ height: 20, minWidth: 20, fontSize: 11, flexShrink: 0, ml: 1 }}
          >
            {item.info}
          </Label>
        )}
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

function NavUserFooter({ onLogout, mini = false }) {
  const userData = getUserData();
  const userRoles = getUserRoles();
  const userName = userData?.name || 'User';
  const primaryRole = userRoles[0] || 'User';
  const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (mini) {
    return (
      <Box sx={{ px: 1, pb: 2, mt: 'auto', display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={`${userName} (${primaryRole})`} placement="right" arrow>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700, cursor: 'default' }}>
            {initials}
          </Avatar>
        </Tooltip>
      </Box>
    );
  }

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

export function NavContent({ onNavigate, onLogout, mini = false }) {
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
          px: mini ? 0 : 2.5,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: mini ? 'center' : 'flex-start',
          flexShrink: 0,
          borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        }}
      >
        <Logo height={32} symbol={mini} href="/dashboard" />
      </Box>

      <Scrollbar sx={{ px: mini ? 1 : 1.5, flexGrow: 1 }}>
        <Box key={permTick} component="nav" sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', pb: 3 }}>
          {NAV_DATA.map((group) => {
            const items = group.items.filter((item) =>
              item.children ? item.children.some((child) => canView(child.permission)) : true
            );
            if (items.length === 0) return null;

            return (
              <Box key={group.subheader} component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 1 }}>
                {mini ? (
                  <Box
                    component="li"
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mt: 1.5,
                      mb: 0.75,
                    }}
                  >
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                  </Box>
                ) : (
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
                )}

                {items.map((item) => (
                  <Box component="li" key={item.title} sx={{ display: 'flex', flexDirection: 'column' }}>
                    {item.children ? (
                      <NavGroupItem item={item} pathname={pathname} onNavigate={onNavigate} mini={mini} />
                    ) : (
                      <NavItem item={item} pathname={pathname} onClick={onNavigate} mini={mini} />
                    )}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      </Scrollbar>

      {onLogout && <NavUserFooter onLogout={onLogout} mini={mini} />}
    </>
  );
}

// ----------------------------------------------------------------------

export function NavDesktop({ onLogout, mini = false, onToggleMini }) {
  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        position: 'fixed',
        top: 0,
        left: 0,
        width: mini ? NAV_WIDTH_MINI : NAV_WIDTH,
        height: 1,
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRight: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) =>
          theme.transitions.create(['width'], { duration: theme.transitions.duration.shorter }),
      }}
    >
      {onToggleMini && (
        <Tooltip title={mini ? 'Expand' : 'Collapse'} placement="right" arrow>
          <IconButton
            onClick={onToggleMini}
            aria-label={mini ? 'Expand navigation' : 'Collapse navigation'}
            size="small"
            sx={[
              (theme) => ({
                position: 'absolute',
                top: 18,
                right: -14,
                zIndex: 1,
                width: 28,
                height: 28,
                color: 'text.secondary',
                bgcolor: 'background.paper',
                border: `dashed 1px ${theme.vars.palette.divider}`,
                '&:hover': { bgcolor: 'background.paper', color: 'text.primary' },
              }),
            ]}
          >
            <Iconify icon={mini ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'} width={14} />
          </IconButton>
        </Tooltip>
      )}
      <NavContent onLogout={onLogout} mini={mini} />
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
