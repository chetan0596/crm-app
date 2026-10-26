import { useEffect, useReducer, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canEdit, canDelete, canView } from "../utils/permissions";
import WhatsAppSendModal from "../components/WhatsAppSendModal";

const tableReducer = (state, action) => {
  switch (action.type) {
    case "PAGE": return { ...state, page: action.page };
    case "PER_PAGE": return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH": return { ...state, search: action.search, page: 1 };
    case "SORT": return { ...state, sortField: action.field, sortDir: action.dir };
    default: return state;
  }
};

const getNum = (v, fallback = 1) => {
  const n = parseInt(v, 10);
  return isNaN(n) || n < 1 ? fallback : n;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const pageCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const metricCardSx = {
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const headerCellSx = {
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  px: 2,
  py: 1.5,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const bodyCellSx = {
  verticalAlign: 'middle',
  px: 2,
  py: 1.5,
  borderBottom: '1px solid #f1f5f9',
};

const typeChipSx = {
  sale: { bgcolor: '#dbf5e9', color: '#118d57' },
  purchase: { bgcolor: '#fff4d6', color: '#b76e00' },
};

const statusChipSx = {
  paid: { bgcolor: '#dbf5e9', color: '#118d57' },
  partial: { bgcolor: '#fff4d6', color: '#b76e00' },
  unpaid: { bgcolor: '#ffe4de', color: '#b71d18' },
};

export default function Payments() {
  const [params, setParams] = useSearchParams();
  const canViewPayments = canView("payments");

  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 10),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [activeTab, setActiveTab] = useState("payments");
  const [sort, setSort] = useState({ field: null, dir: 'asc' });

  const [outstanding, setOutstanding] = useState([]);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [outstandingFilters, setOutstandingFilters] = useState({
    from: "",
    to: "",
    customer_id: "",
    vendor_id: "",
    status: "",
    warehouse_id: "",
  });
  const [summary, setSummary] = useState({
    today_received: 0,
    today_paid: 0,
    month_received: 0,
    month_paid: 0,
    total_outstanding_sales: 0,
    total_outstanding_purchases: 0,
  });

  const [show, setShow] = useState(false);
  const [waShow, setWaShow] = useState(false);
  const [waTarget, setWaTarget] = useState(null);
  const [form, setForm] = useState({
    type: "sale",
    sale_id: "",
    purchase_id: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const downloadOutstandingPDF = () => {
    if (loading) return;
    const type = activeTab === "outstanding-sales" ? "sale" : "purchase";
    const params = { type };
    if (table.search) params.search = table.search;
    if (outstandingFilters.from) params.from = outstandingFilters.from;
    if (outstandingFilters.to) params.to = outstandingFilters.to;
    if (outstandingFilters.status) params.status = outstandingFilters.status;
    if (outstandingFilters.warehouse_id) params.warehouse_id = outstandingFilters.warehouse_id;
    if (type === "sale" && outstandingFilters.customer_id) params.customer_id = outstandingFilters.customer_id;
    if (type === "purchase" && outstandingFilters.vendor_id) params.vendor_id = outstandingFilters.vendor_id;

    api
      .get("/reports/outstanding/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = type === "sale" ? "outstanding-sales-report.pdf" : "outstanding-purchases-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {});
  };

  const downloadOutstandingExcel = () => {
    if (loading) return;
    const type = activeTab === "outstanding-sales" ? "sale" : "purchase";
    const params = { type };
    if (table.search) params.search = table.search;
    if (outstandingFilters.from) params.from = outstandingFilters.from;
    if (outstandingFilters.to) params.to = outstandingFilters.to;
    if (outstandingFilters.status) params.status = outstandingFilters.status;
    if (outstandingFilters.warehouse_id) params.warehouse_id = outstandingFilters.warehouse_id;
    if (type === "sale" && outstandingFilters.customer_id) params.customer_id = outstandingFilters.customer_id;
    if (type === "purchase" && outstandingFilters.vendor_id) params.vendor_id = outstandingFilters.vendor_id;

    api
      .get("/reports/outstanding/csv", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = type === "sale" ? "outstanding-sales-report.csv" : "outstanding-purchases-report.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page, perPage: table.perPage, search: table.search,
      sort: table.sortField, dir: table.sortDir,
    });
    if (newParams.toString() !== params.toString()) setParams(newParams);
  }, [table, params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) dispatch({ type: "SEARCH", search: s });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (activeTab === "payments") {
        loadTable(controller.signal);
      } else {
        loadOutstanding(controller.signal);
      }
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, reloadKey, activeTab, canViewPayments, outstandingFilters]);

  const loadTable = async (signal) => {
    if (!canViewPayments) return;
    setOutstanding([]);
    setLoading(true);
    try {
      const res = await api.get("/payments", { params: { page: table.page, perPage: table.perPage, search: table.search, type: form.type }, signal });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total ?? 0));
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  const loadOutstanding = async (signal) => {
    if (!canViewPayments) return;
    const type = activeTab === "outstanding-sales" ? "sale" : "purchase";
    setRows([]);
    setLoading(true);
    try {
      const res = await api.get("/outstanding", {
        params: {
          type,
          search: table.search,
          perPage: table.perPage,
          page: table.page,
          from: outstandingFilters.from,
          to: outstandingFilters.to,
          status: outstandingFilters.status,
          warehouse_id: outstandingFilters.warehouse_id,
          customer_id: type === "sale" ? outstandingFilters.customer_id : "",
          vendor_id: type === "purchase" ? outstandingFilters.vendor_id : "",
        },
        signal,
      });
      setOutstanding(toArray(res.data));
      setOutstandingTotal(Number(res.data?.total ?? res.data?.data?.total ?? 0));
    } catch { setOutstanding([]); setOutstandingTotal(0); }
    finally { setLoading(false); }
  };

  const loadSummary = useCallback(async (signal) => {
    try {
      const res = await api.get("/payment-summary", { signal });
      setSummary(res.data);
    } catch { setSummary(null); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadSummary(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, activeTab]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [salesRes, purchRes, custRes, vendRes, warehouseRes] = await Promise.all([
          api.get("/sales", { params: { perPage: 200 } }),
          api.get("/purchases", { params: { perPage: 200 } }),
          api.get("/customers", { params: { perPage: 200 } }),
          api.get("/vendors", { params: { perPage: 200 } }),
          api.get("/warehouses/list"),
        ]);
        setSales(toArray(salesRes.data));
        setPurchases(toArray(purchRes.data));
        setCustomers(toArray(custRes.data));
        setVendors(toArray(vendRes.data));
        setWarehouses(toArray(warehouseRes.data));
      } catch { /* ignore */ }
    };
    const timer = setTimeout(() => loadDropdowns(), 0);
    return () => clearTimeout(timer);
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      type: "sale",
      sale_id: "",
      purchase_id: "",
      amount: "",
      payment_method: "cash",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      type: row.type || "sale",
      sale_id: row.sale_id || "",
      purchase_id: row.purchase_id || "",
      amount: row.amount || "",
      payment_method: row.payment_method || "cash",
      reference_number: row.reference_number || "",
      payment_date: row.payment_date ? row.payment_date.split("T")[0] : new Date().toISOString().split("T")[0],
      notes: row.notes || "",
    });
    setShow(true);
  };

  const openPaymentFor = (row, type) => {
    setEditingId(null);
    setForm({
      type,
      sale_id: type === "sale" ? row.id : "",
      purchase_id: type === "purchase" ? row.id : "",
      amount: row.outstanding,
      payment_method: "cash",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.warning("Enter valid amount"); return; }
    if (form.type === "sale" && !form.sale_id) { toast.warning("Select invoice"); return; }
    if (form.type === "purchase" && !form.purchase_id) { toast.warning("Select purchase bill"); return; }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/payments/${editingId}`, form);
        toast.success("Payment updated");
      } else {
        await api.post("/payments", form);
        toast.success("Payment recorded");
      }
      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = (row) => {
    Swal.fire({
      title: "Delete payment?",
      text: `Amount: ₹${formatMoney(row.amount)}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/payments/${row.id}`);
        setReloadKey((k) => k + 1);
        toast.success("Payment deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const paymentColumns = [
    { key: 'id', label: 'ID', width: 70, sortValue: (r) => r.id, render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography> },
    { key: 'payment_date', label: 'Date', minWidth: 110, sortValue: (r) => r.payment_date },
    {
      key: 'type', label: 'Type', minWidth: 100,
      render: (row) => (
        <Chip
          label={row.type === "sale" ? "Received" : "Paid"}
          size="small"
          sx={{ ...(typeChipSx[row.type] || typeChipSx.purchase), fontWeight: 700 }}
        />
      ),
    },
    { key: 'doc', label: 'Invoice/Bill', minWidth: 130, render: (row) => row.sale?.invoice_number || row.purchase?.bill_number || "-" },
    { key: 'party', label: 'Party', minWidth: 140, render: (row) => row.sale?.customer?.name || row.purchase?.vendor?.name || "-" },
    { key: 'method', label: 'Method', minWidth: 120, render: (row) => (row.payment_method || '').replace(/_/g, " ").toUpperCase() },
    { key: 'amount', label: 'Amount', minWidth: 110, sortValue: (r) => Number(r.amount) || 0, render: (row) => `₹${formatMoney(row.amount)}` },
    { key: 'reference_number', label: 'Reference', minWidth: 120, render: (row) => row.reference_number || "-" },
    {
      key: 'action', label: 'Action', minWidth: 110, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {canEdit("payments") && (
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" onClick={() => openEdit(row)} aria-label="Edit payment" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <i className="fas fa-edit" style={{ fontSize: 12 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete("payments") && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => deletePayment(row)} aria-label="Delete payment" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <i className="fas fa-trash" style={{ fontSize: 12 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {(row.sale?.customer?.phone || row.purchase?.vendor?.phone) && (
            <Tooltip title="Send WhatsApp">
              <IconButton size="small" color="success" onClick={() => { setWaTarget(row); setWaShow(true); }} aria-label="Send WhatsApp" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <i className="fab fa-whatsapp" style={{ fontSize: 12 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const outstandingColumns = [
    { key: 'number', label: 'Number', minWidth: 130, sortValue: (r) => r.number },
    { key: 'date', label: 'Date', minWidth: 110, sortValue: (r) => r.date },
    { key: 'party', label: 'Party', minWidth: 140, render: (row) => row.party },
    { key: 'warehouse_name', label: 'Warehouse', minWidth: 120, render: (row) => row.warehouse_name || "-" },
    {
      key: 'total', label: 'Total', minWidth: 110, sortValue: (r) => Number(r.total) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>₹{formatMoney(row.total)}</Typography>,
    },
    {
      key: 'paid', label: 'Paid', minWidth: 110, sortValue: (r) => Number(r.paid) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'success.main' }}>₹{formatMoney(row.paid)}</Typography>,
    },
    {
      key: 'outstanding', label: 'Outstanding', minWidth: 120, sortValue: (r) => Number(r.outstanding) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>₹{formatMoney(row.outstanding)}</Typography>,
    },
    {
      key: 'status', label: 'Status', minWidth: 100,
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          sx={{ ...(statusChipSx[row.status] || statusChipSx.unpaid), fontWeight: 700 }}
        />
      ),
    },
    {
      key: 'action', label: 'Action', minWidth: 130, align: 'right',
      render: (row) => (
        row.outstanding > 0 && canCreate("payments") ? (
          <Button variant="contained" size="small" onClick={() => openPaymentFor(row, row.type)} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
            Pay
          </Button>
        ) : (
          <Typography variant="body2" sx={{ color: 'success.main', display: 'inline-flex', alignItems: 'center', gap: .75 }}>
            <i className="fas fa-check-circle" aria-hidden="true" /> Paid
          </Typography>
        )
      ),
    },
  ];

  const activeColumns = activeTab === "payments" ? paymentColumns : outstandingColumns;
  const activeRows = activeTab === "payments" ? rows : outstanding;
  const activeTotal = activeTab === "payments" ? total : outstandingTotal;

  const sortedRows = (() => {
    if (!sort.field) return activeRows;
    const column = activeColumns.find(c => c.key === sort.field);
    if (!column?.sortValue) return activeRows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...activeRows].sort((a, b) => {
      const av = column.sortValue(a);
      const bv = column.sortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  })();

  const handleLocalSort = (field) => {
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const summaryCards = [
    { label: 'Today Received', value: summary?.today_received, color: '#118d57', bg: '#dbf5e9' },
    { label: 'Today Paid', value: summary?.today_paid, color: '#b76e00', bg: '#fff4d6' },
    { label: 'Month Received', value: summary?.month_received, color: '#006c9c', bg: '#caf4ff' },
    { label: 'Month Paid', value: summary?.month_paid, color: '#637381', bg: '#f4f6f8' },
    { label: 'Outstanding Sales', value: summary?.total_outstanding_sales, color: '#b71d18', bg: '#ffe4de' },
    { label: 'Outstanding Purchases', value: summary?.total_outstanding_purchases, color: '#b71d18', bg: '#ffe4de' },
  ];

  if (!canViewPayments) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view payments.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>Payments</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Record payments and track outstanding amounts</Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        {summaryCards.map((card) => (
          <Card key={card.label} sx={{ ...metricCardSx, bgcolor: card.bg }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: .5 }}>{card.label}</Typography>
              <Typography variant="h5" sx={{ color: card.color, fontWeight: 700 }}>₹{formatMoney(card.value)}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card sx={pageCardSx}>
        <Box sx={{ px: 3, pt: 2, display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, k) => { if (k) setActiveTab(k); }}
            sx={{
              minHeight: 42,
              '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontWeight: 600 },
            }}
          >
            <Tab value="payments" label="Payments" />
            <Tab value="outstanding-sales" label="Outstanding Sales" />
            <Tab value="outstanding-purchases" label="Outstanding Purchases" />
          </Tabs>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              placeholder={activeTab === "payments" ? "Search payments..." : "Search..."}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-search" style={{ fontSize: 13 }} aria-hidden="true" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {activeTab === "payments" && canCreate("payments") && (
              <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                Record Payment
              </Button>
            )}
            {activeTab !== "payments" && (
              <>
                <Button variant="contained" color="success" onClick={downloadOutstandingExcel} disabled={loading} startIcon={<i className="fas fa-file-excel" aria-hidden="true" />}>
                  Excel
                </Button>
                <Button variant="contained" color="error" onClick={downloadOutstandingPDF} disabled={loading} startIcon={<i className="fas fa-file-pdf" aria-hidden="true" />}>
                  PDF
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {activeTab !== "payments" && (
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
              <TextField
                size="small"
                type="date"
                label="From"
                value={outstandingFilters.from}
                onChange={(e) => setOutstandingFilters((f) => ({ ...f, from: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={outstandingFilters.to}
                onChange={(e) => setOutstandingFilters((f) => ({ ...f, to: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={outstandingFilters.status}
                  onChange={(e) => setOutstandingFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value=""><em>All Status</em></MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Warehouse</InputLabel>
                <Select
                  label="Warehouse"
                  value={outstandingFilters.warehouse_id === '' ? '' : String(outstandingFilters.warehouse_id)}
                  onChange={(e) => setOutstandingFilters((f) => ({ ...f, warehouse_id: e.target.value }))}
                >
                  <MenuItem value=""><em>All Warehouses</em></MenuItem>
                  {warehouses.map((w) => (
                    <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {activeTab === "outstanding-sales" ? (
                <FormControl size="small" fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    label="Customer"
                    value={outstandingFilters.customer_id === '' ? '' : String(outstandingFilters.customer_id)}
                    onChange={(e) => setOutstandingFilters((f) => ({ ...f, customer_id: e.target.value }))}
                  >
                    <MenuItem value=""><em>All Customers</em></MenuItem>
                    {customers.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl size="small" fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    label="Vendor"
                    value={outstandingFilters.vendor_id === '' ? '' : String(outstandingFilters.vendor_id)}
                    onChange={(e) => setOutstandingFilters((f) => ({ ...f, vendor_id: e.target.value }))}
                  >
                    <MenuItem value=""><em>All Vendors</em></MenuItem>
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={String(v.id)}>{v.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        )}

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1000 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {activeColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ ...headerCellSx, minWidth: column.minWidth, width: column.width }}
                  >
                    {column.sortValue ? (
                      <TableSortLabel
                        active={sort.field === column.key}
                        direction={sort.field === column.key ? sort.dir : 'asc'}
                        onClick={() => handleLocalSort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={Math.max(activeColumns.length, 1)} align="center" sx={{ py: 7 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No data found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try adjusting your filters or check back later
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedRows.map((row, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'rgba(6,40,73,.035)' },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {activeColumns.map((column) => (
                    <TableCell
                      key={`${row.id ?? idx}-${column.key}`}
                      align={column.align || 'left'}
                      sx={bodyCellSx}
                    >
                      {column.render ? column.render(row) : column.sortValue?.(row) ?? '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={activeTotal}
          page={Math.max(table.page - 1, 0)}
          rowsPerPage={table.perPage}
          rowsPerPageOptions={[10, 20, 50, 100, 200]}
          onPageChange={(event, page) => {
            const nextPage = page + 1;
            if (nextPage !== table.page) dispatch({ type: 'PAGE', page: nextPage });
          }}
          onRowsPerPageChange={(event) => {
            const nextSize = Number(event.target.value);
            if (nextSize !== table.perPage) dispatch({ type: 'PER_PAGE', perPage: nextSize });
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>

      {/* Record Payment Dialog */}
      <Dialog
        open={show}
        onClose={(event, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setShow(false); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingId ? "Edit Payment" : "Record Payment"}</Typography>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: .5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select
                label="Payment Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, sale_id: "", purchase_id: "" })}
              >
                <MenuItem value="sale">Payment Received (from Customer)</MenuItem>
                <MenuItem value="purchase">Payment Paid (to Vendor)</MenuItem>
              </Select>
            </FormControl>

            {form.type === "sale" ? (
              <FormControl size="small" fullWidth required>
                <InputLabel>Select Invoice</InputLabel>
                <Select
                  label="Select Invoice"
                  value={form.sale_id === '' ? '' : String(form.sale_id)}
                  onChange={(e) => setForm({ ...form, sale_id: e.target.value })}
                >
                  <MenuItem value=""><em>-- Select Invoice --</em></MenuItem>
                  {sales.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>#{s.invoice_number} - {s.customer?.name} - ₹{formatMoney(s.grand_total)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl size="small" fullWidth required>
                <InputLabel>Select Purchase Bill</InputLabel>
                <Select
                  label="Select Purchase Bill"
                  value={form.purchase_id === '' ? '' : String(form.purchase_id)}
                  onChange={(e) => setForm({ ...form, purchase_id: e.target.value })}
                >
                  <MenuItem value=""><em>-- Select Bill --</em></MenuItem>
                  {purchases.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>#{p.bill_number} - {p.vendor?.name} - ₹{formatMoney(p.grand_total)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                size="small"
                type="number"
                label="Amount (₹)"
                required
                inputProps={{ step: '0.01' }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  label="Payment Method"
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="date"
                label="Payment Date"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                label="Reference Number"
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                placeholder="Cheque/UTR number"
              />
            </Box>

            <TextField
              size="small"
              label="Notes"
              multiline
              rows={2}
              fullWidth
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      <WhatsAppSendModal
        show={waShow}
        onHide={() => setWaShow(false)}
        toNumber={waTarget?.sale?.customer?.phone || waTarget?.purchase?.vendor?.phone}
        toName={waTarget?.sale?.customer?.name || waTarget?.purchase?.vendor?.name}
        contextType="payment"
        contextId={waTarget?.id}
      />
    </Box>
  );
}
