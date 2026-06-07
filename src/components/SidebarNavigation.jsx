import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { canView } from "../utils/permissions";

// Submenu component
function SubMenu({ label, icon, children, isOpen, onToggle, closeSidebar }) {
  return (
    <li className={`nav-item has-treeview ${isOpen ? 'menu-open' : ''}`}>
      <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onToggle(); }}>
        <i className={`nav-icon ${icon}`}></i>
        <p>
          {label}
          <i className="right fas fa-angle-left"></i>
        </p>
      </a>
      <ul className="nav nav-treeview" style={{ display: isOpen ? 'block' : 'none' }}>
        {children}
      </ul>
    </li>
  );
}

// Single menu item
function MenuLink({ to, icon, label, closeSidebar, exact = false }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={exact}
        className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
        onClick={closeSidebar}
      >
        <i className={`nav-icon ${icon}`}></i>
        <p>{label}</p>
      </NavLink>
    </li>
  );
}

export default function SidebarNavigation({ closeSidebar }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [permTick, setPermTick] = useState(0);

  // Re-render sidebar when permissions change
  useEffect(() => {
    const onChange = () => setPermTick((t) => t + 1);
    window.addEventListener('permissions-changed', onChange);
    return () => window.removeEventListener('permissions-changed', onChange);
  }, []);

  // Auto-open menu based on current path
  useEffect(() => {
    const path = location.pathname;
    const newOpenMenus = {};
    
    if (path.startsWith('/lead') || path.startsWith('/webhooks')) newOpenMenus.leads = true;
    if (path.startsWith('/inventory')) newOpenMenus.inventory = true;
    if (path.startsWith('/reports')) newOpenMenus.reports = true;
    if (path.startsWith('/users') || path.startsWith('/roles') || path.startsWith('/permissions') || path.startsWith('/permission-manager')) newOpenMenus.users = true;
    
    setOpenMenus(prev => ({ ...prev, ...newOpenMenus }));
  }, [location.pathname]);

  const toggleMenu = (key) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <nav className="mt-2" key={permTick}>
      <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
        
        {/* Dashboard */}
        <MenuLink to="/" icon="fas fa-home" label="Dashboard" closeSidebar={closeSidebar} exact />

        {/* Leads Section */}
        {(canView('leads') || canView('lead-categories') || canView('lead-subcategories') || canView('lead-sources') || canView('lead-stages') || canView('lead-tags') || canView('cities') || canView('follow-ups') || canView('lead-integrations')) && (
          <SubMenu 
            label="Leads" 
            icon="fas fa-user-plus" 
            isOpen={openMenus.leads} 
            onToggle={() => toggleMenu('leads')}
            closeSidebar={closeSidebar}
          >
            {canView('leads') && <MenuLink to="/leads" icon="fas fa-list" label="All Leads" closeSidebar={closeSidebar} />}
            {canView('leads') && <MenuLink to="/leads/import" icon="fab fa-google" label="Import from Sheets" closeSidebar={closeSidebar} />}
            {canView('lead-categories') && <MenuLink to="/lead-categories" icon="fas fa-tags" label="Categories" closeSidebar={closeSidebar} />}
            {canView('lead-subcategories') && <MenuLink to="/lead-subcategories" icon="fas fa-sitemap" label="Subcategories" closeSidebar={closeSidebar} />}
            {canView('lead-sources') && <MenuLink to="/lead-sources" icon="fas fa-globe" label="Sources" closeSidebar={closeSidebar} />}
            {canView('lead-stages') && <MenuLink to="/lead-stages" icon="fas fa-tasks" label="Stages" closeSidebar={closeSidebar} />}
            {canView('lead-tags') && <MenuLink to="/lead-tags" icon="fas fa-tag" label="Tags" closeSidebar={closeSidebar} />}
            {canView('cities') && <MenuLink to="/cities" icon="fas fa-map-marker-alt" label="Cities" closeSidebar={closeSidebar} />}
            {canView('follow-ups') && <MenuLink to="/follow-ups" icon="fas fa-calendar-check" label="Follow-ups" closeSidebar={closeSidebar} />}
            {canView('lead-integrations') && <MenuLink to="/lead-source-integrations" icon="fas fa-plug" label="Integrations" closeSidebar={closeSidebar} />}
            {canView('webhooks') && <MenuLink to="/webhooks" icon="fas fa-link" label="Webhooks" closeSidebar={closeSidebar} />}
            {canView('whatsapp-settings') && <MenuLink to="/whatsapp-settings" icon="fab fa-whatsapp" label="WhatsApp" closeSidebar={closeSidebar} />}
          </SubMenu>
        )}

        {/* Inventory Section */}
        {(canView('items') || canView('units') || canView('taxes') || canView('customers') || canView('vendors') || canView('purchases') || canView('sales') || canView('quotations') || canView('payments') || canView('credit-notes') || canView('debit-notes') || canView('warehouses') || canView('stock-transfers')) && (
          <SubMenu 
            label="Inventory" 
            icon="fas fa-boxes" 
            isOpen={openMenus.inventory} 
            onToggle={() => toggleMenu('inventory')}
            closeSidebar={closeSidebar}
          >
            {canView('items') && <MenuLink to="/inventory" icon="fas fa-tachometer-alt" label="Dashboard" closeSidebar={closeSidebar} />}
            {canView('items') && <MenuLink to="/inventory/items" icon="fas fa-box" label="Items" closeSidebar={closeSidebar} />}
            {canView('units') && <MenuLink to="/inventory/units" icon="fas fa-ruler" label="Units" closeSidebar={closeSidebar} />}
            {canView('taxes') && <MenuLink to="/inventory/taxes" icon="fas fa-percentage" label="Taxes" closeSidebar={closeSidebar} />}
            {canView('customers') && <MenuLink to="/inventory/customers" icon="fas fa-users" label="Customers" closeSidebar={closeSidebar} />}
            {canView('vendors') && <MenuLink to="/inventory/vendors" icon="fas fa-truck" label="Vendors" closeSidebar={closeSidebar} />}
            {canView('purchases') && <MenuLink to="/inventory/purchases" icon="fas fa-shopping-cart" label="Purchases" closeSidebar={closeSidebar} />}
            {canView('sales') && <MenuLink to="/inventory/sales" icon="fas fa-cash-register" label="Sales" closeSidebar={closeSidebar} />}
            {canView('quotations') && <MenuLink to="/quotations" icon="fas fa-file-alt" label="Quotations" closeSidebar={closeSidebar} />}
            {canView('payments') && <MenuLink to="/payments" icon="fas fa-money-bill-wave" label="Payments" closeSidebar={closeSidebar} />}
            {canView('credit-notes') && <MenuLink to="/credit-notes" icon="fas fa-file-invoice-dollar" label="Credit Notes" closeSidebar={closeSidebar} />}
            {canView('debit-notes') && <MenuLink to="/debit-notes" icon="fas fa-file-invoice-dollar" label="Debit Notes" closeSidebar={closeSidebar} />}
            {canView('warehouses') && <MenuLink to="/inventory/warehouses" icon="fas fa-warehouse" label="Warehouses" closeSidebar={closeSidebar} />}
            {canView('stock-transfers') && <MenuLink to="/inventory/stock-transfers" icon="fas fa-exchange-alt" label="Stock Transfer" closeSidebar={closeSidebar} />}
          </SubMenu>
        )}

        {/* Reports Section */}
        {(canView('item-ledger') || canView('sales-report') || canView('purchases-report') || canView('inventory-report') || canView('customer-report') || canView('vendor-report') || canView('payments-report') || canView('quotations-report') || canView('credit-notes-report') || canView('debit-notes-report') || canView('warehouses') || canView('leads')) && (
          <SubMenu 
            label="Reports" 
            icon="fas fa-chart-bar" 
            isOpen={openMenus.reports} 
            onToggle={() => toggleMenu('reports')}
            closeSidebar={closeSidebar}
          >
            {canView('item-ledger') && <MenuLink to="/reports/item-ledger" icon="fas fa-book" label="Item Ledger" closeSidebar={closeSidebar} />}
            {canView('sales-report') && <MenuLink to="/reports/sales" icon="fas fa-chart-line" label="Sales Report" closeSidebar={closeSidebar} />}
            {canView('purchases-report') && <MenuLink to="/reports/purchases" icon="fas fa-shopping-basket" label="Purchase Report" closeSidebar={closeSidebar} />}
            {canView('inventory-report') && <MenuLink to="/reports/inventory" icon="fas fa-boxes" label="Inventory Report" closeSidebar={closeSidebar} />}
            {canView('customer-report') && <MenuLink to="/reports/customers" icon="fas fa-users" label="Customer Report" closeSidebar={closeSidebar} />}
            {canView('vendor-report') && <MenuLink to="/reports/vendors" icon="fas fa-truck" label="Vendor Report" closeSidebar={closeSidebar} />}
            {canView('payments-report') && <MenuLink to="/reports/payments" icon="fas fa-money-check-alt" label="Payments Report" closeSidebar={closeSidebar} />}
            {canView('quotations-report') && <MenuLink to="/reports/quotations" icon="fas fa-file-alt" label="Quotations Report" closeSidebar={closeSidebar} />}
            {canView('credit-notes-report') && <MenuLink to="/reports/credit-notes" icon="fas fa-file-invoice-dollar" label="Credit Notes Report" closeSidebar={closeSidebar} />}
            {canView('debit-notes-report') && <MenuLink to="/reports/debit-notes" icon="fas fa-file-invoice-dollar" label="Debit Notes Report" closeSidebar={closeSidebar} />}
            {canView('warehouses') && <MenuLink to="/reports/warehouse" icon="fas fa-warehouse" label="Warehouse Reports" closeSidebar={closeSidebar} />}
            {canView('leads') && <MenuLink to="/reports/leads" icon="fas fa-user-plus" label="Lead Reports" closeSidebar={closeSidebar} />}
          </SubMenu>
        )}

        {/* User Management */}
        {(canView('users') || canView('roles') || canView('permissions')) && (
          <SubMenu 
            label="User Management" 
            icon="fas fa-users-cog" 
            isOpen={openMenus.users} 
            onToggle={() => toggleMenu('users')}
            closeSidebar={closeSidebar}
          >
            {canView('users') && <MenuLink to="/users" icon="fas fa-users" label="Users" closeSidebar={closeSidebar} />}
            {canView('roles') && <MenuLink to="/roles" icon="fas fa-user-shield" label="Roles" closeSidebar={closeSidebar} />}
            {canView('permissions') && <MenuLink to="/permissions" icon="fas fa-key" label="Permissions" closeSidebar={closeSidebar} />}
            {canView('roles') && <MenuLink to="/permission-manager" icon="fas fa-user-cog" label="Permission Manager" closeSidebar={closeSidebar} />}
          </SubMenu>
        )}

      </ul>
    </nav>
  );
}
