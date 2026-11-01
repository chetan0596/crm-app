import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../api";
import { canView } from "../../utils/permissions";
import { Iconify } from "../../components/iconify";
import { DataTable } from "../../components/data-table";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const dateRanges = {
  today: () => {
    const d = new Date().toISOString().split("T")[0];
    return { from: d, to: d };
  },
  thisWeek: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  },
  lastMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: start.toISOString().split("T")[0], to: end.toISOString().split("T")[0] };
  },
  thisYear: () => {
    const now = new Date();
    return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().split("T")[0] };
  },
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const initialDates = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: firstDay.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

const EMPTY_FILTERS = {
  from: "",
  to: "",
  customer_id: "",
  item_id: "",
  warehouse_id: "",
  group_by: "date",
};

const EMPTY_SUMMARY = {
  total_sales: 0,
  total_quantity: 0,
  total_discount: 0,
  total_tax: 0,
  grand_total: 0,
};

const QUICK_RANGES = [
  ["today", "Today"],
  ["thisWeek", "This Week"],
  ["thisMonth", "This Month"],
  ["lastMonth", "Last Month"],
  ["thisYear", "This Year"],
];

function StatCard({ label, value, icon, color, background, dark }) {
  return (
    <Card sx={{ ...cardSx, height: '100%', ...(dark ? { bgcolor: '#062849', borderColor: '#062849' } : {}) }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: background, color, flexShrink: 0 }}>
            <Iconify icon={icon} width={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: dark ? 'rgba(255,255,255,.7)' : 'text.secondary', mb: .25 }}>
              {label}
            </Typography>
            <Typography variant="h6" sx={{ color: dark ? '#fff' : color, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function SalesReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [filters, setFilters] = useState(() => ({
    ...initialDates(),
    customer_id: "",
    item_id: "",
    warehouse_id: "",
    group_by: "date",
  }));

  const canViewReport = canView("sales-report");

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;
      if (f.customer_id) params.customer_id = f.customer_id;
      if (f.item_id) params.item_id = f.item_id;
      if (f.warehouse_id) params.warehouse_id = f.warehouse_id;
      if (f.group_by) params.group_by = f.group_by;

      const res = await api.get("/reports/sales", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || EMPTY_SUMMARY);
    } catch (err) {
      console.error("Failed to load sales report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canViewReport]);

  const loadDropdowns = useCallback(async () => {
    const [itemsRes, custRes, warehouseRes] = await Promise.allSettled([
      api.get("/items", { params: { perPage: 1000 } }),
      api.get("/customers", { params: { perPage: 1000 } }),
      api.get("/warehouses/list"),
    ]);
    if (itemsRes.status === "fulfilled") setItems(toArray(itemsRes.value.data));
    if (custRes.status === "fulfilled") setCustomers(toArray(custRes.value.data));
    if (warehouseRes.status === "fulfilled") setWarehouses(toArray(warehouseRes.value.data));
  }, []);

  useEffect(() => {
    if (canViewReport) {
      loadData(EMPTY_FILTERS);
      loadDropdowns();
    }
  }, [canViewReport, loadData, loadDropdowns]);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData(filters);
  };

  const handleDownloadPDF = () => {
    if (loading) return;

    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.customer_id) params.customer_id = filters.customer_id;
    if (filters.item_id) params.item_id = filters.item_id;
    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
    if (filters.group_by) params.group_by = filters.group_by;

    api
      .get("/reports/sales/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "sales-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download sales report PDF:", err);
      });
  };

  const handleClear = () => {
    const reset = {
      ...initialDates(),
      customer_id: "",
      item_id: "",
      warehouse_id: "",
      group_by: "date",
    };
    setFilters(reset);
    loadData(reset);
  };

  const applyRange = (key) => {
    const range = dateRanges[key]();
    setFilters((prev) => ({ ...prev, ...range }));
  };

  if (!canViewReport) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view this report.
      </Alert>
    );
  }

  const isGrouped = filters.group_by !== "date";

  const detailColumns = [
    {
      key: 'date', label: 'Date', sortable: true, accessor: (row) => row.date ?? '',
      render: (row) => <Typography variant="caption" color="text.secondary">{row.date}</Typography>,
    },
    {
      key: 'invoice_number', label: 'Invoice', sortable: true, accessor: (row) => row.invoice_number ?? '',
      render: (row) => <Chip label={row.invoice_number} size="small" variant="outlined" sx={{ fontWeight: 600 }} />,
    },
    {
      key: 'customer_name', label: 'Customer', sortable: true, accessor: (row) => row.customer_name ?? '', minWidth: 140,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.customer_name}</Typography>,
    },
    {
      key: 'warehouse_name', label: 'Warehouse', sortable: true, accessor: (row) => row.warehouse_name ?? '',
      render: (row) => <Typography variant="caption" color="text.secondary">{row.warehouse_name}</Typography>,
    },
    {
      key: 'item_name', label: 'Item', sortable: true, accessor: (row) => row.item_name ?? '', minWidth: 140,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.item_name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.item_sku}</Typography>
        </Box>
      ),
    },
    {
      key: 'quantity', label: 'Qty', align: 'right', sortable: true, accessor: (row) => Number(row.quantity) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>{Number(row.quantity || 0).toFixed(3)}</Typography>,
    },
    {
      key: 'rate', label: 'Rate', align: 'right', sortable: true, accessor: (row) => Number(row.rate) || 0,
      render: (row) => <Typography variant="body2" color="text.secondary">₹{formatMoney(row.rate)}</Typography>,
    },
    {
      key: 'discount', label: 'Discount', align: 'right', sortable: true, accessor: (row) => Number(row.discount) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'warning.main' }}>₹{formatMoney(row.discount)}</Typography>,
    },
    {
      key: 'tax_amount', label: 'Tax', align: 'right', sortable: true, accessor: (row) => Number(row.tax_amount) || 0,
      render: (row) => <Typography variant="body2" color="text.secondary">₹{formatMoney(row.tax_amount)}</Typography>,
    },
    {
      key: 'total', label: 'Total', align: 'right', sortable: true, accessor: (row) => Number(row.total) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>₹{formatMoney(row.total)}</Typography>,
    },
  ];

  const customerGroupColumns = [
    {
      key: 'customer_name', label: 'Customer', sortable: true, accessor: (row) => row.customer_name ?? '', minWidth: 160,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.customer_name}</Typography>,
    },
    {
      key: 'transaction_count', label: 'Transactions', align: 'center', sortable: true, accessor: (row) => Number(row.transaction_count) || 0,
      render: (row) => <Chip label={row.transaction_count} size="small" color="info" sx={{ fontWeight: 600 }} />,
    },
    {
      key: 'total_quantity', label: 'Total Qty', align: 'right', sortable: true, accessor: (row) => Number(row.total_quantity) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>{Number(row.total_quantity || 0).toFixed(3)}</Typography>,
    },
    {
      key: 'total_amount', label: 'Total Amount', align: 'right', sortable: true, accessor: (row) => Number(row.total_amount) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>₹{formatMoney(row.total_amount)}</Typography>,
    },
  ];

  const itemGroupColumns = [
    {
      key: 'item_name', label: 'Item', sortable: true, accessor: (row) => row.item_name ?? '', minWidth: 160,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.item_name}</Typography>,
    },
    {
      key: 'item_sku', label: 'SKU', sortable: true, accessor: (row) => row.item_sku ?? '',
      render: (row) => <Chip label={row.item_sku} size="small" variant="outlined" />,
    },
    {
      key: 'transaction_count', label: 'Transactions', align: 'center', sortable: true, accessor: (row) => Number(row.transaction_count) || 0,
      render: (row) => <Chip label={row.transaction_count} size="small" color="info" sx={{ fontWeight: 600 }} />,
    },
    {
      key: 'total_quantity', label: 'Total Qty', align: 'right', sortable: true, accessor: (row) => Number(row.total_quantity) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>{Number(row.total_quantity || 0).toFixed(3)}</Typography>,
    },
    {
      key: 'total_amount', label: 'Total Amount', align: 'right', sortable: true, accessor: (row) => Number(row.total_amount) || 0,
      render: (row) => <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>₹{formatMoney(row.total_amount)}</Typography>,
    },
  ];

  const columns = !isGrouped
    ? detailColumns
    : filters.group_by === "customer"
      ? customerGroupColumns
      : itemGroupColumns;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
            Sales Report
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Analyze sales by date, customer, or item
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            disabled={loading}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            startIcon={<Iconify icon="fa6-solid:download" width={16} />}
            endIcon={<Iconify icon="fa6-solid:chevron-down" width={10} />}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => { setExportAnchorEl(null); handleDownloadPDF(); }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <Iconify icon="fa6-solid:file-pdf" width={16} />
              </ListItemIcon>
              <ListItemText>Download PDF</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleFilter}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2 }}>
              <TextField
                type="date"
                size="small"
                label="From"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="To"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  label="Customer"
                  value={filters.customer_id}
                  onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
                >
                  <MenuItem value=""><em>All Customers</em></MenuItem>
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Item</InputLabel>
                <Select
                  label="Item"
                  value={filters.item_id}
                  onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}
                >
                  <MenuItem value=""><em>All Items</em></MenuItem>
                  {items.map((i) => (
                    <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Warehouse</InputLabel>
                <Select
                  label="Warehouse"
                  value={filters.warehouse_id}
                  onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
                >
                  <MenuItem value=""><em>All Warehouses</em></MenuItem>
                  {warehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select
                  label="Group By"
                  value={filters.group_by}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value })}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="item">Item</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <Iconify icon="fa6-solid:spinner" width={16} /> : <Iconify icon="fa6-solid:magnifying-glass" width={16} />}
              >
                {loading ? "Loading..." : "Apply"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleClear}
                disabled={loading}
                startIcon={<Iconify icon="fa6-solid:arrow-rotate-left" width={16} />}
              >
                Clear
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }} useFlexGap>
              {QUICK_RANGES.map(([key, label]) => (
                <Button
                  key={key}
                  variant="outlined"
                  size="small"
                  onClick={() => applyRange(key)}
                  sx={{ color: 'text.secondary' }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard label="Total Sales" value={`₹${formatMoney(summary.total_sales)}`} icon="fa6-solid:cash-register" color="#118d57" background="#dbf5e9" />
        <StatCard label="Total Quantity" value={Number(summary.total_quantity || 0).toFixed(3)} icon="fa6-solid:cubes" color="#006c9c" background="#caf4ff" />
        <StatCard label="Total Discount" value={`₹${formatMoney(summary.total_discount)}`} icon="fa6-solid:tag" color="#b76e00" background="#fff4d6" />
        <StatCard label="Total Tax" value={`₹${formatMoney(summary.total_tax)}`} icon="fa6-solid:receipt" color="#637381" background="#f1f5f9" />
        <StatCard label="Grand Total" value={`₹${formatMoney(summary.grand_total)}`} icon="fa6-solid:wallet" color="#062849" background="rgba(255,255,255,.14)" dark />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            {isGrouped ? `Grouped by ${filters.group_by.charAt(0).toUpperCase() + filters.group_by.slice(1)}` : "Transaction Details"}
          </Typography>
          <Chip label={`${data.length} records`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
        </Box>
        <Divider />
        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={data}
          loading={loading}
          emptyMessage="No data found"
          emptyHint="Try adjusting your date range or filters"
          minWidth={1000}
          defaultPageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>
    </Box>
  );
}
