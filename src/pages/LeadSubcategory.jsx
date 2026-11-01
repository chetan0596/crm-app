import { useCallback, useEffect, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
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
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { Iconify } from "../components/iconify";
import { DataTable } from "../components/data-table";

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

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

export default function LeadSubcategory() {

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

  const [cats, setCats] = useState([]);

  const [searchInput, setSearchInput] = useState(initialTable.search);

  const [columnAnchorEl, setColumnAnchorEl] = useState(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('subcategory-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return {
      id: true,
      name: true,
      category: true,
      action: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('subcategory-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);

  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");
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
      const r = await api.get("/lead-subcategories", {
        params: table,
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

      const catsRes = await api.get("/lead-categories", {
        params: { perPage: 1000 },
        signal,
      });
      setCats(toArray(catsRes.data));
    } catch {
      setServerMode(false);
      setRawRows([]);
      setRows([]);
      setTotal(0);
      setCats([]);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [reloadKey, load]);

  const displayRows = serverMode ? rows : rawRows;

  // ================= MODAL =================

  const openAdd = () => {
    setEdit(null);
    setName("");
    setCatId("");
    setErr("");
    setShow(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setName(r.name);
    setCatId(r.category_id);
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

    if (!catId) {
      toast.warning("Category required");
      setErr("Category required");
      return;
    }

    try {

      setSaving(true);
      setErr("");

      if (edit) {
        await api.put(`/lead-subcategories/${edit.id}`, {
          name,
          category_id: catId
        });
      } else {
        await api.post(`/lead-subcategories`, {
          name,
          category_id: catId
        });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("Subcategory saved successfully");

    } catch (e) {

      const msg = e.response?.data?.errors?.name?.[0] ?? "Save failed";
      toast.error(msg);
      setErr(msg);

    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================

  const del = (r) => {
    Swal.fire({
      title: "Delete subcategory?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await api.delete(`/lead-subcategories/${r.id}`);
        setReloadKey(k => k + 1);
        toast.success("Subcategory deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  // ================= TABLE =================

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const columnOptions = [
    ['id', 'ID'],
    ['name', 'Name'],
    ['category', 'Category'],
  ];

  const shownColumnLabel = [
    visibleCols.id && 'ID',
    visibleCols.name && 'Name',
    visibleCols.category && 'Category',
  ].filter(Boolean).join(', ') || 'None';

  const columns = [
    visibleCols.id && {
      key: 'id', label: 'ID', sortField: 'id', width: 100,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{r.id}</Typography>,
    },
    visibleCols.name && { key: 'name', label: 'Name', sortField: 'name' },
    visibleCols.category && {
      key: 'category',
      label: 'Category',
      render: (r) => r.category?.name,
    },
    visibleCols.action && {
      key: 'action',
      label: 'Action',
      width: 140,
      align: 'right',
      render: (r) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton size="small" color="primary" onClick={() => openEdit(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Edit">
            <Iconify icon="fa6-solid:pen-to-square" width={13} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => del(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Delete">
            <Iconify icon="fa6-solid:trash-can" width={13} />
          </IconButton>
        </Stack>
      ),
    },
  ].filter(Boolean);

  // ================= UI =================

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Subcategories
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 220 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="fa6-solid:magnifying-glass" width={13} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button variant="contained" onClick={openAdd} startIcon={<Iconify icon="fa6-solid:plus" width={16} />}>
                Add
              </Button>
            </Stack>
          </Box>
        </CardContent>

        <Divider />
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Show columns:
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={(event) => setColumnAnchorEl(event.currentTarget)}
            startIcon={<Iconify icon="fa6-solid:table-columns" width={16} />}
          >
            {shownColumnLabel}
          </Button>
          <Menu anchorEl={columnAnchorEl} open={Boolean(columnAnchorEl)} onClose={() => setColumnAnchorEl(null)}>
            {columnOptions.map(([key, label]) => (
              <MenuItem key={key} onClick={() => setVisibleCols(v => ({ ...v, [key]: !v[key] }))}>
                <Checkbox checked={Boolean(visibleCols[key])} size="small" />
                <ListItemText primary={label} />
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={displayRows}
          loading={loading}
          emptyMessage="No data found"
          emptyHint="Try adjusting your filters or check back later"
          minWidth={640}
          server={serverMode}
          total={total}
          page={table.page}
          perPage={table.perPage}
          sortField={table.sortField}
          sortDir={table.sortDir}
          globalFilter={serverMode ? undefined : table.search}
          onPageChange={(pageIndex) => dispatch({ type: 'PAGE', page: pageIndex + 1 })}
          onPerPageChange={(size) => dispatch({ type: 'PER_PAGE', perPage: size })}
          onSortChange={(field, dir) => dispatch({ type: 'SORT', field, dir })}
          columnVisibility={visibleCols}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* ================= MODAL ================= */}

      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {edit ? "Edit" : "Add"} Subcategory
          </Typography>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <Iconify icon="fa6-solid:xmark" width={14} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={catId === "" ? "" : String(catId)}
                onChange={e => setCatId(e.target.value)}
              >
                <MenuItem value=""><em>Select Category</em></MenuItem>
                {cats.map(c => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name}
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

            {err && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {err}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
