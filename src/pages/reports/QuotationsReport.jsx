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
    "Quotation #",
    "Customer",
    "Status",
    "Subtotal",
    "Discount",
    "Tax",
    "Grand Total",
    "Converted Invoice",
  ];

  const lines = [header, ...rows.map(r => ([
    r.quotation_date,
    r.quotation_number,
    r.customer_name,
    r.status,
    r.subtotal,
    r.discount,
    r.tax,
    r.grand_total,
    r.converted_invoice_number,
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

const statusColor = (s) => {
  switch (s) {
    case "draft": return "default";
    case "sent": return "info";
    case "accepted": return "success";
    case "rejected": return "error";
    case "converted": return "primary";
    default: return "default";
  }
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
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: firstDay.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

const EMPTY_SUMMARY = {
  count: 0,
  grand_total: 0,
  draft_count: 0,
  sent_count: 0,
  accepted_count: 0,
  rejected_count: 0,
  converted_count: 0,
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

export default function QuotationsReport() {
  const canViewReport = canView("quotations-report");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [filters, setFilters] = useState(() => ({
    ...initialDates(),
    status: "",
  }));

  const loadData = useCallback(async (f) => {
    if (!canViewReport) return;
    setLoading(true);
    try {
      const params = {};
      if (f.from) params.from = f.from;
      if (f.to) params.to = f.to;
      if (f.status) params.status = f.status;
      const res = await api.get("/reports/quotations", { params });
      setData(toArray(res.data?.data ?? res.data));
      setSummary(res.data?.summary || summary);
    } catch {
      setData([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [canViewReport, summary]);

  const handleDownloadCSV = () => {
    if (csvLoading) return;
    setCsvLoading(true);
    setTimeout(() => {
      downloadCsv("quotations-report.csv", data);
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

    try {
      const res = await api.get("/reports/quotations/pdf", { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "quotations-report.pdf";
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

  const statusCounts = [
    { label: "Draft", value: summary.draft_count, color: statusColor("draft") },
    { label: "Sent", value: summary.sent_count, color: statusColor("sent") },
    { label: "Accepted", value: summary.accepted_count, color: statusColor("accepted") },
    { label: "Rejected", value: summary.rejected_count, color: statusColor("rejected") },
    { label: "Converted", value: summary.converted_count, color: statusColor("converted") },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
          Quotations Report
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Quotation status tracking and totals
        </Typography>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); loadData(filters); }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
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
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
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
        <StatCard label="Total Quotations" value={summary.count} icon="fas fa-file-signature" color="#062849" background="#eaf0f6" />
        <StatCard label="Grand Total" value={`₹${formatMoney(summary.grand_total)}`} icon="fas fa-coins" color="#6528e8" background="#f1ebfd" />
        <Card sx={{ ...cardSx, gridColumn: { lg: 'span 2' } }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Status Counts
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {statusCounts.map((s) => (
                <Chip key={s.label} label={`${s.label}: ${s.value}`} size="small" color={s.color} sx={{ fontWeight: 700 }} />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Quotations
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
                <TableCell sx={headCellSx}>Quotation #</TableCell>
                <TableCell sx={headCellSx}>Customer</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell align="right" sx={headCellSx}>Subtotal</TableCell>
                <TableCell align="right" sx={headCellSx}>Discount</TableCell>
                <TableCell align="right" sx={headCellSx}>Tax</TableCell>
                <TableCell align="right" sx={headCellSx}>Grand Total</TableCell>
                <TableCell sx={headCellSx}>Converted Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 4 }}>Loading...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ color: 'text.secondary', py: 4 }}>No data</TableCell>
                </TableRow>
              ) : (
                data.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ px: 2 }}>{r.quotation_date}</TableCell>
                    <TableCell sx={{ px: 2, fontWeight: 700 }}>{r.quotation_number}</TableCell>
                    <TableCell sx={{ px: 2 }}>{r.customer_name}</TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip label={String(r.status || "").toUpperCase()} size="small" color={statusColor(r.status)} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 2 }}>₹{formatMoney(r.subtotal)}</TableCell>
                    <TableCell align="right" sx={{ px: 2, color: 'error.main' }}>-₹{formatMoney(r.discount)}</TableCell>
                    <TableCell align="right" sx={{ px: 2 }}>₹{formatMoney(r.tax)}</TableCell>
                    <TableCell align="right" sx={{ px: 2, fontWeight: 700 }}>₹{formatMoney(r.grand_total)}</TableCell>
                    <TableCell sx={{ px: 2, color: 'text.secondary' }}>{r.converted_invoice_number || "-"}</TableCell>
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
