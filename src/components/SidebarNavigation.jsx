import { NavLink, useLocation, useMatch, useResolvedPath } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { canView } from "../utils/permissions";

const navButtonSx = {
  minHeight: 42,
  mb: 0.4,
  px: 1.5,
  color: 'rgba(255,255,255,.72)',
  '&:hover': {
    bgcolor: 'rgba(255,255,255,.08)',
    color: '#fff',
  },
  '&.Mui-selected': {
    bgcolor: 'rgba(101,40,232,.22)',
    color: '#fff',
    boxShadow: 'inset 3px 0 0 #8a5cf6',
  },
  '&.Mui-selected:hover': {
    bgcolor: 'rgba(101,40,232,.3)',
  },
};

const nestedButtonSx = {
  ...navButtonSx,
  minHeight: 36,
  mb: 0.25,
  pl: 5,
  '& .MuiListItemText-primary': { fontSize: 13 },
};

// Submenu component
function SubMenu({ label, icon, children, isOpen, onToggle }) {
  return (
    <>
      <ListItemButton onClick={onToggle} sx={navButtonSx}>
        <ListItemIcon sx={{ minWidth: 38, color: 'inherit', fontSize: 16 }}>
          <i className={icon} aria-hidden="true" />
        </ListItemIcon>
        <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
        <i className={`fas fa-angle-down`} style={{ fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} aria-hidden="true" />
      </ListItemButton>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding dense>
          {children}
        </List>
      </Collapse>
    </>
  );
}

// Single menu item
function MenuLink({ to, icon, label, closeSidebar, exact = false, nested = false }) {
  const resolvedPath = useResolvedPath(to);
  const isActive = Boolean(useMatch({ path: resolvedPath.pathname, end: exact }));

  return (
    <ListItemButton
      component={NavLink}
      to={to}
      end={exact}
      selected={isActive}
      onClick={closeSidebar}
      sx={nested ? nestedButtonSx : navButtonSx}
    >
      {!nested && (
        <ListItemIcon sx={{ minWidth: 38, color: 'inherit', fontSize: 16 }}>
          <i className={icon} aria-hidden="true" />
        </ListItemIcon>
      )}
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: nested ? 13 : 14, fontWeight: nested ? 500 : 600 }} />
    </ListItemButton>
  );
}

const getOpenMenus = (path) => ({
  leads: path.startsWith('/lead') || path.startsWith('/webhooks'),
  inventory: path.startsWith('/inventory'),
  reports: path.startsWith('/reports'),
  users: path.startsWith('/users') || path.startsWith('/roles') || path.startsWith('/permissions') || path.startsWith('/permission-manager'),
});

export default function SidebarNavigation({ closeSidebar }) {
  const location = useLocation();
  // Auto-open menu based on current path
  const [openMenus, setOpenMenus] = useState(() => getOpenMenus(location.pathname));
  const [permTick, setPermTick] = useState(0);

  // Re-render sidebar when permissions change
  useEffect(() => {
    const onChange = () => setPermTick((t) => t + 1);
    window.addEventListener('permissions-changed', onChange);
    return () => window.removeEventListener('permissions-changed', onChange);
  }, []);


  const toggleMenu = (key) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box component="nav" key={permTick} sx={{ py: 1 }}>
      <List disablePadding>
        {/* Dashboard */}
        <MenuLink to="/" icon="fas fa-home" label="Dashboard" closeSidebar={closeSidebar} exact />

        {/* Leads Section */}
        {(canView('leads') || canView('lead-categories') || canView('lead-subcategories') || canView('lead-sources') || canView('lead-stages') || canView('lead-tags') || canView('cities') || canView('follow-ups') || canView('lead-integrations')) && (
          <SubMenu label="Leads" icon="fas fa-user-plus" isOpen={openMenus.leads} onToggle={() => toggleMenu('leads')}>
            {canView('leads') && <MenuLink to="/leads" label="All Leads" closeSidebar={closeSidebar} nested />}
            {canView('leads') && <MenuLink to="/leads/import" label="Import from Sheets" closeSidebar={closeSidebar} nested />}
            {canView('lead-categories') && <MenuLink to="/lead-categories" label="Categories" closeSidebar={closeSidebar} nested />}
            {canView('lead-subcategories') && <MenuLink to="/lead-subcategories" label="Subcategories" closeSidebar={closeSidebar} nested />}
            {canView('lead-sources') && <MenuLink to="/lead-sources" label="Sources" closeSidebar={closeSidebar} nested />}
            {canView('lead-stages') && <MenuLink to="/lead-stages" label="Stages" closeSidebar={closeSidebar} nested />}
            {canView('lead-tags') && <MenuLink to="/lead-tags" label="Tags" closeSidebar={closeSidebar} nested />}
            {canView('cities') && <MenuLink to="/cities" label="Cities" closeSidebar={closeSidebar} nested />}
            {canView('follow-ups') && <MenuLink to="/follow-ups" label="Follow-ups" closeSidebar={closeSidebar} nested />}
            {canView('lead-integrations') && <MenuLink to="/lead-source-integrations" label="Integrations" closeSidebar={closeSidebar} nested />}
            {canView('webhooks') && <MenuLink to="/webhooks" label="Webhooks" closeSidebar={closeSidebar} nested />}
            {canView('whatsapp-settings') && <MenuLink to="/whatsapp-settings" label="WhatsApp" closeSidebar={closeSidebar} nested />}
          </SubMenu>
        )}

        {/* Inventory Section */}
        {(canView('items') || canView('units') || canView('taxes') || canView('customers') || canView('vendors') || canView('purchases') || canView('sales') || canView('quotations') || canView('payments') || canView('credit-notes') || canView('debit-notes') || canView('warehouses') || canView('stock-transfers')) && (
          <SubMenu label="Inventory" icon="fas fa-boxes" isOpen={openMenus.inventory} onToggle={() => toggleMenu('inventory')}>
            {canView('items') && <MenuLink to="/inventory" label="Dashboard" closeSidebar={closeSidebar} nested />}
            {canView('items') && <MenuLink to="/inventory/items" label="Items" closeSidebar={closeSidebar} nested />}
            {canView('units') && <MenuLink to="/inventory/units" label="Units" closeSidebar={closeSidebar} nested />}
            {canView('taxes') && <MenuLink to="/inventory/taxes" label="Taxes" closeSidebar={closeSidebar} nested />}
            {canView('customers') && <MenuLink to="/inventory/customers" label="Customers" closeSidebar={closeSidebar} nested />}
            {canView('vendors') && <MenuLink to="/inventory/vendors" label="Vendors" closeSidebar={closeSidebar} nested />}
            {canView('purchases') && <MenuLink to="/inventory/purchases" label="Purchases" closeSidebar={closeSidebar} nested />}
            {canView('sales') && <MenuLink to="/inventory/sales" label="Sales" closeSidebar={closeSidebar} nested />}
            {canView('sales') && <MenuLink to="/inventory/invoice-settings" label="Invoice Settings" closeSidebar={closeSidebar} nested />}
            {canView('quotations') && <MenuLink to="/inventory/quotation-template" label="Quotation Template" closeSidebar={closeSidebar} nested />}
            {canView('quotations') && <MenuLink to="/quotations" label="Quotations" closeSidebar={closeSidebar} nested />}
            {canView('payments') && <MenuLink to="/payments" label="Payments" closeSidebar={closeSidebar} nested />}
            {canView('credit-notes') && <MenuLink to="/credit-notes" label="Credit Notes" closeSidebar={closeSidebar} nested />}
            {canView('debit-notes') && <MenuLink to="/debit-notes" label="Debit Notes" closeSidebar={closeSidebar} nested />}
            {canView('warehouses') && <MenuLink to="/inventory/warehouses" label="Warehouses" closeSidebar={closeSidebar} nested />}
            {canView('stock-transfers') && <MenuLink to="/inventory/stock-transfers" label="Stock Transfer" closeSidebar={closeSidebar} nested />}
          </SubMenu>
        )}

        {/* Reports Section */}
        {(canView('item-ledger') || canView('sales-report') || canView('purchases-report') || canView('inventory-report') || canView('customer-report') || canView('vendor-report') || canView('payments-report') || canView('quotations-report') || canView('credit-notes-report') || canView('debit-notes-report') || canView('warehouses') || canView('leads')) && (
          <SubMenu label="Reports" icon="fas fa-chart-bar" isOpen={openMenus.reports} onToggle={() => toggleMenu('reports')}>
            {canView('item-ledger') && <MenuLink to="/reports/item-ledger" label="Item Ledger" closeSidebar={closeSidebar} nested />}
            {canView('sales-report') && <MenuLink to="/reports/sales" label="Sales Report" closeSidebar={closeSidebar} nested />}
            {canView('purchases-report') && <MenuLink to="/reports/purchases" label="Purchase Report" closeSidebar={closeSidebar} nested />}
            {canView('inventory-report') && <MenuLink to="/reports/inventory" label="Inventory Report" closeSidebar={closeSidebar} nested />}
            {canView('customer-report') && <MenuLink to="/reports/customers" label="Customer Report" closeSidebar={closeSidebar} nested />}
            {canView('vendor-report') && <MenuLink to="/reports/vendors" label="Vendor Report" closeSidebar={closeSidebar} nested />}
            {canView('payments-report') && <MenuLink to="/reports/payments" label="Payments Report" closeSidebar={closeSidebar} nested />}
            {canView('quotations-report') && <MenuLink to="/reports/quotations" label="Quotations Report" closeSidebar={closeSidebar} nested />}
            {canView('credit-notes-report') && <MenuLink to="/reports/credit-notes" label="Credit Notes Report" closeSidebar={closeSidebar} nested />}
            {canView('debit-notes-report') && <MenuLink to="/reports/debit-notes" label="Debit Notes Report" closeSidebar={closeSidebar} nested />}
            {canView('warehouses') && <MenuLink to="/reports/warehouse" label="Warehouse Reports" closeSidebar={closeSidebar} nested />}
            {canView('leads') && <MenuLink to="/reports/leads" label="Lead Reports" closeSidebar={closeSidebar} nested />}
          </SubMenu>
        )}

        {/* User Management */}
        {(canView('users') || canView('roles') || canView('permissions')) && (
          <SubMenu label="User Management" icon="fas fa-users-cog" isOpen={openMenus.users} onToggle={() => toggleMenu('users')}>
            {canView('users') && <MenuLink to="/users" label="Users" closeSidebar={closeSidebar} nested />}
            {canView('roles') && <MenuLink to="/roles" label="Roles" closeSidebar={closeSidebar} nested />}
            {canView('permissions') && <MenuLink to="/permissions" label="Permissions" closeSidebar={closeSidebar} nested />}
            {canView('roles') && <MenuLink to="/permission-manager" label="Permission Manager" closeSidebar={closeSidebar} nested />}
          </SubMenu>
        )}
      </List>
    </Box>
  );
}
