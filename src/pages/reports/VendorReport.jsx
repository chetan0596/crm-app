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

const EMPTY_FILTERS = { from: "", to: "", vendor_id: "", min_purchases: "" };

const EMPTY_SUMMARY = {
  total_vendors: 0,
  total_purchases: 0,
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

export default function VendorReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(() => ({
    ...initialDates(),
    vendor_id: "",
    min_purchases: "",
  }));

  const canViewReport = canView("vendor-report");

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;
      if (f.vendor_id) params.vendor_id = f.vendor_id;
      if (f.min_purchases) params.min_purchases = f.min_purchases;

      const res = await api.get("/reports/vendors", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || EMPTY_SUMMARY);
    } catch (err) {
      console.error("Failed to load vendor report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canViewReport]);

  const loadVendors = useCallback(async () => {
    try {
      const vendRes = await api.get("/vendors", { params: { perPage: 1000 } });
      setVendors(toArray(vendRes.data));
    } catch {
      setVendors([]);
    }
  }, []);

  useEffect(() => {
    if (canViewReport) {
      loadData(EMPTY_FILTERS);
      loadVendors();
    }
  }, [canViewReport, loadData, loadVendors]);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData(filters);
  };

  const handleDownloadPDF = () => {
    if (loading) return;

    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.vendor_id) params.vendor_id = filters.vendor_id;
    if (filters.min_purchases) params.min_purchases = filters.min_purchases;

    api
      .get("/reports/vendors/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "vendor-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download vendor report PDF:", err);
      });
  };

  const handleClear = () => {
    const reset = {
      ...initialDates(),
      vendor_id: "",
      min_purchases: "",
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
      key: 'vendor_name', label: 'Vendor', sortable: true, accessor: (v) => v.vendor_name ?? '', minWidth: 180,
      render: (vendor) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#dbf5e9', color: '#118d57', fontSize: 12, fontWeight: 700 }}>
            {(vendor.vendor_name || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{vendor.vendor_name}</Typography>
            <Typography variant="caption" color="text.secondary">#{vendor.vendor_id}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'contact', label: 'Contact', sortable: true, accessor: (v) => v.vendor_phone ?? v.vendor_email ?? '', minWidth: 140,
      render: (vendor) => (
        <Box>
          <Typography variant="body2">{vendor.vendor_phone || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{vendor.vendor_email || '-'}</Typography>
        </Box>
      ),
    },
    {
      key: 'transaction_count', label: 'Transactions', align: 'center', sortable: true, accessor: (v) => Number(v.transaction_count) || 0,
      render: (vendor) => <Chip label={vendor.transaction_count} size="small" color="info" sx={{ fontWeight: 700 }} />,
    },
    {
      key: 'total_purchases', label: 'Total Purchases', align: 'right', sortable: true, accessor: (v) => Number(v.total_purchases) || 0,
      render: (vendor) => <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>₹{formatMoney(vendor.total_purchases)}</Typography>,
    },
    {
      key: 'avg_order_value', label: 'Avg Order', align: 'right', sortable: true, accessor: (v) => Number(v.avg_order_value) || 0,
      render: (vendor) => `₹${formatMoney(vendor.avg_order_value)}`,
    },
    {
      key: 'last_purchase_date', label: 'Last Purchase', sortable: true, accessor: (v) => v.last_purchase_date ?? '',
      render: (vendor) => (vendor.last_purchase_date ? (
        <Chip label={vendor.last_purchase_date} size="small" variant="outlined" />
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      )),
    },
    {
      key: 'top_item', label: 'Top Item', sortable: true, accessor: (v) => v.top_item?.name ?? '', minWidth: 140,
      render: (vendor) => (vendor.top_item ? (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{vendor.top_item.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {vendor.top_item.quantity.toFixed(0)} qty | ₹{formatMoney(vendor.top_item.amount)}
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
          Vendor Report
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Vendor purchase analysis and top vendors
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
                <InputLabel>Vendor</InputLabel>
                <Select
                  label="Vendor"
                  value={filters.vendor_id}
                  onChange={(e) => setFilters({ ...filters, vendor_id: e.target.value })}
                >
                  <MenuItem value=""><em>All Vendors</em></MenuItem>
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="number"
                size="small"
                label="Min Purchases (₹)"
                placeholder="0"
                value={filters.min_purchases}
                onChange={(e) => setFilters({ ...filters, min_purchases: e.target.value })}
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
        <StatCard label="Total Vendors" value={summary.total_vendors} icon="fa6-solid:truck" color="#062849" background="#eaf0f6" />
        <StatCard label="Total Purchases" value={`₹${formatMoney(summary.total_purchases)}`} icon="fa6-solid:cart-shopping" color="#118d57" background="#dbf5e9" />
        <StatCard label="Total Transactions" value={summary.total_transactions} icon="fa6-solid:receipt" color="#006c9c" background="#caf4ff" />
        <StatCard label="Avg Transaction" value={`₹${formatMoney(summary.avg_transaction_value)}`} icon="fa6-solid:chart-line" color="#6528e8" background="#f1ebfd" />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Vendor Purchase Details
          </Typography>
        </Box>
        <Divider />
        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={data}
          rowKey="vendor_id"
          loading={loading}
          emptyMessage="No vendors found"
          emptyHint="Try adjusting the report filters"
          minWidth={900}
          defaultPageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>
    </Box>
  );
}
