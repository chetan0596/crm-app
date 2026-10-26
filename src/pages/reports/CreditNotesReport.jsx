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
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const downloadCsv = (filename, rows) => {
  const escape = (val) => {
    const s = String(val ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const header = [
    "Date",
    "CN #",
    "Invoice",
    "Customer",
    "Warehouse",
    "Type",
    "Status",
    "Subtotal",
    "Discount",
    "Tax",
    "Grand Total",
  ];

  const lines = [header, ...rows.map(r => ([
    r.credit_note_date,
    r.credit_note_number,
    r.invoice_number,
    r.customer_name,
    r.warehouse_name,
    r.type,
    r.status,
    r.subtotal,
    r.discount,
    r.tax,
    r.grand_total,
  ]))]
    .map(cols => cols.map(escape).join(","))
    .join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

const statusChipColor = (s) => (s === "posted" ? "success" : "warning");
const typeChipColor = (t) => (t === "return" ? "info" : t === "discount" ? "primary" : "error");

const initialDates = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: firstDay.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

const EMPTY_SUMMARY = { count: 0, grand_total: 0, draft_count: 0, posted_count: 0 };

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

export default function CreditNotesReport() {
  const canViewReport = canView("credit-notes-report");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState(() => ({
    ...initialDates(),
    status: "",
    type: "",
    warehouse_id: "",
  }));

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;
    setLoading(true);
    try {
      const params = {};
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;
      if (f.status) params.status = f.status;
      if (f.type) params.type = f.type;
      if (f.warehouse_id) params.warehouse_id = f.warehouse_id;

      const res = await api.get("/reports/credit-notes", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || summary);
    } catch {
      setData([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [canViewReport, summary]);

  const loadWarehouses = useCallback(async () => {
    try {
      const warehouseRes = await api.get("/warehouses/list");
      setWarehouses(toArray(warehouseRes.data));
    } catch {
      setWarehouses([]);
    }
  }, []);

  const handleDownloadCSV = () => {
    if (csvLoading) return;
    setCsvLoading(true);
    setTimeout(() => {
      downloadCsv("credit-notes-report.csv", data);
      setCsvLoading(false);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    if (loading || pdfLoading) return;
    setPdfLoading(true);
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;

    try {
      const res = await api.get("/reports/credit-notes/pdf", { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "credit-notes-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClear = () => {
    setFilters({
      ...initialDates(),
      status: "",
      type: "",
      warehouse_id: "",
    });
  };

  useEffect(() => {
    if (!canViewReport) return;
    loadWarehouses();
  }, [canViewReport, loadWarehouses]);

  useEffect(() => {
    if (!canViewReport) return;
    if (!filters.from || !filters.to) return;
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewReport, filters.from, filters.to]);

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
          Credit Notes Report
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Customer returns/discount adjustments summary
        </Typography>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); loadData(filters); }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
              <TextField
                type="date"
                size="small"
                label="From"
                value={filters.from}
                onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="To"
                value={filters.to}
                onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  <MenuItem value="return">Return</MenuItem>
                  <MenuItem value="discount">Discount</MenuItem>
                  <MenuItem value="damaged">Damaged</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Warehouse</InputLabel>
                <Select
                  label="Warehouse"
                  value={filters.warehouse_id}
                  onChange={(e) => setFilters(f => ({ ...f, warehouse_id: e.target.value }))}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Loading..." : "Apply Filters"}
              </Button>
              <Button type="button" variant="outlined" disabled={loading} onClick={handleClear}>
                Clear
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard label="Count" value={summary.count} icon="fas fa-file-lines" color="#062849" background="#eaf0f6" />
        <StatCard label="Grand Total" value={`₹${formatMoney(summary.grand_total)}`} icon="fas fa-coins" color="#6528e8" background="#f1ebfd" />
        <StatCard label="Draft" value={summary.draft_count} icon="fas fa-file-pen" color="#b76e00" background="#fff4d6" />
        <StatCard label="Posted" value={summary.posted_count} icon="fas fa-circle-check" color="#118d57" background="#dbf5e9" />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Credit Notes
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={loading || data.length === 0 || csvLoading}
              onClick={handleDownloadCSV}
              startIcon={<i className="fas fa-download" aria-hidden="true" />}
            >
              {csvLoading ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={loading || data.length === 0 || pdfLoading}
              onClick={handleDownloadPDF}
              startIcon={<i className="fas fa-file-pdf" aria-hidden="true" />}
            >
              {pdfLoading ? "Downloading..." : "Download PDF"}
            </Button>
          </Stack>
        </Box>
        <Divider />
        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={headCellSx}>Date</TableCell>
                <TableCell sx={headCellSx}>CN #</TableCell>
                <TableCell sx={headCellSx}>Invoice</TableCell>
                <TableCell sx={headCellSx}>Customer</TableCell>
                <TableCell sx={headCellSx}>Warehouse</TableCell>
                <TableCell sx={headCellSx}>Type</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell align="right" sx={headCellSx}>Subtotal</TableCell>
                <TableCell align="right" sx={headCellSx}>Discount</TableCell>
                <TableCell align="right" sx={headCellSx}>Tax</TableCell>
                <TableCell align="right" sx={headCellSx}>Grand Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ color: 'text.secondary', py: 4 }}>Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ color: 'text.secondary', py: 4 }}>No data</TableCell>
                </TableRow>
              ) : (
                data.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ px: 2 }}>{r.credit_note_date}</TableCell>
                    <TableCell sx={{ px: 2, fontWeight: 700 }}>{r.credit_note_number}</TableCell>
                    <TableCell sx={{ px: 2 }}>{r.invoice_number}</TableCell>
                    <TableCell sx={{ px: 2 }}>{r.customer_name}</TableCell>
                    <TableCell sx={{ px: 2 }}>{r.warehouse_name || '-'}</TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip label={r.type} size="small" color={typeChipColor(r.type)} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip label={r.status} size="small" color={statusChipColor(r.status)} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 2 }}>₹{formatMoney(r.subtotal)}</TableCell>
                    <TableCell align="right" sx={{ px: 2, color: 'error.main' }}>-₹{formatMoney(r.discount)}</TableCell>
                    <TableCell align="right" sx={{ px: 2 }}>₹{formatMoney(r.tax)}</TableCell>
                    <TableCell align="right" sx={{ px: 2, fontWeight: 700 }}>₹{formatMoney(r.grand_total)}</TableCell>
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
