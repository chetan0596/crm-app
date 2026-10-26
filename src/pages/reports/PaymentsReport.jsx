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
    "Type",
    "Invoice/Bill",
    "Party",
    "Method",
    "Reference",
    "Amount",
    "Notes",
  ];

  const lines = [header, ...rows.map(r => ([
    r.payment_date,
    r.type,
    r.invoice_number,
    r.party_name,
    r.payment_method,
    r.reference_number,
    r.amount,
    r.notes,
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

const METHODS = ["cash", "cheque", "bank_transfer", "upi", "card", "online"];

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
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: firstDay.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

const EMPTY_SUMMARY = { total_received: 0, total_paid: 0, net: 0, count: 0 };

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

export default function PaymentsReport() {
  const canViewReport = canView("payments-report");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [filters, setFilters] = useState(() => ({
    ...initialDates(),
    type: "",
    payment_method: "",
  }));

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;
    setLoading(true);
    try {
      const params = {};
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;
      if (f.type) params.type = f.type;
      if (f.payment_method) params.payment_method = f.payment_method;

      const res = await api.get("/reports/payments", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || EMPTY_SUMMARY);
    } catch {
      setData([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [canViewReport]);

  const handleDownloadPDF = async () => {
    if (loading || pdfLoading) return;
    setPdfLoading(true);
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.type) params.type = filters.type;
    if (filters.payment_method) params.payment_method = filters.payment_method;

    try {
      const res = await api.get("/reports/payments/pdf", { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "payments-report.pdf";
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

  const handleDownloadCSV = () => {
    if (csvLoading) return;
    setCsvLoading(true);
    setTimeout(() => {
      downloadCsv("payments-report.csv", data);
      setCsvLoading(false);
    }, 100);
  };

  const handleClear = () => {
    setFilters({
      ...initialDates(),
      type: "",
      payment_method: "",
    });
  };

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
          Payments Report
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          All received and paid payments with filters
        </Typography>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); loadData(filters); }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
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
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  <MenuItem value="sale">Received</MenuItem>
                  <MenuItem value="purchase">Paid</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  label="Method"
                  value={filters.payment_method}
                  onChange={(e) => setFilters(f => ({ ...f, payment_method: e.target.value }))}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  {METHODS.map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
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
        <StatCard label="Received" value={`₹${formatMoney(summary.total_received)}`} icon="fas fa-arrow-trend-up" color="#118d57" background="#dbf5e9" />
        <StatCard label="Paid" value={`₹${formatMoney(summary.total_paid)}`} icon="fas fa-arrow-trend-down" color="#b71d18" background="#ffe4de" />
        <StatCard label="Net" value={`₹${formatMoney(summary.net)}`} icon="fas fa-scale-balanced" color="#062849" background="#eaf0f6" />
        <StatCard label="Count" value={summary.count} icon="fas fa-receipt" color="#6528e8" background="#f1ebfd" />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Payments
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
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={headCellSx}>Date</TableCell>
                <TableCell sx={headCellSx}>Type</TableCell>
                <TableCell sx={headCellSx}>Invoice/Bill</TableCell>
                <TableCell sx={headCellSx}>Party</TableCell>
                <TableCell sx={headCellSx}>Method</TableCell>
                <TableCell sx={headCellSx}>Reference</TableCell>
                <TableCell align="right" sx={headCellSx}>Amount</TableCell>
                <TableCell sx={headCellSx}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 4 }}>Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 4 }}>No data</TableCell>
                </TableRow>
              ) : (
                data.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ px: 2 }}>{r.payment_date}</TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip
                        label={r.type === "sale" ? "Received" : "Paid"}
                        size="small"
                        color={r.type === "sale" ? "success" : "warning"}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>{r.invoice_number}</TableCell>
                    <TableCell sx={{ px: 2 }}>{r.party_name}</TableCell>
                    <TableCell sx={{ px: 2, textTransform: 'capitalize' }}>{r.payment_method}</TableCell>
                    <TableCell sx={{ px: 2 }}>{r.reference_number || "-"}</TableCell>
                    <TableCell align="right" sx={{ px: 2, fontWeight: 700 }}>₹{formatMoney(r.amount)}</TableCell>
                    <TableCell sx={{ px: 2, color: 'text.secondary' }}>
                      <Typography variant="caption" color="text.secondary">{r.notes || ""}</Typography>
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
