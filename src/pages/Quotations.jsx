import { useEffect, useReducer, useState, useCallback } from "react";
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
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  ListItemIcon,
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
import { canCreate, canEdit, canDelete, canView } from "../utils/permissions";

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

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const statusChipSx = {
  draft: { bgcolor: '#f1f5f9', color: '#475569' },
  sent: { bgcolor: '#caf4ff', color: '#006c9c' },
  accepted: { bgcolor: '#dbf5e9', color: '#118d57' },
  rejected: { bgcolor: '#ffe4de', color: '#b71d18' },
  converted: { bgcolor: '#eaf0f6', color: '#062849' },
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

const sectionTitleSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  color: 'primary.main',
  fontWeight: 700,
  fontSize: 15,
  mb: 1.5,
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

const menuPaperSx = {
  mt: .75,
  minWidth: 188,
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 12px 32px rgba(28,37,46,.14)',
};

export default function Quotations() {
  const [params, setParams] = useSearchParams();
  const canViewQuotations = canView("quotations");

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

  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [, setTaxes] = useState([]);

  const [show, setShow] = useState(false);
  const [viewShow, setViewShow] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);

  const [form, setForm] = useState({
    customer_id: "",
    quotation_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    notes: "",
    status: "draft",
    items: [{ item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }]
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
    if (!canViewQuotations) return;
    setLoading(true);
    try {
      const res = await api.get("/quotations", { params: table, signal });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total ?? 0));
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  }, [table, canViewQuotations]);

  const loadDropdowns = useCallback(async (signal) => {
    const [custRes, itemRes, taxRes] = await Promise.allSettled([
      api.get("/customers", { params: { perPage: 200 }, signal }),
      api.get("/items", { params: { perPage: 200 }, signal }),
      api.get("/taxes", { params: { perPage: 200 }, signal })
    ]);
    if (custRes.status === 'fulfilled') setCustomers(toArray(custRes.value.data));
    else { setCustomers([]); toast.error("Failed to load customers"); }
    if (itemRes.status === 'fulfilled') setItems(toArray(itemRes.value.data));
    else { setItems([]); toast.error("Failed to load items"); }
    if (taxRes.status === 'fulfilled') setTaxes(toArray(taxRes.value.data));
    else { setTaxes([]); toast.error("Failed to load taxes"); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadTable(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, reloadKey, canViewQuotations]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadDropdowns(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      customer_id: "",
      quotation_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      notes: "",
      status: "draft",
      items: [{ item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }]
    });
    setShow(true);
  };

  const openEdit = useCallback((row) => {
    setEditingId(row.id);
    setForm({
      customer_id: row.customer_id || "",
      quotation_date: row.quotation_date ? row.quotation_date.split('T')[0] : new Date().toISOString().split('T')[0],
      expiry_date: row.expiry_date ? row.expiry_date.split('T')[0] : "",
      notes: row.notes || "",
      status: row.status || "draft",
      items: row.items?.map(it => ({
        item_id: it.item_id,
        quantity: it.quantity,
        price: it.price,
        discount: it.discount || 0,
        tax_percentage: it.tax_percentage || 0,
        description: it.description || ""
      })) || [{ item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }]
    });
    setShow(true);
  }, []);

  const viewQuotation = useCallback((row) => {
    setViewData(row);
    setViewShow(true);
  }, []);

  const addItemRow = () => {
    setForm(f => ({ ...f, items: [...f.items, { item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }] }));
  };

  const removeItemRow = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const formItems = [...f.items];
      formItems[idx] = { ...formItems[idx], [field]: value };
      if (field === 'item_id' && value) {
        const selectedItem = items.find(i => String(i.id) === String(value));
        if (selectedItem) {
          formItems[idx].price = selectedItem.sale_price || 0;
          formItems[idx].tax_percentage = selectedItem.tax?.percentage || 0;
        }
      }
      return { ...f, items: formItems };
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    form.items.forEach(it => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.price) || 0;
      const discount = parseFloat(it.discount) || 0;
      const taxPct = parseFloat(it.tax_percentage) || 0;

      const itemTotal = (qty * price) - discount;
      const taxAmount = (itemTotal * taxPct) / 100;

      subtotal += (qty * price);
      totalDiscount += discount;
      totalTax += taxAmount;
    });

    return {
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      grandTotal: subtotal - totalDiscount + totalTax
    };
  };

  const save = async () => {
    if (!form.customer_id) { toast.warning("Select customer"); return; }
    if (form.items.some(i => !i.item_id)) { toast.warning("Select all items"); return; }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/quotations/${editingId}`, form);
        toast.success("Quotation updated");
      } else {
        await api.post("/quotations", form);
        toast.success("Quotation created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuotation = useCallback((row) => {
    Swal.fire({
      title: "Delete quotation?",
      text: `Quotation #${row.quotation_number}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/quotations/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Quotation deleted");
      } catch { toast.error("Delete failed"); }
    });
  }, []);

  const convertToSale = useCallback((row) => {
    Swal.fire({
      title: "Convert to Sale?",
      text: `Convert quotation #${row.quotation_number} to invoice?`,
      icon: "question", showCancelButton: true, confirmButtonText: "Convert"
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.post(`/quotations/${row.id}/convert`);
        setReloadKey(k => k + 1);
        toast.success("Converted to sale successfully");
      } catch (e) {
        toast.error(e.response?.data?.message || "Conversion failed");
      }
    });
  }, []);

  const handleDownloadQuotationPDF = useCallback(async (row) => {
    try {
      const res = await api.get(`/quotations/${row.id}/download-pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `quotation-${row.quotation_number || row.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Failed to download PDF');
    }
  }, []);

  const handleViewQuotationPDF = useCallback(async (row) => {
    try {
      const res = await api.get(`/quotations/${row.id}/view-pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to open PDF');
    }
  }, []);

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setActionRow(null);
  };

  const runRowAction = (callback) => () => {
    const row = actionRow;
    closeActionMenu();
    if (row) callback(row);
  };

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  const columns = [
    { key: 'id', label: 'ID', width: 70, sortField: 'id', render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography> },
    { key: 'quotation_number', label: 'Quotation #', minWidth: 140, sortField: 'quotation_number', render: (row) => row.quotation_number || '-' },
    { key: 'quotation_date', label: 'Date', minWidth: 110, sortField: 'quotation_date', render: (row) => row.quotation_date || '-' },
    { key: 'customer', label: 'Customer', minWidth: 150, sortField: 'customer_id', render: (row) => row.customer?.name || '-' },
    {
      key: 'grand_total', label: 'Amount', minWidth: 110, sortField: 'grand_total',
      render: (row) => `₹${formatMoney(row.grand_total)}`,
    },
    {
      key: 'status', label: 'Status', minWidth: 120,
      render: (row) => (
        <Chip
          label={row.status?.toUpperCase()}
          size="small"
          sx={{ ...(statusChipSx[row.status] || statusChipSx.draft), fontWeight: 700 }}
        />
      ),
    },
    {
      key: 'action', label: 'Action', minWidth: 84, align: 'right',
      render: (row) => (
        <Tooltip title="Actions">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setActionRow(row);
              setActionAnchorEl(event.currentTarget);
            }}
            aria-label="Quotation actions"
            aria-haspopup="true"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <i className="fas fa-ellipsis-vertical" style={{ fontSize: 13 }} aria-hidden="true" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const totals = calculateTotals();

  if (!canViewQuotations) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view quotations.
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
                Quotations
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total quotations
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search quotations..."
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
              {canCreate("quotations") && (
                <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                  New Quotation
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
                      {column.render ? column.render(row) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={closeActionMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: menuPaperSx } }}
        >
          <MenuItem onClick={runRowAction(viewQuotation)}>
            <ListItemIcon><i className="fas fa-eye" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="View" />
          </MenuItem>
          <MenuItem onClick={runRowAction(handleViewQuotationPDF)}>
            <ListItemIcon><i className="fas fa-file-pdf" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="View PDF" />
          </MenuItem>
          <MenuItem onClick={runRowAction(handleDownloadQuotationPDF)}>
            <ListItemIcon><i className="fas fa-download" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Download PDF" />
          </MenuItem>
          {actionRow?.status !== 'converted' && canEdit("quotations") && (
            <MenuItem onClick={runRowAction(openEdit)}>
              <ListItemIcon><i className="fas fa-edit" aria-hidden="true" /></ListItemIcon>
              <ListItemText primary="Edit" />
            </MenuItem>
          )}
          {actionRow?.status === 'accepted' && canCreate("quotations") && (
            <MenuItem onClick={runRowAction(convertToSale)}>
              <ListItemIcon sx={{ color: 'success.main' }}><i className="fas fa-file-invoice" aria-hidden="true" /></ListItemIcon>
              <ListItemText primary="Convert to Invoice" />
            </MenuItem>
          )}
          {actionRow?.status !== 'converted' && canDelete("quotations") && <Divider />}
          {actionRow?.status !== 'converted' && canDelete("quotations") && (
            <MenuItem onClick={runRowAction(deleteQuotation)} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}><i className="fas fa-trash" aria-hidden="true" /></ListItemIcon>
              <ListItemText primary="Delete" />
            </MenuItem>
          )}
        </Menu>

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

      {/* Add/Edit Dialog */}
      <Dialog
        open={show}
        onClose={(event, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setShow(false); }}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingId ? 'Edit Quotation' : 'New Quotation'}</Typography>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr) 1fr' }, gap: 2, mb: 2 }}>
            <FormControl size="small" fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                label="Customer"
                value={form.customer_id === '' ? '' : String(form.customer_id)}
                onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
              >
                <MenuItem value=""><em>Select Customer</em></MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Quotation Date"
              required
              value={form.quotation_date}
              onChange={e => setForm(f => ({ ...f, quotation_date: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              type="date"
              label="Expiry Date"
              value={form.expiry_date}
              onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {editingId && (
            <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          )}

          <Box sx={{ ...sectionBoxSx, mb: 3 }}>
            <Typography sx={sectionTitleSx}>
              <i className="fas fa-box" aria-hidden="true" />Items
            </Typography>
            <Box sx={borderedTableSx}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 780 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell align="center" sx={{ ...headerCellSx, ...borderedCellSx, width: 40 }}>#</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, minWidth: 220 }}>Item</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 80 }}>Qty</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 110 }}>Price</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 90 }}>Discount</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 90 }}>Tax %</TableCell>
                      <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx, width: 110 }}>Amount</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 48 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.items.map((it, idx) => {
                      const qty = parseFloat(it.quantity) || 0;
                      const price = parseFloat(it.price) || 0;
                      const discount = parseFloat(it.discount) || 0;
                      const amount = (qty * price) - discount;
                      return (
                        <TableRow key={idx}>
                          <TableCell align="center" sx={borderedCellSx}>{idx + 1}</TableCell>
                          <TableCell sx={borderedCellSx}>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={it.item_id === '' || it.item_id == null ? '' : String(it.item_id)}
                                onChange={e => updateItem(idx, 'item_id', e.target.value)}
                              >
                                <MenuItem value=""><em>Select Item</em></MenuItem>
                                {items.map(i => <MenuItem key={i.id} value={String(i.id)}>{i.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={borderedCellSx}>
                            <TextField size="small" type="number" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                          </TableCell>
                          <TableCell sx={borderedCellSx}>
                            <TextField size="small" type="number" inputProps={{ step: '0.01' }} value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
                          </TableCell>
                          <TableCell sx={borderedCellSx}>
                            <TextField size="small" type="number" inputProps={{ step: '0.01' }} value={it.discount || ''} onChange={e => updateItem(idx, 'discount', e.target.value)} placeholder="0" />
                          </TableCell>
                          <TableCell sx={borderedCellSx}>
                            <TextField size="small" type="number" inputProps={{ step: '0.01' }} value={it.tax_percentage || ''} onChange={e => updateItem(idx, 'tax_percentage', e.target.value)} placeholder="0" />
                          </TableCell>
                          <TableCell align="right" sx={{ ...borderedCellSx, fontWeight: 700 }}>₹{amount.toFixed(2)}</TableCell>
                          <TableCell align="center" sx={borderedCellSx}>
                            <IconButton size="small" color="error" onClick={() => removeItemRow(idx)} aria-label="Remove item">
                              <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Button variant="outlined" size="small" onClick={addItemRow} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                Add Item
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
            <TextField
              size="small"
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Terms & conditions, delivery details, etc."
            />
            <Box sx={sectionBoxSx}>
              <Box sx={borderedTableSx}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell align="right" sx={{ ...borderedCellSx, width: '50%', fontWeight: 700 }}>Subtotal:</TableCell>
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
            {editingId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewShow} onClose={() => setViewShow(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Quotation #{viewData?.quotation_number}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {viewData?.status === 'accepted' && canCreate("quotations") && (
              <Button variant="contained" color="success" size="small" onClick={() => { setViewShow(false); convertToSale(viewData); }} startIcon={<i className="fas fa-file-invoice" aria-hidden="true" />}>
                Convert to Invoice
              </Button>
            )}
            {viewData?.status !== 'converted' && canEdit("quotations") && (
              <Button variant="contained" size="small" onClick={() => { setViewShow(false); openEdit(viewData); }} startIcon={<i className="fas fa-edit" aria-hidden="true" />}>
                Edit
              </Button>
            )}
            <Button variant="outlined" size="small" disabled={!viewData} onClick={() => handleViewQuotationPDF(viewData)} startIcon={<i className="fas fa-file-pdf" aria-hidden="true" />}>
              View PDF
            </Button>
            <Button variant="outlined" size="small" disabled={!viewData} onClick={() => handleDownloadQuotationPDF(viewData)} startIcon={<i className="fas fa-download" aria-hidden="true" />}>
              Download
            </Button>
            <IconButton size="small" onClick={() => setViewShow(false)} aria-label="Close">
              <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {viewData && (
            <>
              <Box sx={{ ...sectionBoxSx, p: 2.5, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Customer:</Typography>
                    <Typography variant="body2">{viewData.customer?.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Date:</Typography>
                    <Typography variant="body2">{viewData.quotation_date}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Expiry:</Typography>
                    <Typography variant="body2">{viewData.expiry_date || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Status:</Typography>
                    <Box><Chip label={viewData.status?.toUpperCase()} size="small" sx={{ ...(statusChipSx[viewData.status] || statusChipSx.draft), fontWeight: 700 }} /></Box>
                  </Box>
                </Box>
              </Box>

              {/* Status Workflow */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {viewData.status === 'draft' && canEdit("quotations") && (
                    <>
                      <Button variant="outlined" size="small" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'sent'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Sent"); }} startIcon={<i className="fas fa-paper-plane" aria-hidden="true" />}>
                        Mark as Sent
                      </Button>
                      <Button variant="outlined" size="small" color="success" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'accepted'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Accepted"); }} startIcon={<i className="fas fa-check" aria-hidden="true" />}>
                        Mark as Accepted
                      </Button>
                    </>
                  )}
                  {viewData.status === 'sent' && canEdit("quotations") && (
                    <>
                      <Button variant="outlined" size="small" color="success" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'accepted'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Accepted"); }} startIcon={<i className="fas fa-check" aria-hidden="true" />}>
                        Mark as Accepted
                      </Button>
                      <Button variant="outlined" size="small" color="error" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'rejected'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Rejected"); }} startIcon={<i className="fas fa-times" aria-hidden="true" />}>
                        Mark as Rejected
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>

              <Box sx={{ ...borderedTableSx, mb: 3 }}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Item</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Qty</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Price</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Discount</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Tax</TableCell>
                        <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewData.items?.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={borderedCellSx}>{it.item?.name}</TableCell>
                          <TableCell sx={borderedCellSx}>{it.quantity}</TableCell>
                          <TableCell sx={borderedCellSx}>₹{it.price}</TableCell>
                          <TableCell sx={borderedCellSx}>₹{it.discount || 0}</TableCell>
                          <TableCell sx={borderedCellSx}>₹{it.tax_amount || 0}</TableCell>
                          <TableCell align="right" sx={{ ...borderedCellSx, fontWeight: 700 }}>₹{it.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Box sx={{ ...borderedTableSx, maxWidth: 400, width: '100%' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell align="right" sx={{ ...borderedCellSx, fontWeight: 700 }}>Subtotal:</TableCell>
                        <TableCell align="right" sx={borderedCellSx}>₹{viewData.subtotal}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={borderedCellSx}>Discount:</TableCell>
                        <TableCell align="right" sx={{ ...borderedCellSx, color: 'error.main' }}>-₹{viewData.discount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={borderedCellSx}>Tax:</TableCell>
                        <TableCell align="right" sx={borderedCellSx}>₹{viewData.tax}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>Grand Total:</TableCell>
                        <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>₹{viewData.grand_total}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {viewData.notes && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Notes:</Typography>
                  <Typography variant="body2" sx={{ mb: 0 }}>{viewData.notes}</Typography>
                </Box>
              )}
              {viewData.converted_sale && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.main', color: '#fff', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    <i className="fas fa-check-circle" style={{ marginRight: 8 }} aria-hidden="true" />
                    Converted to Invoice: {viewData.converted_sale.invoice_number}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setViewShow(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
