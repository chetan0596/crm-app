import { Avatar, Box, Button, Divider, MenuItem, Popover, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { varAlpha } from '../../theme/utils';
import { getUserData, getUserRoles } from '../../utils/permissions';
import { Iconify } from '../../components/iconify';
import { usePopover } from '../../hooks/use-popover';

export function AccountPopover({ onLogout }) {
  const popover = usePopover();

  const userData = getUserData();
  const userRoles = getUserRoles();
  const userName = userData?.name || 'User';
  const userEmail = userData?.email || '';
  const primaryRole = userRoles[0] || 'User';
  const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={popover.onOpen}
        aria-label="Account"
        sx={[
          (theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: '2px',
            pr: { xs: '2px', md: 1 },
            border: `dashed 1px transparent`,
            borderRadius: 1.25,
            cursor: 'pointer',
            bgcolor: 'transparent',
            font: 'inherit',
            textAlign: 'left',
            transition: theme.transitions.create(['background-color', 'border-color'], {
              duration: theme.transitions.duration.shorter,
            }),
            '&:hover': { bgcolor: 'action.hover' },
            ...(popover.open && {
              borderColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.32),
              bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
            }),
          }),
        ]}
      >
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.25 }}>
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 140 }}>
            {userName}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block', maxWidth: 140 }}>
            {primaryRole}
          </Typography>
        </Box>
      </Box>

      <Popover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1.5, width: 240, p: 0 } } }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {userName}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {userEmail}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
            {primaryRole}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          component={RouterLink}
          to="/dashboard"
          onClick={popover.onClose}
          sx={{ m: 1, mb: 0.5, gap: 2 }}
        >
          <Iconify icon="solar:home-2-bold-duotone" width={20} />
          Home
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            color="error"
            size="medium"
            variant="text"
            onClick={() => {
              popover.onClose();
              onLogout();
            }}
          >
            Logout
          </Button>
        </Box>
      </Popover>
    </>
  );
}
