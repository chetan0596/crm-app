// import PrivateRoute from "./routes/PrivateRoute";
// import { Routes, Route } from "react-router-dom";
// import AdminLayout from "./layouts/AdminLayout";
// import LeadCategory from "./pages/LeadCategory";

// function Dashboard() {
//   return <h2>Dashboard</h2>;
// }

// export default function App() {
//   return (
//     <AdminLayout>
//       <Routes>
//         <Route path="/" element={<Dashboard />} />
//         <Route path="/lead-categories" element={<LeadCategory />} />
//       </Routes>
//     </AdminLayout>
//   );
// }
import { Routes, Route } from "react-router-dom";

import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import AdminLayout from "./layouts/AdminLayout";

import LeadCategory from "./pages/LeadCategory";
import LeadSubcategoryPage from "./pages/LeadSubcategoryPage";
import LeadSubcategory from "./pages/LeadSubcategory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LeadCategoryActivity from "./pages/LeadCategoryActivity";

// Inventory imports
import InventoryDashboard from "./pages/InventoryDashboard";
import UnitMaster from "./pages/UnitMaster";
import TaxMaster from "./pages/TaxMaster";
import ItemMaster from "./pages/ItemMaster";
import CustomerMaster from "./pages/CustomerMaster";
import VendorMaster from "./pages/VendorMaster";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import WarehouseMaster from "./pages/WarehouseMaster";
import StockTransfer from "./pages/StockTransfer";
import WarehouseReports from "./pages/WarehouseReports";

// User Management imports
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Dashboard from "./pages/Dashboard";
import ItemLedger from "./pages/reports/ItemLedger";
import SalesReport from "./pages/reports/SalesReport";
import PurchaseReport from "./pages/reports/PurchaseReport";
import InventoryReport from "./pages/reports/InventoryReport";
import CustomerReport from "./pages/reports/CustomerReport";
import VendorReport from "./pages/reports/VendorReport";
import PaymentsReport from "./pages/reports/PaymentsReport";
import QuotationsReport from "./pages/reports/QuotationsReport";
import CreditNotesReport from "./pages/reports/CreditNotesReport";
import DebitNotesReport from "./pages/reports/DebitNotesReport";
import Payments from "./pages/Payments";
import Quotations from "./pages/Quotations";
import CreditNotes from "./pages/CreditNotes";
import DebitNotes from "./pages/DebitNotes";
import Leads from "./pages/Leads";
import LeadDetails from "./pages/LeadDetails";
import LeadSources from "./pages/LeadSources";
import LeadStages from "./pages/LeadStages";
import LeadTags from "./pages/LeadTags";
import City from "./pages/City";
import Reports from "./pages/Reports";
import FollowUps from "./pages/FollowUps";
import LeadSourceIntegrations from "./pages/LeadSourceIntegrations";

export default function App() {

  return (
    <Routes>

      {/* ---------- PUBLIC ---------- */}
      {/* <Route path="/login" element={<Login />} /> */}

      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      {/* ---------- PROTECTED ---------- */}
      <Route element={
        <PrivateRoute>
          <AdminLayout />
        </PrivateRoute>
      }>

        <Route path="/" element={<Dashboard />} />
        <Route path="/lead-categories" element={<LeadCategory />} />
        <Route path="/lead-categories/:id/activity" element={<LeadCategoryActivity />}/>
        <Route path="/lead-categories/:id/subcategories" element={<LeadSubcategoryPage />} />
        <Route path="/lead-subcategories" element={<LeadSubcategory />} />

        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetails />} />
        <Route path="/lead-sources" element={<LeadSources />} />
        <Route path="/lead-stages" element={<LeadStages />} />
        <Route path="/lead-tags" element={<LeadTags />} />
        <Route path="/cities" element={<City />} />
        <Route path="/reports/leads" element={<Reports />} />
        <Route path="/follow-ups" element={<FollowUps />} />
        <Route path="/lead-source-integrations" element={<LeadSourceIntegrations />} />

        {/* Inventory Routes */}
        <Route path="/inventory" element={<InventoryDashboard />} />
        <Route path="/inventory/units" element={<UnitMaster />} />
        <Route path="/inventory/taxes" element={<TaxMaster />} />
        <Route path="/inventory/items" element={<ItemMaster />} />
        <Route path="/inventory/customers" element={<CustomerMaster />} />
        <Route path="/inventory/vendors" element={<VendorMaster />} />
        <Route path="/inventory/purchases" element={<Purchase />} />
        <Route path="/inventory/sales" element={<Sales />} />
        <Route path="/inventory/warehouses" element={<WarehouseMaster />} />
        <Route path="/inventory/stock-transfers" element={<StockTransfer />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/credit-notes" element={<CreditNotes />} />
        <Route path="/debit-notes" element={<DebitNotes />} />

        {/* User Management Routes */}
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/permissions" element={<Permissions />} />

        {/* Report Routes */}
        <Route path="/reports/warehouse" element={<WarehouseReports />} />
        <Route path="/reports/item-ledger" element={<ItemLedger />} />
        <Route path="/reports/sales" element={<SalesReport />} />
        <Route path="/reports/purchases" element={<PurchaseReport />} />
        <Route path="/reports/inventory" element={<InventoryReport />} />
        <Route path="/reports/customers" element={<CustomerReport />} />
        <Route path="/reports/vendors" element={<VendorReport />} />
        <Route path="/reports/payments" element={<PaymentsReport />} />
        <Route path="/reports/quotations" element={<QuotationsReport />} />
        <Route path="/reports/credit-notes" element={<CreditNotesReport />} />
        <Route path="/reports/debit-notes" element={<DebitNotesReport />} />
      </Route>

    </Routes>
  );
}
