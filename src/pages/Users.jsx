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
  FormControlLabel,
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
import { canCreate, canEdit, canDelete } from "../utils/permissions";

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

const sectionSx = {
  p: 2.5,
  borderRadius: 2.5,
  bgcolor: '#f8fafc',
  border: '1px solid',
  borderColor: 'divider',
};

const ROLE_COLORS = {
  danger: '#dc2626',
  primary: '#062849',
  warning: '#d97706',
  info: '#0284c7',
  secondary: '#64748b',
};

const getRoleMeta = (roleName) => {
  const meta = {
    'Super Admin': { icon: 'fa-crown', color: 'danger', bg: '#ffebee', desc: 'Full access' },
    'Admin': { icon: 'fa-shield-alt', color: 'primary', bg: '#e3f2fd', desc: 'Manage system' },
    'Manager': { icon: 'fa-user-tie', color: 'warning', bg: '#fff3e0', desc: 'Manage operations' },
    'User': { icon: 'fa-user', color: 'info', bg: '#e3f2fd', desc: 'Standard user' },
  };
  return meta[roleName] || { icon: 'fa-user-circle', color: 'secondary', bg: '#f5f5f5', desc: 'Custom role' };
};

const TRANSFER_OPTIONS = [
  { key: 'transfer_assigned_leads', label: 'Assigned Leads', desc: 'Move active lead ownership' },
  { key: 'transfer_created_leads', label: 'Created Leads', desc: 'Change lead creator (historical)' },
  { key: 'transfer_activities', label: 'Activities', desc: 'Change activity creator (historical)' },
  { key: 'transfer_notifications', label: 'Notifications', desc: 'Move unread notifications' },
  { key: 'transfer_source_integrations', label: 'Source Integrations', desc: 'Fixed user & round-robin lists' },
  { key: 'transfer_caller_responses', label: 'IndiaMART Responses', desc: 'Caller response assignments' },
  { key: 'transfer_meta_connections', label: 'Meta Connections', desc: 'Facebook/Meta integrations' },
  { key: 'transfer_meta_form_users', label: 'Meta Form Users', desc: 'Lead form user assignments' },
  { key: 'transfer_inverters', label: 'Inverters & Faults', desc: 'All inverter-related data' },
  { key: 'transfer_plant_infos', label: 'Plant Infos', desc: 'Solar plant monitoring data' },
  { key: 'transfer_stock_transfers', label: 'Stock Transfers', desc: 'Warehouse transfers (historical)' },
  { key: 'transfer_subordinates', label: 'Subordinates', desc: 'Team members who report to this user' },
  { key: 'delete_after_transfer', label: 'Delete Old User', desc: 'Remove user after transfer' },
];

export default function Users() {
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

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]); // For reports_to dropdown

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", roles: [], reports_to: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Transfer dialog state
  const [transferShow, setTransferShow] = useState(false);
  const [transferUser, setTransferUser] = useState(null);
  const [transferToUserId, setTransferToUserId] = useState("");
  const [transferPreview, setTransferPreview] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferConfirming, setTransferConfirming] = useState(false);
  const [transferOptions, setTransferOptions] = useState({
    transfer_assigned_leads: true,
    transfer_created_leads: false,
    transfer_activities: false,
    transfer_notifications: true,
    transfer_source_integrations: true,
    transfer_caller_responses: true,
    transfer_meta_connections: true,
    transfer_meta_form_users: true,
    transfer_inverters: true,
    transfer_plant_infos: true,
    transfer_stock_transfers: false,
    transfer_subordinates: true,
    delete_after_transfer: false,
  });

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
    try {
      setLoading(true);
      const res = await api.get("/users", { params: table, signal });
      const payload = res.data;
      const list = toArray(payload);
      setRows(list);
      const t = Number(payload?.total ?? payload?.data?.total);
      setTotal(Number.isFinite(t) ? t : list.length);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  }, [table]);

  const loadDropdowns = useCallback(async (signal) => {
    const [rolesRes, allUsersRes] = await Promise.allSettled([
      api.get("/roles", { params: { perPage: 200 }, signal }),
      api.get("/users", { params: { perPage: 200 }, signal })
    ]);
    if (rolesRes.status === 'fulfilled') setRoles(toArray(rolesRes.value.data));
    else { setRoles([]); toast.error("Failed to load roles"); }
    if (allUsersRes.status === 'fulfilled') setUsers(toArray(allUsersRes.value.data));
    else { setUsers([]); toast.error("Failed to load users"); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTable(controller.signal);
    return () => controller.abort();
  }, [loadTable, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    loadDropdowns(controller.signal);
    return () => controller.abort();
  }, [loadDropdowns, reloadKey]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", email: "", password: "", roles: [], reports_to: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      email: row.email,
      password: "",
      roles: row.roles?.map(r => r.id) || [],
      reports_to: row.reports_to || ""
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name) { toast.warning("Name required"); return; }
    if (!form.email) { toast.warning("Email required"); return; }
    if (!editingId && !form.password) { toast.warning("Password required"); return; }

    try {
      setSaving(true);
      const data = { ...form };
      if (editingId && !data.password) delete data.password;

      if (editingId) {
        await api.put(`/users/${editingId}`, data);
        toast.success("User updated");
      } else {
        await api.post("/users", data);
        toast.success("User created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (row) => {
    Swal.fire({
      title: "Delete user?",
      text: `User: ${row.name}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/users/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("User deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const openTransfer = (row) => {
    setTransferUser(row);
    setTransferToUserId("");
    setTransferPreview(null);
    setTransferShow(true);
  };

  const loadTransferPreview = async () => {
    if (!transferToUserId) { toast.warning("Select a target user"); return; }
    try {
      setTransferLoading(true);
      const res = await api.post(`/users/${transferUser.id}/transfer-preview`, { to_user_id: transferToUserId });
      setTransferPreview(res.data?.data?.preview || {});
    } catch (e) {
      toast.error(e.response?.data?.message || "Preview failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const executeTransfer = async () => {
    if (!transferToUserId) { toast.warning("Select a target user"); return; }
    try {
      setTransferConfirming(true);
      await api.post(`/users/${transferUser.id}/transfer`, {
        to_user_id: transferToUserId,
        options: transferOptions,
      });
      toast.success("User data transferred successfully");
      setTransferShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Transfer failed");
    } finally {
      setTransferConfirming(false);
    }
  };

  const toggleOption = (key) => {
    setTransferOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRole = (roleId) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(roleId)
        ? f.roles.filter(id => id !== roleId)
        : [...f.roles, roleId]
    }));
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const handleTransferClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setTransferShow(false);
  };

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  const transferPreviewRows = [
    ['assigned_leads', 'Assigned Leads'],
    ['created_leads', 'Created Leads'],
    ['lead_assignments_to', 'Lead Assignments (as recipient)'],
    ['lead_assignments_from', 'Lead Assignments (as sender)'],
    ['activities', 'Activities'],
    ['notifications', 'Notifications'],
    ['source_integrations_fixed', 'Source Integrations (Fixed User)'],
    ['source_integrations_round_robin', 'Source Integrations (Round Robin)'],
    ['caller_responses', 'IndiaMART Caller Responses'],
    ['meta_connections', 'Meta Connections'],
    ['meta_form_users', 'Meta Lead Form Users'],
    ['inverters', 'Inverters'],
    ['inverter_details', 'Inverter Details'],
    ['inverter_faults', 'Inverter Faults'],
    ['plant_infos', 'Plant Infos'],
    ['stock_transfers', 'Stock Transfers'],
    ['subordinates', 'Subordinates (reports to)'],
  ];

  const columns = [
    { key: 'id', label: 'ID', sortField: 'id', width: 70, render: (r) => r.id },
    { key: 'name', label: 'Name', sortField: 'name', render: (r) => r.name },
    { key: 'email', label: 'Email', sortField: 'email', render: (r) => r.email },
    {
      key: 'roles', label: 'Roles',
      render: (row) => (
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {row.roles?.map(r => (
            <Chip
              key={r.id}
              size="small"
              label={r.name}
              sx={{ bgcolor: '#eaf0f6', color: '#062849' }}
            />
          ))}
          {!row.roles?.length && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
          )}
        </Stack>
      ),
    },
    {
      key: 'created', label: 'Created', width: 110,
      render: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      key: 'action', label: 'Action', width: 160,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {canEdit('users') && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEdit(row)}
                aria-label="Edit user"
                sx={{ border: '1px solid', borderColor: 'divider', color: 'primary.main' }}
              >
                <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {canEdit('users') && (
            <Tooltip title="Transfer Data">
              <IconButton
                size="small"
                onClick={() => openTransfer(row)}
                aria-label="Transfer user data"
                sx={{ border: '1px solid', borderColor: 'divider', color: 'warning.dark' }}
              >
                <i className="fas fa-people-arrows" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete('users') && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => deleteUser(row)}
                aria-label="Delete user"
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
                Users
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total users
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search users..."
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
              {canCreate('users') && (
                <Button
                  variant="contained"
                  onClick={openAdd}
                  startIcon={<i className="fas fa-plus" aria-hidden="true" />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  New User
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

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
              {editingId ? 'Edit User' : 'New User'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* User Info Section */}
          <Paper variant="outlined" sx={{ ...sectionSx, mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: 'primary.main', fontWeight: 700, mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <i className="fas fa-user" aria-hidden="true" />
              User Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                size="small"
                label="Full Name"
                required
                placeholder="Enter full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                type="email"
                label="Email Address"
                required
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                fullWidth
              />
            </Box>
            <TextField
              size="small"
              type="password"
              label="Password"
              required={!editingId}
              helperText={editingId ? "Leave blank to keep current password" : ""}
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              fullWidth
              sx={{ mt: 2 }}
            />
            <FormControl size="small" fullWidth sx={{ mt: 2 }}>
              <InputLabel>Reports To (Manager/Team Leader)</InputLabel>
              <Select
                label="Reports To (Manager/Team Leader)"
                value={form.reports_to || ""}
                onChange={e => setForm(f => ({ ...f, reports_to: e.target.value || null }))}
              >
                <MenuItem value=""><em>-- Select Manager --</em></MenuItem>
                {users.filter(u => u.id !== editingId).map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* Roles Section */}
          <Paper variant="outlined" sx={sectionSx}>
            <Typography
              variant="subtitle2"
              sx={{ color: 'primary.main', fontWeight: 700, mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <i className="fas fa-user-shield" aria-hidden="true" />
              Assign Roles
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {roles.map(role => {
                const meta = getRoleMeta(role.name);
                const iconColor = ROLE_COLORS[meta.color] || ROLE_COLORS.secondary;
                const isChecked = form.roles.includes(role.id);
                return (
                  <Box
                    key={role.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRole(role.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRole(role.id); } }}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isChecked ? 'secondary.main' : 'divider',
                      bgcolor: isChecked ? meta.bg : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: 90,
                      boxShadow: isChecked ? '0 2px 8px rgba(28,37,46,.08)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          bgcolor: isChecked ? '#fff' : meta.bg,
                          border: '2px solid',
                          borderColor: isChecked ? 'secondary.main' : 'transparent',
                        }}
                      >
                        <i className={`fas ${meta.icon} fa-lg`} style={{ color: iconColor }} aria-hidden="true" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isChecked ? 'secondary.main' : 'text.primary' }}>
                          {role.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {meta.desc}
                        </Typography>
                      </Box>
                      {isChecked && (
                        <i className="fas fa-check-circle" style={{ color: '#6528e8', fontSize: 16 }} aria-hidden="true" />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShow(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          >
            {editingId ? 'Update User' : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Data Dialog */}
      <Dialog
        open={transferShow}
        onClose={handleTransferClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fas fa-people-arrows" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Transfer User Data
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setTransferShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {transferUser && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>From:</strong> {transferUser.name} ({transferUser.email})
            </Alert>
          )}

          {/* Target User Selection */}
          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Transfer To (Target User)</InputLabel>
            <Select
              label="Transfer To (Target User)"
              value={transferToUserId}
              onChange={e => { setTransferToUserId(e.target.value); setTransferPreview(null); }}
            >
              <MenuItem value=""><em>-- Select User --</em></MenuItem>
              {users.filter(u => u.id !== transferUser?.id).map(u => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              onClick={loadTransferPreview}
              disabled={transferLoading || !transferToUserId}
              startIcon={transferLoading ? <CircularProgress color="inherit" size={16} /> : <i className="fas fa-search" aria-hidden="true" />}
            >
              {transferLoading ? "Loading..." : "Preview Transfer"}
            </Button>
          </Box>

          {/* Preview */}
          {transferPreview && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Data Preview
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableBody>
                    {transferPreviewRows
                      .filter(([key]) => transferPreview[key] > 0)
                      .map(([key, label]) => (
                        <TableRow key={key}>
                          <TableCell sx={bodyCellSx}>{label}</TableCell>
                          <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>{transferPreview[key]}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Transfer Options */}
          {transferPreview && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Transfer Options
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 0.5 }}>
                {TRANSFER_OPTIONS.map(opt => (
                  <FormControlLabel
                    key={opt.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(transferOptions[opt.key])}
                        onChange={() => toggleOption(opt.key)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{opt.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{opt.desc}</Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mr: 0, '& .MuiCheckbox-root': { mt: '-4px' } }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setTransferShow(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={executeTransfer}
            disabled={transferConfirming || !transferPreview}
            startIcon={transferConfirming ? <CircularProgress color="inherit" size={16} /> : <i className="fas fa-people-arrows" aria-hidden="true" />}
          >
            {transferConfirming ? "Transferring..." : "Transfer Data"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
