// import { NavLink } from "react-router-dom";

// export default function AdminLayout({ children }) {
//   return (
//     <div className="wrapper sidebar-mini">

//       {/* Navbar */}
//       <nav className="main-header navbar navbar-expand navbar-white navbar-light">
//         <ul className="navbar-nav">
//           <li className="nav-item">
//             <a className="nav-link" data-widget="pushmenu" href="#">
//               <i className="fas fa-bars"></i>
//             </a>
//           </li>
//         </ul>
//       </nav>

//       {/* Sidebar */}
//       <aside className="main-sidebar sidebar-dark-primary elevation-4">
//         <a href="#" className="brand-link">
//             <span className="brand-text font-weight-light ms-2">
//                 CRM Admin
//             </span>
//         </a>

//         <div className="sidebar">
//           <nav>
//             <ul className="nav nav-pills nav-sidebar flex-column">
//                 <li className="nav-item">
//                 <NavLink
//                     to="/"
//                     className={({ isActive }) =>
//                     "nav-link " + (isActive ? "active" : "")
//                     }
//                 >
//                     <i className="nav-icon fas fa-home"></i>
//                 <p>Dashboard</p>
//                 </NavLink>
//                 </li>

//                 <li className="nav-item">
//                 <NavLink
//                     to="/lead-categories"
//                     className={({ isActive }) =>
//                     "nav-link " + (isActive ? "active" : "")
//                     }
//                 >
//                     <i className="nav-icon fas fa-tags"></i>
//                     <p>Lead Category</p>
//                 </NavLink>
//                 </li>
//             </ul>
//           </nav>
//         </div>
//       </aside>

//       {/* Content */}
//       <div className="content-wrapper">
//         <section className="content pt-3">
//           <div className="container-fluid">
//             {children}
//           </div>
//         </section>
//       </div>

//     </div>
//   );
// }
import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { clearPermissions, clearUserData, getUserData, getUserRoles, canView } from "../utils/permissions";

export default function AdminLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize sidebar to expanded state (default)
    // document.body.classList.remove('sidebar-collapse');
    document.body.classList.remove('sidebar-open');
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    clearPermissions();
    clearUserData();
    window.location.href = "/login";
  };

  // Get user data
  const userData = getUserData();
  const userRoles = getUserRoles();
  const userName = userData?.name || 'User';
  const userEmail = userData?.email || '';
  const primaryRole = userRoles[0] || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const firstLetter = userName.charAt(0).toUpperCase();

  const toggleSidebar = (e) => {
    e.preventDefault();
    // AdminLTE handles the toggle automatically with data-widget="pushmenu"
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    // Close sidebar only on mobile (< 992px)
    if (window.innerWidth < 992) {
      document.body.classList.add('sidebar-collapse');
      document.body.classList.remove('sidebar-open');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`wrapper sidebar-mini${sidebarOpen ? " sidebar-open" : ""}`}>

      {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">

          {/* Toggle */}
          <li className="nav-item">
            <a className="nav-link" href="#" data-widget="pushmenu" onClick={toggleSidebar}>
              <i className="fas fa-bars"></i>
            </a>
          </li>

        </ul>

        {/* Right side */}
        <ul className="navbar-nav ml-auto align-items-center">
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
        </ul>
      </nav>


      {/* Sidebar */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4">

        <a href="#" className="brand-link">
          <span className="brand-text font-weight-light ms-2">
            CRM Admin
          </span>
        </a>

        <div className="sidebar">
          <nav>
            <ul className="nav nav-pills nav-sidebar flex-column">

              {/* Dashboard */}
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    "nav-link " + (isActive ? "active" : "")
                  }
                  onClick={closeSidebar}
                >
                  <i className="nav-icon fas fa-home"></i>
                  <p>Dashboard</p>
                </NavLink>
              </li>

              {/* Lead Category */}
              <li className="nav-item">
                <NavLink
                  to="/lead-categories"
                  className={({ isActive }) =>
                    "nav-link " + (isActive ? "active" : "")
                  }
                  onClick={closeSidebar}
                >
                  <i className="nav-icon fas fa-tags"></i>
                  <p>Category</p>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/lead-subcategories"
                  className={({isActive}) =>
                    "nav-link " + (isActive?"active":"")
                  }
                  onClick={closeSidebar}
                >
                  <i className="nav-icon fas fa-sitemap"></i>
                  <p>Subcategory</p>
                </NavLink>
              </li>

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/leads"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-user-plus"></i>
                    <p>Leads</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/lead-sources"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-list"></i>
                    <p>Lead Sources</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/lead-stages"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-tags"></i>
                    <p>Lead Stages</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/lead-tags"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-tag"></i>
                    <p>Lead Tags</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/cities"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-map-marker-alt"></i>
                    <p>Cities</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/leads"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-chart-bar"></i>
                    <p>Lead Reports</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/follow-ups"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-calendar-check"></i>
                    <p>Follow-ups</p>
                  </NavLink>
                </li>
              )}

              {canView('leads') && (
                <li className="nav-item">
                  <NavLink
                    to="/lead-source-integrations"
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "")
                    }
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-plug"></i>
                    <p>Source Integrations</p>
                  </NavLink>
                </li>
              )}

              {/* Inventory Menu */}
              <li className="nav-header">INVENTORY</li>
              {canView('dashboard') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory"
                    end
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-boxes"></i>
                    <p>Stock Dashboard</p>
                  </NavLink>
                </li>
              )}
              {canView('items') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/items"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-box"></i>
                    <p>Item Master</p>
                  </NavLink>
                </li>
              )}
              {canView('units') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/units"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-ruler"></i>
                    <p>Unit Master</p>
                  </NavLink>
                </li>
              )}
              {canView('taxes') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/taxes"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-percentage"></i>
                    <p>Tax/GST Master</p>
                  </NavLink>
                </li>
              )}
              {canView('customers') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/customers"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-users"></i>
                    <p>Customers</p>
                  </NavLink>
                </li>
              )}
              {canView('vendors') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/vendors"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-truck"></i>
                    <p>Vendors</p>
                  </NavLink>
                </li>
              )}
              {canView('purchases') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/purchases"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-shopping-cart"></i>
                    <p>Purchase</p>
                  </NavLink>
                </li>
              )}
              {canView('sales') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/sales"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-cash-register"></i>
                    <p>Sales</p>
                  </NavLink>
                </li>
              )}
              {canView('quotations') && (
                <li className="nav-item">
                  <NavLink
                    to="/quotations"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-file-alt"></i>
                    <p>Quotations</p>
                  </NavLink>
                </li>
              )}
              {canView('payments') && (
                <li className="nav-item">
                  <NavLink
                    to="/payments"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-money-bill-wave"></i>
                    <p>Payments</p>
                  </NavLink>
                </li>
              )}

              {canView('credit-notes') && (
                <li className="nav-item">
                  <NavLink
                    to="/credit-notes"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-file-invoice-dollar"></i>
                    <p>Credit Notes</p>
                  </NavLink>
                </li>
              )}

              {canView('debit-notes') && (
                <li className="nav-item">
                  <NavLink
                    to="/debit-notes"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-file-invoice-dollar"></i>
                    <p>Debit Notes</p>
                  </NavLink>
                </li>
              )}

              {/* Warehouse Management */}
              {canView('warehouses') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/warehouses"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-warehouse"></i>
                    <p>Warehouses</p>
                  </NavLink>
                </li>
              )}
              {canView('stock-transfers') && (
                <li className="nav-item">
                  <NavLink
                    to="/inventory/stock-transfers"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-exchange-alt"></i>
                    <p>Stock Transfer</p>
                  </NavLink>
                </li>
              )}
              {canView('warehouses') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/warehouse"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-chart-bar"></i>
                    <p>Warehouse Reports</p>
                  </NavLink>
                </li>
              )}

              {/* Reports Menu */}
              {canView('item-ledger') && (
                <li className="nav-header">REPORTS</li>
              )}
              {canView('item-ledger') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/item-ledger"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-book"></i>
                    <p>Item Ledger</p>
                  </NavLink>
                </li>
              )}
              {canView('sales-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/sales"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-chart-line"></i>
                    <p>Sales Report</p>
                  </NavLink>
                </li>
              )}
              {canView('purchases-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/purchases"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-shopping-basket"></i>
                    <p>Purchase Report</p>
                  </NavLink>
                </li>
              )}
              {canView('inventory-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/inventory"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-boxes"></i>
                    <p>Inventory Report</p>
                  </NavLink>
                </li>
              )}
              {canView('customer-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/customers"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-users"></i>
                    <p>Customer Report</p>
                  </NavLink>
                </li>
              )}
              {canView('vendor-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/vendors"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-truck"></i>
                    <p>Vendor Report</p>
                  </NavLink>
                </li>
              )}

              {canView('payments-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/payments"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-money-check-alt"></i>
                    <p>Payments Report</p>
                  </NavLink>
                </li>
              )}

              {canView('quotations-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/quotations"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-file-alt"></i>
                    <p>Quotations Report</p>
                  </NavLink>
                </li>
              )}

              {canView('credit-notes-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/credit-notes"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-file-invoice-dollar"></i>
                    <p>Credit Notes Report</p>
                  </NavLink>
                </li>
              )}

              {canView('debit-notes-report') && (
                <li className="nav-item">
                  <NavLink
                    to="/reports/debit-notes"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-file-invoice-dollar"></i>
                    <p>Debit Notes Report</p>
                  </NavLink>
                </li>
              )}

              {/* User Management Menu */}
              {(canView('users') || canView('roles') || canView('permissions')) && (
                <li className="nav-header">USER MANAGEMENT</li>
              )}
              {canView('users') && (
                <li className="nav-item">
                  <NavLink
                    to="/users"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-users-cog"></i>
                    <p>Users</p>
                  </NavLink>
                </li>
              )}
              {canView('roles') && (
                <li className="nav-item">
                  <NavLink
                    to="/roles"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-user-shield"></i>
                    <p>Roles</p>
                  </NavLink>
                </li>
              )}
              {canView('permissions') && (
                <li className="nav-item">
                  <NavLink
                    to="/permissions"
                    className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
                    onClick={closeSidebar}
                  >
                    <i className="nav-icon fas fa-key"></i>
                    <p>Permissions</p>
                  </NavLink>
                </li>
              )}

            </ul>
          </nav>
        </div>

      </aside>

      {/* Content */}
      <div className="content-wrapper">

        <section className="content pt-3">
          <div className="container-fluid">

            {/* 🔥 Important */}
            <Outlet />

          </div>
        </section>

      </div>

    </div>
  );
}
