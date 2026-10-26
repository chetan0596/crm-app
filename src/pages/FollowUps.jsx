import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import api from "../api";
import { canView, canDelete, canEdit, getUserData } from "../utils/permissions";

const getIndiamartQueryTypeBadge = (queryType) => {
  const types = {
    W: { label: "Direct", sx: { bgcolor: '#eaf0f6', color: '#062849' } },
    B: { label: "Buy-Lead", sx: { bgcolor: '#dbf5e9', color: '#118d57' } },
    P: { label: "PNS Call", sx: { bgcolor: '#fff4d6', color: '#b76e00' } },
    BIZ: { label: "Catalog View", sx: { bgcolor: '#caf4ff', color: '#006c9c' } },
    WA: { label: "WhatsApp", sx: { bgcolor: '#f1f5f9', color: '#475569' } },
  };

  return types[queryType] || { label: queryType || "Unknown", sx: { bgcolor: '#f1f5f9', color: '#475569' } };
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const stageChipSx = (stage) => {
  const s = (stage || "").toLowerCase();
  if (s.includes("new")) return { bgcolor: '#caf4ff', color: '#006c9c' };
  if (s.includes("warm")) return { bgcolor: '#fff4d6', color: '#b76e00' };
  if (s.includes("hot")) return { bgcolor: '#ffe4de', color: '#b71d18' };
  if (s.includes("won")) return { bgcolor: '#dbf5e9', color: '#118d57' };
  if (s.includes("lost")) return { bgcolor: '#f1f5f9', color: '#475569' };
  return { bgcolor: '#f1f5f9', color: '#475569' };
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

export default function FollowUps() {
  const navigate = useNavigate();
  const canViewLeads = canView("leads");
  const canEditLeads = canEdit("leads");
  const canDeleteLeads = canDelete("leads");
  const currentUser = getUserData();
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [bucket, setBucket] = useState("today");
  const [upcomingDays, setUpcomingDays] = useState(7);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [leadSources, setLeadSources] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [filterStage, setFilterStage] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterTags, setFilterTags] = useState([]);
  const [filterCreatedFrom, setFilterCreatedFrom] = useState("");
  const [filterCreatedTo, setFilterCreatedTo] = useState("");
  const [filterActivityFrom, setFilterActivityFrom] = useState("");
  const [filterActivityTo, setFilterActivityTo] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedRows, setSelectedRows] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('followups-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return {
      id: true,
      name: true,
      phone: true,
      stage: true,
      source: true,
      tags: true,
      last_activity: true,
      assignee: true,
      next_follow_up: true,
      action: true,
    };
  });

  const [summary, setSummary] = useState({
    today: 0,
    upcoming: 0,
    overdue: 0,
    not_scheduled: 0,
    never_follow_up: 0,
    upcoming_days: 7,
  });

  const hasActiveFilters =
    filterStage ||
    filterSource ||
    filterAssignee ||
    filterTags.length ||
    filterCreatedFrom ||
    filterCreatedTo ||
    filterActivityFrom ||
    filterActivityTo;

  useEffect(() => {
    localStorage.setItem('followups-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const viewLead = useCallback((r) => navigate(`/leads/${r.id}`), [navigate]);

  const editLead = useCallback((r) => navigate(`/leads/${r.id}`, { state: { edit: true } }), [navigate]);

  const deleteLead = useCallback(async (r) => {
    const result = await Swal.fire({
      title: "Delete lead?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/leads/${r.id}`);
      toast.success("Lead deleted");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  }, []);

  const claimLead = useCallback(async (r) => {
    try {
      await api.post(`/leads/${r.id}/claim`);
      toast.success("Lead assigned to you");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to claim lead");
    }
  }, []);

  const bulkDelete = async () => {
    if (!selectedRows.length) return;
    const result = await Swal.fire({
      title: `Delete ${selectedRows.length} leads?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete them!",
    });
    if (!result.isConfirmed) return;
    try {
      await Promise.all(selectedRows.map((r) => api.delete(`/leads/${r.id}`)));
      toast.success(`${selectedRows.length} leads deleted`);
      setSelectedRows([]);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Some leads could not be deleted");
    }
  };

  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    try {
      setExporting(true);
      const baseParams = {
        perPage: 200,
        search,
        stage: filterStage,
        source: filterSource,
        assigned_to: filterAssignee,
        tags: (filterTags || []).join(","),
        followup_bucket: bucket,
        upcoming_days: bucket === "upcoming" ? upcomingDays : undefined,
        created_from: filterCreatedFrom || undefined,
        created_to: filterCreatedTo || undefined,
        activity_from: filterActivityFrom || undefined,
        sort: sortField,
        dir: sortDir,
        with: "tags",
      };

      // Fetch first page to get total
      const first = await api.get("/leads", { params: { ...baseParams, page: 1 } });
      const totalRecords = first.data?.total || 0;
      let allRows = toArray(first.data);

      // Fetch remaining pages if needed
      const totalPages = Math.ceil(totalRecords / 200);
      for (let p = 2; p <= totalPages; p++) {
        const res = await api.get("/leads", { params: { ...baseParams, page: p } });
        allRows = allRows.concat(toArray(res.data));
      }

      if (!allRows.length) {
        toast.warning("No data to export");
        return;
      }

      const headers = ["ID", "Name", "Phone", "Stage", "Source", "Assignee", "Next Follow-up", "Created At"];
      const data = allRows.map((r) => [
        r.id,
        r.name,
        r.phone || "",
        r.stage || "",
        r.source || "",
        r.assignee?.name || "",
        r.next_follow_up_date || "",
        r.created_at || "",
      ]);
      const csv = [headers.join(","), ...data.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `followups-${bucket}-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success(`Exported ${allRows.length} records`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilterStage("");
    setFilterSource("");
    setFilterAssignee("");
    setFilterTags([]);
    setFilterCreatedFrom("");
    setFilterCreatedTo("");
    setFilterActivityFrom("");
    setFilterActivityTo("");
    setPage(1);
  };

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await api.get("/leads/followup-summary", {
        params: { upcoming_days: upcomingDays },
      });
      setSummary((prev) => res.data?.data || prev);
    } catch {
      toast.error("Failed to load follow-up summary");
    } finally {
      setSummaryLoading(false);
    }
  }, [upcomingDays]);

  const load = useCallback(async () => {
    if (!canViewLeads) return;
    try {
      setLoading(true);
      const res = await api.get("/leads", {
        params: {
          page,
          perPage,
          search,
          stage: filterStage,
          source: filterSource,
          assigned_to: filterAssignee,
          tags: (filterTags || []).join(","),
          followup_bucket: bucket,
          upcoming_days: bucket === "upcoming" ? upcomingDays : undefined,
          created_from: filterCreatedFrom || undefined,
          created_to: filterCreatedTo || undefined,
          activity_from: filterActivityFrom || undefined,
          sort: sortField,
          dir: sortDir,
          with: "tags,activities",
        },
      });

      const payload = res.data;
      setRows(toArray(payload));
      setTotal(payload?.total || 0);
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [canViewLeads, page, perPage, search, filterStage, filterSource, filterAssignee, filterTags, bucket, upcomingDays, filterCreatedFrom, filterCreatedTo, filterActivityFrom, sortField, sortDir]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, reloadKey]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== search) {
        setSearch(s);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  useEffect(() => {
    const loadMasters = async () => {
      if (!canViewLeads) return;
      try {
        const [sourcesRes, stagesRes, usersRes, tagsRes] = await Promise.allSettled([
          api.get("/lead-sources?perPage=200"),
          api.get("/lead-stages?perPage=200"),
          api.get("/leads/assignable-users"),
          api.get("/lead-tags?perPage=200"),
        ]);

        if (sourcesRes.status === "fulfilled") {
          setLeadSources(toArray(sourcesRes.value.data));
        }
        if (stagesRes.status === "fulfilled") {
          setLeadStages(toArray(stagesRes.value.data));
        }
        if (usersRes.status === "fulfilled") {
          setUsers(toArray(usersRes.value.data));
        }
        if (tagsRes.status === "fulfilled") {
          setTags(toArray(tagsRes.value.data));
        }
      } catch {
        // ignore
      }
    };

    loadMasters();
  }, [canViewLeads]);

  const applyBucket = (key) => {
    setBucket(key);
    setPage(1);
  };

  const applyUpcomingDays = (days) => {
    setUpcomingDays(days);
    setPage(1);
  };

  const updateFilterStage = (v) => { setFilterStage(v); setPage(1); };
  const updateFilterSource = (v) => { setFilterSource(v); setPage(1); };
  const updateFilterAssignee = (v) => { setFilterAssignee(v); setPage(1); };
  const updateFilterTags = (v) => { setFilterTags(v); setPage(1); };
  const updateFilterCreatedFrom = (v) => { setFilterCreatedFrom(v); setPage(1); };
  const updateFilterCreatedTo = (v) => { setFilterCreatedTo(v); setPage(1); };
  const updateFilterActivityFrom = (v) => { setFilterActivityFrom(v); setPage(1); };
  const updateFilterActivityTo = (v) => { setFilterActivityTo(v); setPage(1); };

  const handleSort = (field) => {
    const dir = sortField === field ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortField(field);
    setSortDir(dir);
  };

  const isRowSelected = (r) => selectedRows.some((s) => s.id === r.id);

  const toggleRow = (r) => {
    setSelectedRows((prev) =>
      prev.some((s) => s.id === r.id)
        ? prev.filter((s) => s.id !== r.id)
        : [...prev, r]
    );
  };

  const toggleAllRows = () => {
    setSelectedRows((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.some((s) => s.id === r.id));
      if (allSelected) {
        return prev.filter((s) => !rows.some((r) => r.id === s.id));
      }
      const next = [...prev];
      rows.forEach((r) => {
        if (!next.some((s) => s.id === r.id)) next.push(r);
      });
      return next;
    });
  };

  const allRowsSelected = rows.length > 0 && rows.every((r) => selectedRows.some((s) => s.id === r.id));
  const someRowsSelected = rows.some((r) => selectedRows.some((s) => s.id === r.id)) && !allRowsSelected;

  const columns = useMemo(
    () => [
      visibleCols.id && {
        key: 'id', label: 'ID', sortField: 'id', width: 70,
        render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>#{r.id}</Typography>,
      },
      visibleCols.name && {
        key: 'name', label: 'Name', sortField: 'name', minWidth: 140,
        render: (r) => r.name,
      },
      visibleCols.phone && {
        key: 'phone', label: 'Phone', sortField: 'phone', width: 140,
        render: (r) => r.phone || "-",
      },
      visibleCols.stage && {
        key: 'stage', label: 'Stage', sortField: 'stage', width: 120,
        render: (r) => (
          <Chip label={r.stage || "-"} size="small" sx={{ ...stageChipSx(r.stage), fontWeight: 700 }} />
        ),
      },
      visibleCols.source && {
        key: 'source', label: 'Source', sortField: 'source', minWidth: 120,
        render: (r) => {
          const showBadge = r.source_type === "indiamart" && r.query_type;
          const badge = showBadge ? getIndiamartQueryTypeBadge(r.query_type) : null;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">{r.source || "-"}</Typography>
              {showBadge && (
                <Chip label={badge.label} size="small" sx={{ ...badge.sx, fontSize: 11, fontWeight: 700 }} />
              )}
            </Box>
          );
        },
      },
      visibleCols.tags && {
        key: 'tags', label: 'Tags', minWidth: 140,
        render: (r) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .5 }}>
            {(r.tags || []).length === 0 && <Typography variant="body2" color="text.secondary">-</Typography>}
            {(r.tags || []).slice(0, 3).map((t) => (
              <Chip key={t.id} label={t.name} size="small" variant="outlined" />
            ))}
            {(r.tags || []).length > 3 && (
              <Chip label={`+${(r.tags || []).length - 3}`} size="small" variant="outlined" />
            )}
          </Box>
        ),
      },
      visibleCols.last_activity && {
        key: 'last_activity', label: 'Last Activity', minWidth: 160,
        render: (r) => {
          const last = r.activities?.[0];
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {last?.type ? last.type.charAt(0).toUpperCase() + last.type.slice(1) : "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {last?.activity_at ? new Date(last.activity_at).toLocaleString() : ""}
              </Typography>
            </Box>
          );
        },
      },
      visibleCols.assignee && {
        key: 'assignee', label: 'Assignee', width: 160,
        render: (r) => r.assignee?.name || "-",
      },
      visibleCols.next_follow_up && {
        key: 'next_follow_up', label: 'Next Follow-up', sortField: 'next_follow_up_date', width: 140,
        render: (r) => (r.next_follow_up_date ? String(r.next_follow_up_date).slice(0, 10) : "-"),
      },
      visibleCols.action && {
        key: 'action', label: 'Action', width: 180,
        render: (r) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View">
              <IconButton size="small" color="primary" onClick={() => viewLead(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="View">
                <i className="fas fa-eye" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" color="info" onClick={() => editLead(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Edit">
                <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
            {canEditLeads && (!r.assigned_to || currentUserId !== Number(r.assigned_to)) && (
              <Tooltip title="Claim">
                <IconButton size="small" color="success" onClick={() => claimLead(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Claim">
                  <i className="fas fa-user-check" style={{ fontSize: 13 }} aria-hidden="true" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteLeads && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => deleteLead(r)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Delete">
                  <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ].filter(Boolean),
    [visibleCols, canEditLeads, canDeleteLeads, currentUserId, viewLead, editLead, claimLead, deleteLead]
  );

  const bucketCards = [
    { key: "today", label: "Today", value: summary.today, icon: "fa-calendar-day", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    { key: "upcoming", label: `Upcoming (${upcomingDays}d)`, value: summary.upcoming, icon: "fa-calendar-week", color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
    { key: "overdue", label: "Overdue", value: summary.overdue, icon: "fa-exclamation-circle", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
    { key: "not_scheduled", label: "Not Scheduled", value: summary.not_scheduled, icon: "fa-calendar-xmark", color: "#64748b", bg: "rgba(100,116,139,0.08)" },
    { key: "never_follow_up", label: "Never Follow-up", value: summary.never_follow_up, icon: "fa-ban", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  ];

  const titleByBucket = {
    today: "Today Follow-ups",
    upcoming: "Upcoming Follow-ups",
    overdue: "Overdue Follow-ups",
    not_scheduled: "Not Scheduled",
    never_follow_up: "Never Follow-up",
  };

  const columnOptions = [
    ['id', 'ID'],
    ['name', 'Name'],
    ['phone', 'Phone'],
    ['stage', 'Stage'],
    ['source', 'Source'],
    ['tags', 'Tags'],
    ['last_activity', 'Last Activity'],
    ['assignee', 'Assignee'],
    ['next_follow_up', 'Next Follow-up'],
    ['action', 'Action'],
  ];

  const totalColumnCount = columns.length + (canDeleteLeads ? 1 : 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Follow-ups
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            Manage and track all your lead follow-ups
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={String(upcomingDays)}
              onChange={(e) => applyUpcomingDays(parseInt(e.target.value || "7", 10))}
            >
              <MenuItem value="7">Upcoming: 7 days</MenuItem>
              <MenuItem value="15">Upcoming: 15 days</MenuItem>
              <MenuItem value="30">Upcoming: 30 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => setReloadKey(k => k + 1)}
            disabled={loading}
            startIcon={<i className="fas fa-sync-alt" aria-hidden="true" />}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={loadSummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? "Loading..." : "Refresh Summary"}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {bucketCards.map((c) => (
          <Card
            key={c.key}
            role="button"
            onClick={() => applyBucket(c.key)}
            sx={{
              bgcolor: c.bg,
              border: '2px solid',
              borderColor: bucket === c.key ? c.color : 'transparent',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(28,37,46,.05)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
          >
            <CardContent sx={{ px: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: .5 }}>
                    {c.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: c.color }}>
                    {c.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: c.color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  <i className={`fas ${c.icon}`} aria-hidden="true" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <i className="fas fa-list-ul" style={{ color: '#062849', fontSize: 13 }} aria-hidden="true" />
            <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {titleByBucket[bucket] || "Follow-ups"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search name, phone, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-search" style={{ fontSize: 12, color: '#637381' }} aria-hidden="true" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              variant="contained"
              color="success"
              onClick={exportToCSV}
              disabled={exporting}
              startIcon={<i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-csv'}`} style={{ fontSize: 12 }} aria-hidden="true" />}
            >
              {exporting ? "Exporting..." : "Export All"}
            </Button>

            <Button
              variant="outlined"
              onClick={(event) => setColumnAnchorEl(event.currentTarget)}
              startIcon={<i className="fas fa-columns" style={{ fontSize: 12 }} aria-hidden="true" />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Columns
            </Button>
            <Menu anchorEl={columnAnchorEl} open={Boolean(columnAnchorEl)} onClose={() => setColumnAnchorEl(null)}>
              {columnOptions.map(([key, label]) => (
                <MenuItem key={key} onClick={() => setVisibleCols(v => ({ ...v, [key]: !v[key] }))}>
                  <Checkbox checked={Boolean(visibleCols[key])} size="small" />
                  <ListItemText primary={label} />
                </MenuItem>
              ))}
            </Menu>

            <Button
              variant="outlined"
              onClick={() => setShowFilters(open => !open)}
              startIcon={<i className="fas fa-filter" style={{ fontSize: 12 }} aria-hidden="true" />}
              endIcon={hasActiveFilters ? <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} /> : null}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Filters
            </Button>
          </Stack>
        </Box>

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
              {hasActiveFilters ? (
                <Button variant="text" size="small" onClick={clearFilters} startIcon={<i className="fas fa-times" aria-hidden="true" />}>
                  Clear
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Stage</InputLabel>
                <Select label="Stage" value={filterStage} onChange={(e) => updateFilterStage(e.target.value)}>
                  <MenuItem value=""><em>All Stages</em></MenuItem>
                  {leadStages.map((s) => (
                    <MenuItem key={s.id ?? s.name} value={s.name}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Source</InputLabel>
                <Select label="Source" value={filterSource} onChange={(e) => updateFilterSource(e.target.value)}>
                  <MenuItem value=""><em>All Sources</em></MenuItem>
                  {leadSources.map((s) => (
                    <MenuItem key={s.id ?? s.name} value={s.name}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select label="Assignee" value={String(filterAssignee)} onChange={(e) => updateFilterAssignee(e.target.value)}>
                  <MenuItem value=""><em>All Assignees</em></MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  label="Tags"
                  value={filterTags.map(String)}
                  onChange={(e) => updateFilterTags(e.target.value)}
                  renderValue={(selected) => (selected.length ? `${selected.length} selected` : 'All tags')}
                >
                  {tags.map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>
                      <Checkbox checked={filterTags.map(String).includes(String(t.id))} size="small" />
                      <ListItemText primary={t.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: .75 }}>
                  Created Date
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <TextField size="small" type="date" label="From" value={filterCreatedFrom} onChange={(e) => updateFilterCreatedFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField size="small" type="date" label="To" value={filterCreatedTo} onChange={(e) => updateFilterCreatedTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: .75 }}>
                  Last Activity Date
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <TextField size="small" type="date" label="From" value={filterActivityFrom} onChange={(e) => updateFilterActivityFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField size="small" type="date" label="To" value={filterActivityTo} onChange={(e) => updateFilterActivityTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>

        {selectedRows.length > 0 && canDeleteLeads && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              mx: 3,
              mt: 2,
              mb: 2,
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: 13 }} aria-hidden="true" />
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {selectedRows.length} selected
              </Typography>
            </Stack>
            <Button variant="outlined" color="error" size="small" onClick={bulkDelete} startIcon={<i className="fas fa-trash-alt" style={{ fontSize: 11 }} aria-hidden="true" />}>
              Delete
            </Button>
          </Box>
        )}

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1100 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {canDeleteLeads && (
                  <TableCell padding="checkbox" sx={{ ...headCellSx, px: 1 }}>
                    <Checkbox
                      size="small"
                      checked={allRowsSelected}
                      indeterminate={someRowsSelected}
                      onChange={toggleAllRows}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ ...headCellSx, minWidth: column.minWidth, width: column.width }}
                  >
                    {column.sortField ? (
                      <TableSortLabel
                        active={sortField === column.sortField}
                        direction={sortField === column.sortField ? sortDir : 'asc'}
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
                  <TableCell colSpan={Math.max(totalColumnCount, 1)} align="center" sx={{ py: 7 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No leads found
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
                  selected={isRowSelected(row)}
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  {canDeleteLeads && (
                    <TableCell padding="checkbox" sx={{ ...bodyCellSx, px: 1 }}>
                      <Checkbox
                        size="small"
                        checked={isRowSelected(row)}
                        onChange={() => toggleRow(row)}
                      />
                    </TableCell>
                  )}
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
          page={Math.max(page - 1, 0)}
          rowsPerPage={perPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(event, p) => setPage(p + 1)}
          onRowsPerPageChange={(event) => {
            const nextSize = Number(event.target.value);
            setPerPage(nextSize);
            setPage(1);
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>
    </Box>
  );
}
