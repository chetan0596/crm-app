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
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";

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

export default function LeadSources() {
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
    description: "",
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
      const r = await api.get("/lead-sources", {
        params: {
          page: table.page,
          perPage: table.perPage,
          search: table.search,
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

  const moveRow = useCallback(async (row, dir) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const targetIdx = idx + (dir === "up" ? -1 : 1);
    if (idx < 0 || targetIdx < 0 || targetIdx >= rows.length) return;

    try {
      const newOrder = [...rows];
      const [moved] = newOrder.splice(idx, 1);
      newOrder.splice(targetIdx, 0, moved);

      await api.post('/lead-sources/reorder', {
        ordered_ids: newOrder.map((r) => r.id),
      });

      toast.success("Priority updated");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Reorder failed");
    }
  }, [rows]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [reloadKey, load]);

  const openAdd = () => {
    setEdit(null);
    setForm({ name: "", description: "", priority: "", status: true });
    setShow(true);
  };

  const openEdit = (row) => {
    setEdit(row);
    setForm({
      name: row?.name || "",
      description: row?.description || "",
      priority: row?.priority ?? 0,
      status: !!row?.status,
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Name required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        status: !!form.status,
      };

      if (String(form.priority).trim() !== "") {
        payload.priority = getNum(form.priority, 0);
      }

      if (edit?.id) {
        await api.put(`/lead-sources/${edit.id}`, payload);
        toast.success("Lead Source updated");
      } else {
        await api.post(`/lead-sources`, payload);
        toast.success("Lead Source created");
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
      title: "Delete Lead Source?",
      text: row?.name || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/lead-sources/${row.id}`);
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

  const handleNameSort = () => {
    setNameSort((s) => (s === 'asc' ? 'desc' : 'asc'));
  };

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
                Lead Sources
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                Set priority to control dropdown order
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
                        <i className="fas fa-search" style={{ fontSize: 13 }} aria-hidden="true" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {canCreate("leads") && (
                <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                  New
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ ...headCellSx, width: 80 }}>ID</TableCell>
                <TableCell sx={headCellSx}>
                  <TableSortLabel
                    active={Boolean(nameSort)}
                    direction={nameSort || 'asc'}
                    onClick={handleNameSort}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: 150 }}>Priority</TableCell>
                <TableCell sx={{ ...headCellSx, width: 110 }}>Status</TableCell>
                <TableCell align="right" sx={{ ...headCellSx, width: 140 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 7 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No data found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try adjusting your filters or check back later
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayRows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={bodyCellSx}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>#{r.id}</Typography>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{r.name}</TableCell>
                  <TableCell sx={bodyCellSx}>
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
                            <i className="fas fa-arrow-up" style={{ fontSize: 11 }} aria-hidden="true" />
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
                            <i className="fas fa-arrow-down" style={{ fontSize: 11 }} aria-hidden="true" />
                          </IconButton>
                        </Stack>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Chip
                      label={r.status ? "Active" : "Inactive"}
                      size="small"
                      sx={r.status
                        ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
                        : { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={bodyCellSx}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {canEdit("leads") && (
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => openEdit(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Edit">
                            <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete("leads") && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => remove(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Delete">
                            <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
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
          rowsPerPageOptions={[10, 15, 20, 25, 30]}
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
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${edit ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {edit ? "Edit" : "Create"} Lead Source
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
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
            <TextField
              size="small"
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Box>
                <TextField
                  size="small"
                  type="number"
                  label="Priority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  fullWidth
                />
                {!edit && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: .5 }}>
                    Leave blank to auto-set priority
                  </Typography>
                )}
              </Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status ? "1" : "0"}
                  onChange={(e) => setForm({ ...form, status: e.target.value === "1" })}
                >
                  <MenuItem value="1">Active</MenuItem>
                  <MenuItem value="0">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShow(false)} disabled={saving}>
            Close
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
