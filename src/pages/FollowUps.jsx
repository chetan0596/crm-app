import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Col, Dropdown, Form, Row } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import api from "../api";
import { canView, canCreate, canDelete, canEdit, getUserData } from "../utils/permissions";

 const getIndiamartQueryTypeBadge = (queryType) => {
   const types = {
     W: { label: "Direct", class: "bg-primary" },
     B: { label: "Buy-Lead", class: "bg-success" },
     P: { label: "PNS Call", class: "bg-warning text-dark" },
     BIZ: { label: "Catalog View", class: "bg-info" },
     WA: { label: "WhatsApp", class: "bg-success" },
   };

   return types[queryType] || { label: queryType || "Unknown", class: "bg-secondary" };
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
  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('followups-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
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

  const viewLead = (r) => navigate(`/leads/${r.id}`);

  const editLead = (r) => navigate(`/leads/${r.id}`, { state: { edit: true } });

  const deleteLead = async (r) => {
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
  };

  const claimLead = async (r) => {
    try {
      await api.post(`/leads/${r.id}/claim`);
      toast.success("Lead assigned to you");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to claim lead");
    }
  };

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
    } catch (e) {
      toast.error("Some leads could not be deleted");
    }
  };

  const exportToCSV = () => {
    if (!rows.length) {
      toast.warning("No data to export");
      return;
    }
    const headers = ["ID", "Name", "Phone", "Stage", "Source", "Assignee", "Next Follow-up", "Created At"];
    const data = rows.map((r) => [
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
    toast.success("Export completed");
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
  };

  const stageVariant = (stage) => {
    const s = (stage || "").toLowerCase();
    if (s.includes("new")) return { bg: "info", text: "white" };
    if (s.includes("warm")) return { bg: "warning", text: "dark" };
    if (s.includes("hot")) return { bg: "danger", text: "white" };
    if (s.includes("won")) return { bg: "success", text: "white" };
    if (s.includes("lost")) return { bg: "secondary", text: "white" };
    return { bg: "light", text: "dark" };
  };

  const loadSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await api.get("/leads/followup-summary", {
        params: { upcoming_days: upcomingDays },
      });
      setSummary(res.data?.data || summary);
    } catch (e) {
      toast.error("Failed to load follow-up summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const load = async () => {
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
      setRows(payload?.data || []);
      setTotal(payload?.total || 0);
    } catch (e) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [upcomingDays, reloadKey]);

  useEffect(() => {
    load();
  }, [bucket, upcomingDays, page, perPage, search, canViewLeads, filterStage, filterSource, filterAssignee, filterTags, filterCreatedFrom, filterCreatedTo, filterActivityFrom, filterActivityTo, sortField, sortDir, reloadKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

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
          setLeadSources(sourcesRes.value.data?.data || sourcesRes.value.data || []);
        }
        if (stagesRes.status === "fulfilled") {
          setLeadStages(stagesRes.value.data?.data || stagesRes.value.data || []);
        }
        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value.data?.data || usersRes.value.data || []);
        }
        if (tagsRes.status === "fulfilled") {
          setTags(tagsRes.value.data?.data || tagsRes.value.data || []);
        }
      } catch {
        // ignore
      }
    };

    loadMasters();
  }, [canViewLeads]);

  useEffect(() => {
    setPage(1);
  }, [bucket, upcomingDays, search, perPage, filterStage, filterSource, filterAssignee, filterTags, filterCreatedFrom, filterCreatedTo, filterActivityFrom, filterActivityTo]);

  const columns = useMemo(
    () => [
      visibleCols.id && {
        name: "ID",
        selector: (r) => r.id,
        sortable: true,
        sortField: "id",
        width: "70px",
      },
      visibleCols.name && {
        name: "Name",
        selector: (r) => r.name,
        sortable: true,
        sortField: "name",
        wrap: true,
        minWidth: "140px",
      },
      visibleCols.phone && {
        name: "Phone",
        selector: (r) => r.phone || "-",
        sortable: true,
        sortField: "phone",
        width: "140px",
      },
      visibleCols.stage && {
        name: "Stage",
        cell: (r) => {
          const v = stageVariant(r.stage);
          return <Badge bg={v.bg}>{r.stage || "-"}</Badge>;
        },
        sortable: true,
        sortField: "stage",
        width: "120px",
      },
      visibleCols.source && {
        name: "Source",
        cell: (r) => {
          const showBadge = r.source_type === "indiamart" && r.query_type;
          const badge = showBadge ? getIndiamartQueryTypeBadge(r.query_type) : null;

          return (
            <div>
              <span className="text-secondary">{r.source || "-"}</span>
              {showBadge && (
                <span className={`badge ms-1 ${badge.class}`} style={{ fontSize: "0.7em" }}>
                  {badge.label}
                </span>
              )}
            </div>
          );
        },
        sortable: true,
        sortField: "source",
        minWidth: "120px",
      },
      visibleCols.tags && {
        name: "Tags",
        cell: (r) => (
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
        cell: (r) => {
          const last = r.activities?.[0];
          return (
            <div>
              <div className="small fw-semibold" style={{ color: "#0f172a" }}>
                {last?.type ? last.type.charAt(0).toUpperCase() + last.type.slice(1) : "-"}
              </div>
              <div className="small text-secondary">
                {last?.activity_at ? new Date(last.activity_at).toLocaleString() : ""}
              </div>
            </div>
          );
        },
        minWidth: "160px",
      },
      visibleCols.assignee && {
        name: "Assignee",
        selector: (r) => r.assignee?.name || "-",
        sortable: false,
        width: "160px",
      },
      visibleCols.next_follow_up && {
        name: "Next Follow-up",
        selector: (r) => (r.next_follow_up_date ? String(r.next_follow_up_date).slice(0, 10) : "-"),
        sortable: true,
        sortField: "next_follow_up_date",
        width: "140px",
      },
      visibleCols.action && {
        name: "Action",
        cell: (r) => (
          <div className="d-flex gap-1">
            <button className="btn btn-outline-primary btn-sm" title="View" onClick={() => viewLead(r)}>
              <i className="fas fa-eye"></i>
            </button>
            <button className="btn btn-outline-info btn-sm" title="Edit" onClick={() => editLead(r)}>
              <i className="fas fa-edit"></i>
            </button>
            {canEditLeads && (!r.assigned_to || currentUserId !== Number(r.assigned_to)) && (
              <button className="btn btn-outline-success btn-sm" title="Claim" onClick={() => claimLead(r)}>
                <i className="fas fa-user-check"></i>
              </button>
            )}
            {canDeleteLeads && (
              <button className="btn btn-outline-danger btn-sm" title="Delete" onClick={() => deleteLead(r)}>
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        ),
        width: "180px",
      },
    ].filter(Boolean),
    [visibleCols, canEditLeads, canDeleteLeads, currentUserId]
  );

  const bucketCards = [
    { key: "today", label: "Today", value: summary.today, variant: "primary" },
    { key: "upcoming", label: `Upcoming (${upcomingDays}d)`, value: summary.upcoming, variant: "info" },
    { key: "overdue", label: "Overdue", value: summary.overdue, variant: "danger" },
    { key: "not_scheduled", label: "Not Scheduled", value: summary.not_scheduled, variant: "secondary" },
    { key: "never_follow_up", label: "Never Follow-up", value: summary.never_follow_up, variant: "warning" },
  ];

  const titleByBucket = {
    today: "Today Follow-ups",
    upcoming: "Upcoming Follow-ups",
    overdue: "Overdue Follow-ups",
    not_scheduled: "Not Scheduled",
    never_follow_up: "Never Follow-up",
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Follow-ups</h4>
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            value={upcomingDays}
            style={{ width: 140 }}
            onChange={(e) => setUpcomingDays(parseInt(e.target.value || "7", 10))}
          >
            <option value={7}>Upcoming: 7 days</option>
            <option value={15}>Upcoming: 15 days</option>
            <option value={30}>Upcoming: 30 days</option>
          </Form.Select>
          <Button variant="outline-secondary" size="sm" onClick={() => setReloadKey(k => k + 1)} disabled={loading}>
            <i className="fas fa-sync-alt me-1"></i> Refresh
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={loadSummary} disabled={summaryLoading}>
            {summaryLoading ? "Loading..." : "Refresh Summary"}
          </Button>
        </div>
      </div>

      <Row className="g-2 mb-3">
        {bucketCards.map((c) => (
          <Col key={c.key} md={2} sm={6}>
            <Card
              role="button"
              onClick={() => setBucket(c.key)}
              className={bucket === c.key ? "border border-2 border-primary" : ""}
            >
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-semibold">{c.label}</div>
                  <Badge bg={c.variant}>{c.value}</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="fw-semibold">{titleByBucket[bucket] || "Follow-ups"}</div>
          <div className="d-flex gap-2 align-items-center">
            <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                className="form-control"
                placeholder="Search name, phone, email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <Button variant="outline-success" size="sm" onClick={exportToCSV}>
              <i className="fas fa-file-export me-1"></i> Export
            </Button>

            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary btn-sm" id="followups-columns-toggle">
                <i className="fas fa-columns me-1"></i> Columns
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item active={visibleCols.id} onClick={() => setVisibleCols(v => ({ ...v, id: !v.id }))}>
                  <i className={`fas ${visibleCols.id ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> ID
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.name} onClick={() => setVisibleCols(v => ({ ...v, name: !v.name }))}>
                  <i className={`fas ${visibleCols.name ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Name
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.phone} onClick={() => setVisibleCols(v => ({ ...v, phone: !v.phone }))}>
                  <i className={`fas ${visibleCols.phone ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Phone
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.stage} onClick={() => setVisibleCols(v => ({ ...v, stage: !v.stage }))}>
                  <i className={`fas ${visibleCols.stage ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Stage
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.source} onClick={() => setVisibleCols(v => ({ ...v, source: !v.source }))}>
                  <i className={`fas ${visibleCols.source ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Source
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.tags} onClick={() => setVisibleCols(v => ({ ...v, tags: !v.tags }))}>
                  <i className={`fas ${visibleCols.tags ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Tags
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.last_activity} onClick={() => setVisibleCols(v => ({ ...v, last_activity: !v.last_activity }))}>
                  <i className={`fas ${visibleCols.last_activity ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Last Activity
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.assignee} onClick={() => setVisibleCols(v => ({ ...v, assignee: !v.assignee }))}>
                  <i className={`fas ${visibleCols.assignee ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Assignee
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.next_follow_up} onClick={() => setVisibleCols(v => ({ ...v, next_follow_up: !v.next_follow_up }))}>
                  <i className={`fas ${visibleCols.next_follow_up ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Next Follow-up
                </Dropdown.Item>
                <Dropdown.Item active={visibleCols.action} onClick={() => setVisibleCols(v => ({ ...v, action: !v.action }))}>
                  <i className={`fas ${visibleCols.action ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Action
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary btn-sm" id="followups-filter-toggle">
                <i className="fas fa-filter me-1"></i>
                Filters
                {hasActiveFilters && <span className="badge bg-primary ms-1">●</span>}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ minWidth: 280 }}>
                <div className="px-3 py-2">
                  <div className="mb-2">
                    <label className="small fw-semibold text-muted">Stage</label>
                    <Form.Select size="sm" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
                      <option value="">All Stages</option>
                      {leadStages.map((s) => (
                        <option key={s.id ?? s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="mb-2">
                    <label className="small fw-semibold text-muted">Source</label>
                    <Form.Select size="sm" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                      <option value="">All Sources</option>
                      {leadSources.map((s) => (
                        <option key={s.id ?? s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="mb-2">
                    <label className="small fw-semibold text-muted">Assignee</label>
                    <Form.Select size="sm" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                      <option value="">All Assignees</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
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
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
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
          </div>
        </Card.Header>
        <Card.Body>
          {selectedRows.length > 0 && canDeleteLeads && (
            <div className="mb-2 d-flex justify-content-between align-items-center bg-light p-2 rounded">
              <span className="small fw-semibold">{selectedRows.length} selected</span>
              <Button variant="danger" size="sm" onClick={bulkDelete}>
                <i className="fas fa-trash me-1"></i> Delete Selected
              </Button>
            </div>
          )}
          <DataTable
            columns={columns}
            data={rows}
            progressPending={loading}
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={perPage}
            paginationDefaultPage={page}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            onChangePage={(p) => setPage(p)}
            onChangeRowsPerPage={(n) => setPerPage(n)}
            sortServer
            onSort={(col, dir) => {
              if (col.sortField) {
                setSortField(col.sortField);
                setSortDir(dir);
              }
            }}
            selectableRows={canDeleteLeads}
            onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
            clearSelectedRows={selectedRows.length === 0}
            highlightOnHover
            dense
            noDataComponent={canViewLeads ? "No leads found" : "No permission"}
            persistTableHead
            striped
            pointerOnHover
            responsive
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
        </Card.Body>
      </Card>
    </div>
  );
}
