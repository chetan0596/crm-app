import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Switch,
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

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const strVal = (v) => (v === "" || v == null ? "" : String(v));

function tableReducer(state, action) {
  switch (action.type) {
    case "PAGE":
      return { ...state, page: action.page };
    case "PER_PAGE":
      return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH":
      return { ...state, search: action.search, page: 1 };
    case "SORT":
      return { ...state, sortField: action.field, sortDir: action.dir };
    default:
      return state;
  }
}

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

const statusChipSx = (active) => (active
  ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
  : { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 });

const visibleColumnOptions = [
  ['id', 'ID'],
  ['name', 'Name'],
  ['state', 'State'],
  ['pincode', 'Pincode'],
  ['status', 'Status'],
  ['action', 'Action'],
];

export default function City() {

  const [params, setParams] = useSearchParams();

  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 25),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };

  const [table, dispatch] = useReducer(tableReducer, initialTable);

  const [rawRows, setRawRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [serverMode, setServerMode] = useState(false);

  const [states, setStates] = useState([]);

  const [searchInput, setSearchInput] = useState(initialTable.search);

  const [columnAnchorEl, setColumnAnchorEl] = useState(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('city-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          id: true,
          name: true,
          state: true,
          pincode: true,
          status: true,
          action: true,
        };
      }
    }
    return {
      id: true,
      name: true,
      state: true,
      pincode: true,
      status: true,
      action: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('city-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);

  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // ================= LOAD =================

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page,
      perPage: table.perPage,
      search: table.search,
      sort: table.sortField,
      dir: table.sortDir,
    });

    if (newParams.toString() !== params.toString()) {
      setParams(newParams);
    }
  }, [params, setParams, table]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) {
        dispatch({ type: "SEARCH", search: s });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = useCallback(async (signal) => {
    try {
      setLoading(true);
      const r = await api.get("/cities", {
        params: {
          ...table,
          with: 'state'
        },
        signal,
      });

      const payload = r.data;

      if (payload && Array.isArray(payload.data)) {
        setServerMode(true);
        setRows(payload.data);
        setTotal(Number(payload.total) || 0);
        setRawRows([]);
      } else if (payload && Array.isArray(payload.data?.data)) {
        setServerMode(true);
        setRows(payload.data.data);
        setTotal(Number(payload.data.total) || 0);
        setRawRows([]);
      } else if (Array.isArray(payload?.data)) {
        setServerMode(false);
        setRawRows(payload.data);
      } else if (Array.isArray(payload)) {
        setServerMode(false);
        setRawRows(payload);
      } else {
        setServerMode(false);
        setRawRows([]);
      }

      const statesRes = await api.get("/states", {
        params: { perPage: 1000 },
        signal,
      });
      setStates(toArray(statesRes.data));
    } catch {
      setServerMode(false);
      setRawRows([]);
      setRows([]);
      setTotal(0);
      setStates([]);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const filteredRows = useMemo(() => {
    if (serverMode) return [];

    const q = table.search.trim().toLowerCase();
    if (!q) return rawRows;
    return rawRows.filter(r => (r?.name ?? "").toLowerCase().includes(q));
  }, [rawRows, serverMode, table.search]);

  const clientRows = useMemo(() => {
    if (serverMode) return [];

    const dir = table.sortDir === "asc" ? 1 : -1;
    const field = table.sortField;

    const sorted = [...filteredRows].sort((a, b) => {
      const av = a?.[field];
      const bv = b?.[field];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }

      return String(av).localeCompare(String(bv)) * dir;
    });

    const start = (table.page - 1) * table.perPage;
    const end = start + table.perPage;
    return sorted.slice(start, end);
  }, [filteredRows, serverMode, table.page, table.perPage, table.sortDir, table.sortField]);

  const displayRows = serverMode ? rows : clientRows;
  const displayTotal = serverMode ? total : filteredRows.length;

  // ================= MODAL =================

  const openAdd = () => {
    setEdit(null);
    setName("");
    setStateId("");
    setPincode("");
    setStatus(true);
    setErr("");
    setShow(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setName(r.name);
    setStateId(strVal(r.state_id));
    setPincode(r.pincode || "");
    setStatus(r.status === 1 || r.status === true);
    setErr("");
    setShow(true);
  };

  // ================= SAVE =================

  const save = async () => {

    if (!name.trim()) {
      toast.warning("Name required");
      setErr("Name required");
      return;
    }

    if (!stateId) {
      toast.warning("State required");
      setErr("State required");
      return;
    }

    try {

      setSaving(true);
      setErr("");

      if (edit) {
        await api.put(`/cities/${edit.id}`, {
          name,
          state_id: stateId,
          pincode: pincode.trim() || null,
          status: status ? 1 : 0
        });
      } else {
        await api.post(`/cities`, {
          name,
          state_id: stateId,
          pincode: pincode.trim() || null,
          status: status ? 1 : 0
        });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("City saved successfully");

    } catch (e) {

      const msg = e.response?.data?.errors?.name?.[0] ??
                  e.response?.data?.errors?.state_id?.[0] ??
                  e.response?.data?.message ??
                  "Save failed";
      toast.error(msg);
      setErr(msg);

    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================

  const del = (r) => {
    Swal.fire({
      title: "Delete city?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await api.delete(`/cities/${r.id}`);
        setReloadKey(k => k + 1);
        toast.success("City deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  // ================= TABLE =================

  const columns = [
    visibleCols.id && {
      key: 'id', label: 'ID', sortField: 'id', width: 90,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography>,
    },
    visibleCols.name && {
      key: 'name', label: 'Name', sortField: 'name', minWidth: 160,
      render: (row) => row.name || '-',
    },
    visibleCols.state && {
      key: 'state', label: 'State', sortField: 'state.name', minWidth: 140,
      render: (row) => row.state?.name || '-',
    },
    visibleCols.pincode && {
      key: 'pincode', label: 'Pincode', sortField: 'pincode', width: 110,
      render: (row) => row.pincode || '-',
    },
    visibleCols.status && {
      key: 'status', label: 'Status', sortField: 'status', width: 110,
      render: (row) => <Chip label={row.status ? 'Active' : 'Inactive'} size="small" sx={statusChipSx(Boolean(row.status))} />,
    },
    visibleCols.action && {
      key: 'action', label: 'Action', width: 110, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={actionBtnSx} aria-label="Edit city">
              <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => del(row)} sx={{ ...actionBtnSx, color: 'error.main' }} aria-label="Delete city">
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

  // ================= UI =================

  return (
    <Box>

      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Cities
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {displayTotal} total cities
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
              <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                Add
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
          <Table sx={{ minWidth: 760 }} size="small">
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
              {displayRows.length === 0 && !loading ? (
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
              ) : displayRows.map((row) => (
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
          count={displayTotal}
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


      {/* ================= MODAL ================= */}

      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${edit ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {edit ? "Edit" : "Add"} City
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel id="city-state-label">State</InputLabel>
              <Select
                labelId="city-state-label"
                label="State"
                value={strVal(stateId)}
                onChange={e => setStateId(e.target.value)}
              >
                <MenuItem value=""><em>Select State</em></MenuItem>
                {states.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
            />

            <TextField
              size="small"
              label="Pincode"
              placeholder="Enter pincode (optional)"
              value={pincode}
              onChange={e => setPincode(e.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={<Switch checked={status} onChange={e => setStatus(e.target.checked)} />}
              label="Active"
            />

            {err && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {err}
              </Alert>
            )}
          </Stack>
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
