import { useCallback, useState, useEffect } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import api from "../api";

// Simple time ago formatter
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?unread_only=true&limit=10');
      const payload = res.data?.data ?? res.data ?? {};
      const list = Array.isArray(payload) ? payload : Array.isArray(payload.notifications) ? payload.notifications : [];
      setNotifications(list);
      setUnreadCount(Number(payload.unread_count ?? list.length) || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(fetchNotifications, 0);
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'follow_up':
        return 'fas fa-calendar-check';
      case 'lead_assigned':
        return 'fas fa-user-plus';
      default:
        return 'fas fa-bell';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'follow_up':
        return 'warning.main';
      case 'lead_assigned':
        return 'info.main';
      default:
        return 'primary.main';
    }
  };

  return (
    <Box sx={{ mx: 1 }}>
      <Tooltip title="Notifications">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Notifications"
          sx={{ color: 'inherit' }}
        >
          <Badge
            badgeContent={unreadCount > 99 ? '99+' : unreadCount}
            color="error"
            invisible={unreadCount <= 0}
            overlap="circular"
          >
            <i className="fas fa-bell" style={{ fontSize: 18 }} aria-hidden="true" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 350,
              maxWidth: 'calc(100vw - 24px)',
            },
          },
          list: {
            sx: {
              py: 0,
              maxHeight: 400,
              overflowY: 'auto',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              variant="text"
              size="small"
              onClick={markAllAsRead}
              sx={{ minWidth: 0, p: 0, fontSize: 12 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <i className="fas fa-check-circle" style={{ fontSize: 28, opacity: 0.4 }} aria-hidden="true" />
            <Typography variant="body2" sx={{ mt: 1 }}>
              No new notifications
            </Typography>
          </Box>
        ) : (
          <>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                sx={{
                  whiteSpace: 'normal',
                  alignItems: 'flex-start',
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                  <Box
                    component="i"
                    className={getIcon(notification.type)}
                    sx={{ color: getIconColor(notification.type), fontSize: 15, mt: 0.35, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {notification.scheduled_at
                          ? timeAgo(notification.scheduled_at)
                          : timeAgo(notification.created_at)
                        }
                      </Typography>
                      {notification.lead_id && (
                        <Button
                          component={Link}
                          to={`/leads/${notification.lead_id}`}
                          variant="text"
                          size="small"
                          onClick={() => markAsRead(notification.id)}
                          sx={{ minWidth: 0, p: 0, fontSize: 12 }}
                        >
                          View Lead
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <Tooltip title="Mark as read">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      aria-label="Mark as read"
                      sx={{ color: 'text.secondary', p: 0.5, flexShrink: 0 }}
                    >
                      <i className="fas fa-times" style={{ fontSize: 12 }} aria-hidden="true" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              component={Link}
              to="/follow-ups"
              onClick={() => setAnchorEl(null)}
              sx={{ justifyContent: 'center', py: 1.25 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                View All Follow-ups
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
}
