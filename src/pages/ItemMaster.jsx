import { useCallback, useEffect, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
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

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const actionBtnSx = { border: '1px solid', borderColor: 'divider' };

const formGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
  gap: 2,
};

const visibleColumnOptions = [
  ['id', 'ID'],
  ['name', 'Name'],
  ['sku', 'SKU'],
  ['unit', 'Unit'],
  ['price', 'Price'],
  ['stock', 'Stock'],
  ['tax', 'Tax'],
  ['action', 'Action'],
];

export default function ItemMaster() {
  const [params, setParams] = useSearchParams();
  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 10),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemWarehouseStocks, setItemWarehouseStocks] = useState([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('item-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {
      return { id: true, name: true, sku: true, unit: true, price: true, stock: true, tax: true, action: true };
    } }
    return { id: true, name: true, sku: true, unit: true, price: true, stock: true, tax: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('item-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({
    name: "", sku: "", unit_id: "", tax_id: "",
    purchase_price: "", sale_price: "", opening_stock: "0", min_stock: "0"
  });
  const [saving, setSaving] = useState(false);

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

  const loadTable = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/items", { params: table, signal });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total) || 0);
    } catch {
      setRows([]); setTotal(0);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [table]);

  const loadDropdowns = useCallback(async (signal) => {
    const [unitsRes, taxesRes, warehousesRes] = await Promise.allSettled([
      api.get("/units", { params: { perPage: 200 }, signal }),
      api.get("/taxes", { params: { perPage: 200 }, signal }),
      api.get("/warehouses/list", { signal })
    ]);

    if (unitsRes.status === 'fulfilled') {
      setUnits(toArray(unitsRes.value.data));
    } else { setUnits([]); toast.error("Failed to load units"); }

    if (taxesRes.status === 'fulfilled') {
      setTaxes(toArray(taxesRes.value.data));
    } else { setTaxes([]); toast.error("Failed to load taxes"); }

    if (warehousesRes.status === 'fulfilled') {
      setWarehouses(toArray(warehousesRes.value.data));
    } else { setWarehouses([]); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTable(controller.signal);
    return () => controller.abort();
  }, [loadTable, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    loadDropdowns(controller.signal);
    return () => controller.abort();
  }, [loadDropdowns, reloadKey]);

  const openAdd = () => {
    setEditRow(null);
    setForm({ name: "", sku: "", unit_id: "", tax_id: "", purchase_price: "", sale_price: "", opening_stock: "0", min_stock: "0" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      name: row.name || "", sku: row.sku || "", unit_id: strVal(row.unit_id),
      tax_id: strVal(row.tax_id), purchase_price: row.purchase_price || "",
      sale_price: row.sale_price || "", opening_stock: row.opening_stock || "0",
      min_stock: row.min_stock || "0"
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Item name required");
      return;
    }
    if (!form.unit_id) {
      toast.warning("Unit required");
      return;
    }
    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/items/${editRow.id}`, form);
      } else {
        await api.post("/items", form);
      }
      setShow(false);
      setReloadKey(k => k + 1);
      toast.success(editRow ? "Item updated" : "Item created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openWarehouseStock = async (row) => {
    setSelectedItem(row);
    setShowStockModal(true);
    setLoadingStock(true);
    try {
      const res = await api.get(`/items/${row.id}/warehouse-stock`);
      setItemWarehouseStocks(toArray(res.data));
    } catch {
      setItemWarehouseStocks([]);
    } finally {
      setLoadingStock(false);
    }
  };

  const remove = (row) => {
    Swal.fire({
      title: "Delete item?",
      text: `Remove "${row.name}"?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/items/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Item deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const columns = [
    visibleCols.id && {
      key: 'id', label: 'ID', sortField: 'id', width: 90,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography>,
    },
    visibleCols.name && {
      key: 'name', label: 'Item Name', sortField: 'name', minWidth: 170,
      render: (row) => row.name || '-',
    },
    visibleCols.sku && {
      key: 'sku', label: 'SKU/Code', sortField: 'sku', width: 120,
      render: (row) => row.sku || '-',
    },
    visibleCols.unit && {
      key: 'unit', label: 'Unit', sortField: 'unit_id', width: 90,
      render: (row) => row.unit?.symbol || row.unit?.name || '-',
    },
    visibleCols.price && {
      key: 'price', label: 'Sale Price', sortField: 'sale_price', width: 110,
      render: (row) => `₹${row.sale_price}`,
    },
    visibleCols.stock && {
      key: 'stock', label: 'Stock', sortField: 'current_stock', width: 110,
      render: (row) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="body2">{row.current_stock || 0}</Typography>
          <Tooltip title="View Godown-wise Stock">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openWarehouseStock(row); }} sx={{ color: 'secondary.main' }} aria-label="View warehouse stock">
              <i className="fas fa-warehouse" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    visibleCols.tax && {
      key: 'tax', label: 'Tax', sortField: 'tax_id', width: 130,
      render: (row) => row.tax ? `${row.tax.name} (${row.tax.percentage}%)` : '-',
    },
    visibleCols.action && {
      key: 'action', label: 'Action', width: 110, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={actionBtnSx} aria-label="Edit item">
              <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => remove(row)} sx={{ ...actionBtnSx, color: 'error.main' }} aria-label="Delete item">
              <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ].filter(Boolean);

  const shownColumnCount = visibleColumnOptions.filter(([key]) => visibleCols[key]).length;

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Item Master
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total items
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
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
              <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                Add Item
              </Button>
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
          <Button
            variant="outlined"
            size="small"
            onClick={() => setReloadKey(k => k + 1)}
            disabled={loading}
            startIcon={<i className="fas fa-sync-alt" aria-hidden="true" />}
          >
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 960 }} size="small">
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

      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${editRow ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editRow ? "Edit Item" : "Add Item"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={formGridSx}>
            <TextField
              size="small"
              label="Item Name"
              required
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="SKU / Code"
              placeholder="Unique item code"
              value={form.sku}
              onChange={e => updateField('sku', e.target.value)}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="item-unit-label">Unit</InputLabel>
              <Select
                labelId="item-unit-label"
                label="Unit"
                value={strVal(form.unit_id)}
                onChange={e => updateField('unit_id', e.target.value)}
              >
                <MenuItem value=""><em>Select Unit</em></MenuItem>
                {units.map(u => <MenuItem key={u.id} value={String(u.id)}>{u.name} ({u.symbol})</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="item-tax-label">Tax</InputLabel>
              <Select
                labelId="item-tax-label"
                label="Tax"
                value={strVal(form.tax_id)}
                onChange={e => updateField('tax_id', e.target.value)}
              >
                <MenuItem value=""><em>No Tax</em></MenuItem>
                {taxes.map(t => <MenuItem key={t.id} value={String(t.id)}>{t.name} - {t.percentage}%</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="number"
              label="Purchase Price (₹)"
              value={form.purchase_price}
              onChange={e => updateField('purchase_price', e.target.value)}
              inputProps={{ step: "0.01" }}
              fullWidth
            />
            <TextField
              size="small"
              type="number"
              label="Sale Price (₹)"
              value={form.sale_price}
              onChange={e => updateField('sale_price', e.target.value)}
              inputProps={{ step: "0.01" }}
              fullWidth
            />
            {!editRow && (
              <>
                <TextField
                  size="small"
                  type="number"
                  label="Opening Stock"
                  value={form.opening_stock}
                  onChange={e => updateField('opening_stock', e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  type="number"
                  label="Minimum Stock Alert"
                  value={form.min_stock}
                  onChange={e => updateField('min_stock', e.target.value)}
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShow(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warehouse Stock Modal */}
      <Dialog
        open={showStockModal}
        onClose={() => setShowStockModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Warehouse-wise Stock - {selectedItem?.name}
          </Typography>
          <IconButton size="small" onClick={() => setShowStockModal(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {loadingStock ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 4, color: 'text.secondary' }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>SKU:</Box> {selectedItem?.sku || '-'}
                {' | '}
                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>Total Stock:</Box> {selectedItem?.current_stock || 0}
              </Typography>
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={headCellSx}>Warehouse (Godown)</TableCell>
                      <TableCell align="right" sx={headCellSx}>Quantity</TableCell>
                      <TableCell sx={headCellSx}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warehouses.map(wh => {
                      const stock = itemWarehouseStocks.find(s => s.warehouse_id === wh.id);
                      const qty = stock?.quantity || 0;
                      return (
                        <TableRow key={wh.id} hover>
                          <TableCell sx={bodyCellSx}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2">{wh.name}</Typography>
                              {wh.is_primary && (
                                <Chip label="Primary" size="small" sx={{ bgcolor: '#eaf0f6', color: '#062849', fontWeight: 700 }} />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ ...bodyCellSx, fontWeight: 700 }}>{qty}</TableCell>
                          <TableCell sx={bodyCellSx}>
                            {qty > 0 ? (
                              <Chip label="In Stock" size="small" sx={{ bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }} />
                            ) : (
                              <Chip label="Out" size="small" sx={{ bgcolor: '#ffe4de', color: '#b71d18', fontWeight: 700 }} />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {warehouses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                          No warehouses configured
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowStockModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
