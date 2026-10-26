import { useEffect, useMemo, useReducer, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
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
  ListItemText,
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
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";

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

const gridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
  gap: 2,
};

const fullSpanSx = { gridColumn: '1 / -1' };

const strVal = (v) => (v === "" || v == null ? "" : String(v));

const sortValue = (r, field) => {
  switch (field) {
    case 'name': return r.name;
    case 'phone': return r.phone;
    case 'email': return r.email;
    case 'stage': return r.stage;
    case 'source': return r.source;
    case 'assigned_to': return r.assigned_to_user?.name ?? "-";
    case 'expected_close_date': return r.expected_close_date;
    case 'follow_up_date': return r.follow_up_date;
    case 'expected_value': return r.expected_value;
    default: return r[field];
  }
};

const emptyForm = {
  lead_type: "individual",
  name: "",
  phone_code: "+91 IN",
  phone: "",
  whatsapp_code: "+91 IN",
  whatsapp: "",
  email: "",
  lead_category_id: "",
  lead_subcategory_id: "",
  source: "",
  stage: "",
  description: "",
  address: "",
  pincode: "",
  country: "India",
  state_id: "",
  city_id: "",
  gstin: "",
  assigned_to: "",
  expected_close_date: "",
  follow_up_date: "",
  expected_value: "",
  company_name: "",
  industry: "",
  company_size: "",
  source_other: "",
  notes: "",
  tags: [],
};

export default function LeadsExtended() {
  const canViewPage = canView("leads");

  const [table, dispatch] = useReducer(tableReducer, {
    page: 1,
    perPage: 25,
    search: "",
    sortField: "id",
    sortDir: "desc",
  });

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [uiSort, setUiSort] = useState({ field: null, dir: 'asc' });

  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [, setSubcategories] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [users, setUsers] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [showAdvance, setShowAdvance] = useState(false);

  const [form, setForm] = useState(emptyForm);

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
      const r = await api.get("/leads", {
        params: table,
        signal,
      });

      const payload = r.data;

      if (payload && Array.isArray(payload.data)) {
        setRows(payload.data);
        setTotal(Number(payload.total) || 0);
      } else if (Array.isArray(payload)) {
        setRows(payload);
        setTotal(0);
      } else {
        setRows([]);
        setTotal(0);
      }
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

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [catRes, subRes, srcRes, stageRes, userRes, tagRes] = await Promise.all([
          api.get("/lead-categories", { params: { perPage: 200 } }),
          api.get("/lead-subcategories", { params: { perPage: 200 } }),
          api.get("/lead-sources/list"),
          api.get("/lead-stages/list"),
          api.get("/users", { params: { perPage: 200 } }),
          api.get("/lead-tags", { params: { status: 1 } }),
        ]);
        setCategories(toArray(catRes.data));
        setSubcategories(toArray(subRes.data));
        setLeadSources(toArray(srcRes.data));
        setLeadStages(toArray(stageRes.data));
        setUsers(toArray(userRes.data));
        setTags(toArray(tagRes.data));
      } catch { /* ignore */ }
    };
    loadMasters();
  }, []);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const res = await api.get("/states");
        setStates(toArray(res.data));
      } catch { /* ignore */ }
    };
    loadStates();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      const stateId = form.state_id;
      if (!stateId) {
        setCities([]);
        return;
      }

      try {
        const res = await api.get(`/states/${stateId}/cities`);
        setCities(toArray(res.data));
      } catch {
        setCities([]);
      }
    };
    loadCities();
  }, [form.state_id]);

  const openAdd = () => {
    setForm(emptyForm);
    setShowAdvance(false);
    setShow(true);
  };

  const openEdit = useCallback((r) => {
    setForm({
      ...emptyForm,
      editId: r.id,
      lead_type: r.lead_type || "individual",
      name: r.name || "",
      phone_code: r.phone_code || "+91 IN",
      phone: r.phone || "",
      whatsapp_code: r.whatsapp_code || "+91 IN",
      whatsapp: r.whatsapp || "",
      email: r.email || "",
      lead_category_id: r.lead_category_id ?? "",
      lead_subcategory_id: r.lead_subcategory_id ?? "",
      source: r.source || "",
      stage: r.stage || "",
      description: r.description || "",
      address: r.address || "",
      pincode: r.pincode || "",
      country: r.country || "India",
      state_id: r.state_id || "",
      city_id: r.city_id || "",
      gstin: r.gstin || "",
      assigned_to: r.assigned_to || "",
      expected_close_date: r.expected_close_date || "",
      follow_up_date: r.follow_up_date || "",
      expected_value: r.expected_value || "",
      company_name: r.company_name || "",
      industry: r.industry || "",
      company_size: r.company_size || "",
      source_other: r.source_other || "",
      notes: r.notes || "",
      tags: (Array.isArray(r.tags) ? r.tags : []).map((t) => String(typeof t === "object" ? t.id : t)),
    });
    setShowAdvance(false);
    setShow(true);
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Name required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags.map((t) => (typeof t === "object" ? t.id : t)) : [],
      };

      if (form.editId) {
        await api.put(`/leads/${form.editId}`, payload);
        toast.success("Lead updated");
      } else {
        await api.post("/leads", payload);
        toast.success("Lead created");
      }

      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = useCallback(async (row) => {
    const ok = await Swal.fire({
      title: "Delete Lead?",
      text: row?.name || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/leads/${row.id}`);
      toast.success("Deleted");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  }, []);

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleUiSort = (field) => {
    setUiSort((s) => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const displayRows = useMemo(() => {
    if (!uiSort.field) return rows;
    const dir = uiSort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortValue(a, uiSort.field);
      const bv = sortValue(b, uiSort.field);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, uiSort]);

  const columns = [
    {
      key: 'id', label: 'ID', width: 80,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{r.id}</Typography>,
    },
    { key: 'name', label: 'Name', sortField: 'name', render: (r) => r.name },
    { key: 'phone', label: 'Phone', sortField: 'phone', render: (r) => r.phone },
    { key: 'email', label: 'Email', sortField: 'email', render: (r) => r.email },
    { key: 'stage', label: 'Stage', sortField: 'stage', render: (r) => r.stage },
    { key: 'source', label: 'Source', sortField: 'source', render: (r) => r.source },
    { key: 'assigned_to', label: 'Assigned To', sortField: 'assigned_to', render: (r) => r.assigned_to_user?.name ?? "-" },
    { key: 'expected_close_date', label: 'Expected Close', sortField: 'expected_close_date', render: (r) => r.expected_close_date },
    { key: 'follow_up_date', label: 'Follow Up', sortField: 'follow_up_date', render: (r) => r.follow_up_date },
    { key: 'expected_value', label: 'Expected Value', sortField: 'expected_value', render: (r) => r.expected_value },
    {
      key: 'tags', label: 'Tags',
      render: (r) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .5 }}>
          {(Array.isArray(r.tags) ? r.tags : []).map((t) => (
            <Chip
              key={typeof t === "object" ? t.id : t}
              label={typeof t === "object" ? t.name : t}
              size="small"
              sx={{ bgcolor: (typeof t === "object" ? t.color : null) ?? '#6c757d', color: '#fff', fontWeight: 600 }}
            />
          ))}
        </Box>
      ),
    },
    {
      key: 'action', label: 'Action', width: 140, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {canEdit("leads") && (
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" onClick={() => openEdit(row)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Edit">
                <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete("leads") && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => remove(row)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Delete">
                <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
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
                Leads (Extended)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                All fields enabled
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search name/phone/email"
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
                  New Lead
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1100 }} size="small">
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
                        active={uiSort.field === column.sortField}
                        direction={uiSort.field === column.sortField ? uiSort.dir : 'asc'}
                        onClick={() => handleUiSort(column.sortField)}
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
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 7 }}>
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
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
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
        maxWidth="lg"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className={`fas ${form.editId ? 'fa-edit' : 'fa-plus'}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {form.editId ? "Edit" : "Create"} Lead (Extended)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={gridSx}>
            <Box sx={fullSpanSx}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: .5 }}>
                Type <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <RadioGroup row value={form.lead_type} onChange={update('lead_type')}>
                <FormControlLabel value="business" control={<Radio size="small" />} label="Business" />
                <FormControlLabel value="individual" control={<Radio size="small" />} label="Individual" />
              </RadioGroup>
            </Box>

            <TextField
              size="small"
              label="Name"
              required
              placeholder="Name"
              value={form.name}
              onChange={update('name')}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 1.5 }}>
              <FormControl size="small" fullWidth required>
                <InputLabel>Code</InputLabel>
                <Select label="Code" value={strVal(form.phone_code)} onChange={update('phone_code')}>
                  <MenuItem value="+91 IN">+91 IN</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Phone no"
                required
                placeholder="Phone no"
                value={form.phone}
                onChange={update('phone')}
                fullWidth
              />
            </Box>

            <TextField
              size="small"
              type="email"
              label="Email"
              placeholder="Email"
              value={form.email}
              onChange={update('email')}
              fullWidth
            />

            <FormControl size="small" fullWidth required>
              <InputLabel>Lead Stage</InputLabel>
              <Select label="Lead Stage" value={form.stage} onChange={update('stage')}>
                {(leadStages.length ? leadStages : [{ id: 0, name: 'New Lead' }]).map((s) => (
                  <MenuItem key={s.id ?? s.name} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Assigned To</InputLabel>
              <Select label="Assigned To" value={strVal(form.assigned_to)} onChange={update('assigned_to')}>
                <MenuItem value=""><em>Choose</em></MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>{u.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Lead Category</InputLabel>
              <Select
                label="Lead Category"
                value={strVal(form.lead_category_id)}
                onChange={(e) => setForm({ ...form, lead_category_id: e.target.value, lead_subcategory_id: "" })}
              >
                <MenuItem value=""><em>Choose</em></MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Lead Source</InputLabel>
              <Select label="Lead Source" value={form.source} onChange={update('source')}>
                <MenuItem value=""><em>Choose</em></MenuItem>
                {leadSources.map((s) => (
                  <MenuItem key={s.id ?? s.name} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {form.source === "Other" && (
              <TextField
                size="small"
                label="Source (Other)"
                placeholder="Specify source"
                value={form.source_other}
                onChange={update('source_other')}
                fullWidth
              />
            )}

            <TextField
              size="small"
              label="Description"
              placeholder="Description"
              value={form.description}
              onChange={update('description')}
              multiline
              rows={3}
              fullWidth
              sx={fullSpanSx}
            />

            <Box sx={{ ...fullSpanSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Advance Options
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowAdvance(!showAdvance)}
              >
                {showAdvance ? "Click to hide" : "Click to show"}
              </Button>
            </Box>

            <Collapse in={showAdvance} unmountOnExit sx={fullSpanSx}>
              <Box sx={gridSx}>
                <TextField
                  size="small"
                  type="email"
                  label="Email"
                  placeholder="Email"
                  value={form.email}
                  onChange={update('email')}
                  fullWidth
                />

                <TextField
                  size="small"
                  label="Address"
                  placeholder="Address"
                  value={form.address}
                  onChange={update('address')}
                  multiline
                  rows={3}
                  fullWidth
                  sx={fullSpanSx}
                />

                <Box sx={{ ...fullSpanSx, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <TextField
                    size="small"
                    label="Pincode"
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={update('pincode')}
                    fullWidth
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select label="Country" value={form.country} onChange={update('country')}>
                      <MenuItem value="India">India</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      label="State"
                      value={strVal(form.state_id)}
                      onChange={(e) => setForm({ ...form, state_id: e.target.value, city_id: "" })}
                    >
                      <MenuItem value=""><em>Choose</em></MenuItem>
                      {states.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ ...fullSpanSx, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>City</InputLabel>
                    <Select
                      label="City"
                      value={strVal(form.city_id)}
                      onChange={update('city_id')}
                      disabled={!form.state_id}
                    >
                      <MenuItem value=""><em>Choose</em></MenuItem>
                      {cities.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="GSTIN (TAX No.)"
                    placeholder="GSTIN (TAX No.)"
                    value={form.gstin}
                    onChange={update('gstin')}
                    fullWidth
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Assigned To</InputLabel>
                    <Select label="Assigned To" value={strVal(form.assigned_to)} onChange={update('assigned_to')}>
                      <MenuItem value=""><em>Choose</em></MenuItem>
                      {users.map((u) => (
                        <MenuItem key={u.id} value={String(u.id)}>{u.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ ...fullSpanSx, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <TextField
                    size="small"
                    type="date"
                    label="Expected Close Date"
                    value={form.expected_close_date}
                    onChange={update('expected_close_date')}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Follow Up Date"
                    value={form.follow_up_date}
                    onChange={update('follow_up_date')}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Expected Value"
                    value={form.expected_value}
                    onChange={update('expected_value')}
                    slotProps={{ htmlInput: { step: 0.01 } }}
                    fullWidth
                  />
                </Box>

                {form.lead_type === "business" && (
                  <Box sx={{ ...fullSpanSx, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <TextField
                      size="small"
                      label="Company Name"
                      placeholder="Company Name"
                      value={form.company_name}
                      onChange={update('company_name')}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Industry"
                      placeholder="Industry"
                      value={form.industry}
                      onChange={update('industry')}
                      fullWidth
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Company Size</InputLabel>
                      <Select label="Company Size" value={form.company_size} onChange={update('company_size')}>
                        <MenuItem value=""><em>Choose</em></MenuItem>
                        <MenuItem value="Small">Small</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Large">Large</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                <FormControl size="small" fullWidth sx={fullSpanSx}>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    label="Tags"
                    value={(form.tags || []).map(String)}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    renderValue={(selected) =>
                      tags
                        .filter((t) => selected.includes(String(t.id)))
                        .map((t) => t.name)
                        .join(", ")
                    }
                  >
                    {tags.map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>
                        <Checkbox checked={(form.tags || []).map(String).includes(String(t.id))} size="small" />
                        <ListItemText primary={t.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="Notes"
                  placeholder="Internal notes"
                  value={form.notes}
                  onChange={update('notes')}
                  multiline
                  rows={4}
                  fullWidth
                  sx={fullSpanSx}
                />
              </Box>
            </Collapse>
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
