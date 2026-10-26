import { useEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
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
import { canCreate, canEdit, canDelete, canView } from "../utils/permissions";

const tableReducer = (state, action) => {
  switch (action.type) {
    case "PAGE": return { ...state, page: action.page };
    case "PER_PAGE": return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH": return { ...state, search: action.search, page: 1 };
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

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const statusChipSx = {
  draft: { bgcolor: '#fff4d6', color: '#b76e00' },
  posted: { bgcolor: '#dbf5e9', color: '#118d57' },
};

const typeChipSx = {
  return: { bgcolor: '#caf4ff', color: '#006c9c' },
  discount: { bgcolor: '#f1ebfd', color: '#6528e8' },
  damaged: { bgcolor: '#ffe4de', color: '#b71d18' },
};

const pageCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const headerCellSx = {
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

const sectionBoxSx = {
  p: 2,
  bgcolor: '#f8fafc',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
};

const borderedTableSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  overflow: 'hidden',
  bgcolor: '#fff',
};

const borderedCellSx = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  borderRight: '1px solid',
  borderRightColor: 'divider',
  '&:last-child': { borderRight: 0 },
};

export default function DebitNotes() {
  const [params, setParams] = useSearchParams();
  const canViewNotes = canView("debit-notes");
  const prefillAppliedRef = useRef(false);
  const pendingPurchaseIdRef = useRef(params.get("purchaseId"));

  const initialTable = { page: getNum(params.get("page"), 1), perPage: getNum(params.get("perPage"), 10), search: params.get("search") || "" };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [sort, setSort] = useState({ field: null, dir: 'asc' });

  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [show, setShow] = useState(false);
  const [viewShow, setViewShow] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [form, setForm] = useState({
    purchase_id: "", warehouse_id: "", debit_note_date: new Date().toISOString().split('T')[0], type: "return", reason: "", items: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const newParams = new URLSearchParams({ page: table.page, perPage: table.perPage, search: table.search });
    if (newParams.toString() !== params.toString()) setParams(newParams);
  }, [table, params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => { const s = searchInput.trim(); if (s !== table.search) dispatch({ type: "SEARCH", search: s }); }, 400);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadTable(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, reloadKey, canViewNotes]);

  const loadTable = async (signal) => {
    if (!canViewNotes) return;
    setLoading(true);
    try {
      const res = await api.get("/debit-notes", { params: table, signal });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total ?? 0));
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadDropdowns(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [reloadKey]);

  const loadDropdowns = async (signal) => {
    const [purchRes, itemsRes, warehousesRes] = await Promise.allSettled([
      api.get("/purchases", { params: { perPage: 200 }, signal }),
      api.get("/items", { params: { perPage: 200 }, signal }),
      api.get("/warehouses/list", { signal })
    ]);
    if (purchRes.status === 'fulfilled') setPurchases(toArray(purchRes.value.data));
    else { setPurchases([]); toast.error("Failed to load purchases"); }
    if (itemsRes.status === 'fulfilled') setItems(toArray(itemsRes.value.data));
    else { setItems([]); toast.error("Failed to load items"); }
    if (warehousesRes.status === 'fulfilled') setWarehouses(toArray(warehousesRes.value.data));
    else { setWarehouses([]); toast.error("Failed to load warehouses"); }
  };

  const selectPurchase = (purchaseId) => {
    const purchase = purchases.find(p => String(p.id) === String(purchaseId));
    setSelectedPurchase(purchase);
    if (purchase) {
      setForm(f => ({
        ...f, purchase_id: purchaseId,
        items: purchase.items?.map(it => ({
          item_id: it.item_id,
          original_quantity: it.quantity,
          quantity: 0,
          price: it.price,
          discount: it.discount || 0,
          tax_percentage: it.tax_percentage || 0,
          purchase_item_id: it.id,
          reason: ""
        })) || []
      }));
    }
  };

  const openForPurchase = (purchaseId) => {
    setShow(true);
    selectPurchase(purchaseId);
  };

  // Option B: open modal + preselect bill based on URL param (?purchaseId=123)
  useEffect(() => {
    if (!canViewNotes) return;
    const purchaseId = pendingPurchaseIdRef.current;
    if (!purchaseId) return;
    if (prefillAppliedRef.current) return;
    if (!purchases || purchases.length === 0) return;

    prefillAppliedRef.current = true;
    openForPurchase(purchaseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, canViewNotes]);

  const openAdd = () => {
    setSelectedPurchase(null);
    setForm({
      purchase_id: "", warehouse_id: "", debit_note_date: new Date().toISOString().split('T')[0], type: "return", reason: "", items: []
    });
    setShow(true);
  };

  const updateItemQty = (idx, qty) => {
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], quantity: Math.max(0, parseFloat(qty) || 0) }; return { ...f, items }; });
  };

  const calculateTotals = () => {
    let subtotal = 0, discount = 0, tax = 0;
    form.items.forEach(it => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.price) || 0;
      const disc = parseFloat(it.discount) || 0;
      const taxPct = parseFloat(it.tax_percentage) || 0;
      const itemAmt = (qty * price) - disc;
      subtotal += (qty * price); discount += disc; tax += (itemAmt * taxPct) / 100;
    });
    return { subtotal, discount, tax, grandTotal: subtotal - discount + tax };
  };

  const save = async () => {
    if (!form.purchase_id) { toast.warning("Select purchase bill"); return; }
    if (form.items.every(i => i.quantity <= 0)) { toast.warning("Enter at least one item quantity"); return; }
    const validItems = form.items.filter(i => i.quantity > 0);
    if (validItems.length === 0) { toast.warning("No items with quantity > 0"); return; }

    try {
      setSaving(true);
      await api.post("/debit-notes", { ...form, items: validItems });
      toast.success("Debit Note created");
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) { toast.error(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const deleteNote = (row) => {
    Swal.fire({ title: "Delete Debit Note?", text: `#${row.debit_note_number}?`, icon: "warning", showCancelButton: true }).then(async (r) => {
      if (!r.isConfirmed) return;
      try { await api.delete(`/debit-notes/${row.id}`); setReloadKey(k => k + 1); toast.success("Deleted"); } catch { toast.error("Delete failed"); }
    });
  };

  const postNote = (row) => {
    Swal.fire({ title: "Post Debit Note?", text: `Post #${row.debit_note_number}?`, icon: "question", showCancelButton: true, confirmButtonText: "Post" }).then(async (r) => {
      if (!r.isConfirmed) return;
      try { await api.post(`/debit-notes/${row.id}/post`); setReloadKey(k => k + 1); toast.success("Posted"); } catch (e) { toast.error(e.response?.data?.message || "Post failed"); }
    });
  };

  const columns = [
    { key: 'debit_note_number', label: 'DN #', minWidth: 130, sortValue: (r) => r.debit_note_number },
    { key: 'debit_note_date', label: 'Date', minWidth: 110, sortValue: (r) => r.debit_note_date, render: (row) => row.debit_note_date || '-' },
    { key: 'bill', label: 'Bill', minWidth: 120, render: (row) => row.purchase?.bill_number || '-' },
    { key: 'vendor', label: 'Vendor', minWidth: 150, render: (row) => row.purchase?.vendor?.name || '-' },
    {
      key: 'type', label: 'Type', minWidth: 100,
      render: (row) => (
        <Chip
          label={row.type}
          size="small"
          sx={{ ...(typeChipSx[row.type] || { bgcolor: '#f1f5f9', color: '#475569' }), fontWeight: 700 }}
        />
      ),
    },
    { key: 'grand_total', label: 'Amount', minWidth: 110, sortValue: (r) => Number(r.grand_total) || 0, render: (row) => `₹${formatMoney(row.grand_total)}` },
    {
      key: 'status', label: 'Status', minWidth: 90,
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          sx={{ ...(statusChipSx[row.status] || { bgcolor: '#f1f5f9', color: '#475569' }), fontWeight: 700 }}
        />
      ),
    },
    {
      key: 'action', label: 'Action', minWidth: 130, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View">
            <IconButton size="small" color="info" onClick={() => { setViewData(row); setViewShow(true); }} aria-label="View debit note" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <i className="fas fa-eye" style={{ fontSize: 12 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          {row.status === 'draft' && canEdit("debit-notes") && (
            <Tooltip title="Post">
              <IconButton size="small" color="success" onClick={() => postNote(row)} aria-label="Post debit note" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <i className="fas fa-check" style={{ fontSize: 12 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === 'draft' && canDelete("debit-notes") && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => deleteNote(row)} aria-label="Delete debit note" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <i className="fas fa-trash" style={{ fontSize: 12 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const sortedRows = (() => {
    if (!sort.field) return rows;
    const column = columns.find(c => c.key === sort.field);
    if (!column?.sortValue) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.sortValue(a);
      const bv = column.sortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  })();

  const handleLocalSort = (field) => {
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const totals = calculateTotals();

  if (!canViewNotes) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view debit notes.
      </Alert>
    );
  }

  return (
    <Box>

      <Card sx={pageCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Debit Notes
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total debit notes
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search..."
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
              {canCreate("debit-notes") && (
                <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                  New Debit Note
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 960 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ ...headerCellSx, minWidth: column.minWidth, width: column.width }}
                  >
                    {column.sortValue ? (
                      <TableSortLabel
                        active={sort.field === column.key}
                        direction={sort.field === column.key ? sort.dir : 'asc'}
                        onClick={() => handleLocalSort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length === 0 && !loading ? (
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
              ) : sortedRows.map((row) => (
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
                      {column.render ? column.render(row) : column.sortValue?.(row) ?? '-'}
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
          rowsPerPageOptions={[10, 20, 50, 100, 200]}
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

      {/* New Debit Note Dialog */}
      <Dialog
        open={show}
        onClose={(event, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setShow(false); }}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>New Debit Note</Typography>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <FormControl size="small" fullWidth required>
              <InputLabel>Select Purchase Bill</InputLabel>
              <Select
                label="Select Purchase Bill"
                value={form.purchase_id === '' ? '' : String(form.purchase_id)}
                onChange={e => selectPurchase(e.target.value)}
              >
                <MenuItem value=""><em>-- Select --</em></MenuItem>
                {purchases.map(p => <MenuItem key={p.id} value={String(p.id)}>#{p.bill_number} - {p.vendor?.name} - ₹{formatMoney(p.grand_total)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth required>
              <InputLabel>From Godown</InputLabel>
              <Select
                label="From Godown"
                value={form.warehouse_id === '' ? '' : String(form.warehouse_id)}
                onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}
              >
                <MenuItem value=""><em>-- Select Godown --</em></MenuItem>
                {warehouses.map(w => <MenuItem key={w.id} value={String(w.id)}>{w.name} {w.is_primary ? '(Primary)' : ''}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Date"
              required
              value={form.debit_note_date}
              onChange={e => setForm(f => ({ ...f, debit_note_date: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                <MenuItem value="return">Return</MenuItem>
                <MenuItem value="discount">Discount</MenuItem>
                <MenuItem value="damaged">Damaged</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {selectedPurchase && (
            <Box sx={{ ...sectionBoxSx, mb: 3 }}>
              <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: 15, mb: 1.5 }}>
                Items to Return/Debit
              </Typography>
              <Box sx={borderedTableSx}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 640 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Item</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 110 }}>Original Qty</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 110 }}>Debit Qty</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 100 }}>Price</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx, minWidth: 160 }}>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={borderedCellSx}>{items.find(i => String(i.id) === String(it.item_id))?.name || it.item_id}</TableCell>
                          <TableCell sx={borderedCellSx}>{it.original_quantity}</TableCell>
                          <TableCell sx={borderedCellSx}>
                            <TextField type="number" size="small" inputProps={{ min: 0, max: it.original_quantity }} value={it.quantity ?? ''} onChange={e => updateItemQty(idx, e.target.value)} />
                          </TableCell>
                          <TableCell sx={borderedCellSx}>₹{it.price}</TableCell>
                          <TableCell sx={borderedCellSx}>
                            <TextField size="small" fullWidth placeholder="Reason" value={it.reason} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], reason: e.target.value }; setForm(f => ({ ...f, items })); }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
            <TextField
              size="small"
              label="Reason/Notes"
              multiline
              rows={3}
              fullWidth
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
            <Box sx={sectionBoxSx}>
              <Box sx={borderedTableSx}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell align="right" sx={{ ...borderedCellSx, fontWeight: 700 }}>Subtotal:</TableCell>
                      <TableCell align="right" sx={borderedCellSx}>₹{totals.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" sx={borderedCellSx}>Discount:</TableCell>
                      <TableCell align="right" sx={{ ...borderedCellSx, color: 'error.main' }}>-₹{totals.discount.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" sx={borderedCellSx}>Tax:</TableCell>
                      <TableCell align="right" sx={borderedCellSx}>₹{totals.tax.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>Grand Total:</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>₹{totals.grandTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Debit Note Dialog */}
      <Dialog open={viewShow} onClose={() => setViewShow(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Debit Note #{viewData?.debit_note_number}</Typography>
          <IconButton size="small" onClick={() => setViewShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewData && (<>
            <Box sx={{ ...sectionBoxSx, p: 2.5, mb: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Bill:</Typography>
                  <Typography variant="body2">{viewData.purchase?.bill_number}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Date:</Typography>
                  <Typography variant="body2">{viewData.debit_note_date}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Status:</Typography>
                  <Box><Chip label={viewData.status} size="small" sx={{ ...(statusChipSx[viewData.status] || { bgcolor: '#f1f5f9', color: '#475569' }), fontWeight: 700 }} /></Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ ...borderedTableSx, mb: 3 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Item</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Qty</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Price</TableCell>
                      <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewData.items?.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={borderedCellSx}>{it.item?.name}</TableCell>
                        <TableCell sx={borderedCellSx}>{it.quantity}</TableCell>
                        <TableCell sx={borderedCellSx}>₹{it.price}</TableCell>
                        <TableCell align="right" sx={borderedCellSx}>₹{it.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ ...borderedTableSx, maxWidth: 400, width: '100%' }}>
                <Table size="small">
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>Grand Total:</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>₹{viewData.grand_total}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </>)}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setViewShow(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
