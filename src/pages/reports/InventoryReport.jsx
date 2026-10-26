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
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../api";
import { canView } from "../../utils/permissions";

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

const headCellSx = {
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  px: 2,
  py: 1.5,
};

const initialDates = () => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return {
    from: lastMonth.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

const EMPTY_FILTERS = { stock_status: "all", from: "", to: "" };

const EMPTY_SUMMARY = {
  total_items: 0,
  total_stock_value: 0,
  total_stock_quantity: 0,
  in_stock_count: 0,
  low_stock_count: 0,
  out_of_stock_count: 0,
};

const chipColorMap = {
  success: "success",
  warning: "warning",
  danger: "error",
  error: "error",
  info: "info",
  primary: "primary",
  secondary: "default",
};

function StatCard({ label, value, icon, color, background }) {
  return (
    <Card sx={{ ...cardSx, height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: background, color, flexShrink: 0 }}>
            <i className={icon} style={{ fontSize: 18 }} aria-hidden="true" />
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

export default function InventoryReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(() => ({
    stock_status: "all",
    ...initialDates(),
  }));

  const canViewReport = canView("inventory-report");

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (f.stock_status && f.stock_status !== "all") params.stock_status = f.stock_status;
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;

      const res = await api.get("/reports/inventory", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || EMPTY_SUMMARY);
    } catch (err) {
      console.error("Failed to load inventory report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canViewReport]);

  useEffect(() => {
    if (canViewReport) {
      loadData(EMPTY_FILTERS);
    }
  }, [canViewReport, loadData]);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData(filters);
  };

  const handleDownloadPDF = () => {
    if (loading) return;

    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.stock_status) params.stock_status = filters.stock_status;

    api
      .get("/reports/inventory/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "inventory-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download inventory report PDF:", err);
      });
  };

  const handleClear = () => {
    const reset = {
      stock_status: "all",
      ...initialDates(),
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

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
          Inventory Report
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Stock levels, valuation and movement summary
        </Typography>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleFilter}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Stock Status</InputLabel>
                <Select
                  label="Stock Status"
                  value={filters.stock_status}
                  onChange={(e) => setFilters({ ...filters, stock_status: e.target.value })}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="in_stock">In Stock</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="out">Out of Stock</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="date"
                size="small"
                label="Movement From"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="Movement To"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
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
                startIcon={<i className="fas fa-file-pdf" aria-hidden="true" />}
              >
                PDF
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard label="Total Items" value={summary.total_items} icon="fas fa-boxes-stacked" color="#062849" background="#eaf0f6" />
        <StatCard label="In Stock" value={summary.in_stock_count} icon="fas fa-circle-check" color="#118d57" background="#dbf5e9" />
        <StatCard label="Low Stock" value={summary.low_stock_count} icon="fas fa-triangle-exclamation" color="#b76e00" background="#fff4d6" />
        <StatCard label="Out of Stock" value={summary.out_of_stock_count} icon="fas fa-ban" color="#b71d18" background="#ffe4de" />
        <StatCard label="Total Stock Qty" value={Number(summary.total_stock_quantity || 0).toFixed(3)} icon="fas fa-cubes" color="#006c9c" background="#caf4ff" />
        <StatCard label="Stock Value" value={`₹${formatMoney(summary.total_stock_value)}`} icon="fas fa-coins" color="#6528e8" background="#f1ebfd" />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Item Stock Details
          </Typography>
        </Box>
        <Divider />
        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={headCellSx}>Item</TableCell>
                <TableCell sx={headCellSx}>SKU</TableCell>
                <TableCell sx={headCellSx}>Unit</TableCell>
                <TableCell align="right" sx={headCellSx}>Current Stock</TableCell>
                <TableCell align="right" sx={headCellSx}>Min Stock</TableCell>
                <TableCell align="right" sx={headCellSx}>Sale Price</TableCell>
                <TableCell align="right" sx={headCellSx}>Stock Value</TableCell>
                <TableCell align="center" sx={headCellSx}>Purchases (Period)</TableCell>
                <TableCell align="center" sx={headCellSx}>Sales (Period)</TableCell>
                <TableCell align="center" sx={headCellSx}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ color: 'text.secondary', py: 4 }}>Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ color: 'text.secondary', py: 4 }}>No items found</TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ px: 2, fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell sx={{ px: 2 }}><Chip label={item.sku} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ px: 2, color: 'text.secondary' }}>{item.unit}</TableCell>
                    <TableCell align="right" sx={{ px: 2, color: 'info.main', fontWeight: 600 }}>{Number(item.current_stock || 0).toFixed(3)}</TableCell>
                    <TableCell align="right" sx={{ px: 2, color: 'text.secondary' }}>{Number(item.min_stock || 0).toFixed(3)}</TableCell>
                    <TableCell align="right" sx={{ px: 2 }}>₹{formatMoney(item.sale_price)}</TableCell>
                    <TableCell align="right" sx={{ px: 2, color: 'success.main', fontWeight: 700 }}>₹{formatMoney(item.stock_value)}</TableCell>
                    <TableCell align="center" sx={{ px: 2, color: 'success.main' }}>
                      {item.purchases_in_period > 0 ? '+' + Number(item.purchases_in_period).toFixed(3) : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ px: 2, color: 'error.main' }}>
                      {item.sales_in_period > 0 ? '-' + Number(item.sales_in_period).toFixed(3) : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ px: 2 }}>
                      <Chip
                        label={item.status}
                        size="small"
                        color={chipColorMap[item.status_color] || "default"}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
