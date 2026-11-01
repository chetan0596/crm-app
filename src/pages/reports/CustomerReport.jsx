import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
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

const EMPTY_FILTERS = { from: "", to: "", customer_id: "", min_sales: "" };

const EMPTY_SUMMARY = {
  total_customers: 0,
  total_sales: 0,
  total_transactions: 0,
  avg_transaction_value: 0,
};

function StatCard({ label, value, icon, color, background }) {
  return (
    <Card sx={{ ...cardSx, height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: background, color, flexShrink: 0 }}>
            <Iconify icon={icon} width={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: .25 }}>
              {label}
            </Typography>
            <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function CustomerReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(() => ({
    ...initialDates(),
    customer_id: "",
    min_sales: "",
  }));

  const canViewReport = canView("customer-report");

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;
      if (f.customer_id) params.customer_id = f.customer_id;
      if (f.min_sales) params.min_sales = f.min_sales;

      const res = await api.get("/reports/customers", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || EMPTY_SUMMARY);
    } catch (err) {
      console.error("Failed to load customer report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canViewReport]);

  const loadCustomers = useCallback(async () => {
    try {
      const custRes = await api.get("/customers", { params: { perPage: 1000 } });
      setCustomers(toArray(custRes.data));
    } catch {
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    if (canViewReport) {
      loadData(EMPTY_FILTERS);
      loadCustomers();
    }
  }, [canViewReport, loadData, loadCustomers]);

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
    if (filters.min_sales) params.min_sales = filters.min_sales;

    api
      .get("/reports/customers/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "customer-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download customer report PDF:", err);
      });
  };

  const handleClear = () => {
    const reset = {
      ...initialDates(),
      customer_id: "",
      min_sales: "",
    };
    setFilters(reset);
    loadData(reset);
  };

  if (!canViewReport) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view this report.
      </Alert>
    );
  }

  const columns = [
    {
      key: 'customer_name', label: 'Customer', sortable: true, accessor: (c) => c.customer_name ?? '', minWidth: 180,
      render: (customer) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#eaf0f6', color: '#062849', fontSize: 12, fontWeight: 700 }}>
            {(customer.customer_name || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{customer.customer_name}</Typography>
            <Typography variant="caption" color="text.secondary">#{customer.customer_id}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'contact', label: 'Contact', sortable: true, accessor: (c) => c.customer_phone ?? c.customer_email ?? '', minWidth: 140,
      render: (customer) => (
        <Box>
          <Typography variant="body2">{customer.customer_phone || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{customer.customer_email || '-'}</Typography>
        </Box>
      ),
    },
    {
      key: 'transaction_count', label: 'Transactions', align: 'center', sortable: true, accessor: (c) => Number(c.transaction_count) || 0,
      render: (customer) => <Chip label={customer.transaction_count} size="small" color="info" sx={{ fontWeight: 700 }} />,
    },
    {
      key: 'total_sales', label: 'Total Sales', align: 'right', sortable: true, accessor: (c) => Number(c.total_sales) || 0,
      render: (customer) => <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>₹{formatMoney(customer.total_sales)}</Typography>,
    },
    {
      key: 'avg_order_value', label: 'Avg Order', align: 'right', sortable: true, accessor: (c) => Number(c.avg_order_value) || 0,
      render: (customer) => `₹${formatMoney(customer.avg_order_value)}`,
    },
    {
      key: 'last_purchase_date', label: 'Last Purchase', sortable: true, accessor: (c) => c.last_purchase_date ?? '',
      render: (customer) => (customer.last_purchase_date ? (
        <Chip label={customer.last_purchase_date} size="small" variant="outlined" />
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      )),
    },
    {
      key: 'top_item', label: 'Top Item', sortable: true, accessor: (c) => c.top_item?.name ?? '', minWidth: 140,
      render: (customer) => (customer.top_item ? (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.top_item.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {customer.top_item.quantity.toFixed(0)} qty | ₹{formatMoney(customer.top_item.amount)}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      )),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
          Customer Report
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Customer sales analysis and top customers
        </Typography>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleFilter}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
              <TextField
                type="date"
                size="small"
                label="From Date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="To Date"
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
              <TextField
                type="number"
                size="small"
                label="Min Sales (₹)"
                placeholder="0"
                value={filters.min_sales}
                onChange={(e) => setFilters({ ...filters, min_sales: e.target.value })}
                fullWidth
              />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Loading..." : "Apply Filters"}
              </Button>
              <Button type="button" variant="outlined" onClick={handleClear} disabled={loading}>
                Clear
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={handleDownloadPDF}
                disabled={loading}
                startIcon={<Iconify icon="fa6-solid:file-pdf" width={16} />}
              >
                PDF
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard label="Total Customers" value={summary.total_customers} icon="fa6-solid:users" color="#062849" background="#eaf0f6" />
        <StatCard label="Total Sales" value={`₹${formatMoney(summary.total_sales)}`} icon="fa6-solid:indian-rupee-sign" color="#118d57" background="#dbf5e9" />
        <StatCard label="Total Transactions" value={summary.total_transactions} icon="fa6-solid:receipt" color="#006c9c" background="#caf4ff" />
        <StatCard label="Avg Transaction" value={`₹${formatMoney(summary.avg_transaction_value)}`} icon="fa6-solid:chart-line" color="#6528e8" background="#f1ebfd" />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Customer Sales Details
          </Typography>
        </Box>
        <Divider />
        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={data}
          rowKey="customer_id"
          loading={loading}
          emptyMessage="No customers found"
          emptyHint="Try adjusting the report filters"
          minWidth={900}
          defaultPageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>
    </Box>
  );
}
