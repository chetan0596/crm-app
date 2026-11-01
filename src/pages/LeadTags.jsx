import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  Alert,
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";
import { Iconify } from "../components/iconify";
import { DataTable } from "../components/data-table";

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
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

export default function LeadTags() {
  const canViewPage = canView("leads");

  const [table, dispatch] = useReducer(tableReducer, {
    page: 1,
    perPage: 25,
    search: "",
  });

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [nameSort, setNameSort] = useState(null);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    color: "",
    priority: "",
    status: true,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) dispatch({ type: "SEARCH", search: s });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = useCallback(async (signal) => {
    if (!canViewPage) return;
    try {
      setLoading(true);

      const r = await api.get("/lead-tags", {
        params: {
          search: table.search,
          page: table.page,
          perPage: table.perPage,
        },
        signal,
      });

      const data = toArray(r.data);
      const sorted = [...data].sort((a, b) => {
        const ap = getNum(a?.priority, 0);
        const bp = getNum(b?.priority, 0);
        if (ap !== bp) return ap - bp;
        return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
      });
      setRows(sorted);
      setTotal(Number(r.data?.total) || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [canViewPage, table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [reloadKey, load]);

  const openAdd = () => {
    setEdit(null);
    setForm({ name: "", color: "", priority: "", status: true });
    setShow(true);
  };

  const openEdit = (row) => {
    setEdit(row);
    setForm({
      name: row?.name || "",
      color: row?.color || "",
      priority: row?.priority ?? 0,
      status: !!row?.status,
    });
    setShow(true);
  };

  const moveRow = useCallback(async (row, dir) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const targetIdx = idx + (dir === "up" ? -1 : 1);
    if (idx < 0 || targetIdx < 0 || targetIdx >= rows.length) return;

    try {
      const newOrder = [...rows];
      const [moved] = newOrder.splice(idx, 1);
      newOrder.splice(targetIdx, 0, moved);

      await api.post("/lead-tags/reorder", {
        ordered_ids: newOrder.map((r) => r.id),
      });

      toast.success("Priority updated");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Reorder failed");
    }
  }, [rows]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Name required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        color: String(form.color || "").trim() || null,
        status: !!form.status,
      };

      if (String(form.priority).trim() !== "") {
        payload.priority = getNum(form.priority, 0);
      }

      if (edit?.id) {
        await api.put(`/lead-tags/${edit.id}`, payload);
        toast.success("Tag updated");
      } else {
        await api.post("/lead-tags", payload);
        toast.success("Tag created");
      }

      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const ok = await Swal.fire({
      title: "Delete Tag?",
      text: row?.name || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/lead-tags/${row.id}`);
      toast.success("Deleted");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const displayRows = useMemo(() => {
    if (!nameSort) return rows;
    const dir = nameSort === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => String(a?.name ?? "").localeCompare(String(b?.name ?? "")) * dir);
  }, [rows, nameSort]);

  const columns = [
    {
      key: 'id', label: 'ID', width: 80,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{r.id}</Typography>,
    },
    { key: 'name', label: 'Name', sortField: 'name' },
    {
      key: 'color', label: 'Color', width: 140,
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: 1,
              bgcolor: r.color || '#94a3b8',
            }}
          />
          <Typography variant="body2" color="text.secondary">{r.color || "-"}</Typography>
        </Box>
      ),
    },
    {
      key: 'priority', label: 'Priority', width: 150,
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{r.priority ?? 0}</Typography>
          {canEdit("leads") && (
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                aria-label="Move up"
                onClick={() => moveRow(r, "up")}
                disabled={rows.findIndex((x) => x.id === r.id) <= 0}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <Iconify icon="fa6-solid:arrow-up" width={11} />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Move down"
                onClick={() => moveRow(r, "down")}
                disabled={(() => {
                  const idx = rows.findIndex((x) => x.id === r.id);
                  return idx < 0 || idx >= rows.length - 1;
                })()}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <Iconify icon="fa6-solid:arrow-down" width={11} />
              </IconButton>
            </Stack>
          )}
        </Box>
      ),
    },
    {
      key: 'status', label: 'Status', width: 110,
      render: (r) => (
        <Chip
          label={r.status ? "Active" : "Inactive"}
          size="small"
          sx={r.status
            ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
            : { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }}
        />
      ),
    },
    {
      key: 'action', label: 'Action', width: 140, align: 'right',
      render: (r) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {canEdit("leads") && (
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" onClick={() => openEdit(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Edit">
                <Iconify icon="fa6-solid:pen-to-square" width={13} />
              </IconButton>
            </Tooltip>
          )}
          {canDelete("leads") && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => remove(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Delete">
                <Iconify icon="fa6-solid:trash-can" width={13} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canViewPage) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        Access denied
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Lead Tags
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                Create tags for better lead management
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 260 } }}
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
              {canCreate("leads") && (
                <Button variant="contained" onClick={openAdd} startIcon={<Iconify icon="fa6-solid:plus" width={16} />}>
                  New
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={displayRows}
          loading={loading}
          emptyMessage="No data found"
          emptyHint="Try adjusting your filters or check back later"
          minWidth={760}
          server
          total={total}
          page={table.page}
          perPage={table.perPage}
          sortField={nameSort ? 'name' : undefined}
          sortDir={nameSort}
          onPageChange={(pageIndex) => dispatch({ type: 'PAGE', page: pageIndex + 1 })}
          onPerPageChange={(size) => dispatch({ type: 'PER_PAGE', perPage: size })}
          onSortChange={(field, dir) => setNameSort(dir)}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Iconify icon={edit?.id ? 'fa6-solid:pen-to-square' : 'fa6-solid:plus'} width={15} sx={{ color: '#062849' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {edit?.id ? "Edit" : "Create"} Tag
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <Iconify icon="fa6-solid:xmark" width={14} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <TextField
              size="small"
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: .75 }}>
                  Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="input"
                    type="color"
                    value={form.color || "#6c757d"}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    sx={{
                      width: 54,
                      height: 40,
                      p: 0.5,
                      border: '1px solid',
                      borderColor: 'rgba(145, 158, 171, 0.32)',
                      borderRadius: 2,
                      bgcolor: '#ffffff',
                      cursor: 'pointer',
                    }}
                  />
                  <TextField
                    size="small"
                    value={form.color || "#6c757d"}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#6c757d"
                    fullWidth
                  />
                </Box>
              </Box>
              <TextField
                size="small"
                type="number"
                label="Priority"
                placeholder="Auto"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
              />
            }
            label={form.status ? "Active" : "Inactive"}
          />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
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
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
