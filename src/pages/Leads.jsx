import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
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

const stageVariant = (stage) => {
  const s = (stage || "").toLowerCase();
  if (s.includes("new")) return { bg: "info", text: "white" };
  if (s.includes("warm")) return { bg: "warning", text: "dark" };
  if (s.includes("hot")) return { bg: "danger", text: "white" };
  if (s.includes("won")) return { bg: "success", text: "white" };
  return { bg: "secondary", text: "white" };
};

// IndiaMART QUERY_TYPE mapping helper
const getIndiamartQueryTypeBadge = (queryType) => {
  const types = {
    'W': { label: 'Direct', class: 'bg-primary' },
    'B': { label: 'Buy-Lead', class: 'bg-success' },
    'P': { label: 'PNS Call', class: 'bg-warning text-dark' },
    'BIZ': { label: 'Catalog', class: 'bg-info' },
    'WA': { label: 'WhatsApp', class: 'bg-secondary' },
  };
  return types[queryType] || { label: queryType, class: 'bg-light text-dark' };
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
  const [subcategories, setSubcategories] = useState([]);
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

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('leads-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
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
  });

  useEffect(() => {
    localStorage.setItem('leads-visible-cols', JSON.stringify(visibleCols));
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

  const fetchWithCache = async (key, url, setter) => {
    const now = Date.now();
    if (masterCache[key] && masterCache.expires[key] && now < masterCache.expires[key]) {
      setter(masterCache[key]);
      return;
    }
    const r = await api.get(url);
    const data = r.data?.data || r.data || [];
    masterCache[key] = data;
    masterCache.expires[key] = now + 600000; // 10 minutes
    setter(data);
  };

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

  const loadTable = async (signal) => {
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
  };

  const loadDropdowns = async () => {
    await Promise.allSettled([
      fetchWithCache('categories', '/lead-categories?perPage=200', setCategories),
      fetchWithCache('subcategories', '/lead-subcategories?perPage=200', setSubcategories),
      fetchWithCache('leadSources', '/lead-sources?perPage=200', setLeadSources),
      fetchWithCache('leadStages', '/lead-stages?perPage=200', setLeadStages),
      fetchWithCache('users', '/leads/assignable-users', setUsers),
      fetchWithCache('tags', '/lead-tags?perPage=200', setTags),
      fetchWithCache('states', '/states?perPage=200', setStates),
    ]);
  };

  useEffect(() => {
    const controller = new AbortController();
    loadTable(controller.signal);
    return () => controller.abort();
  }, [reloadKey, table, canViewLeads, buildWithQuery]);

  useEffect(() => {
    loadDropdowns();
  }, [reloadKey]);

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

  const cols = useMemo(() => {
    const all = [
      visibleCols.id && {
        name: "ID",
        selector: r => r.id,
        sortable: true,
        sortField: "id",
        width: "70px",
      },
      visibleCols.name && {
        name: "Name",
        selector: r => r.name,
        sortable: true,
        sortField: "name",
        minWidth: "140px",
      },
      visibleCols.phone && {
        name: "Phone",
        selector: r => r.phone || "-",
        sortable: true,
        sortField: "phone",
        minWidth: "120px",
      },
      visibleCols.lead_stage && {
        name: "Lead Stage",
        cell: r => {
          const v = stageVariant(r.stage);
          return <span className={`badge bg-${v.bg}`}>{r.stage || "-"}</span>;
        },
        sortable: true,
        sortField: "stage",
        width: "110px",
      },
      visibleCols.lead_source && {
        name: "Lead Source",
        selector: r => (
          <div>
            <span className="text-secondary">{r.source || "-"}</span>
            {r.source_type === 'indiamart' && r.query_type && (
              <span className={`badge ms-1 ${getIndiamartQueryTypeBadge(r.query_type).class}`} style={{ fontSize: '0.7em' }}>
                {getIndiamartQueryTypeBadge(r.query_type).label}
              </span>
            )}
          </div>
        ),
        sortable: true,
        sortField: "source",
        minWidth: "140px",
      },
      visibleCols.tags && {
        name: "Tags",
        cell: r => (
          <div className="d-flex flex-wrap gap-1">
            {(r.tags || []).length === 0 && <span className="text-secondary">-</span>}
            {(r.tags || []).slice(0, 3).map((t) => (
              <span key={t.id} className="badge bg-light text-dark border" style={{ fontSize: 11 }}>
                {t.name}
              </span>
            ))}
            {(r.tags || []).length > 3 && (
              <span className="badge bg-light text-dark border" style={{ fontSize: 11 }}>+{(r.tags || []).length - 3}</span>
            )}
          </div>
        ),
        minWidth: "140px",
      },
      visibleCols.last_activity && {
        name: "Last Activity",
        cell: r => {
          const last = r.activities?.[0];
          return (
            <div>
              <div className="small fw-semibold" style={{ color: "#0f172a" }}>{last?.type ? (last.type.charAt(0).toUpperCase() + last.type.slice(1)) : "-"}</div>
              <div className="small text-secondary">{last?.activity_at ? new Date(last.activity_at).toLocaleString() : ""}</div>
            </div>
          );
        },
        minWidth: "160px",
      },
      visibleCols.assignee && {
        name: "Assignee",
        cell: r => (
          <div>
            <div className="fw-semibold" style={{ color: "#0f172a" }}>{r.assignee?.name || "-"}</div>
            <div className="small text-secondary">{r.assigned_at ? new Date(r.assigned_at).toLocaleString() : ""}</div>
          </div>
        ),
        minWidth: "180px",
      },
      visibleCols.action && {
        name: "Action",
        width: "140px",
        cell: r => (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-primary" onClick={() => navigate(`/leads/${r.id}`)}>
              <i className="fas fa-eye"></i>
            </button>
            <button className="btn btn-outline-info" onClick={() => openEdit(r)}>
              <i className="fas fa-edit"></i>
            </button>
            {canEdit("leads") && (!r.assigned_to || (currentUserId && Number(r.assigned_to) !== Number(currentUserId))) && (
              <button className="btn btn-outline-success" onClick={() => claim(r)}>
                <i className="fas fa-user-check"></i>
              </button>
            )}
            {canDelete("leads") && (
              <button className="btn btn-outline-danger" onClick={() => del(r)}>
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        ),
      },
    ];

    return all.filter(Boolean);
  }, [visibleCols, navigate, currentUserId]);

  // ================= UI =================

  if (!canViewLeads) {
    return (
      <div className="p-4">
        <div className="card card-outline card-primary">
          <div className="card-body text-center py-5">
            <div className="text-secondary">Access denied</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-outline card-primary">

      <div className="card-header">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <h3 className="card-title mb-0">
              <i className="fas fa-users me-2 text-primary"></i>
              Leads
            </h3>
            {total > 0 && (
              <span className="badge bg-light text-dark mt-1">{total} total</span>
            )}
          </div>

          <div className="col-12 col-md-8">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end align-items-center">
              <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  className="form-control"
                  placeholder="Search name, phone, email"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>

              {/* Filter Dropdown */}
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary btn-sm" id="leads-filter-toggle">
                  <i className="fas fa-filter me-1"></i>
                  Filters
                  {hasActiveFilters && <span className="badge bg-primary ms-1">●</span>}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ minWidth: 280 }}>
                  <div className="px-3 py-2">
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Stage</label>
                      <Form.Select
                        size="sm"
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                      >
                        <option value="">All Stages</option>
                        {leadStages.map((s) => (
                          <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Source</label>
                      <Form.Select
                        size="sm"
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                      >
                        <option value="">All Sources</option>
                        {leadSources.map((s) => (
                          <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Product</label>
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="Search product..."
                        value={filterProductName}
                        onChange={(e) => setFilterProductName(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Assignee</label>
                      <Form.Select
                        size="sm"
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                      >
                        <option value="">All Assignees</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Created By</label>
                      <Form.Select
                        size="sm"
                        value={filterCreatedBy}
                        onChange={(e) => setFilterCreatedBy(e.target.value)}
                      >
                        <option value="">All Creators</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Tags</label>
                      <Form.Select
                        size="sm"
                        multiple
                        style={{ minHeight: 60 }}
                        value={filterTags}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                          setFilterTags(selected);
                        }}
                      >
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </Form.Select>
                      <small className="text-muted">Hold Ctrl to select multiple</small>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Created Date</label>
                      <div className="d-flex gap-1">
                        <Form.Control
                          type="date"
                          size="sm"
                          placeholder="From"
                          value={filterCreatedFrom}
                          onChange={(e) => setFilterCreatedFrom(e.target.value)}
                        />
                        <Form.Control
                          type="date"
                          size="sm"
                          placeholder="To"
                          value={filterCreatedTo}
                          onChange={(e) => setFilterCreatedTo(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-semibold text-muted">Last Activity Date</label>
                      <div className="d-flex gap-1">
                        <Form.Control
                          type="date"
                          size="sm"
                          placeholder="From"
                          value={filterActivityFrom}
                          onChange={(e) => setFilterActivityFrom(e.target.value)}
                        />
                        <Form.Control
                          type="date"
                          size="sm"
                          placeholder="To"
                          value={filterActivityTo}
                          onChange={(e) => setFilterActivityTo(e.target.value)}
                        />
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                          <i className="fas fa-times me-1"></i> Clear
                        </button>
                      </div>
                    )}
                  </div>
                </Dropdown.Menu>
              </Dropdown>

              {canCreate("leads") && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={openAdd}
                >
                  <i className="fas fa-plus me-1"></i> Add Lead
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      <div className="card-body bg-light border-bottom py-2">
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small fw-semibold">Columns:</span>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary btn-sm" id="leadscol-toggle">
                <i className="fas fa-columns me-1"></i>
                {(() => {
                  const allCols = [
                    visibleCols.id, visibleCols.name, visibleCols.phone,
                    visibleCols.lead_stage, visibleCols.lead_source, visibleCols.tags,
                    visibleCols.last_activity, visibleCols.assignee, visibleCols.action,
                  ];
                  const total = allCols.length;
                  const shown = allCols.filter(Boolean).length;
                  if (shown === 0) return 'No columns';
                  if (shown === total) return `All columns (${total})`;
                  return `${shown} of ${total} columns`;
                })()}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item
                  active={visibleCols.id}
                  onClick={() => setVisibleCols(v => ({ ...v, id: !v.id }))}
                >
                  <i className={`fas ${visibleCols.id ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  ID
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.name}
                  onClick={() => setVisibleCols(v => ({ ...v, name: !v.name }))}
                >
                  <i className={`fas ${visibleCols.name ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Name
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.phone}
                  onClick={() => setVisibleCols(v => ({ ...v, phone: !v.phone }))}
                >
                  <i className={`fas ${visibleCols.phone ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Phone
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.lead_stage}
                  onClick={() => setVisibleCols(v => ({ ...v, lead_stage: !v.lead_stage }))}
                >
                  <i className={`fas ${visibleCols.lead_stage ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Lead Stage
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.lead_source}
                  onClick={() => setVisibleCols(v => ({ ...v, lead_source: !v.lead_source }))}
                >
                  <i className={`fas ${visibleCols.lead_source ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Lead Source
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.tags}
                  onClick={() => setVisibleCols(v => ({ ...v, tags: !v.tags }))}
                >
                  <i className={`fas ${visibleCols.tags ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Tags
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.last_activity}
                  onClick={() => setVisibleCols(v => ({ ...v, last_activity: !v.last_activity }))}
                >
                  <i className={`fas ${visibleCols.last_activity ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Last Activity
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.assignee}
                  onClick={() => setVisibleCols(v => ({ ...v, assignee: !v.assignee }))}
                >
                  <i className={`fas ${visibleCols.assignee ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Assignee
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.action}
                  onClick={() => setVisibleCols(v => ({ ...v, action: !v.action }))}
                >
                  <i className={`fas ${visibleCols.action ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Action
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setReloadKey(k => k + 1)} disabled={loading}>
              <i className="fas fa-sync-alt me-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable
          keyField="id"
          columns={cols}
          data={rows}
          progressPending={loading}
          persistTableHead
          pagination
          paginationServer
          paginationTotalRows={total}
          paginationPerPage={table.perPage}
          onChangePage={(p) => {
            if (p !== table.page) {
              dispatch({ type: "PAGE", page: p });
            }
          }}
          onChangeRowsPerPage={(n) => {
            if (n !== table.perPage) {
              dispatch({ type: "PER_PAGE", perPage: n });
            }
          }}
          sortServer
          onSort={(col, dir) => {
            if (col.sortField) {
              dispatch({ type: "SORT", field: col.sortField, dir });
            }
          }}
          striped
          highlightOnHover
          pointerOnHover
          responsive
          noDataComponent={
            <div className="p-5 text-center">
              <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
              <div className="fw-semibold text-secondary mb-1">No leads found</div>
              <div className="small text-muted">Try adjusting your search or filters</div>
            </div>
          }
          customStyles={{
            rows: {
              style: {
                fontSize: '0.875rem',
              },
            },
            headCells: {
              style: {
                fontWeight: '600',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            },
          }}
        />
      </div>


      {/* ================= MODAL ================= */}

      <Modal show={show} onHide={() => setShow(false)} backdrop="static" centered size="lg" scrollable>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className={`fas ${edit ? 'fa-edit' : 'fa-plus'} me-2 text-primary`}></i>
            {edit ? "Edit Lead" : "Add Lead"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <div className="small text-secondary mb-2">
              <span className="fw-semibold">Type</span> <span className="text-danger">*</span>
            </div>
            <div className="d-flex gap-4">
              <Form.Check
                type="radio"
                id="lead-type-business"
                label="Business"
                checked={form.lead_type === "business"}
                onChange={() => setForm({ ...form, lead_type: "business" })}
              />
              <Form.Check
                type="radio"
                id="lead-type-individual"
                label="Individual"
                checked={form.lead_type === "individual"}
                onChange={() => setForm({ ...form, lead_type: "individual" })}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-muted small">Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <div className="row g-2">
                <div className="col-5">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Code <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={form.phone_code}
                      onChange={(e) => setForm({ ...form, phone_code: e.target.value })}
                    >
                      <option value="+91 IN">+91 IN</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-7">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Phone <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <div className="row g-2">
                <div className="col-5">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Code</Form.Label>
                    <Form.Select
                      value={form.whatsapp_code}
                      onChange={(e) => setForm({ ...form, whatsapp_code: e.target.value })}
                    >
                      <option value="+91 IN">+91 IN</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-7">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Whatsapp</Form.Label>
                    <Form.Control
                      placeholder="Whatsapp number"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Stage <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  {(leadStages.length ? leadStages : [{ id: 0, name: 'New Lead' }]).map((s) => (
                    <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
           

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Category</Form.Label>
                <Form.Select value={form.lead_category_id} onChange={(e) => setForm({ ...form, lead_category_id: e.target.value, lead_subcategory_id: "" })}>
                  <option value="">Choose</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Source</Form.Label>
                <Form.Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="">Choose</option>
                  {leadSources.map((s) => (
                    <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          {form.source === "Other" && (
            <Form.Group className="mb-3">
              <Form.Label>Source (Other)</Form.Label>
              <Form.Control
                placeholder="Specify source"
                value={form.source_other}
                onChange={(e) => setForm({ ...form, source_other: e.target.value })}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Form.Group>

          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="fw-semibold text-secondary">Advance Options</div>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => setShowAdvance(!showAdvance)}
              style={{ textDecoration: "none" }}
            >
              {showAdvance ? "Click to hide" : "Click to show"}
            </button>
          </div>

          {showAdvance && (
            <>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Website</Form.Label>
                    <Form.Control
                      type="url"
                      placeholder="https://example.com"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-muted small">Company</Form.Label>
                    <Form.Control
                      placeholder="Company name"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Form.Group>

              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Pincode</Form.Label>
                    <Form.Control
                      placeholder="Pincode"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                      <option value="India">India</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Select
                      value={form.state_id}
                      onChange={(e) => setForm({ ...form, state_id: e.target.value, city_id: "" })}
                    >
                      <option value="">Choose</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Select
                      value={form.city_id}
                      onChange={(e) => setForm({ ...form, city_id: e.target.value })}
                      disabled={!form.state_id}
                    >
                      <option value="">Choose</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <div className="d-flex justify-content-end" style={{ marginTop: -10 }}>
                    <button type="button" className="btn btn-link p-0" onClick={openAddCity}>
                      + Add New City
                    </button>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>GSTIN (TAX No.)</Form.Label>
                    <Form.Control
                      placeholder="GSTIN (TAX No.)"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Assigned To</Form.Label>
                    <Form.Select
                      value={form.assigned_to}
                      onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    >
                      <option value="">Choose</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Close Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.expected_close_date}
                      onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Value</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={form.expected_value}
                      onChange={(e) => setForm({ ...form, expected_value: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Budget</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="Enter budget"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Priority</Form.Label>
                    <Form.Select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <Form.Select
                      multiple
                      style={{ minHeight: 38, height: 90 }}
                      value={(form.tags || []).map(String)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (o) => String(o.value));
                        setForm({ ...form, tags: selected });
                      }}
                    >
                      {tags.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              {form.lead_type === "business" && (
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Industry</Form.Label>
                      <Form.Control
                        placeholder="Industry"
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12 col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Company Size</Form.Label>
                      <Form.Select
                        value={form.company_size}
                        onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                      >
                        <option value="">Choose</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Internal notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Form.Group>
            </>
          )}

          {err && (
            <div className="text-danger mt-2">
              {err}
            </div>
          )}

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setShow(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={save}
            disabled={saving}
          >
            {saving && (
              <span className="spinner-border spinner-border-sm me-2"/>
            )}
            {saving ? "Saving..." : "Save"}
          </Button>

        </Modal.Footer>
      </Modal>

      {/* Add City Modal */}
      <Modal show={showAddCity} onHide={() => setShowAddCity(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Add City</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>City Name</Form.Label>
            <Form.Control
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              autoFocus
              placeholder="Enter city name"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddCity(false)} disabled={addingCity}>Cancel</Button>
          <Button variant="primary" onClick={saveCity} disabled={addingCity}>
            {addingCity ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
