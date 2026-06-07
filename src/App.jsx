import { Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { refreshPermissions } from "./utils/permissions";
import useFcmToken from "./hooks/useFcmToken";
import useFcmForeground from "./hooks/useFcmForeground";

import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import PermissionRoute from "./routes/PermissionRoute";
import AdminLayout from "./layouts/AdminLayout";

// Lazy loaded components
const LeadCategory = lazy(() => import("./pages/LeadCategory"));
const LeadSubcategoryPage = lazy(() => import("./pages/LeadSubcategoryPage"));
const LeadSubcategory = lazy(() => import("./pages/LeadSubcategory"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const LeadCategoryActivity = lazy(() => import("./pages/LeadCategoryActivity"));

// Inventory imports
const InventoryDashboard = lazy(() => import("./pages/InventoryDashboard"));
const UnitMaster = lazy(() => import("./pages/UnitMaster"));
const TaxMaster = lazy(() => import("./pages/TaxMaster"));
const ItemMaster = lazy(() => import("./pages/ItemMaster"));
const CustomerMaster = lazy(() => import("./pages/CustomerMaster"));
const VendorMaster = lazy(() => import("./pages/VendorMaster"));
const Purchase = lazy(() => import("./pages/Purchase"));
const Sales = lazy(() => import("./pages/Sales"));
const WarehouseMaster = lazy(() => import("./pages/WarehouseMaster"));
const StockTransfer = lazy(() => import("./pages/StockTransfer"));
const WarehouseReports = lazy(() => import("./pages/WarehouseReports"));

// User Management imports
const Users = lazy(() => import("./pages/Users"));
const Roles = lazy(() => import("./pages/Roles"));
const Permissions = lazy(() => import("./pages/Permissions"));
const PermissionManager = lazy(() => import("./pages/PermissionManager"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ItemLedger = lazy(() => import("./pages/reports/ItemLedger"));
const SalesReport = lazy(() => import("./pages/reports/SalesReport"));
const PurchaseReport = lazy(() => import("./pages/reports/PurchaseReport"));
const InventoryReport = lazy(() => import("./pages/reports/InventoryReport"));
const CustomerReport = lazy(() => import("./pages/reports/CustomerReport"));
const VendorReport = lazy(() => import("./pages/reports/VendorReport"));
const PaymentsReport = lazy(() => import("./pages/reports/PaymentsReport"));
const QuotationsReport = lazy(() => import("./pages/reports/QuotationsReport"));
const CreditNotesReport = lazy(() => import("./pages/reports/CreditNotesReport"));
const DebitNotesReport = lazy(() => import("./pages/reports/DebitNotesReport"));
const Payments = lazy(() => import("./pages/Payments"));
const Quotations = lazy(() => import("./pages/Quotations"));
const CreditNotes = lazy(() => import("./pages/CreditNotes"));
const DebitNotes = lazy(() => import("./pages/DebitNotes"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadDetails = lazy(() => import("./pages/LeadDetails"));
const LeadSources = lazy(() => import("./pages/LeadSources"));
const LeadStages = lazy(() => import("./pages/LeadStages"));
const LeadTags = lazy(() => import("./pages/LeadTags"));
const City = lazy(() => import("./pages/City"));
const Reports = lazy(() => import("./pages/Reports"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const LeadSourceIntegrations = lazy(() => import("./pages/LeadSourceIntegrations"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const GoogleSheetsImport = lazy(() => import("./pages/GoogleSheetsImport"));
const WhatsAppSettings = lazy(() => import("./pages/WhatsAppSettings"));

// Loading component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

export default function App() {
  useFcmToken();
  useFcmForeground();

  // Refresh permissions silently when user returns to the tab
  useEffect(() => {
    const onFocus = () => refreshPermissions();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <Routes>

        {/* ---------- PUBLIC ---------- */}

        <Route path="/login" element={
        <PublicRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <Login />
          </Suspense>
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <Register />
          </Suspense>
        </PublicRoute>
      } />
      {/* ---------- PROTECTED ---------- */}
      <Route element={
        <PrivateRoute>
          <AdminLayout />
        </PrivateRoute>
      }>

        <Route path="/" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/lead-categories" element={
          <PermissionRoute permission="lead-categories-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadCategory />
            </Suspense>
          </PermissionRoute>
        }/>
        <Route path="/lead-categories/:id/activity" element={
          <PermissionRoute permission="lead-categories-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadCategoryActivity />
            </Suspense>
          </PermissionRoute>
        }/>
        <Route path="/lead-categories/:id/subcategories" element={
          <PermissionRoute permission="lead-subcategories-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadSubcategoryPage />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/lead-subcategories" element={
          <PermissionRoute permission="lead-subcategories-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadSubcategory />
            </Suspense>
          </PermissionRoute>
        } />

        <Route path="/leads" element={
          <PermissionRoute permission="leads-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Leads />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/leads/:id" element={
          <PermissionRoute permission="leads-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadDetails />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/leads/import" element={
          <PermissionRoute permission="leads-import">
            <Suspense fallback={<LoadingSpinner />}>
              <GoogleSheetsImport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/lead-sources" element={
          <PermissionRoute permission="lead-sources-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadSources />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/lead-stages" element={
          <PermissionRoute permission="lead-stages-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadStages />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/lead-tags" element={
          <PermissionRoute permission="lead-tags-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadTags />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/cities" element={
          <PermissionRoute permission="cities-view">
            <Suspense fallback={<LoadingSpinner />}>
              <City />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/leads" element={
          <PermissionRoute permission="leads-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Reports />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/follow-ups" element={
          <PermissionRoute permission="follow-ups-view">
            <Suspense fallback={<LoadingSpinner />}>
              <FollowUps />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/lead-source-integrations" element={
          <PermissionRoute permission="lead-integrations-view">
            <Suspense fallback={<LoadingSpinner />}>
              <LeadSourceIntegrations />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/webhooks" element={
          <PermissionRoute permission="webhooks-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Webhooks />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/whatsapp-settings" element={
          <PermissionRoute permission="whatsapp-settings-view">
            <Suspense fallback={<LoadingSpinner />}>
              <WhatsAppSettings />
            </Suspense>
          </PermissionRoute>
        } />

        {/* Inventory Routes */}
        <Route path="/inventory" element={
          <PermissionRoute permission="items-view">
            <Suspense fallback={<LoadingSpinner />}>
              <InventoryDashboard />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/units" element={
          <PermissionRoute permission="units-view">
            <Suspense fallback={<LoadingSpinner />}>
              <UnitMaster />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/taxes" element={
          <PermissionRoute permission="taxes-view">
            <Suspense fallback={<LoadingSpinner />}>
              <TaxMaster />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/items" element={
          <PermissionRoute permission="items-view">
            <Suspense fallback={<LoadingSpinner />}>
              <ItemMaster />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/customers" element={
          <PermissionRoute permission="customers-view">
            <Suspense fallback={<LoadingSpinner />}>
              <CustomerMaster />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/vendors" element={
          <PermissionRoute permission="vendors-view">
            <Suspense fallback={<LoadingSpinner />}>
              <VendorMaster />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/purchases" element={
          <PermissionRoute permission="purchases-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Purchase />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/sales" element={
          <PermissionRoute permission="sales-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Sales />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/warehouses" element={
          <PermissionRoute permission="warehouses-view">
            <Suspense fallback={<LoadingSpinner />}>
              <WarehouseMaster />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/inventory/stock-transfers" element={
          <PermissionRoute permission="stock-transfers-view">
            <Suspense fallback={<LoadingSpinner />}>
              <StockTransfer />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/payments" element={
          <PermissionRoute permission="payments-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Payments />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/quotations" element={
          <PermissionRoute permission="quotations-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Quotations />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/credit-notes" element={
          <PermissionRoute permission="credit-notes-view">
            <Suspense fallback={<LoadingSpinner />}>
              <CreditNotes />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/debit-notes" element={
          <PermissionRoute permission="debit-notes-view">
            <Suspense fallback={<LoadingSpinner />}>
              <DebitNotes />
            </Suspense>
          </PermissionRoute>
        } />

        {/* User Management Routes */}
        <Route path="/users" element={
          <PermissionRoute permission="users-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Users />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/roles" element={
          <PermissionRoute permission="roles-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Roles />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/permissions" element={
          <PermissionRoute permission="permissions-view">
            <Suspense fallback={<LoadingSpinner />}>
              <Permissions />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/permission-manager" element={
          <PermissionRoute permission="roles-view">
            <Suspense fallback={<LoadingSpinner />}>
              <PermissionManager />
            </Suspense>
          </PermissionRoute>
        } />

        {/* Report Routes */}
        <Route path="/reports/warehouse" element={
          <PermissionRoute permission="warehouses-view">
            <Suspense fallback={<LoadingSpinner />}>
              <WarehouseReports />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/item-ledger" element={
          <PermissionRoute permission="item-ledger-view">
            <Suspense fallback={<LoadingSpinner />}>
              <ItemLedger />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/sales" element={
          <PermissionRoute permission="sales-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <SalesReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/purchases" element={
          <PermissionRoute permission="purchases-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <PurchaseReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/inventory" element={
          <PermissionRoute permission="inventory-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <InventoryReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/customers" element={
          <PermissionRoute permission="customer-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <CustomerReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/vendors" element={
          <PermissionRoute permission="vendor-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <VendorReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/payments" element={
          <PermissionRoute permission="payments-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <PaymentsReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/quotations" element={
          <PermissionRoute permission="quotations-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <QuotationsReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/credit-notes" element={
          <PermissionRoute permission="credit-notes-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <CreditNotesReport />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="/reports/debit-notes" element={
          <PermissionRoute permission="debit-notes-report-view">
            <Suspense fallback={<LoadingSpinner />}>
              <DebitNotesReport />
            </Suspense>
          </PermissionRoute>
        } />
      </Route>

    </Routes>
  );
}
