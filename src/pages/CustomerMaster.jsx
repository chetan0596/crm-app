import { useCallback, useEffect, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
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

const fullSpanSx = { gridColumn: '1 / -1' };

const visibleColumnOptions = [
  ['id', 'ID'],
  ['name', 'Name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['gst', 'GST'],
  ['action', 'Action'],
];

export default function CustomerMaster() {
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

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('customer-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {
      return { id: true, name: true, email: true, phone: true, gst: true, action: true };
    } }
    return { id: true, name: true, email: true, phone: true, gst: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('customer-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", gst_number: "",
    address: "", city: "", state: "", pincode: ""
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

  const load = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/customers", { params: table, signal });
      setRows(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total) || 0);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  }, [table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const openAdd = () => {
    setEditRow(null);
    setForm({ name: "", email: "", phone: "", gst_number: "", address: "", city: "", state: "", pincode: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      name: row.name || "", email: row.email || "", phone: row.phone || "",
      gst_number: row.gst_number || "", address: row.address || "",
      city: row.city || "", state: row.state || "", pincode: row.pincode || ""
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Customer name required");
      return;
    }
    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/customers/${editRow.id}`, form);
      } else {
        await api.post("/customers", form);
      }
      setShow(false);
      setReloadKey(k => k + 1);
      toast.success(editRow ? "Customer updated" : "Customer created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    Swal.fire({
      title: "Delete customer?",
      text: `Remove "${row.name}"?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/customers/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Customer deleted");
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
      key: 'name', label: 'Customer Name', sortField: 'name', minWidth: 170,
      render: (row) => row.name || '-',
    },
    visibleCols.email && {
      key: 'email', label: 'Email', sortField: 'email', minWidth: 180,
      render: (row) => row.email || '-',
    },
    visibleCols.phone && {
      key: 'phone', label: 'Phone', sortField: 'phone', width: 130,
      render: (row) => row.phone || '-',
    },
    visibleCols.gst && {
      key: 'gst', label: 'GST', sortField: 'gst_number', width: 140,
      render: (row) => row.gst_number || '-',
    },
    visibleCols.action && {
      key: 'action', label: 'Action', width: 110, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={actionBtnSx} aria-label="Edit customer">
              <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => remove(row)} sx={{ ...actionBtnSx, color: 'error.main' }} aria-label="Delete customer">
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
                Customer Master
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total customers
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search customers..."
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
                Add Customer
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
              {editRow ? "Edit Customer" : "Add Customer"}
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
              label="Name"
              required
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="GST Number"
              placeholder="e.g., 22AAAAA0000A1Z5"
              value={form.gst_number}
              onChange={e => updateField('gst_number', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              type="email"
              label="Email"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="Phone"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="Address"
              multiline
              rows={2}
              value={form.address}
              onChange={e => updateField('address', e.target.value)}
              fullWidth
              sx={fullSpanSx}
            />
            <Box sx={{ ...fullSpanSx, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                size="small"
                label="City"
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="State"
                value={form.state}
                onChange={e => updateField('state', e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Pincode"
                value={form.pincode}
                onChange={e => updateField('pincode', e.target.value)}
                fullWidth
              />
            </Box>
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
    </Box>
  );
}
