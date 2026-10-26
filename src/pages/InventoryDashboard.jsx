import { useCallback, useEffect, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";

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

const iconBoxSx = (background, color, size = 48) => ({
  width: size,
  height: size,
  borderRadius: 2,
  display: 'grid',
  placeItems: 'center',
  bgcolor: background,
  color,
  flexShrink: 0,
});

function MetricCard({ label, value, icon, color, background }) {
  return (
    <Card sx={{ ...cardSx, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={iconBoxSx(background, color)}>
            <i className={icon} style={{ fontSize: 20 }} aria-hidden="true" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: .5 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ color, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const visibleColumnOptions = [
  ['id', 'ID'],
  ['name', 'Name'],
  ['sku', 'SKU'],
  ['unit', 'Unit'],
  ['stock', 'Stock'],
  ['min_stock', 'Min Stock'],
  ['status', 'Status'],
  ['value', 'Value'],
];

export default function InventoryDashboard() {
  const [params, setParams] = useSearchParams();
  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 10),
    search: params.get("search") || "",
    sortField: params.get("sort") || "current_stock",
    sortDir: params.get("dir") || "asc",
  };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 });
  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [filterStatus, setFilterStatus] = useState("all");
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('inventory-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {
      return { id: true, name: true, sku: true, unit: true, stock: true, min_stock: true, status: true, value: true };
    } }
    return { id: true, name: true, sku: true, unit: true, stock: true, min_stock: true, status: true, value: true };
  });

  useEffect(() => {
    localStorage.setItem('inventory-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

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

  const load = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/items/inventory", {
        params: { ...table, status: filterStatus !== 'all' ? filterStatus : '' },
        signal
      });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total) || 0);
      setStats(res.data?.stats || { totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 });
    } catch {
      setRows([]);
      setTotal(0);
      setStats({ totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 });
    }
    finally { setLoading(false); }
  }, [table, filterStatus]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const getStockStatus = (row) => {
    const stock = parseFloat(row.current_stock) || 0;
    const min = parseFloat(row.min_stock) || 0;
    if (stock <= 0) return { label: "Out of Stock", color: "error", chipSx: { bgcolor: '#ffe4de', color: '#b71d18' }, progress: 0 };
    if (stock <= min) return { label: "Low Stock", color: "warning", chipSx: { bgcolor: '#fff4d6', color: '#b76e00' }, progress: (stock / (min * 2)) * 100 };
    return { label: "In Stock", color: "success", chipSx: { bgcolor: '#dbf5e9', color: '#118d57' }, progress: Math.min(100, (stock / (min * 3)) * 100) };
  };

  const columns = [
    visibleCols.id && {
      key: 'id', label: 'ID', sortField: 'id', width: 80,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography>,
    },
    visibleCols.name && {
      key: 'name', label: 'Item Name', sortField: 'name', minWidth: 170,
      render: (row) => row.name || '-',
    },
    visibleCols.sku && {
      key: 'sku', label: 'SKU', sortField: 'sku', width: 120,
      render: (row) => row.sku || '-',
    },
    visibleCols.unit && {
      key: 'unit', label: 'Unit', width: 90,
      render: (row) => row.unit?.symbol || row.unit?.name || '-',
    },
    visibleCols.stock && {
      key: 'stock', label: 'Current Stock', sortField: 'current_stock', width: 120,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.current_stock || 0}</Typography>,
    },
    visibleCols.min_stock && {
      key: 'min_stock', label: 'Min Stock', sortField: 'min_stock', width: 100,
      render: (row) => row.min_stock || 0,
    },
    visibleCols.status && {
      key: 'status', label: 'Status', width: 150,
      render: (row) => {
        const status = getStockStatus(row);
        return (
          <Box sx={{ minWidth: 110 }}>
            <Chip label={status.label} size="small" sx={{ ...status.chipSx, fontWeight: 700 }} />
            <LinearProgress
              variant="determinate"
              value={status.progress}
              color={status.color}
              sx={{ height: 4, borderRadius: 4, mt: 0.75, bgcolor: 'grey.200' }}
            />
          </Box>
        );
      },
    },
    visibleCols.value && {
      key: 'value', label: 'Stock Value', width: 120,
      render: (row) => `₹${((row.current_stock || 0) * (row.purchase_price || 0)).toFixed(2)}`,
    },
  ].filter(Boolean);

  const shownColumnCount = visibleColumnOptions.filter(([key]) => visibleCols[key]).length;

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  const metrics = [
    { label: 'Total Items', value: stats.totalItems, icon: 'fas fa-boxes-stacked', color: '#062849', background: '#eaf0f6' },
    { label: 'Total Stock', value: stats.totalStock, icon: 'fas fa-layer-group', color: '#118d57', background: '#dbf5e9' },
    { label: 'Low Stock', value: stats.lowStock, icon: 'fas fa-triangle-exclamation', color: '#b76e00', background: '#fff4d6' },
    { label: 'Out of Stock', value: stats.outOfStock, icon: 'fas fa-ban', color: '#b71d18', background: '#ffe4de' },
    { label: 'Total Stock Value', value: `₹${stats.stockValue?.toFixed(2)}`, icon: 'fas fa-coins', color: '#006c9c', background: '#caf4ff' },
  ];

  return (
    <Box>
      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </Box>

      {/* Inventory Table */}
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Inventory Status
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total items
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel id="inventory-status-label">Status</InputLabel>
                <Select
                  labelId="inventory-status-label"
                  label="Status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="out">Out of Stock</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="ok">In Stock</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Search items..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 240 } }}
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
            </Stack>
          </Box>
        </CardContent>

        <Divider />
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Columns:
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={(event) => setColumnAnchorEl(event.currentTarget)}
              startIcon={<i className="fas fa-columns" aria-hidden="true" />}
            >
              {shownColumnCount === 0 ? 'No columns' : shownColumnCount === visibleColumnOptions.length ? `All columns (${visibleColumnOptions.length})` : `${shownColumnCount} of ${visibleColumnOptions.length} columns`}
            </Button>
            <Menu anchorEl={columnAnchorEl} open={Boolean(columnAnchorEl)} onClose={() => setColumnAnchorEl(null)}>
              {visibleColumnOptions.map(([key, label]) => (
                <MenuItem key={key} onClick={() => setVisibleCols(v => ({ ...v, [key]: !v[key] }))}>
                  <Checkbox checked={Boolean(visibleCols[key])} size="small" />
                  <ListItemText primary={label} />
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Box>

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1000 }} size="small">
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
                        active={table.sortField === column.sortField}
                        direction={table.sortField === column.sortField ? table.sortDir : 'asc'}
                        onClick={() => handleSort(column.sortField)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1)} align="center" sx={{ py: 7 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No data found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try adjusting your filters or check back later
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'rgba(6,40,73,.035)' },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${row.id}-${column.key}`}
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

        <TablePagination
          component="div"
          count={total}
          page={Math.max(table.page - 1, 0)}
          rowsPerPage={table.perPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
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
    </Box>
  );
}
