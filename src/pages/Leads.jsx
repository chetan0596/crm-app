import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
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
import LeadFormDialog from "../components/LeadFormDialog";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";
import { getUserData } from "../utils/permissions";

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function fmtDateForInput(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    case "FILTERS":
      return { ...state, filters: { ...state.filters, ...action.filters }, page: 1 };
    case "RESET_FILTERS":
      return { ...state, filters: { stage: "", source: "", product_name: "", tags: [], assigned_to: "", created_by: "" }, page: 1 };
    default:
      return state;
  }
}

const stageChipSx = (stage) => {
  const s = (stage || "").toLowerCase();
  if (s.includes("new")) return { bgcolor: '#e0f2fe', color: '#075985' };
  if (s.includes("warm")) return { bgcolor: '#fff4d6', color: '#b76e00' };
  if (s.includes("hot")) return { bgcolor: '#ffe4de', color: '#b71d18' };
  if (s.includes("won")) return { bgcolor: '#dbf5e9', color: '#118d57' };
  return { bgcolor: '#f1f5f9', color: '#475569' };
};

// IndiaMART QUERY_TYPE mapping helper
const getIndiamartQueryTypeBadge = (queryType) => {
  const types = {
    'W': { label: 'Direct', sx: { bgcolor: '#eaf0f6', color: '#062849' } },
    'B': { label: 'Buy-Lead', sx: { bgcolor: '#dbf5e9', color: '#118d57' } },
    'P': { label: 'PNS Call', sx: { bgcolor: '#fff4d6', color: '#b76e00' } },
    'BIZ': { label: 'Catalog', sx: { bgcolor: '#caf4ff', color: '#006c9c' } },
    'WA': { label: 'WhatsApp', sx: { bgcolor: '#f1f5f9', color: '#475569' } },
  };
  return types[queryType] || { label: queryType, sx: { bgcolor: '#f1f5f9', color: '#475569' } };
};

const getInitials = (name) => (name || 'U').split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);

const defaultVisibleCols = {
  id: true,
  name: true,
  phone: true,
  lead_stage: true,
  lead_source: true,
  tags: true,
  last_activity: true,
  assignee: true,
  action: true,
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

export default function Leads() {

  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const canViewLeads = canView("leads");
  const currentUser = getUserData();
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;

  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: Math.min(getNum(params.get("perPage"), 10), 200),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
    filters: {
      stage: params.get("stage") || "",
      source: params.get("source") || "",
      product_name: params.get("product_name") || "",
      tags: params.get("tags") ? params.get("tags").split(",") : [],
      assigned_to: params.get("assigned_to") || "",
      created_by: params.get("created_by") || "",
      created_from: params.get("created_from") || "",
      created_to: params.get("created_to") || "",
      activity_from: params.get("activity_from") || "",
      activity_to: params.get("activity_to") || "",
    },
  };

  const [table, dispatch] = useReducer(tableReducer, initialTable);

  const [rawRows, setRawRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [serverMode, setServerMode] = useState(false);

  const [categories, setCategories] = useState([]);
  const [, setSubcategories] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [searchInput, setSearchInput] = useState(initialTable.search);

  // Filter inputs state
  const [filterStage, setFilterStage] = useState(initialTable.filters.stage);
  const [filterSource, setFilterSource] = useState(initialTable.filters.source);
  const [filterProductName, setFilterProductName] = useState(initialTable.filters.product_name);
  const [filterTags, setFilterTags] = useState(initialTable.filters.tags);
  const [filterAssignee, setFilterAssignee] = useState(initialTable.filters.assigned_to);
  const [filterCreatedBy, setFilterCreatedBy] = useState(initialTable.filters.created_by);
  const [filterCreatedFrom, setFilterCreatedFrom] = useState(initialTable.filters.created_from);
  const [filterCreatedTo, setFilterCreatedTo] = useState(initialTable.filters.created_to);
  const [filterActivityFrom, setFilterActivityFrom] = useState(initialTable.filters.activity_from);
  const [filterActivityTo, setFilterActivityTo] = useState(initialTable.filters.activity_to);
  const [showFilters, setShowFilters] = useState(false);
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('leads-visible-cols');
      return saved ? { ...defaultVisibleCols, ...JSON.parse(saved) } : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('leads-visible-cols', JSON.stringify(visibleCols));
    } catch {
      return undefined;
    }
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [edit, setEdit] = useState(null);

  const [form, setForm] = useState({
    lead_type: "individual",
    name: "",
    phone_code: "+91 IN",
    phone: "",
    whatsapp_code: "+91 IN",
    whatsapp: "",
    email: "",
    website: "",
    company_name: "",
    lead_category_id: "",
    lead_subcategory_id: "",
    source: "",
    stage: "New Lead",
    source_other: "",
    description: "",
    address: "",
    pincode: "",
    country: "India",
    state_id: "",
    city_id: "",
    gstin: "",
    status: "open",
    next_follow_up_date: "",
    assigned_to: "",
    expected_close_date: "",
    expected_value: "",
    budget: "",
    priority: "medium",
    notes: "",
    industry: "",
    company_size: "",
    tags: [],
  });

  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [addingCity, setAddingCity] = useState(false);

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // ================= LOAD =================

  // Simple in-memory cache with 10-minute TTL
  const masterCache = useMemo(() => ({
    categories: null,
    subcategories: null,
    leadSources: null,
    leadStages: null,
    users: null,
    tags: null,
    states: null,
    expires: {},
  }), []);

  const fetchWithCache = useCallback(async (key, url, setter) => {
    const now = Date.now();
    if (masterCache[key] && masterCache.expires[key] && now < masterCache.expires[key]) {
      setter(masterCache[key]);
      return;
    }
    const r = await api.get(url);
    const data = toArray(r.data);
    masterCache[key] = data;
    masterCache.expires[key] = now + 600000; // 10 minutes
    setter(data);
  }, [masterCache]);

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page,
      perPage: table.perPage,
      search: table.search,
      sort: table.sortField,
      dir: table.sortDir,
      ...(table.filters.stage && { stage: table.filters.stage }),
      ...(table.filters.source && { source: table.filters.source }),
      ...(table.filters.product_name && { product_name: table.filters.product_name }),
      ...(table.filters.tags.length && { tags: table.filters.tags.join(",") }),
      ...(table.filters.assigned_to && { assigned_to: table.filters.assigned_to }),
      ...(table.filters.created_by && { created_by: table.filters.created_by }),
      ...(table.filters.created_from && { created_from: table.filters.created_from }),
      ...(table.filters.created_to && { created_to: table.filters.created_to }),
      ...(table.filters.activity_from && { activity_from: table.filters.activity_from }),
      ...(table.filters.activity_to && { activity_to: table.filters.activity_to }),
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

  const buildWithQuery = useMemo(() => {
    const withParts = ['tags', 'activities'];
    if (visibleCols.category) withParts.push('category');
    if (visibleCols.subcategory) withParts.push('subcategory');
    if (visibleCols.state) withParts.push('state');
    if (visibleCols.city) withParts.push('city');
    if (visibleCols.stage) withParts.push('leadStage');
    if (visibleCols.source) withParts.push('leadSource');
    return withParts.join(',');
  }, [visibleCols.category, visibleCols.subcategory, visibleCols.state, visibleCols.city, visibleCols.stage, visibleCols.source]);

  const loadTable = useCallback(async (signal) => {
    if (!canViewLeads) return;
    try {
      setLoading(true);
      const r = await api.get('/leads', {
        params: {
          ...table,
          stage: table.filters.stage,
          source: table.filters.source,
          product_name: table.filters.product_name,
          tags: table.filters.tags.join(","),
          assigned_to: table.filters.assigned_to,
          created_by: table.filters.created_by,
          created_from: table.filters.created_from,
          created_to: table.filters.created_to,
          activity_from: table.filters.activity_from,
          activity_to: table.filters.activity_to,
          with: buildWithQuery,
        },
        signal,
      });

      const payload = r.data;
      if (payload && Array.isArray(payload.data)) {
        setServerMode(true); setRows(payload.data); setTotal(Number(payload.total) || 0); setRawRows([]);
      } else if (payload && Array.isArray(payload.data?.data)) {
        setServerMode(true); setRows(payload.data.data); setTotal(Number(payload.data.total) || 0); setRawRows([]);
      } else if (Array.isArray(payload?.data)) {
        setServerMode(false); setRawRows(payload.data);
      } else if (Array.isArray(payload)) {
        setServerMode(false); setRawRows(payload);
      } else {
        setServerMode(false); setRawRows([]);
      }
    } catch {
      setServerMode(false); setRawRows([]); setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [canViewLeads, table, buildWithQuery]);

  const loadDropdowns = useCallback(async () => {
    await Promise.allSettled([
      fetchWithCache('categories', '/lead-categories?perPage=200', setCategories),
      fetchWithCache('subcategories', '/lead-subcategories?perPage=200', setSubcategories),
      fetchWithCache('leadSources', '/lead-sources?perPage=200', setLeadSources),
      fetchWithCache('leadStages', '/lead-stages?perPage=200', setLeadStages),
      fetchWithCache('users', '/leads/assignable-users', setUsers),
      fetchWithCache('tags', '/lead-tags?perPage=200', setTags),
      fetchWithCache('states', '/states?perPage=200', setStates),
    ]);
  }, [fetchWithCache]);

  useEffect(() => {
    const controller = new AbortController();
    loadTable(controller.signal);
    return () => controller.abort();
  }, [loadTable, reloadKey]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns, reloadKey]);

  // Debounced filter updates
  useEffect(() => {
    const t = setTimeout(() => {
      const newFilters = {
        stage: filterStage,
        source: filterSource,
        product_name: filterProductName,
        tags: filterTags,
        assigned_to: filterAssignee,
        created_by: filterCreatedBy,
        created_from: filterCreatedFrom,
        created_to: filterCreatedTo,
        activity_from: filterActivityFrom,
        activity_to: filterActivityTo,
      };
      const currentFilters = table.filters;
      
      // Check if all filters are empty (reset state)
      const allEmpty = !newFilters.stage && !newFilters.source && !newFilters.product_name &&
                      !newFilters.tags.length && !newFilters.assigned_to &&
                      !newFilters.created_by &&
                      !newFilters.created_from && !newFilters.created_to &&
                      !newFilters.activity_from && !newFilters.activity_to;
      
      const currentEmpty = !currentFilters.stage && !currentFilters.source && !currentFilters.product_name &&
                         !currentFilters.tags.length && !currentFilters.assigned_to &&
                         !currentFilters.created_by &&
                         !currentFilters.created_from && !currentFilters.created_to &&
                         !currentFilters.activity_from && !currentFilters.activity_to;
      
      // Skip if both are empty (reset already handled)
      if (allEmpty && currentEmpty) return;
      
      if (
        newFilters.stage !== currentFilters.stage ||
        newFilters.source !== currentFilters.source ||
        newFilters.product_name !== currentFilters.product_name ||
        JSON.stringify(newFilters.tags) !== JSON.stringify(currentFilters.tags) ||
        newFilters.assigned_to !== currentFilters.assigned_to ||
        newFilters.created_by !== currentFilters.created_by ||
        newFilters.created_from !== currentFilters.created_from ||
        newFilters.created_to !== currentFilters.created_to ||
        newFilters.activity_from !== currentFilters.activity_from ||
        newFilters.activity_to !== currentFilters.activity_to
      ) {
        dispatch({ type: "FILTERS", filters: newFilters });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [filterStage, filterSource, filterProductName, filterTags, filterAssignee, filterCreatedBy, filterCreatedFrom, filterCreatedTo, filterActivityFrom, filterActivityTo, table.filters]);

  useEffect(() => {
    const loadCities = async () => {
      const stateId = form.state_id;
      if (!stateId) {
        setCities([]);
        return;
      }

      try {
        const res = await api.get(`/states/${stateId}/cities`);
        setCities(res.data?.data || []);
      } catch {
        setCities([]);
      }
    };
    loadCities();
  }, [form.state_id]);

  const clientRows = useMemo(() => {
    if (serverMode) return [];

    let data = rawRows;
    const q = table.search.trim().toLowerCase();
    if (q) {
      data = data.filter(r => 
        (r?.name ?? "").toLowerCase().includes(q) ||
        (r?.phone ?? "").toLowerCase().includes(q) ||
        (r?.email ?? "").toLowerCase().includes(q)
      );
    }

    const dir = table.sortDir === "asc" ? 1 : -1;
    const field = table.sortField;

    const sorted = [...data].sort((a, b) => {
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
  }, [rawRows, serverMode, table.page, table.perPage, table.search, table.sortDir, table.sortField]);

  useEffect(() => {
    if (serverMode) return;

    const q = table.search.trim().toLowerCase();
    const filtered = q
      ? rawRows.filter(r => 
          (r?.name ?? "").toLowerCase().includes(q) ||
          (r?.phone ?? "").toLowerCase().includes(q) ||
          (r?.email ?? "").toLowerCase().includes(q)
        )
      : rawRows;

    setTotal(filtered.length);
    setRows(clientRows);
  }, [clientRows, rawRows, serverMode, table.search]);

  // ================= MODAL =================

  const openAdd = ()=>{
    setEdit(null);
    setForm({
      lead_type: "individual",
      name: "",
      phone_code: "+91 IN",
      phone: "",
      whatsapp_code: "+91 IN",
      whatsapp: "",
      email: "",
      website: "",
      company_name: "",
      lead_category_id: "",
      lead_subcategory_id: "",
      source: "",
      stage: "New Lead",
      source_other: "",
      description: "",
      address: "",
      pincode: "",
      country: "India",
      state_id: "",
      city_id: "",
      gstin: "",
      status: "open",
      next_follow_up_date: "",
      assigned_to: "",
      expected_close_date: "",
      expected_value: "",
      budget: "",
      priority: "medium",
      notes: "",
      industry: "",
      company_size: "",
      tags: [],
    });
    setShowAdvance(false);
    setErr("");
    setShow(true);
  };

  const openEdit = (r)=>{
    setEdit(r);
    setForm({
      lead_type: r.lead_type || "individual",
      name: r.name || "",
      phone_code: r.phone_code || "+91 IN",
      phone: r.phone || "",
      whatsapp_code: r.whatsapp_code || "+91 IN",
      whatsapp: r.whatsapp || "",
      email: r.email || "",
      website: r.website || "",
      company_name: r.company_name || "",
      lead_category_id: r.lead_category_id || "",
      lead_subcategory_id: r.lead_subcategory_id || "",
      source: r.source || "",
      stage: r.stage || "New Lead",
      source_other: r.source_other || "",
      description: r.description || "",
      address: r.address || "",
      pincode: r.pincode || "",
      country: r.country || "India",
      state_id: r.state_id || "",
      city_id: r.city_id || "",
      gstin: r.gstin || "",
      status: r.status || "open",
      next_follow_up_date: fmtDateForInput(r.next_follow_up_date),
      assigned_to: r.assigned_to || "",
      expected_close_date: fmtDateForInput(r.expected_close_date),
      expected_value: r.expected_value || "",
      budget: r.budget || "",
      priority: r.priority || "medium",
      notes: r.notes || "",
      industry: r.industry || "",
      company_size: r.company_size || "",
      tags: (r.tags || []).map(t => String(t.id)),
    });
    setShowAdvance(false);
    setErr("");
    setShow(true);
  };

  const openAddCity = () => {
    if (!form.state_id) {
      toast.warning("Please select State first");
      return;
    }
    setNewCityName("");
    setShowAddCity(true);
  };

  const saveCity = async () => {
    const name = newCityName.trim();
    if (!name) {
      toast.warning("City name required");
      return;
    }

    try {
      setAddingCity(true);
      const res = await api.post('/cities', {
        state_id: form.state_id,
        name,
      });

      const created = res.data?.data;

      const citiesRes = await api.get(`/states/${form.state_id}/cities`);
      const list = citiesRes.data?.data || [];
      setCities(list);

      if (created?.id) {
        setForm({ ...form, city_id: String(created.id) });
      }

      setShowAddCity(false);
      toast.success("City added");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to add city");
    } finally {
      setAddingCity(false);
    }
  };

  // ================= SAVE =================

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Enter lead name");
      setErr("Lead name required");
      return;
    }

    if (!String(form.phone || "").trim()) {
      toast.warning("Enter phone number");
      setErr("Phone number required");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      if (edit) {
        await api.put(`/leads/${edit.id}`, form);
        toast.success("Lead updated");
      } else {
        await api.post("/leads", form);
        toast.success("Lead created");
      }

      setShow(false);
      setReloadKey(k => k + 1);

    } catch(e) {
      const msg = e.response?.data?.message ?? 
                  e.response?.data?.errors?.name?.[0] ??
                  e.response?.data?.errors?.phone?.[0] ??
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
      title: "Delete lead?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await api.delete(`/leads/${r.id}`);
        setReloadKey(k => k + 1);
        toast.success("Lead deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  const claim = async (row) => {
    try {
      await api.post(`/leads/${row.id}/claim`);
      toast.success("Assigned to you");
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterStage("");
    setFilterSource("");
    setFilterProductName("");
    setFilterTags([]);
    setFilterAssignee("");
    setFilterCreatedBy("");
    setFilterCreatedFrom("");
    setFilterCreatedTo("");
    setFilterActivityFrom("");
    setFilterActivityTo("");
    // Dispatch immediately to avoid double API call
    dispatch({ type: "RESET_FILTERS" });
  };

  const hasActiveFilters = filterStage || filterSource || filterProductName || filterTags.length || filterAssignee || filterCreatedBy || filterCreatedFrom || filterCreatedTo || filterActivityFrom || filterActivityTo;

  // ================= TABLE =================

  const columns = [
    visibleCols.id && {
      key: 'id', label: 'ID', sortField: 'id', width: 80,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography>,
    },
    visibleCols.name && {
      key: 'name', label: 'Name', sortField: 'name', minWidth: 190,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#eaf0f6', color: '#062849', fontSize: 12, fontWeight: 700 }}>
            {getInitials(row.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name || '-'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.email || row.company_name || ''}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    visibleCols.phone && {
      key: 'phone', label: 'Phone', sortField: 'phone', minWidth: 130,
      render: (row) => row.phone || '-',
    },
    visibleCols.lead_stage && {
      key: 'lead_stage', label: 'Lead Stage', sortField: 'stage', minWidth: 120,
      render: (row) => <Chip label={row.stage || '-'} size="small" sx={{ ...stageChipSx(row.stage), fontWeight: 700 }} />,
    },
    visibleCols.lead_source && {
      key: 'lead_source', label: 'Lead Source', sortField: 'source', minWidth: 160,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">{row.source || '-'}</Typography>
          {row.source_type === 'indiamart' && row.query_type && (
            <Chip label={getIndiamartQueryTypeBadge(row.query_type).label} size="small" sx={{ ...getIndiamartQueryTypeBadge(row.query_type).sx, fontSize: 11, fontWeight: 700 }} />
          )}
        </Box>
      ),
    },
    visibleCols.tags && {
      key: 'tags', label: 'Tags', minWidth: 160,
      render: (row) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .5 }}>
          {(row.tags || []).length === 0 && <Typography variant="body2" color="text.secondary">-</Typography>}
          {(row.tags || []).slice(0, 3).map((tag) => (
            <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
          ))}
          {(row.tags || []).length > 3 && <Chip label={`+${row.tags.length - 3}`} size="small" variant="outlined" />}
        </Box>
      ),
    },
    visibleCols.last_activity && {
      key: 'last_activity', label: 'Last Activity', minWidth: 170,
      render: (row) => {
        const last = row.activities?.[0];
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {last?.type ? (last.type.charAt(0).toUpperCase() + last.type.slice(1)) : '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {last?.activity_at ? new Date(last.activity_at).toLocaleString() : ''}
            </Typography>
          </Box>
        );
      },
    },
    visibleCols.assignee && {
      key: 'assignee', label: 'Assignee', minWidth: 190,
      render: (row) => (
        <Stack direction="row" spacing={1.25} alignItems="center">
          {row.assignee?.name ? (
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1ebfd', color: '#6528e8', fontSize: 11, fontWeight: 700 }}>
              {getInitials(row.assignee.name)}
            </Avatar>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.assignee?.name || '-'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.assigned_at ? new Date(row.assigned_at).toLocaleString() : ''}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    visibleCols.action && {
      key: 'action', label: 'Action', minWidth: 84, align: 'right',
      render: (row) => (
        <Tooltip title="Actions">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setActionRow(row);
              setActionAnchorEl(event.currentTarget);
            }}
            aria-label="Lead actions"
            aria-haspopup="true"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <i className="fas fa-ellipsis-vertical" style={{ fontSize: 13 }} aria-hidden="true" />
          </IconButton>
        </Tooltip>
      ),
    },
  ].filter(Boolean);

  const visibleColumnOptions = [
    ['id', 'ID'],
    ['name', 'Name'],
    ['phone', 'Phone'],
    ['lead_stage', 'Lead Stage'],
    ['lead_source', 'Lead Source'],
    ['tags', 'Tags'],
    ['last_activity', 'Last Activity'],
    ['assignee', 'Assignee'],
    ['action', 'Action'],
  ];

  const shownColumnCount = visibleColumnOptions.filter(([key]) => visibleCols[key]).length;

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setActionRow(null);
  };

  const runRowAction = (callback) => () => {
    const row = actionRow;
    closeActionMenu();
    if (row) callback(row);
  };

  const handleSort = (field) => {
    const isAsc = table.sortField === field && table.sortDir === 'asc';
    dispatch({ type: 'SORT', field, dir: isAsc ? 'desc' : 'asc' });
  };

  // ================= UI =================

  if (!canViewLeads) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        Access denied. You don’t have permission to view leads.
      </Alert>
    );
  }

  return (
    <Box>

      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 24px rgba(28,37,46,.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Leads
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                {total} total leads
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search name, phone, email"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 280 } }}
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

              {/* Filter Dropdown */}
              <Button
                variant="outlined"
                onClick={() => setShowFilters(open => !open)}
                startIcon={<i className="fas fa-filter" aria-hidden="true" />}
                endIcon={hasActiveFilters ? <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} /> : null}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Filters
              </Button>

              {canCreate("leads") && (
                <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                  Add Lead
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>

        <Collapse in={showFilters} unmountOnExit>
          <Divider />
          <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                  Filters
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Refine the leads shown in the table
                </Typography>
              </Box>
              {hasActiveFilters && (
                <Button variant="text" size="small" onClick={clearFilters} startIcon={<i className="fas fa-times" aria-hidden="true" />}>
                  Clear filters
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Stage</InputLabel>
                <Select label="Stage" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
                  <MenuItem value=""><em>All stages</em></MenuItem>
                  {leadStages.map((stage) => <MenuItem key={stage.id ?? stage.name} value={stage.name}>{stage.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Source</InputLabel>
                <Select label="Source" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                  <MenuItem value=""><em>All sources</em></MenuItem>
                  {leadSources.map((source) => <MenuItem key={source.id ?? source.name} value={source.name}>{source.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" label="Product" placeholder="Search product" value={filterProductName} onChange={(e) => setFilterProductName(e.target.value)} fullWidth />
              <FormControl size="small" fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select label="Assignee" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                  <MenuItem value=""><em>All assignees</em></MenuItem>
                  {users.map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Created by</InputLabel>
                <Select label="Created by" value={filterCreatedBy} onChange={(e) => setFilterCreatedBy(e.target.value)}>
                  <MenuItem value=""><em>All creators</em></MenuItem>
                  {users.map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  displayEmpty
                  label="Tags"
                  value={filterTags.map(String)}
                  onChange={(e) => setFilterTags(e.target.value)}
                  renderValue={(selected) => selected.length ? `${selected.length} selected` : 'All tags'}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag.id} value={String(tag.id)}>
                      <Checkbox checked={filterTags.map(String).includes(String(tag.id))} size="small" />
                      <ListItemText primary={tag.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: .75 }}>
                  Created date
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <TextField size="small" type="date" label="From" value={filterCreatedFrom} onChange={(e) => setFilterCreatedFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField size="small" type="date" label="To" value={filterCreatedTo} onChange={(e) => setFilterCreatedTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: .75 }}>
                  Last activity date
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <TextField size="small" type="date" label="From" value={filterActivityFrom} onChange={(e) => setFilterActivityFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField size="small" type="date" label="To" value={filterActivityTo} onChange={(e) => setFilterActivityTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>

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
          <Table sx={{ minWidth: 1100 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{
                      minWidth: column.minWidth,
                      width: column.width,
                      color: 'text.secondary',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      px: 2,
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
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
                      No leads found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try adjusting your search or filters
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
                      sx={{ verticalAlign: 'middle', px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={closeActionMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: .75,
                minWidth: 168,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 12px 32px rgba(28,37,46,.14)',
              },
            },
          }}
        >
          <MenuItem onClick={runRowAction((row) => navigate(`/leads/${row.id}`))}>
            <ListItemIcon><i className="fas fa-eye" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="View" />
          </MenuItem>
          <MenuItem onClick={runRowAction(openEdit)}>
            <ListItemIcon><i className="fas fa-edit" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          {actionRow && canEdit("leads") && (!actionRow.assigned_to || (currentUserId && Number(actionRow.assigned_to) !== Number(currentUserId))) && (
            <MenuItem onClick={runRowAction(claim)}>
              <ListItemIcon sx={{ color: 'success.main' }}><i className="fas fa-user-check" aria-hidden="true" /></ListItemIcon>
              <ListItemText primary="Assign to me" />
            </MenuItem>
          )}
          {actionRow && canDelete("leads") && <Divider />}
          {actionRow && canDelete("leads") && (
            <MenuItem onClick={runRowAction(del)} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}><i className="fas fa-trash" aria-hidden="true" /></ListItemIcon>
              <ListItemText primary="Delete" />
            </MenuItem>
          )}
        </Menu>

        <TablePagination
          component="div"
          count={total}
          page={Math.max(table.page - 1, 0)}
          rowsPerPage={table.perPage}
          rowsPerPageOptions={[10, 20, 50, 100, 200]}
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

      <LeadFormDialog
        open={show}
        edit={edit}
        form={form}
        setForm={setForm}
        categories={categories}
        leadSources={leadSources}
        leadStages={leadStages}
        users={users}
        states={states}
        cities={cities}
        tags={tags}
        saving={saving}
        err={err}
        showAdvance={showAdvance}
        setShowAdvance={setShowAdvance}
        onClose={() => setShow(false)}
        onSave={save}
        showAddCity={showAddCity}
        newCityName={newCityName}
        setNewCityName={setNewCityName}
        addingCity={addingCity}
        onOpenAddCity={openAddCity}
        onCloseAddCity={() => setShowAddCity(false)}
        onSaveCity={saveCity}
      />

    </Box>
  );
}
