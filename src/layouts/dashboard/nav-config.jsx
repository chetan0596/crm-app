import { Iconify } from '../../components/iconify';

const icon = (name) => <Iconify icon={name} width={20} />;

// Data-driven nav config, filtered by module permissions at render time.
// `permission` uses the module prefix resolved by canView('<module>').
export const NAV_DATA = [
  {
    subheader: 'Overview',
    items: [{ title: 'Dashboard', path: '/dashboard', icon: icon('solar:widget-5-bold-duotone'), exact: true }],
  },
  {
    subheader: 'Management',
    items: [
      {
        title: 'Leads',
        icon: icon('solar:users-group-rounded-bold-duotone'),
        path: '/leads',
        children: [
          { title: 'All leads', path: '/leads', permission: 'leads' },
          { title: 'Import from sheets', path: '/leads/import', permission: 'leads' },
          { title: 'Categories', path: '/lead-categories', permission: 'lead-categories' },
          { title: 'Subcategories', path: '/lead-subcategories', permission: 'lead-subcategories' },
          { title: 'Sources', path: '/lead-sources', permission: 'lead-sources' },
          { title: 'Stages', path: '/lead-stages', permission: 'lead-stages' },
          { title: 'Tags', path: '/lead-tags', permission: 'lead-tags' },
          { title: 'Cities', path: '/cities', permission: 'cities' },
          { title: 'Follow-ups', path: '/follow-ups', permission: 'follow-ups' },
          { title: 'Integrations', path: '/lead-source-integrations', permission: 'lead-integrations' },
          { title: 'Webhooks', path: '/webhooks', permission: 'webhooks' },
          { title: 'WhatsApp', path: '/whatsapp-settings', permission: 'whatsapp-settings' },
        ],
      },
      {
        title: 'Inventory',
        icon: icon('solar:box-bold-duotone'),
        path: '/inventory',
        children: [
          { title: 'Dashboard', path: '/inventory', permission: 'items', exact: true },
          { title: 'Items', path: '/inventory/items', permission: 'items' },
          { title: 'Units', path: '/inventory/units', permission: 'units' },
          { title: 'Taxes', path: '/inventory/taxes', permission: 'taxes' },
          { title: 'Customers', path: '/inventory/customers', permission: 'customers' },
          { title: 'Vendors', path: '/inventory/vendors', permission: 'vendors' },
          { title: 'Purchases', path: '/inventory/purchases', permission: 'purchases' },
          { title: 'Sales', path: '/inventory/sales', permission: 'sales' },
          { title: 'Invoice settings', path: '/inventory/invoice-settings', permission: 'sales' },
          { title: 'Quotation template', path: '/inventory/quotation-template', permission: 'quotations' },
          { title: 'Quotations', path: '/quotations', permission: 'quotations' },
          { title: 'Payments', path: '/payments', permission: 'payments' },
          { title: 'Credit notes', path: '/credit-notes', permission: 'credit-notes' },
          { title: 'Debit notes', path: '/debit-notes', permission: 'debit-notes' },
          { title: 'Warehouses', path: '/inventory/warehouses', permission: 'warehouses' },
          { title: 'Stock transfer', path: '/inventory/stock-transfers', permission: 'stock-transfers' },
        ],
      },
      {
        title: 'Reports',
        icon: icon('solar:chart-square-bold-duotone'),
        path: '/reports',
        children: [
          { title: 'Item ledger', path: '/reports/item-ledger', permission: 'item-ledger' },
          { title: 'Sales report', path: '/reports/sales', permission: 'sales-report' },
          { title: 'Purchase report', path: '/reports/purchases', permission: 'purchases-report' },
          { title: 'Inventory report', path: '/reports/inventory', permission: 'inventory-report' },
          { title: 'Customer report', path: '/reports/customers', permission: 'customer-report' },
          { title: 'Vendor report', path: '/reports/vendors', permission: 'vendor-report' },
          { title: 'Payments report', path: '/reports/payments', permission: 'payments-report' },
          { title: 'Quotations report', path: '/reports/quotations', permission: 'quotations-report' },
          { title: 'Credit notes report', path: '/reports/credit-notes', permission: 'credit-notes-report' },
          { title: 'Debit notes report', path: '/reports/debit-notes', permission: 'debit-notes-report' },
          { title: 'Warehouse reports', path: '/reports/warehouse', permission: 'warehouses' },
          { title: 'Lead reports', path: '/reports/leads', permission: 'leads' },
        ],
      },
      {
        title: 'User management',
        icon: icon('solar:shield-user-bold-duotone'),
        path: '/users',
        children: [
          { title: 'Users', path: '/users', permission: 'users' },
          { title: 'Roles', path: '/roles', permission: 'roles' },
          { title: 'Permissions', path: '/permissions', permission: 'permissions' },
          { title: 'Permission manager', path: '/permission-manager', permission: 'roles' },
        ],
      },
    ],
  },
];
