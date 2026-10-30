import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Badge, Box, Button, IconButton, ListItemAvatar, ListItemButton, ListItemText, Popover, Tooltip, Typography } from '@mui/material';

import api from '../../api';
import { varAlpha } from '../../theme/utils';
import { Iconify } from '../../components/iconify';
import { Scrollbar } from '../../components/scrollbar';
import { usePopover } from '../../hooks/use-popover';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

const TYPE_MAP = {
  follow_up: { icon: 'solar:calendar-mark-bold-duotone', color: 'warning' },
  lead_assigned: { icon: 'solar:user-plus-rounded-bold-duotone', color: 'info' },
};

export function NotificationsPopover() {
  const popover = usePopover();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
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

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={popover.onOpen} aria-label="Notifications" sx={{ color: 'text.primary' }}>
          <Badge badgeContent={unreadCount > 99 ? '99+' : unreadCount} color="error" invisible={unreadCount <= 0}>
            <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1.5, width: 360, maxWidth: 'calc(100vw - 24px)' } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 2.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              You have {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton color="primary" onClick={markAllAsRead}>
                <Iconify icon="eva:done-all-fill" width={20} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}` }} />

        <Scrollbar sx={{ height: { xs: 340, sm: 'auto' }, maxHeight: { sm: 400 } }}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Iconify icon="solar:bell-off-bold-duotone" width={48} sx={{ opacity: 0.4, mb: 1 }} />
              <Typography variant="body2">No new notifications</Typography>
            </Box>
          ) : (
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {notifications.map((notification) => {
                const meta = TYPE_MAP[notification.type] || { icon: 'solar:bell-bold-duotone', color: 'primary' };
                return (
                  <Box
                    component="li"
                    key={notification.id}
                    sx={{ display: 'flex', borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}` }}
                  >
                    <ListItemButton
                      sx={{
                        py: 1.5,
                        px: 2.5,
                        alignItems: 'flex-start',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemAvatar sx={{ mt: 0 }}>
                        <Avatar
                          sx={[
                            (theme) => ({
                              width: 40,
                              height: 40,
                              bgcolor: varAlpha(theme.vars.palette[meta.color].mainChannel, 0.16),
                              color: `${meta.color}.dark`,
                            }),
                          ]}
                        >
                          <Iconify icon={meta.icon} width={22} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                              <Iconify icon="solar:clock-circle-outline" width={14} />
                              <Typography component="span" variant="caption">
                                {timeAgo(notification.scheduled_at || notification.created_at)}
                              </Typography>
                            </Box>
                          </>
                        }
                        slotProps={{
                          primary: { variant: 'subtitle2', sx: { mb: 0.5 } },
                          secondary: { component: 'div' },
                        }}
                      />
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          aria-label="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          sx={{ ml: 1, color: 'text.secondary', flexShrink: 0 }}
                        >
                          <Iconify icon="eva:close-fill" width={14} />
                        </IconButton>
                      </Tooltip>
                    </ListItemButton>
                    {notification.lead_id && (
                      <Button
                        component={RouterLink}
                        to={`/leads/${notification.lead_id}`}
                        size="small"
                        variant="text"
                        onClick={() => {
                          markAsRead(notification.id);
                          popover.onClose();
                        }}
                        sx={{ alignSelf: 'center', flexShrink: 0, mr: 1, px: 1, minWidth: 0, fontSize: 12 }}
                      >
                        View
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Scrollbar>

        <Box sx={{ p: 1, borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}` }}>
          <Button
            component={RouterLink}
            to="/follow-ups"
            fullWidth
            size="small"
            onClick={popover.onClose}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={14} />}
          >
            View all follow-ups
          </Button>
        </Box>
      </Popover>
    </>
  );
}
