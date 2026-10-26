import { useEffect, useReducer, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
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

const selVal = (v) => (v == null || v === "" ? "" : String(v));

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
  p: 2.5,
  bgcolor: '#f8fafc',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  height: '100%',
};

const sectionTitleSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  color: 'primary.main',
  fontWeight: 700,
  fontSize: 15,
  pb: 1.5,
  mb: 2,
  borderBottom: '1px solid',
  borderColor: 'divider',
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
  minWidth: 168,
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 12px 32px rgba(28,37,46,.14)',
};

export default function Purchase() {
  const nav = useNavigate();
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

  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [show, setShow] = useState(false);
  const [viewShow, setViewShow] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);

  const [form, setForm] = useState({
    vendor_id: "",
    warehouse_id: "",
    invoice_type: "Retail",
    bill_date: new Date().toISOString().split('T')[0],
    bill_number: "",
    notes: "",
    discount: 0,
    discount_percentage: 0,
    tax: 0,
    tax_percentage: 0,
    tax_name: "",
    tax_type: "Tax Exclusive",
    gst_type: "CGST/SGST",
    addless_amount: 0,
    addless_title: "Addless",
    items: []
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('purchase-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return { id: true, bill_number: true, vendor: true, warehouse: true, date: true, total: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('purchase-visible-cols', JSON.stringify(visibleCols));
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

  const loadTable = async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/purchases", { params: table, signal });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total ?? 0));
    } catch {
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async (signal) => {
    const [vendorRes, itemRes, taxRes, warehouseRes] = await Promise.allSettled([
      api.get("/vendors", { params: { perPage: 200 }, signal }),
      api.get("/items", { params: { perPage: 200 }, signal }),
      api.get("/taxes", { params: { perPage: 200 }, signal }),
      api.get("/warehouses/list", { signal }),
    ]);

    if (vendorRes.status === 'fulfilled') {
      setVendors(toArray(vendorRes.value.data));
    } else { setVendors([]); toast.error("Failed to load vendors"); }

    if (itemRes.status === 'fulfilled') {
      setItems(toArray(itemRes.value.data));
    } else { setItems([]); toast.error("Failed to load items"); }

    if (taxRes.status === 'fulfilled') {
      setTaxes(toArray(taxRes.value.data));
    } else { setTaxes([]); toast.error("Failed to load taxes"); }

    if (warehouseRes.status === 'fulfilled') {
      setWarehouses(toArray(warehouseRes.value.data));
    } else { setWarehouses([]); toast.error("Failed to load warehouses"); }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadTable(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadDropdowns(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [reloadKey]);

  const generateBillNumber = () => {
    if (!rows || rows.length === 0) return 'PUR001';
    const numbers = rows.map(row => {
      const match = row.bill_number?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `PUR${String(maxNum + 1).padStart(3, '0')}`;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      vendor_id: "",
      warehouse_id: "",
      invoice_type: "Retail",
      bill_date: new Date().toISOString().split('T')[0],
      bill_number: generateBillNumber(),
      notes: "",
      discount: 0,
      discount_percentage: 0,
      tax: 0,
      tax_percentage: 0,
      tax_name: "",
      tax_type: "Tax Exclusive",
      gst_type: "CGST/SGST",
      addless_amount: 0,
      addless_title: "Addless",
      items: [{ item_id: "", quantity: 1, price: 0, tax_id: null, discount: 0 }]
    });
    setShow(true);
  };

  const openEdit = useCallback((row) => {
    setEditingId(row.id);
    setForm({
      vendor_id: row.vendor_id || "",
      warehouse_id: row.warehouse_id ? String(row.warehouse_id) : "",
      bill_date: row.bill_date ? row.bill_date.split('T')[0] : new Date().toISOString().split('T')[0],
      bill_number: row.bill_number || "",
      invoice_type: row.invoice_type || "Retail",
      notes: row.notes || "",
      discount: row.discount || 0,
      discount_percentage: row.discount_percentage || 0,
      tax: row.tax || 0,
      tax_percentage: row.tax_percentage || 0,
      tax_name: row.tax_name || "",
      tax_type: row.tax_type || "Tax Exclusive",
      gst_type: row.gst_type || "CGST/SGST",
      addless_amount: row.addless_amount || 0,
      addless_title: row.addless_title || "Addless",
      items: row.items?.map(it => ({ item_id: it.item_id, quantity: it.quantity, price: it.price, tax_id: it.tax_id || null, discount: it.discount || 0 })) || [{ item_id: "", quantity: 1, price: 0, tax_id: null, discount: 0 }]
    });
    setShow(true);
  }, []);

  const viewPurchase = useCallback((row) => {
    setViewData(row);
    setViewShow(true);
  }, []);

  const handleDownloadPDF = useCallback(async (row) => {
    try {
      const res = await api.get(`/purchases/${row.id}/download-pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `purchase-${row.bill_number || row.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Failed to download PDF');
    }
  }, []);

  const addItemRow = () => {
    setForm(f => ({ ...f, items: [...f.items, { item_id: "", quantity: 1, price: 0, tax_id: null, discount: 0 }] }));
  };

  const removeItemRow = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const itemsList = [...f.items];
      itemsList[idx] = { ...itemsList[idx], [field]: value };
      if (field === 'item_id' && value) {
        const selected = items.find(i => String(i.id) === String(value));
        if (selected) itemsList[idx].price = selected.purchase_price || 0;
      }
      return { ...f, items: itemsList };
    });
  };

  const getItemTaxInfo = (itemId, taxId, quantity, price, discount = 0) => {
    if (!itemId || form.invoice_type !== 'Tax Invoice') {
      return { taxAmount: 0, taxPercentage: 0, taxName: '', baseAmount: 0, isInclusive: false };
    }

    let effectiveTaxId = taxId;
    if (!effectiveTaxId) {
      const selectedItem = items.find(i => String(i.id) === String(itemId));
      effectiveTaxId = selectedItem?.tax_id;
    }

    if (!effectiveTaxId) {
      return { taxAmount: 0, taxPercentage: 0, taxName: '', baseAmount: 0, isInclusive: false };
    }

    const itemTax = taxes.find(t => String(t.id) === String(effectiveTaxId));
    if (!itemTax) return { taxAmount: 0, taxPercentage: 0, taxName: '', baseAmount: 0, isInclusive: false };

    const itemTotal = ((parseFloat(quantity) || 0) * (parseFloat(price) || 0)) - (parseFloat(discount) || 0);
    const taxPercentage = parseFloat(itemTax.percentage) || 0;
    const isInclusive = form.tax_type === 'Tax Inclusive';

    let baseAmount, taxAmount;
    if (isInclusive) {
      baseAmount = itemTotal / (1 + taxPercentage / 100);
      taxAmount = itemTotal - baseAmount;
    } else {
      baseAmount = itemTotal;
      taxAmount = (itemTotal * taxPercentage) / 100;
    }

    return {
      taxAmount,
      taxPercentage,
      taxName: itemTax.name,
      baseAmount,
      isInclusive,
      effectiveTaxId,
    };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalTax = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    form.items.forEach(it => {
      const taxInfo = getItemTaxInfo(it.item_id, it.tax_id, it.quantity, it.price, it.discount);
      const itemNetAmount = taxInfo.isInclusive ? taxInfo.baseAmount : ((parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0) - (parseFloat(it.discount) || 0));
      const itemDiscount = parseFloat(it.discount) || 0;

      subtotal += itemNetAmount;
      totalItemDiscount += itemDiscount;
      totalTax += taxInfo.taxAmount;

      if (form.gst_type === 'CGST/SGST' && taxInfo.taxAmount > 0) {
        cgstTotal += taxInfo.taxAmount / 2;
        sgstTotal += taxInfo.taxAmount / 2;
      } else {
        igstTotal += taxInfo.taxAmount;
      }
    });

    const discount = parseFloat(form.discount) || 0;
    const discountPercentage = parseFloat(form.discount_percentage) || 0;
    const addlessAmount = parseFloat(form.addless_amount) || 0;
    const grandTotal = subtotal - discount + totalTax + addlessAmount;

    return {
      subtotal,
      discount,
      discountPercentage,
      tax: totalTax,
      taxPercentage: 0,
      addlessAmount,
      grandTotal,
      totalItemDiscount,
      cgst: cgstTotal,
      sgst: sgstTotal,
      igst: igstTotal,
    };
  };

  const handleDiscountChange = (field, value) => {
    const subtotal = form.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0), 0);

    if (field === 'discount') {
      const discountAmount = parseFloat(value) || 0;
      const percentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
      setForm(f => ({ ...f, discount: discountAmount, discount_percentage: percentage.toFixed(2) }));
    } else if (field === 'discount_percentage') {
      const percentage = parseFloat(value) || 0;
      const amount = (percentage / 100) * subtotal;
      setForm(f => ({ ...f, discount_percentage: percentage, discount: amount.toFixed(2) }));
    }
  };

  const save = async () => {
    if (!form.vendor_id) { toast.warning("Select vendor"); return; }
    if (!form.warehouse_id) { toast.warning("Select warehouse"); return; }
    if (!form.bill_number) { toast.warning("Bill number required"); return; }
    if (form.items.some(i => !i.item_id)) { toast.warning("Select all items"); return; }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/purchases/${editingId}`, form);
        toast.success("Purchase updated");
      } else {
        await api.post("/purchases", form);
        toast.success("Purchase saved");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = useCallback((row) => {
    Swal.fire({
      title: "Delete purchase?",
      text: `Bill #${row.bill_number}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/purchases/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Purchase deleted");
      } catch { toast.error("Delete failed"); }
    });
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
    visibleCols.id && {
      key: 'id', label: 'ID', sortField: 'id', width: 80,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography>,
    },
    visibleCols.bill_number && {
      key: 'bill_number', label: 'Bill #', sortField: 'bill_number', minWidth: 130,
      render: (row) => row.bill_number || '-',
    },
    visibleCols.vendor && {
      key: 'vendor', label: 'Vendor', sortField: 'vendor_id', minWidth: 150,
      render: (row) => row.vendor?.name || '-',
    },
    visibleCols.warehouse && {
      key: 'warehouse', label: 'Godown', sortField: 'warehouse_id', minWidth: 140,
      render: (row) => row.warehouse?.name || '-',
    },
    visibleCols.date && {
      key: 'date', label: 'Date', sortField: 'bill_date', minWidth: 110,
      render: (row) => row.bill_date || '-',
    },
    visibleCols.total && {
      key: 'total', label: 'Total', sortField: 'total_amount', minWidth: 110,
      render: (row) => `₹${row.total_amount}`,
    },
    visibleCols.action && {
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
            aria-label="Purchase actions"
            aria-haspopup="true"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <i className="fas fa-ellipsis-vertical" style={{ fontSize: 13 }} aria-hidden="true" />
          </IconButton>
        </Tooltip>
      ),
    },
  ].filter(Boolean);

  const visibleColumnOptions = [
    ['id', 'ID'],
    ['bill_number', 'Bill #'],
    ['vendor', 'Vendor'],
    ['warehouse', 'Godown'],
    ['date', 'Date'],
    ['total', 'Total'],
    ['action', 'Action'],
  ];

  const shownColumnCount = visibleColumnOptions.filter(([key]) => visibleCols[key]).length;

  const totals = calculateTotals();
  const { subtotal, discount, discountPercentage, addlessAmount, grandTotal, cgst, sgst, igst } = totals;

  return (
    <Box>

      <Card sx={pageCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Purchase Orders
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total purchases
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search purchases..."
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
                New Purchase
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
          <Table sx={{ minWidth: 900 }} size="small">
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
                      {column.render(row)}
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
          <MenuItem onClick={runRowAction(viewPurchase)}>
            <ListItemIcon><i className="fas fa-eye" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="View" />
          </MenuItem>
          <MenuItem onClick={runRowAction(handleDownloadPDF)}>
            <ListItemIcon><i className="fas fa-file-pdf" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Download PDF" />
          </MenuItem>
          <MenuItem onClick={runRowAction(openEdit)}>
            <ListItemIcon><i className="fas fa-edit" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={runRowAction(deletePurchase)} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><i className="fas fa-trash" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
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

      {/* Add/Edit Purchase Dialog */}
      <Dialog
        open={show}
        onClose={(event, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setShow(false); }}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingId ? 'Edit Purchase' : 'New Purchase'}</Typography>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Header Section - Two Columns */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5, mb: 3 }}>
            {/* Vendor Info */}
            <Box sx={sectionBoxSx}>
              <Typography sx={sectionTitleSx}>
                <i className="fas fa-user" aria-hidden="true" />Vendor Info
              </Typography>
              <FormControl size="small" fullWidth required sx={{ mb: 2 }}>
                <InputLabel>Vendor Name</InputLabel>
                <Select
                  label="Vendor Name"
                  value={selVal(form.vendor_id)}
                  onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Vendor</em></MenuItem>
                  {vendors.map(v => <MenuItem key={v.id} value={String(v.id)}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Discount (₹)"
                  inputProps={{ step: '0.01' }}
                  value={form.discount}
                  onChange={e => handleDiscountChange('discount', e.target.value)}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Discount (%)"
                  inputProps={{ step: '0.01' }}
                  value={form.discount_percentage}
                  onChange={e => handleDiscountChange('discount_percentage', e.target.value)}
                />
              </Box>
            </Box>

            {/* Bill Info */}
            <Box sx={sectionBoxSx}>
              <Typography sx={sectionTitleSx}>
                <i className="fas fa-file-invoice" aria-hidden="true" />Bill Info
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                <TextField
                  size="small"
                  label="Bill #"
                  required
                  value={form.bill_number}
                  onChange={e => setForm(f => ({ ...f, bill_number: e.target.value }))}
                  placeholder="e.g., PUR-001"
                />
                <TextField
                  size="small"
                  type="date"
                  label="Bill Date"
                  required
                  value={form.bill_date}
                  onChange={e => setForm(f => ({ ...f, bill_date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <FormControl size="small" fullWidth required>
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    label="Warehouse"
                    value={selVal(form.warehouse_id)}
                    onChange={e => setForm(f => ({ ...f, warehouse_id: String(e.target.value) }))}
                  >
                    <MenuItem value=""><em>Select Warehouse</em></MenuItem>
                    {warehouses.map(w => <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Invoice Type</InputLabel>
                  <Select
                    label="Invoice Type"
                    value={form.invoice_type}
                    onChange={e => setForm(f => ({ ...f, invoice_type: e.target.value }))}
                  >
                    <MenuItem value="Retail">Retail</MenuItem>
                    <MenuItem value="Tax Invoice">Tax Invoice</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Tax Rate Type</InputLabel>
                  <Select
                    label="Tax Rate Type"
                    value={form.tax_type || 'Tax Exclusive'}
                    onChange={e => setForm(f => ({ ...f, tax_type: e.target.value }))}
                    disabled={form.invoice_type === 'Retail'}
                  >
                    <MenuItem value="Tax Exclusive">Tax Exclusive</MenuItem>
                    <MenuItem value="Tax Inclusive">Tax Inclusive</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: .5 }}>
                  Tax (GST) Type
                </Typography>
                <RadioGroup
                  row
                  name="gst_type"
                  value={form.gst_type || ''}
                  onChange={e => setForm(f => ({ ...f, gst_type: e.target.value }))}
                >
                  <FormControlLabel
                    value="CGST/SGST"
                    control={<Radio size="small" />}
                    label="CGST/SGST"
                    disabled={form.invoice_type === 'Retail'}
                  />
                  <FormControlLabel
                    value="IGST"
                    control={<Radio size="small" />}
                    label="IGST"
                    disabled={form.invoice_type === 'Retail'}
                  />
                </RadioGroup>
              </Box>
            </Box>
          </Box>

          {/* Item Info Section */}
          <Box sx={{ ...sectionBoxSx, p: 2, mb: 3 }}>
            <Typography sx={{ ...sectionTitleSx, borderBottom: 0, pb: 0, mb: 1.5 }}>
              <i className="fas fa-box" aria-hidden="true" />Item Info
            </Typography>
            <Box sx={borderedTableSx}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 860 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell align="center" sx={{ ...headerCellSx, ...borderedCellSx, width: 40 }}>#</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, minWidth: 220 }}>Item</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 80 }}>Qty</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 110 }}>Price (₹)</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 90 }}>Discount</TableCell>
                      <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx, width: 110 }}>Amount</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, minWidth: 130 }}>Tax (%)</TableCell>
                      <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx, width: 90 }}>Tax Amt</TableCell>
                      <TableCell sx={{ ...headerCellSx, ...borderedCellSx, width: 48 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.items.map((it, idx) => {
                      const itemDiscount = parseFloat(it.discount) || 0;
                      const itemAmount = ((parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0)) - itemDiscount;
                      const taxInfo = getItemTaxInfo(it.item_id, it.tax_id, it.quantity, it.price, it.discount);
                      return (
                        <TableRow key={idx}>
                          <TableCell align="center" sx={borderedCellSx}>{idx + 1}</TableCell>
                          <TableCell sx={borderedCellSx}>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={selVal(it.item_id)}
                                onChange={e => updateItem(idx, 'item_id', e.target.value)}
                              >
                                <MenuItem value=""><em>Select Item</em></MenuItem>
                                {items.map(i => <MenuItem key={i.id} value={String(i.id)}>{i.name} (Stock: {i.current_stock})</MenuItem>)}
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
                          <TableCell align="right" sx={{ ...borderedCellSx, fontWeight: 700 }}>₹{itemAmount.toFixed(2)}</TableCell>
                          <TableCell sx={borderedCellSx}>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={selVal(it.tax_id)}
                                onChange={e => updateItem(idx, 'tax_id', e.target.value)}
                                disabled={!it.item_id || form.invoice_type === 'Retail'}
                              >
                                <MenuItem value=""><em>No Tax</em></MenuItem>
                                {taxes.map(t => <MenuItem key={t.id} value={String(t.id)}>{t.name} ({t.percentage}%)</MenuItem>)}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right" sx={{ ...borderedCellSx, color: 'text.secondary' }}>{taxInfo.taxAmount > 0 ? `₹${taxInfo.taxAmount.toFixed(2)}` : '-'}</TableCell>
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

          {/* Bottom Section - Addless, Notes, Summary */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 2.5 }}>
            <Box sx={sectionBoxSx}>
              <Typography sx={sectionTitleSx}>
                <i className="fas fa-edit" aria-hidden="true" />Additional Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                <TextField
                  size="small"
                  label="Addless Title"
                  value={form.addless_title}
                  onChange={e => setForm(f => ({ ...f, addless_title: e.target.value }))}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Addless Amount (₹)"
                  inputProps={{ step: '0.01' }}
                  value={form.addless_amount}
                  onChange={e => setForm(f => ({ ...f, addless_amount: e.target.value }))}
                />
              </Box>
              <TextField
                size="small"
                label="Notes"
                multiline
                rows={2}
                fullWidth
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Enter any additional notes..."
              />
            </Box>

            <Box sx={sectionBoxSx}>
              <Typography sx={sectionTitleSx}>
                <i className="fas fa-calculator" aria-hidden="true" />Summary
              </Typography>
              <Box sx={borderedTableSx}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell align="right" sx={{ ...borderedCellSx, width: '50%', fontWeight: 700 }}>Subtotal:</TableCell>
                      <TableCell align="right" sx={borderedCellSx}>₹{subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" sx={borderedCellSx}>Discount:</TableCell>
                      <TableCell align="right" sx={{ ...borderedCellSx, color: 'error.main' }}>-₹{discount.toFixed(2)} ({discountPercentage.toFixed(1)}%)</TableCell>
                    </TableRow>
                    {form.invoice_type === 'Tax Invoice' && form.gst_type === 'CGST/SGST' ? (
                      <>
                        <TableRow>
                          <TableCell align="right" sx={borderedCellSx}>CGST:</TableCell>
                          <TableCell align="right" sx={borderedCellSx}>₹{cgst.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="right" sx={borderedCellSx}>SGST:</TableCell>
                          <TableCell align="right" sx={borderedCellSx}>₹{sgst.toFixed(2)}</TableCell>
                        </TableRow>
                      </>
                    ) : form.invoice_type === 'Tax Invoice' && (
                      <TableRow>
                        <TableCell align="right" sx={borderedCellSx}>IGST:</TableCell>
                        <TableCell align="right" sx={borderedCellSx}>₹{igst.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell align="right" sx={borderedCellSx}>{form.addless_title}:</TableCell>
                      <TableCell align="right" sx={borderedCellSx}>₹{addlessAmount.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>Grand Total:</TableCell>
                      <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>₹{grandTotal.toFixed(2)}</TableCell>
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
            {editingId ? 'Update Purchase' : 'Save Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Purchase Dialog */}
      <Dialog open={viewShow} onClose={() => setViewShow(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Purchase Details</Typography>
          <IconButton size="small" onClick={() => setViewShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewData && (
            <>
              {/* Header Info */}
              <Box sx={{ ...sectionBoxSx, height: 'auto', mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Vendor:</Typography>
                    <Typography variant="body2">{viewData.vendor?.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Bill #:</Typography>
                    <Typography variant="body2">{viewData.bill_number}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Type:</Typography>
                    <Typography variant="body2">{viewData.invoice_type}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Date:</Typography>
                    <Typography variant="body2">{viewData.bill_date ? new Date(viewData.bill_date).toLocaleDateString('en-IN') : '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Godown:</Typography>
                    <Typography variant="body2">{viewData.warehouse?.name || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Invoice Type:</Typography>
                    <Typography variant="body2">{viewData.invoice_type}</Typography>
                  </Box>
                  {viewData.invoice_type === 'Tax Invoice' && (
                    <>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Tax Rate Type:</Typography>
                        <Typography variant="body2">{viewData.tax_type || 'Tax Exclusive'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>GST Type:</Typography>
                        <Typography variant="body2">{viewData.gst_type || 'CGST/SGST'}</Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              {/* Items Table */}
              <Box sx={{ ...borderedTableSx, mb: 3 }}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell align="center" sx={{ ...headerCellSx, ...borderedCellSx }}>#</TableCell>
                        <TableCell sx={{ ...headerCellSx, ...borderedCellSx }}>Item</TableCell>
                        <TableCell align="center" sx={{ ...headerCellSx, ...borderedCellSx }}>Qty</TableCell>
                        <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx }}>Price (₹)</TableCell>
                        <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx }}>Discount (₹)</TableCell>
                        <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx }}>Amount (₹)</TableCell>
                        <TableCell align="right" sx={{ ...headerCellSx, ...borderedCellSx }}>Tax</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewData.items?.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell align="center" sx={borderedCellSx}>{idx + 1}</TableCell>
                          <TableCell sx={borderedCellSx}>{it.item?.name}</TableCell>
                          <TableCell align="center" sx={borderedCellSx}>{it.quantity}</TableCell>
                          <TableCell align="right" sx={borderedCellSx}>₹{parseFloat(it.price).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={borderedCellSx}>{it.discount ? `₹${parseFloat(it.discount).toFixed(2)}` : '-'}</TableCell>
                          <TableCell align="right" sx={{ ...borderedCellSx, fontWeight: 700 }}>₹{parseFloat(it.amount || (it.quantity * it.price - (it.discount || 0))).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ ...borderedCellSx, color: 'text.secondary' }}>{it.tax_amount ? `₹${parseFloat(it.tax_amount).toFixed(2)}` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Box sx={{ ...borderedTableSx, maxWidth: 400, width: '100%' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell align="right" sx={{ ...borderedCellSx, width: '60%', fontWeight: 700 }}>Subtotal:</TableCell>
                        <TableCell align="right" sx={borderedCellSx}>₹{parseFloat(viewData.total_amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={borderedCellSx}>Discount:</TableCell>
                        <TableCell align="right" sx={{ ...borderedCellSx, color: 'error.main' }}>-₹{parseFloat(viewData.discount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                      {viewData.invoice_type === 'Tax Invoice' && viewData.gst_type === 'CGST/SGST' ? (
                        <>
                          <TableRow>
                            <TableCell align="right" sx={borderedCellSx}>CGST:</TableCell>
                            <TableCell align="right" sx={borderedCellSx}>₹{(parseFloat(viewData.tax || 0) / 2).toFixed(2)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align="right" sx={borderedCellSx}>SGST:</TableCell>
                            <TableCell align="right" sx={borderedCellSx}>₹{(parseFloat(viewData.tax || 0) / 2).toFixed(2)}</TableCell>
                          </TableRow>
                        </>
                      ) : viewData.invoice_type === 'Tax Invoice' && viewData.gst_type === 'IGST' ? (
                        <TableRow>
                          <TableCell align="right" sx={borderedCellSx}>IGST:</TableCell>
                          <TableCell align="right" sx={borderedCellSx}>₹{parseFloat(viewData.tax || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ) : viewData.invoice_type === 'Tax Invoice' && (
                        <TableRow>
                          <TableCell align="right" sx={borderedCellSx}>Tax:</TableCell>
                          <TableCell align="right" sx={borderedCellSx}>₹{parseFloat(viewData.tax || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell align="right" sx={borderedCellSx}>{viewData.addless_title || 'Addless'}:</TableCell>
                        <TableCell align="right" sx={borderedCellSx}>₹{parseFloat(viewData.addless_amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>Grand Total:</TableCell>
                        <TableCell align="right" sx={{ borderBottom: 0, color: '#fff', fontWeight: 700 }}>₹{parseFloat(viewData.grand_total || 0).toFixed(2)}</TableCell>
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
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (!viewData?.id) return;
              setViewShow(false);
              nav(`/debit-notes?purchaseId=${viewData.id}`);
            }}
          >
            Create Debit Note
          </Button>
          <Button variant="outlined" onClick={() => setViewShow(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
