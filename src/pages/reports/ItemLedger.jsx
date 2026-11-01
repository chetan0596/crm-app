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

const EMPTY_SUMMARY = { total_in: 0, total_out: 0, closing_balance: 0 };

const typeChipColor = (type) => {
  switch (type) {
    case 'Purchase': return 'success';
    case 'Sale': return 'error';
    case 'Sale Return': return 'info';
    case 'Purchase Return': return 'warning';
    default: return 'default';
  }
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

export default function ItemLedger() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const canViewLedger = canView("item-ledger");

  const loadData = useCallback(async (item, from, to) => {
    if (!canViewLedger) return;

    setLoading(true);
    try {
      const params = {};
      if (item) params.item_id = item;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get("/item-ledger", { params });
      setItems(toArray(res.data?.items));
      setTransactions(toArray(res.data?.transactions));
      setSummary(res.data?.summary || EMPTY_SUMMARY);
    } catch (err) {
      console.error("Failed to load item ledger:", err);
      setTransactions([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [canViewLedger]);

  useEffect(() => {
    if (canViewLedger) {
      loadData("", "", "");
    }
  }, [canViewLedger, loadData]);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData(selectedItem, fromDate, toDate);
  };

  const handleClear = () => {
    setSelectedItem("");
    setFromDate("");
    setToDate("");
    loadData("", "", "");
  };

  const handleDownloadPDF = () => {
    if (!selectedItem) {
      alert('Please select an item first');
      return;
    }

    if (loading) return;

    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    api
      .get(`/item-ledger/${selectedItem}/pdf`, { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `item-ledger-${selectedItem}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download item ledger PDF:", err);
      });
  };

  if (!canViewLedger) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view this report.
      </Alert>
    );
  }

  const selectedItemData = items.find((i) => String(i.id) === String(selectedItem));
  const netMovement = Number(summary.total_in || 0) - Number(summary.total_out || 0);

  // Flatten transactions into DataTable rows: a synthetic opening-balance row,
  // interleaved daily-summary rows, and transaction rows with a running balance.
  const ledgerRows = (() => {
    const rows = [];
    const firstSummary = transactions.find(t => t.type === 'summary');
    let running = Number(firstSummary?.opening_stock || 0);

    if (transactions.length === 0) return rows;

    rows.push({
      __key: 'opening',
      __kind: 'opening',
      date: firstSummary?.date || '-',
      balance: running,
    });

    transactions.forEach((t, index) => {
      if (t.type === 'summary') {
        rows.push({
          __key: `summary-${index}`,
          __kind: 'summary',
          date: t.date,
          opening_stock: Number(t.opening_stock || 0),
          closing_stock: Number(t.closing_stock || 0),
          balance: Number(t.closing_stock || 0),
        });
      } else {
        const qtyIn = Number(t.quantity_in || 0);
        const qtyOut = Number(t.quantity_out || 0);
        if (qtyIn > 0) running += qtyIn;
        if (qtyOut > 0) running -= qtyOut;

        rows.push({ ...t, __key: `trans-${index}`, __kind: 'txn', qtyIn, qtyOut, balance: running });
      }
    });

    return rows;
  })();

  const columns = [
    {
      key: 'date', label: 'Date',
      render: (r) => (r.__kind === 'txn'
        ? r.date
        : <Box component="span" sx={{ fontWeight: 700 }}>{r.date}</Box>),
    },
    {
      key: 'type', label: 'Type',
      render: (r) => {
        if (r.__kind === 'opening') {
          return <Chip label="Opening Balance" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }} />;
        }
        if (r.__kind === 'summary') {
          return <Chip label="Daily Summary" size="small" color="primary" sx={{ fontWeight: 700 }} />;
        }
        return <Chip label={r.type} size="small" color={typeChipColor(r.type)} sx={{ fontWeight: 700 }} />;
      },
    },
    {
      key: 'reference', label: 'Reference',
      render: (r) => {
        if (r.__kind === 'opening') return <Box component="span" sx={{ color: 'text.secondary' }}>-</Box>;
        if (r.__kind === 'summary') {
          return (
            <Box component="span" sx={{ fontWeight: 700 }}>
              Opening: {r.opening_stock.toFixed(3)} | Closing: {r.closing_stock.toFixed(3)}
            </Box>
          );
        }
        return r.reference;
      },
    },
    {
      key: 'party', label: 'Party',
      render: (r) => (r.__kind === 'txn' ? r.party : '-'),
    },
    !selectedItem && {
      key: 'item', label: 'Item', minWidth: 140,
      render: (r) => (r.__kind === 'txn' ? (
        <Box>
          <Typography variant="body2">{r.item_name}</Typography>
          <Typography variant="caption" color="text.secondary">{r.item_sku}</Typography>
        </Box>
      ) : '-'),
    },
    {
      key: 'quantity_in', label: 'Qty In', align: 'right',
      render: (r) => (r.__kind === 'txn' && r.qtyIn > 0
        ? <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>{r.qtyIn.toFixed(3)}</Box>
        : '-'),
    },
    {
      key: 'quantity_out', label: 'Qty Out', align: 'right',
      render: (r) => (r.__kind === 'txn' && r.qtyOut > 0
        ? <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>{r.qtyOut.toFixed(3)}</Box>
        : '-'),
    },
    {
      key: 'rate', label: 'Rate', align: 'right',
      render: (r) => (r.__kind === 'txn' ? `₹${formatMoney(r.rate)}` : '-'),
    },
    {
      key: 'value', label: 'Value', align: 'right',
      render: (r) => (r.__kind === 'txn'
        ? <Box component="span" sx={{ fontWeight: 600 }}>₹{formatMoney(r.value)}</Box>
        : '-'),
    },
    {
      key: 'balance', label: 'Balance', align: 'right',
      render: (r) => <Box component="span" sx={{ color: 'info.main', fontWeight: 700 }}>{r.balance.toFixed(3)}</Box>,
    },
  ].filter(Boolean);

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
          Item Ledger
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          View item transaction history with running balance
        </Typography>
      </Box>

      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleFilter}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Item</InputLabel>
                <Select
                  label="Item"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  <MenuItem value=""><em>All Items</em></MenuItem>
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="date"
                size="small"
                label="From Date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="To Date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
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
                disabled={!selectedItem || loading}
                startIcon={<Iconify icon="fa6-solid:file-pdf" width={16} />}
              >
                Download PDF
              </Button>
            </Stack>
          </Box>

          {selectedItemData && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Selected Item</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedItemData.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>SKU</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedItemData.sku}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Current Stock</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{selectedItemData.current_stock}</Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <StatCard label="Total In (Purchases)" value={Number(summary.total_in || 0).toFixed(3)} icon="fa6-solid:arrow-down" color="#118d57" background="#dbf5e9" />
        <StatCard label="Total Out (Sales)" value={Number(summary.total_out || 0).toFixed(3)} icon="fa6-solid:arrow-up" color="#b71d18" background="#ffe4de" />
        <StatCard label="Net Movement" value={netMovement.toFixed(3)} icon="fa6-solid:arrow-right-arrow-left" color={netMovement >= 0 ? "#118d57" : "#b71d18"} background={netMovement >= 0 ? "#dbf5e9" : "#ffe4de"} />
        <StatCard label="Closing Balance" value={Number(summary.closing_balance || 0).toFixed(3)} icon="fa6-solid:box" color="#006c9c" background="#caf4ff" />
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Transaction History
          </Typography>
        </Box>
        <Divider />
        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={ledgerRows}
          rowKey="__key"
          loading={loading}
          emptyMessage="No transactions found"
          emptyHint="Try adjusting the report filters"
          minWidth={1000}
          defaultPageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>
    </Box>
  );
}
