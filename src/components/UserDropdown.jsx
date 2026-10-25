import { useState } from "react";
import { Avatar, Box, ButtonBase, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { getUserData, getUserRoles } from "../utils/permissions";
import NotificationBell from "./NotificationBell";

export default function UserDropdown({ logout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Get user data
  const userData = getUserData();
  const userRoles = getUserRoles();
  const userName = userData?.name || 'User';
  const userEmail = userData?.email || '';
  const primaryRole = userRoles[0] || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <NotificationBell />
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? 'user-menu' : undefined}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, p: .5, pr: 1, borderRadius: 2 }}
      >
        <Avatar sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
          {userInitials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, lineHeight: 1.2 }}>
            {userName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
            {primaryRole}
          </Typography>
        </Box>
        <i className="fas fa-angle-down" style={{ color: '#637381', fontSize: 12 }} aria-hidden="true" />
      </ButtonBase>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.25,
              minWidth: 260,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 12px 32px rgba(22,28,36,.16)',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
          <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: 'primary.main', fontSize: 20 }}>
            {userInitials}
          </Avatar>
          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{userName}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{userEmail}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main', justifyContent: 'center', py: 1.5, fontWeight: 600 }}>
          <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} aria-hidden="true" /> Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
