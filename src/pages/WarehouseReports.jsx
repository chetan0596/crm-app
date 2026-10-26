import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const strVal = (v) => (v === "" || v == null ? "" : String(v));

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
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const bodyCellSx = {
  verticalAlign: 'middle',
  px: 2,
  py: 1.5,
  borderBottom: '1px solid #f1f5f9',
};

const successChipSx = { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 };
const warningChipSx = { bgcolor: '#fff4d6', color: '#b76e00', fontWeight: 700 };
const errorChipSx = { bgcolor: '#ffe4de', color: '#b71d18', fontWeight: 700 };
const infoChipSx = { bgcolor: '#caf4ff', color: '#006c9c', fontWeight: 700 };
const neutralChipSx = { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 };
const primaryChipSx = { bgcolor: '#eaf0f6', color: '#062849', fontWeight: 700 };

const sortRows = (data, sortField, sortDir) => {
  if (!sortField) return data;
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...data].sort((a, b) => {
    const av = a?.[sortField];
    const bv = b?.[sortField];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
};

const ledgerTypeChipSx = (type) => {
  if (type === 'Transfer In') return successChipSx;
  if (type === 'Transfer Out') return warningChipSx;
  return infoChipSx;
};

const transferStatusChipSx = (status) => {
  if (status === 'completed') return successChipSx;
  if (status === 'draft') return warningChipSx;
  return neutralChipSx;
};

const stockColumns = [
  { key: 'warehouse', label: 'Godown', sortField: 'warehouse_name', render: r => r.warehouse_name },
  { key: 'item', label: 'Item', sortField: 'item_name', render: r => r.item_name },
  { key: 'sku', label: 'SKU', sortField: 'sku', width: 120, render: r => r.sku },
  { key: 'unit', label: 'Unit', width: 80, render: r => r.unit },
  { key: 'quantity', label: 'Quantity', sortField: 'quantity', width: 100, align: 'right', render: r => r.quantity },
  { key: 'purchase_price', label: 'Purchase Price', width: 120, align: 'right', render: r => `₹${r.purchase_price || 0}` },
  { key: 'stock_value', label: 'Stock Value', width: 120, align: 'right', render: r => `₹${Number(r.stock_value || 0).toFixed(2)}` },
];

const summaryColumns = [
  { key: 'name', label: 'Godown Name', sortField: 'name', render: r => r.name },
  { key: 'location', label: 'Location', render: r => r.location || '-' },
  { key: 'primary', label: 'Primary', width: 90, render: r => (r.is_primary
    ? <Chip label="Yes" size="small" sx={primaryChipSx} />
    : <Chip label="No" size="small" sx={neutralChipSx} />) },
  { key: 'total_items', label: 'Total Items', sortField: 'total_items', width: 110, align: 'right', render: r => r.total_items },
  { key: 'total_quantity', label: 'Total Qty', sortField: 'total_quantity', width: 100, align: 'right', render: r => r.total_quantity },
  { key: 'stock_value', label: 'Stock Value', width: 120, align: 'right', render: r => `₹${Number(r.stock_value || 0).toFixed(2)}` },
];

const ledgerColumns = [
  { key: 'date', label: 'Date', sortField: 'date', width: 110, render: r => new Date(r.date).toLocaleDateString() },
  { key: 'type', label: 'Type', width: 110, render: r => <Chip label={r.type} size="small" sx={ledgerTypeChipSx(r.type)} /> },
  { key: 'reference', label: 'Reference', width: 130, render: r => r.reference },
  { key: 'item', label: 'Item', render: r => r.item_name },
  { key: 'quantity', label: 'Qty', width: 80, align: 'right', render: r => r.quantity },
  { key: 'warehouse', label: 'Godown', render: r => r.warehouse || '-' },
];

const transferColumns = [
  { key: 'transfer_date', label: 'Date', sortField: 'transfer_date', width: 110, render: r => new Date(r.transfer_date).toLocaleDateString() },
  { key: 'transfer_number', label: 'Transfer #', width: 140, render: r => r.transfer_number },
  { key: 'from_warehouse', label: 'From Godown', render: r => r.from_warehouse },
  { key: 'to_warehouse', label: 'To Godown', render: r => r.to_warehouse },
  { key: 'status', label: 'Status', width: 110, render: r => <Chip label={r.status} size="small" sx={transferStatusChipSx(r.status)} /> },
  { key: 'total_items', label: 'Items', width: 80, align: 'right', render: r => r.total_items },
  { key: 'total_quantity', label: 'Qty', width: 80, align: 'right', render: r => r.total_quantity },
];

const lowStockColumns = [
  { key: 'warehouse', label: 'Godown', sortField: 'warehouse_name', render: r => r.warehouse_name },
  { key: 'item', label: 'Item', sortField: 'item_name', render: r => r.item_name },
  { key: 'sku', label: 'SKU', width: 120, render: r => r.sku },
  { key: 'unit', label: 'Unit', width: 80, render: r => r.unit },
  { key: 'current_stock', label: 'Current', width: 90, align: 'right', render: r => r.current_stock },
  { key: 'min_stock', label: 'Min Stock', width: 90, align: 'right', render: r => r.min_stock },
  { key: 'status', label: 'Status', width: 130, render: r => (
    <Chip
      label={r.current_stock <= 0 ? 'Out of Stock' : 'Low Stock'}
      size="small"
      sx={r.current_stock <= 0 ? errorChipSx : warningChipSx}
    />
  ) },
];

function ReportTable({ columns, data, sortField, sortDir, onSort }) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 860 }} size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align || 'left'}
                sx={{ ...headCellSx, minWidth: column.minWidth, width: column.width }}
              >
                {column.sortField ? (
                  <TableSortLabel
                    active={sortField === column.sortField}
                    direction={sortField === column.sortField ? sortDir : 'asc'}
                    onClick={() => onSort(column.sortField)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 7 }}>
                <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                  No data found
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Try adjusting your filters or check back later
                </Typography>
              </TableCell>
            </TableRow>
          ) : data.map((row, index) => (
            <TableRow
              key={row.id ?? index}
              hover
              sx={{
                '&:hover': { bgcolor: 'rgba(6,40,73,.035)' },
                '&:last-child td': { borderBottom: 0 },
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={`${row.id ?? index}-${column.key}`}
                  align={column.align || 'left'}
                  sx={bodyCellSx}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function WarehouseReports() {
  const [activeTab, setActiveTab] = useState("stock");
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  // Report Data
  const [stockData, setStockData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [transferData, setTransferData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await api.get("/warehouses/list");
      setWarehouses(toArray(res.data));
    } catch {
      setWarehouses([]);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get("/items", { params: { perPage: 1000 } });
      setItems(toArray(res.data));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
    loadItems();
  }, [loadWarehouses, loadItems]);

  const loadStockByWarehouse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-stock", {
        params: { warehouse_id: selectedWarehouse, search }
      });
      setStockData(toArray(res.data));
    } catch {
      setStockData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, search]);

  const loadWarehouseSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-summary");
      setSummaryData(toArray(res.data));
    } catch {
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-ledger", {
        params: { warehouse_id: selectedWarehouse, item_id: selectedItem }
      });
      setLedgerData(toArray(res.data));
    } catch {
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, selectedItem]);

  const loadTransferReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-transfers", {
        params: {
          from_date: fromDate,
          to_date: toDate,
          from_warehouse_id: selectedWarehouse
        }
      });
      setTransferData(toArray(res.data));
    } catch {
      setTransferData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse, fromDate, toDate]);

  const loadLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-low-stock");
      setLowStockData(toArray(res.data));
    } catch {
      setLowStockData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case "stock":
        loadStockByWarehouse();
        break;
      case "summary":
        loadWarehouseSummary();
        break;
      case "ledger":
        loadLedger();
        break;
      case "transfers":
        loadTransferReport();
        break;
      case "lowstock":
        loadLowStock();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleTabChange = (event, value) => {
    setActiveTab(value);
    setSortField("");
    setSortDir("asc");
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
          Warehouse (Godown) Reports
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
          Stock, ledger, transfer, and low-stock reports per warehouse.
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab value="stock" label="Stock by Godown" icon={<i className="fas fa-boxes-stacked" aria-hidden="true" />} iconPosition="start" />
        <Tab value="summary" label="Godown Summary" icon={<i className="fas fa-warehouse" aria-hidden="true" />} iconPosition="start" />
        <Tab value="ledger" label="Item Ledger" icon={<i className="fas fa-clipboard-list" aria-hidden="true" />} iconPosition="start" />
        <Tab value="transfers" label="Transfer History" icon={<i className="fas fa-arrow-right-arrow-left" aria-hidden="true" />} iconPosition="start" />
        <Tab value="lowstock" label="Low Stock" icon={<i className="fas fa-triangle-exclamation" aria-hidden="true" />} iconPosition="start" />
      </Tabs>

      {activeTab === "stock" && (
        <Card sx={cardSx}>
          <Box sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="stock-warehouse-label">Godown</InputLabel>
                <Select
                  labelId="stock-warehouse-label"
                  label="Godown"
                  value={strVal(selectedWarehouse)}
                  onChange={e => setSelectedWarehouse(e.target.value)}
                >
                  <MenuItem value=""><em>All Godowns</em></MenuItem>
                  {warehouses.map(w => <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={loadStockByWarehouse}>
                Load
              </Button>
            </Box>
          </Box>
          <Divider />
          {loading && <LinearProgress />}
          <ReportTable columns={stockColumns} data={sortRows(stockData, sortField, sortDir)} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        </Card>
      )}

      {activeTab === "summary" && (
        <Card sx={cardSx}>
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Godown-wise Stock Summary
            </Typography>
            <Button variant="outlined" size="small" onClick={loadWarehouseSummary} startIcon={<i className="fas fa-sync-alt" aria-hidden="true" />}>
              Refresh
            </Button>
          </Box>
          <Divider />
          {loading && <LinearProgress />}
          <ReportTable columns={summaryColumns} data={sortRows(summaryData, sortField, sortDir)} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        </Card>
      )}

      {activeTab === "ledger" && (
        <Card sx={cardSx}>
          <Box sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="ledger-warehouse-label">Godown</InputLabel>
                <Select
                  labelId="ledger-warehouse-label"
                  label="Godown"
                  value={strVal(selectedWarehouse)}
                  onChange={e => setSelectedWarehouse(e.target.value)}
                >
                  <MenuItem value=""><em>Select Godown</em></MenuItem>
                  {warehouses.map(w => <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel id="ledger-item-label">Item</InputLabel>
                <Select
                  labelId="ledger-item-label"
                  label="Item"
                  value={strVal(selectedItem)}
                  onChange={e => setSelectedItem(e.target.value)}
                >
                  <MenuItem value=""><em>All Items</em></MenuItem>
                  {items.map(i => <MenuItem key={i.id} value={String(i.id)}>{i.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={loadLedger} disabled={!selectedWarehouse}>
                Load
              </Button>
            </Box>
          </Box>
          <Divider />
          {loading && <LinearProgress />}
          <ReportTable columns={ledgerColumns} data={sortRows(ledgerData, sortField, sortDir)} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        </Card>
      )}

      {activeTab === "transfers" && (
        <Card sx={cardSx}>
          <Box sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) 1fr' }, gap: 2 }}>
              <TextField
                size="small"
                type="date"
                label="From Date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                size="small"
                type="date"
                label="To Date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel id="transfers-warehouse-label">From/To Godown</InputLabel>
                <Select
                  labelId="transfers-warehouse-label"
                  label="From/To Godown"
                  value={strVal(selectedWarehouse)}
                  onChange={e => setSelectedWarehouse(e.target.value)}
                >
                  <MenuItem value=""><em>From/To Godown</em></MenuItem>
                  {warehouses.map(w => <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={loadTransferReport}>
                Load
              </Button>
            </Box>
          </Box>
          <Divider />
          {loading && <LinearProgress />}
          <ReportTable columns={transferColumns} data={sortRows(transferData, sortField, sortDir)} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        </Card>
      )}

      {activeTab === "lowstock" && (
        <Card sx={cardSx}>
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Low Stock Items by Godown
            </Typography>
            <Button variant="outlined" size="small" onClick={loadLowStock} startIcon={<i className="fas fa-sync-alt" aria-hidden="true" />}>
              Refresh
            </Button>
          </Box>
          <Divider />
          {loading && <LinearProgress />}
          <ReportTable columns={lowStockColumns} data={sortRows(lowStockData, sortField, sortDir)} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        </Card>
      )}
    </Box>
  );
}
