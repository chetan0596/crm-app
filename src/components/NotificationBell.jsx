import { useState, useEffect } from 'react';
import { Dropdown, Badge } from "react-bootstrap";
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
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?unread_only=true&limit=10');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

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
        return 'fas fa-calendar-check text-warning';
      case 'lead_assigned':
        return 'fas fa-user-plus text-info';
      default:
        return 'fas fa-bell text-primary';
    }
  };

  return (
    <Dropdown align="end" className="mx-2">
      <Dropdown.Toggle 
        variant="light" 
        className="nav-link position-relative p-2 border-0 bg-transparent"
        id="notification-dropdown"
      >
        <i className="fas fa-bell fa-lg"></i>
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            className="position-absolute top-0 end-0"
            style={{ fontSize: '0.65rem', transform: 'translate(25%, -25%)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="dropdown-menu-right shadow border-0" style={{ width: '350px', maxHeight: '400px', overflow: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0 font-weight-bold">Notifications</h6>
          {unreadCount > 0 && (
            <button 
              className="btn btn-link btn-sm text-decoration-none p-0"
              onClick={markAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="fas fa-check-circle fa-2x mb-2"></i>
            <p className="mb-0 small">No new notifications</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <Dropdown.Item 
                key={notification.id}
                className="border-bottom py-2 px-3"
                style={{ whiteSpace: 'normal' }}
              >
                <div className="d-flex align-items-start gap-2">
                  <i className={`${getIcon(notification.type)} mt-1`}></i>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <p className="mb-1 small font-weight-bold">
                      {notification.title}
                    </p>
                    <p className="mb-1 small text-muted">
                      {notification.message}
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {notification.scheduled_at 
                          ? timeAgo(notification.scheduled_at)
                          : timeAgo(notification.created_at)
                        }
                      </small>
                      {notification.lead_id && (
                        <Link 
                          to={`/leads/${notification.lead_id}`}
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          onClick={() => markAsRead(notification.id)}
                        >
                          View Lead
                        </Link>
                      )}
                    </div>
                  </div>
                  <button 
                    className="btn btn-link btn-sm p-0 text-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </Dropdown.Item>
            ))}
            <Dropdown.Item 
              as={Link} 
              to="/follow-ups" 
              className="text-center py-2 font-weight-bold"
            >
              View All Follow-ups
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
