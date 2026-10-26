import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
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

export default function Permissions() {
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

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", guard_name: "web" });
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

  const load = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/permissions", { params: table, signal });
      const payload = res.data;
      const list = toArray(payload);
      setRows(list);
      const t = Number(payload?.total ?? payload?.data?.total);
      setTotal(Number.isFinite(t) ? t : list.length);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  }, [table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", guard_name: "web" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, guard_name: row.guard_name || "web" });
    setShow(true);
  };

  const save = async () => {
    if (!form.name) { toast.warning("Permission name required"); return; }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/permissions/${editingId}`, form);
        toast.success("Permission updated");
      } else {
        await api.post("/permissions", form);
        toast.success("Permission created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePermission = (row) => {
    Swal.fire({
      title: "Delete permission?",
      text: `Permission: ${row.name}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/permissions/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Permission deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  // Group permissions
  const groupedPermissions = useMemo(() => {
    const groups = {};
    rows.forEach(p => {
      const parts = p.name.split('-');
      const group = parts[0] || 'general';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return groups;
  }, [rows]);

  const columns = [
    { key: 'id', label: 'ID', sortField: 'id', width: 70, render: (r) => r.id },
    { key: 'name', label: 'Name', sortField: 'name', render: (r) => r.name },
    { key: 'guard_name', label: 'Guard', width: 100, render: (r) => r.guard_name },
    {
      key: 'group', label: 'Group', width: 140,
      render: (row) => {
        const group = row.name.split('-')[0] || 'general';
        return (
          <Chip
            size="small"
            label={group}
            sx={{ textTransform: 'capitalize', bgcolor: '#f1f5f9', color: '#475569' }}
          />
        );
      },
    },
    {
      key: 'action', label: 'Action', width: 120,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => openEdit(row)}
              aria-label="Edit permission"
              sx={{ border: '1px solid', borderColor: 'divider', color: 'primary.main' }}
            >
              <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => deletePermission(row)}
              aria-label="Delete permission"
              sx={{ border: '1px solid', borderColor: 'divider', color: 'error.main' }}
            >
              <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Permissions
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total permissions
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search permissions..."
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
              <Button
                variant="contained"
                onClick={openAdd}
                startIcon={<i className="fas fa-plus" aria-hidden="true" />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                New Permission
              </Button>
            </Stack>
          </Box>
        </CardContent>

        {/* Permission Groups Summary */}
        {Object.keys(groupedPermissions).length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 1.5,
                }}
              >
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <Box
                    key={group}
                    sx={{
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', textTransform: 'capitalize', mb: 0.75 }}>
                      {group}
                    </Typography>
                    <Chip size="small" color="info" label={`${perms.length} permissions`} />
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }} size="small">
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
          rowsPerPageOptions={[10, 20, 50, 100]}
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
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? 'Edit Permission' : 'New Permission'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              size="small"
              label="Permission Name"
              required
              placeholder="e.g., users-create, items-edit"
              helperText="Use format: module-action (e.g., users-create, sales-view)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Guard Name</InputLabel>
              <Select
                label="Guard Name"
                value={form.guard_name}
                onChange={e => setForm(f => ({ ...f, guard_name: e.target.value }))}
              >
                <MenuItem value="web">web</MenuItem>
                <MenuItem value="api">api</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShow(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          >
            {editingId ? 'Update Permission' : 'Save Permission'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
