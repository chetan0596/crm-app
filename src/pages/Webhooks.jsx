import { useCallback, useEffect, useReducer, useState } from "react";
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
  return [];
};

const EVENT_OPTIONS = [
  { value: "lead.created", label: "Lead Created" },
  { value: "lead.updated", label: "Lead Updated" },
  { value: "lead.deleted", label: "Lead Deleted" },
  { value: "lead.assigned", label: "Lead Assigned" },
  { value: "follow-up.created", label: "Follow-up Created" },
  { value: "follow-up.completed", label: "Follow-up Completed" },
];

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

const bodyCellSx = { verticalAlign: 'middle', px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' };

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

export default function Webhooks() {
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
  const [form, setForm] = useState({
    name: "",
    url: "",
    type: "push",
    events: [],
    active: true,
    secret: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testLoading, setTestLoading] = useState(null);

  const canViewWebhooks = canView("webhooks");
  const canCreateWebhook = canCreate("webhooks");
  const canEditWebhook = canEdit("webhooks");
  const canDeleteWebhook = canDelete("webhooks");

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
    setLoading(true);
    try {
      const res = await api.get("/webhooks", {
        params: {
          page: table.page,
          perPage: table.perPage,
          search: table.search,
          sortField: table.sortField,
          sortDir: table.sortDir,
        },
        signal,
      });
      setRows(toArray(res.data.data ?? res.data));
      setTotal(Number(res.data.total ?? res.data?.data?.total) || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", url: "", type: "push", events: [], active: true, secret: "", description: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      url: row.url,
      type: row.type || "push",
      events: row.events || [],
      active: row.active ?? true,
      secret: row.secret || "",
      description: row.description || "",
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name || !form.url) {
      toast.warning("Name and URL are required");
      return;
    }
    if (!form.events.length) {
      toast.warning("Select at least one event");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/webhooks/${editingId}`, form);
        toast.success("Webhook updated");
      } else {
        await api.post("/webhooks", form);
        toast.success("Webhook created");
      }
      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteWebhook = (row) => {
    Swal.fire({
      title: "Delete webhook?",
      text: `Webhook: ${row.name}?`,
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/webhooks/${row.id}`);
        setReloadKey((k) => k + 1);
        toast.success("Webhook deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  const testWebhook = async (row) => {
    try {
      setTestLoading(row.id);
      const res = await api.post(`/webhooks/${row.id}/test`);
      if (res.data?.success) {
        toast.success(`Webhook test sent — Status: ${res.data.status || "OK"}`);
      } else {
        toast.error(`Webhook test failed — ${res.data?.message || "Unknown error"}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Test failed");
    } finally {
      setTestLoading(null);
    }
  };

  const toggleEvent = (eventValue) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(eventValue)
        ? f.events.filter((e) => e !== eventValue)
        : [...f.events, eventValue],
    }));
  };

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  if (!canViewWebhooks) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        You do not have permission to view webhooks.
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 24px rgba(28,37,46,.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <i className="fas fa-link" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Webhooks
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search webhooks..."
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
              {canCreateWebhook && (
                <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                  New Webhook
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

        {loading && <LinearProgress />}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ ...headCellSx, width: 70 }}>
                  <TableSortLabel
                    active={table.sortField === 'id'}
                    direction={table.sortField === 'id' ? table.sortDir : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={headCellSx}>
                  <TableSortLabel
                    active={table.sortField === 'name'}
                    direction={table.sortField === 'name' ? table.sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={headCellSx}>URL</TableCell>
                <TableCell sx={{ ...headCellSx, width: 80 }}>Type</TableCell>
                <TableCell sx={headCellSx}>Events</TableCell>
                <TableCell sx={{ ...headCellSx, width: 90 }}>Status</TableCell>
                <TableCell sx={{ ...headCellSx, width: 140 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 7, borderBottom: 0 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No webhooks found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Create a webhook to push or pull lead data
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={bodyCellSx}>{row.id}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Tooltip title={row.url || ''}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ color: 'text.secondary', maxWidth: 240 }}
                      >
                        {row.url}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Chip
                      label={row.type}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        ...(row.type === "push"
                          ? { bgcolor: '#eaf0f6', color: '#062849' }
                          : { bgcolor: '#caf4ff', color: '#006c9c' }),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(row.events || []).slice(0, 2).map((e) => (
                        <Chip key={e} label={e} size="small" variant="outlined" />
                      ))}
                      {(row.events || []).length > 2 && (
                        <Chip label={`+${(row.events || []).length - 2}`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569' }} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Chip
                      label={row.active ? "Active" : "Inactive"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        ...(row.active
                          ? { bgcolor: '#dbf5e9', color: '#118d57' }
                          : { bgcolor: '#f1f5f9', color: '#475569' }),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx} align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {canEditWebhook && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(row)} aria-label="Edit webhook" sx={{ color: 'primary.main' }}>
                            <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Test webhook">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => testWebhook(row)}
                            disabled={testLoading === row.id}
                            aria-label="Test webhook"
                            sx={{ color: 'info.main' }}
                          >
                            {testLoading === row.id ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <i className="fas fa-vial" style={{ fontSize: 13 }} aria-hidden="true" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      {canDeleteWebhook && (
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => deleteWebhook(row)} aria-label="Delete webhook" sx={{ color: 'error.main' }}>
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
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(event, page) => {
            const nextPage = page + 1;
            if (nextPage !== table.page) dispatch({ type: 'PAGE', page: nextPage });
          }}
          onRowsPerPageChange={(event) => {
            const nextSize = Number(event.target.value);
            if (nextSize !== table.perPage) dispatch({ type: 'PER_PAGE', perPage: nextSize });
          }}
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? "Edit Webhook" : "New Webhook"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              size="small"
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Slack Lead Notification"
              fullWidth
            />

            <TextField
              size="small"
              label="Webhook URL"
              required
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://hooks.example.com/lead-events"
              helperText={form.type === "push" ? "We will POST lead data to this URL when events occur." : "We will periodically fetch leads from this URL."}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <MenuItem value="push">Push (send data out)</MenuItem>
                  <MenuItem value="pull">Pull (fetch data in)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.active ? "1" : "0"}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "1" }))}
                >
                  <MenuItem value="1">Active</MenuItem>
                  <MenuItem value="0">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              size="small"
              type="password"
              label="Secret Key (optional)"
              value={form.secret}
              onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
              placeholder="For HMAC signature verification"
              fullWidth
            />

            <TextField
              size="small"
              label="Description (optional)"
              multiline
              rows={2}
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g., Sends new leads to Slack #leads channel. Maintained by IT team."
              fullWidth
            />

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>
                Events <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                {EVENT_OPTIONS.map((evt) => {
                  const checked = form.events.includes(evt.value);
                  return (
                    <Box
                      key={evt.value}
                      onClick={() => toggleEvent(evt.value)}
                      role="button"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        cursor: 'pointer',
                        bgcolor: checked ? 'rgba(101, 40, 232, 0.08)' : '#fff',
                        borderColor: checked ? 'secondary.main' : 'divider',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: checked ? 'secondary.main' : '#919eab' },
                      }}
                    >
                      <Checkbox checked={checked} size="small" sx={{ p: 0, pointerEvents: 'none' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: checked ? 'secondary.dark' : 'text.primary' }}>
                        {evt.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
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
            {editingId ? "Update Webhook" : "Save Webhook"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
