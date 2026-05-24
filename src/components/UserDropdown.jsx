import { Dropdown } from "react-bootstrap";
import { getUserData, getUserRoles } from "../utils/permissions";
import NotificationBell from "./NotificationBell";

export default function UserDropdown({ logout }) {
  // Get user data
  const userData = getUserData();
  const userRoles = getUserRoles();
  const userName = userData?.name || 'User';
  const userEmail = userData?.email || '';
  const primaryRole = userRoles[0] || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <>
      <NotificationBell />
      <li className="nav-item dropdown user-menu">
      <Dropdown align="end">
        <Dropdown.Toggle 
          variant="light" 
          className="nav-link d-flex align-items-center gap-2 border-0 px-2 py-1 bg-transparent" 
          id="user-dropdown"
        >
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 36, height: 36, fontSize: '14px'}}>
            <span className="font-weight-bold">{userInitials}</span>
          </div>
          <div className="d-none d-md-block text-left">
            <div className="font-weight-bold text-dark" style={{fontSize: '14px', lineHeight: '1.2'}}>{userName}</div>
            <div className="text-muted" style={{fontSize: '12px', lineHeight: '1.2'}}>{primaryRole}</div>
          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu-right shadow border-0" style={{minWidth: '200px'}}>
          <div className="dropdown-header text-center bg-light border-bottom py-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{width: 60, height: 60}}>
              <span className="font-weight-bold">{firstLetter}</span>
            </div>
            <div className="font-weight-bold text-dark">{userName}</div>
            <div className="text-muted small">{userEmail}</div>
          </div>
          <Dropdown.Divider />
          <Dropdown.Item onClick={logout} className="text-danger text-center py-2">
            <i className="fas fa-sign-out-alt mr-2"></i> Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </li>
    </>
  );
}
