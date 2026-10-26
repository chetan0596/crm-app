import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
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
  Paper,
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
import { canCreate, canEdit, canDelete, hasPermission } from "../utils/permissions";

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

const ACTION_META = {
  view:   { label: "View",   color: "info",      icon: "fa-eye" },
  create: { label: "Create", color: "success",   icon: "fa-plus" },
  edit:   { label: "Edit",   color: "warning",   icon: "fa-edit" },
  delete: { label: "Delete", color: "danger",    icon: "fa-trash" },
};

const ACTION_CHIP_COLORS = {
  info:    { bg: '#e0f2fe', fg: '#0284c7' },
  success: { bg: '#dcfce7', fg: '#16a34a' },
  warning: { bg: '#fef3c7', fg: '#d97706' },
  danger:  { bg: '#fee2e2', fg: '#dc2626' },
};

const getActionChipColors = (color) => ACTION_CHIP_COLORS[color] || { bg: '#f1f5f9', fg: '#64748b' };

const getActionMeta = (permName) => {
  const action = permName.split("-").pop();
  return ACTION_META[action] || { label: action, color: "secondary", icon: "fa-check" };
};

const getScopeLabel = (permName) => {
  const parts = permName.split("-");
  const action = parts.pop();
  if (ACTION_META[action]) {
    if (parts[0] === "lead") parts.shift();
    if (parts[0] === "leads") parts.shift();
    return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Leads";
  }
  return parts.join("-").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function Roles() {
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

  const [permissions, setPermissions] = useState([]);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", guard_name: "web", permissions: [] });
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
    setLoading(true);
    try {
      const rolesRes = await api.get("/roles", {
        params: {
          page: table.page,
          perPage: table.perPage,
          search: table.search,
          sortField: table.sortField,
          sortDir: table.sortDir,
        },
        signal,
      });

      const payload = rolesRes.data;
      const list = toArray(payload);
      setRows(list);
      const t = Number(payload?.total ?? payload?.data?.total);
      setTotal(Number.isFinite(t) ? t : list.length);

      if (hasPermission("permissions-view")) {
        try {
          const permRes = await api.get("/permissions", {
            params: {
              page: 1,
              perPage: 5000,
              sortField: "id",
              sortDir: "asc",
            },
            signal,
          });
          setPermissions(toArray(permRes.data));
        } catch (e) {
          const status = e?.response?.status;
          if (status === 403) {
            setPermissions([]);
          } else {
            throw e;
          }
        }
      } else {
        setPermissions([]);
      }
    } catch {
      setRows([]);
      setTotal(0);
      setPermissions([]);
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
    setForm({ name: "", guard_name: "web", permissions: [] });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      guard_name: row.guard_name || "web",
      permissions: row.permissions?.map(p => p.id) || []
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name) { toast.warning("Role name required"); return; }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/roles/${editingId}`, form);
        toast.success("Role updated");
      } else {
        await api.post("/roles", form);
        toast.success("Role created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = (row) => {
    Swal.fire({
      title: "Delete role?",
      text: `Role: ${row.name}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/roles/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Role deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const togglePermission = (permId) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(permId)
        ? f.permissions.filter(id => id !== permId)
        : [...f.permissions, permId]
    }));
  };

  // Group permissions by prefix and sort by action priority
  const groupedPermissions = useMemo(() => {
    const groups = {};
    const order = ["view", "create", "edit", "delete"];
    permissions.forEach(p => {
      const parts = p.name.split('-');
      const group = parts[0] || 'general';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    Object.keys(groups).forEach((g) => {
      groups[g].sort((a, b) => {
        const ai = order.indexOf(a.name.split("-").pop());
        const bi = order.indexOf(b.name.split("-").pop());
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    });
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
  }, [permissions]);

  const toggleGroup = (groupPerms, allChecked) => {
    setForm(f => {
      const next = new Set(f.permissions);
      groupPerms.forEach((p) => (allChecked ? next.delete(p.id) : next.add(p.id)));
      return { ...f, permissions: Array.from(next) };
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

  const columns = [
    { key: 'id', label: 'ID', sortField: 'id', width: 70, render: (r) => r.id },
    { key: 'name', label: 'Name', sortField: 'name', render: (r) => r.name },
    { key: 'guard_name', label: 'Guard', width: 100, render: (r) => r.guard_name },
    {
      key: 'permissions', label: 'Permissions',
      render: (row) => (
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {row.permissions?.slice(0, 3).map(p => (
            <Chip
              key={p.id}
              size="small"
              label={p.name}
              sx={{ textTransform: 'capitalize', bgcolor: '#e0f2fe', color: '#075985' }}
            />
          ))}
          {row.permissions?.length > 3 && (
            <Chip
              size="small"
              label={`+${row.permissions.length - 3}`}
              sx={{ bgcolor: '#f1f5f9', color: '#475569' }}
            />
          )}
          {!row.permissions?.length && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
          )}
        </Stack>
      ),
    },
    {
      key: 'action', label: 'Action', width: 120,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {canEdit('roles') && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEdit(row)}
                aria-label="Edit role"
                sx={{ border: '1px solid', borderColor: 'divider', color: 'primary.main' }}
              >
                <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete('roles') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => deleteRole(row)}
                aria-label="Delete role"
                sx={{ border: '1px solid', borderColor: 'divider', color: 'error.main' }}
              >
                <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
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
                Roles
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total roles
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search roles..."
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
              {canCreate('roles') && (
                <Button
                  variant="contained"
                  onClick={openAdd}
                  startIcon={<i className="fas fa-plus" aria-hidden="true" />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  New Role
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
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? 'Edit Role' : 'New Role'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mb: 3 }}>
            <TextField
              size="small"
              label="Role Name"
              required
              placeholder="e.g., Admin, Manager"
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

          <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, mb: 1.5 }}>
            Permissions
          </Typography>
          <Box sx={{ maxHeight: 420, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(groupedPermissions).map(([group, perms]) => {
              const selectedCount = perms.filter((p) => form.permissions.includes(p.id)).length;
              const allChecked = perms.every((p) => form.permissions.includes(p.id));
              const someChecked = perms.some((p) => form.permissions.includes(p.id));
              return (
                <Paper key={group} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden', flexShrink: 0 }}>
                  {/* Module Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      bgcolor: '#f8fafc',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: '#e9e4fd',
                        color: 'secondary.main',
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      <i className="fas fa-layer-group" aria-hidden="true" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                          {group.replace(/-/g, " ")}
                        </Typography>
                        <Chip size="small" variant="outlined" label={`${selectedCount} / ${perms.length}`} />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={perms.length ? (selectedCount / perms.length) * 100 : 0}
                        sx={{ mt: 0.75, maxWidth: 160 }}
                      />
                    </Box>
                    <Tooltip title={allChecked ? "Uncheck all" : "Check all"}>
                      <Checkbox
                        size="small"
                        checked={allChecked}
                        indeterminate={!allChecked && someChecked}
                        onChange={() => toggleGroup(perms, allChecked)}
                        inputProps={{ 'aria-label': `${allChecked ? 'Uncheck' : 'Check'} all ${group} permissions` }}
                      />
                    </Tooltip>
                  </Box>
                  {/* Permission Items */}
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                        gap: 1.5,
                      }}
                    >
                      {perms.map((p) => {
                        const checked = form.permissions.includes(p.id);
                        const meta = getActionMeta(p.name);
                        const chipColors = getActionChipColors(meta.color);
                        return (
                          <Box
                            key={p.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => togglePermission(p.id)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePermission(p.id); } }}
                            title={p.name}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: checked ? 'secondary.main' : 'divider',
                              bgcolor: checked ? 'rgba(101,40,232,0.08)' : '#fff',
                              cursor: 'pointer',
                              minHeight: 44,
                              transition: 'all .15s ease',
                            }}
                          >
                            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                              {checked ? (
                                <i className="fas fa-check-square" style={{ color: '#6528e8', fontSize: 14 }} aria-hidden="true" />
                              ) : (
                                <i className="far fa-square" style={{ color: '#919eab', fontSize: 14 }} aria-hidden="true" />
                              )}
                            </Box>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: checked ? '#fff' : chipColors.bg,
                                color: chipColors.fg,
                                fontSize: 11,
                                flexShrink: 0,
                              }}
                            >
                              <i className={`fas ${meta.icon}`} aria-hidden="true" />
                            </Box>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ flex: 1, fontWeight: 500, fontSize: '0.8rem', color: checked ? '#4b16b4' : 'text.primary' }}
                            >
                              <Box component="span" sx={{ color: 'text.secondary' }}>{getScopeLabel(p.name)}</Box>
                              <Box component="span" sx={{ mx: 0.5, color: 'grey.400' }}>·</Box>
                              {meta.label}
                            </Typography>
                            {checked && (
                              <i className="fas fa-check-circle" style={{ color: '#6528e8', fontSize: 14, marginLeft: 'auto', flexShrink: 0 }} aria-hidden="true" />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShow(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          >
            {editingId ? 'Update Role' : 'Save Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
