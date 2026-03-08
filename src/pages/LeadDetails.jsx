import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Card, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../api";
import { canEdit, canView } from "../utils/permissions";
import { getUserData } from "../utils/permissions";

const typeLabels = {
  call: "Call",
  message: "Message",
  meeting: "Meeting",
  site_visit: "Site Visit",
  follow_up: "Follow-up",
  system: "System",
};

const typeIcons = {
  call: "fas fa-phone",
  message: "fas fa-comment-dots",
  meeting: "fas fa-handshake",
  site_visit: "fas fa-map-marker-alt",
  follow_up: "fas fa-bell",
  system: "fas fa-robot",
};

const stageVariant = (stage) => {
  const s = (stage || "").toLowerCase();
  if (s.includes("new")) return "info";
  if (s.includes("warm")) return "warning";
  if (s.includes("hot")) return "danger";
  if (s.includes("won")) return "success";
  return "secondary";
};

const statusVariant = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "open") return "primary";
  if (s === "won") return "success";
  if (s === "lost") return "secondary";
  return "dark";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = getUserData();
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;

  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState(null);

  const [showActivity, setShowActivity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leadStages, setLeadStages] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activity, setActivity] = useState({
    type: "call",
    notes: "",
    follow_up_date: "",
    lead_stage: "",
  });

  const openActivityModal = () => {
    // Format existing follow_up_date to datetime-local if present
    let followUpDateTime = "";
    if (lead?.next_follow_up_date) {
      const date = new Date(lead.next_follow_up_date);
      // Format as local datetime (YYYY-MM-DDTHH:mm)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      followUpDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    setActivity({
      type: "call",
      notes: "",
      follow_up_date: followUpDateTime,
      lead_stage: lead?.stage || "",
    });
    setShowActivity(true);
  };

  const canViewLeads = canView("leads");

  // Fetch master data for dropdowns
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [stagesRes, sourcesRes, catRes, subRes, usersRes, tagsRes] = await Promise.allSettled([
          api.get('/lead-stages?perPage=200'),
          api.get('/lead-sources?perPage=200'),
          api.get('/lead-categories?perPage=200'),
          api.get('/lead-subcategories?perPage=200'),
          api.get('/leads/assignable-users'), // Only users that can be assigned to
          api.get('/lead-tags?perPage=200'),
        ]);
        if (stagesRes.status === 'fulfilled') setLeadStages(stagesRes.value.data?.data || []);
        if (sourcesRes.status === 'fulfilled') setLeadSources(sourcesRes.value.data?.data || []);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data?.data || []);
        if (subRes.status === 'fulfilled') setSubcategories(subRes.value.data?.data || []);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data?.data || []);
        if (tagsRes.status === 'fulfilled') setTags(tagsRes.value.data?.data || []);
      } catch {}
    };
    fetchMasterData();
  }, []);

  const startEdit = (field, value) => {
    setEditing(field);
    setEditForm({ [field]: value });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({});
  };

  const saveInlineEdit = async (field) => {
    try {
      setSaving(true);
      // Handle assignment separately using the assign endpoint
      if (field === 'assigned_to') {
        await api.post(`/leads/${id}/assign`, {
          to_user_id: editForm[field],
          reason: 'Reassigned via inline edit'
        });
      } else {
        const update = { [field]: editForm[field] };
        // Handle tags separately (array)
        if (field === 'tags') {
          update.tags = editForm[field];
        }
        await api.put(`/leads/${id}`, update);
      }
      // Refetch lead to show updated values
      const controller = new AbortController();
      await load(controller.signal);
      toast.success('Updated successfully');
      cancelEdit();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const assigneeId =
    lead?.assigned_to !== null && lead?.assigned_to !== undefined
      ? Number(lead.assigned_to)
      : (lead?.assignee?.id !== null && lead?.assignee?.id !== undefined
          ? Number(lead.assignee.id)
          : null);

  const assignedToMe = Boolean(currentUserId && assigneeId && assigneeId === Number(currentUserId));

  const load = async (signal) => {
    if (!canViewLeads) return;
    setLoading(true);
    try {
      const res = await api.get(`/leads/${id}`, { signal });
      setLead(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load lead");
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [id, canViewLeads]);

  useEffect(() => {
    const loadStages = async () => {
      try {
        const res = await api.get("/lead-stages/list");
        setLeadStages(res.data?.data || []);
      } catch {
        setLeadStages([]);
      }
    };
    loadStages();
  }, []);

  const claim = async () => {
    try {
      await api.post(`/leads/${id}/claim`);
      toast.success("Assigned to you");
      const controller = new AbortController();
      load(controller.signal);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const addActivity = async () => {
    try {
      setSaving(true);
      await api.post(`/leads/${id}/activities`, {
        type: activity.type,
        notes: activity.notes,
        next_follow_up_date: activity.follow_up_date || null, // Send null to clear if empty
      });

      // Update lead stage if changed
      if (activity.lead_stage && activity.lead_stage !== lead?.stage) {
        await api.put(`/leads/${id}`, { stage: activity.lead_stage });
      }

      toast.success("Activity added");
      setShowActivity(false);
      setActivity({
        type: "call",
        notes: "",
        follow_up_date: "",
        lead_stage: "",
      });
      const controller = new AbortController();
      load(controller.signal);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!canViewLeads) {
    return (
      <div className="p-4">
        <Card className="border" style={{ borderColor: "#e2e8f0" }}>
          <Card.Body className="text-center py-5">
            <div className="text-secondary">Access denied</div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>
            Lead Details
          </h4>
          <div className="text-secondary small">
            Lead #{id}
            {lead?.assignee?.name ? (
              <span>
                {" "}• Assigned to <strong>{lead.assignee.name}</strong>
              </span>
            ) : null}
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light" onClick={() => navigate(-1)}>
            Back
          </button>
          {canEdit("leads") && !assignedToMe && (
            <button className="btn btn-primary" onClick={claim} disabled={loading}>
              <i className="fas fa-user-check me-1"></i>
              Assign to me
            </button>
          )}
          {canEdit("leads") && (
            <button className="btn btn-success" onClick={openActivityModal} disabled={loading}>
              <i className="fas fa-plus me-1"></i>
              Add Activity
            </button>
          )}
        </div>
      </div>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Body>
          {loading && <div className="text-secondary">Loading...</div>}
          {!loading && !lead && <div className="text-secondary">No data</div>}

          {!loading && lead && (
            <div className="row g-3">
              <div className="col-12 col-lg-4">
                <div className="border rounded p-3" style={{ borderColor: "#e2e8f0" }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-semibold">Timeline</div>
                    {canEdit("leads") && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={openActivityModal}
                        disabled={loading}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Add Activity
                      </button>
                    )}
                  </div>

                  {(lead.activities || []).length === 0 && (
                    <div className="text-secondary small">No activities</div>
                  )}

                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 8,
                        bottom: 8,
                        width: 2,
                        background: "#e2e8f0",
                      }}
                    />

                    {(lead.activities || []).map((a) => {
                      const isSystem = a.type === 'system';
                      return (
                        <div key={a.id} className="d-flex gap-3 pb-3" style={{ position: "relative" }}>
                          <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: 26,
                                height: 26,
                                background: isSystem ? "#f1f5f9" : "#e0f2fe",
                                color: isSystem ? "#64748b" : "#0369a1",
                                zIndex: 1
                              }}
                            >
                              <i className={typeIcons[a.type] || "fas fa-sticky-note"} style={{ fontSize: 12 }}></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="small fw-semibold" style={{ color: "#0f172a" }}>
                              {formatDateTime(a.activity_at || a.created_at)}
                            </div>
                            <div className="small" style={{ color: isSystem ? "#64748b" : "#334155" }}>
                              {typeLabels[a.type] || a.type}
                              {isSystem && <span className="ms-1 text-muted">(auto)</span>}
                            </div>
                            <div className="small text-secondary">
                              {a.creator?.name ? `@ ${a.creator.name}` : ""}
                            </div>
                            {a.notes ? (
                              <div className="small text-secondary mt-1" style={{ whiteSpace: "pre-wrap" }}>{a.notes}</div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-8">
                <div className="border rounded p-3" style={{ borderColor: "#e2e8f0" }}>
                  <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 58, height: 58, background: "#f1f5f9", color: "#0f172a", fontWeight: 700 }}
                      >
                        {(lead.name || "-")
                          .split(" ")
                          .slice(0, 2)
                          .map((p) => (p[0] || "").toUpperCase())
                          .join("")}
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: 16, color: "#0f172a" }}>{lead.name}</div>
                        {lead.phone && <div className="text-secondary small">{lead.phone}</div>}
                        {lead.email && <div className="text-secondary small">{lead.email}</div>}
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="mb-1">
                        <Badge bg={stageVariant(lead.stage)}>{lead.stage || "-"}</Badge>
                      </div>
                      {assignedToMe ? (
                        <Badge bg="success">ASSIGNED TO YOU</Badge>
                      ) : (
                        <Badge bg="light" text="dark">NOT ASSIGNED TO YOU</Badge>
                      )}
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="small text-secondary">Lead Source</div>
                      {editing === 'lead_source_id' ? (
                        <div className="d-flex gap-1">
                          <Form.Select
                            size="sm"
                            value={editForm.lead_source_id || ''}
                            onChange={(e) => setEditForm({ ...editForm, lead_source_id: e.target.value })}
                            disabled={saving}
                          >
                            <option value="">Choose</option>
                            {leadSources.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </Form.Select>
                          <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('lead_source_id')} disabled={saving}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="fw-semibold">{lead.source || "-"}</div>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit('lead_source_id', lead.lead_source_id || '')}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="small text-secondary">Next Follow-up</div>
                      <div className="fw-semibold">{formatDateTime(lead.next_follow_up_date)}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="small text-secondary">Category</div>
                      {editing === 'lead_category_id' ? (
                        <div className="d-flex gap-1">
                          <Form.Select
                            size="sm"
                            value={editForm.lead_category_id || ''}
                            onChange={(e) => setEditForm({ ...editForm, lead_category_id: e.target.value, lead_subcategory_id: '' })}
                            disabled={saving}
                          >
                            <option value="">Choose</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </Form.Select>
                          <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('lead_category_id')} disabled={saving}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="fw-semibold">{lead.category?.name || "-"}</div>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit('lead_category_id', lead.lead_category_id || '')}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="small text-secondary">Subcategory</div>
                      {editing === 'lead_subcategory_id' ? (
                        <div className="d-flex gap-1">
                          <Form.Select
                            size="sm"
                            value={editForm.lead_subcategory_id || ''}
                            onChange={(e) => setEditForm({ ...editForm, lead_subcategory_id: e.target.value })}
                            disabled={saving}
                          >
                            <option value="">Choose</option>
                            {subcategories.filter(s => s.lead_category_id == Number(lead.lead_category_id)).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </Form.Select>
                          <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('lead_subcategory_id')} disabled={saving}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="fw-semibold">{lead.subcategory?.name || "-"}</div>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit('lead_subcategory_id', lead.lead_subcategory_id || '')}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="small text-secondary">Assignee</div>
                      {editing === 'assigned_to' ? (
                        <div className="d-flex gap-1">
                          <Form.Select
                            size="sm"
                            value={editForm.assigned_to || ''}
                            onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                            disabled={saving}
                          >
                            <option value="">Select User</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </Form.Select>
                          <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('assigned_to')} disabled={saving}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="fw-semibold">{lead.assignee?.name || "-"}</div>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit('assigned_to', lead.assigned_to || '')}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="small text-secondary">Created</div>
                      <div className="fw-semibold">{formatDateTime(lead.created_at)}</div>
                    </div>
                    <div className="col-12">
                      <div className="small text-secondary">Description</div>
                      {editing === 'description' ? (
                        <div className="d-flex gap-1 flex-column">
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            disabled={saving}
                          />
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('description')} disabled={saving}>
                              <i className="fas fa-check"></i> Save
                            </button>
                            <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                              <i className="fas fa-times"></i> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div style={{ color: "#0f172a", whiteSpace: "pre-wrap", flex: 1 }}>{lead.description || "-"}</div>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary flex-shrink-0" onClick={() => startEdit('description', lead.description || '')}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <div className="small text-secondary">Lead Stage</div>
                      {editing === 'stage' ? (
                        <div className="d-flex gap-1">
                          <Form.Select
                            size="sm"
                            value={editForm.stage || ''}
                            onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                            disabled={saving}
                          >
                            <option value="">Choose</option>
                            {leadStages.map(s => (
                              <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                            ))}
                          </Form.Select>
                          <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('stage')} disabled={saving}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <Badge bg={stageVariant(lead.stage)}>{lead.stage || "-"}</Badge>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit('stage', lead.stage || '')}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <div className="small text-secondary">Tags</div>
                      {editing === 'tags' ? (
                        <div className="d-flex gap-1 flex-column">
                          <Form.Select
                            multiple
                            size="sm"
                            value={editForm.tags || []}
                            onChange={(e) => setEditForm({ ...editForm, tags: Array.from(e.target.selectedOptions, o => o.value) })}
                            disabled={saving}
                            style={{ height: '80px' }}
                          >
                            {tags.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </Form.Select>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" onClick={() => saveInlineEdit('tags')} disabled={saving}>
                              <i className="fas fa-check"></i> Save
                            </button>
                            <button className="btn btn-sm btn-light" onClick={cancelEdit} disabled={saving}>
                              <i className="fas fa-times"></i> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="d-flex flex-wrap gap-1">
                            {(lead.tags || []).length === 0 && <span className="text-muted">-</span>}
                            {(lead.tags || []).map(t => (
                              <span key={t.id} className="badge bg-light text-dark border" style={{ fontSize: 11 }}>
                                {t.name}
                              </span>
                            ))}
                          </div>
                          {canEdit("leads") && assignedToMe && (
                            <button className="btn btn-sm btn-outline-secondary flex-shrink-0" onClick={() => startEdit('tags', (lead.tags || []).map(t => String(t.id)))}>
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded p-3 mt-3" style={{ borderColor: "#e2e8f0" }}>
                  <div className="fw-semibold">Assignment History</div>
                  <div className="mt-2">
                    {(lead.assignments || []).length === 0 && (
                      <div className="text-secondary small">No history</div>
                    )}
                    {(lead.assignments || []).map((h) => (
                      <div key={h.id} className="border rounded p-2 mb-2" style={{ borderColor: "#e2e8f0" }}>
                        <div className="d-flex justify-content-between gap-2">
                          <div className="small">
                            <span className="fw-semibold">{h.from_user?.name || "Unassigned"}</span>
                            <span className="text-secondary"> → </span>
                            <span className="fw-semibold">{h.to_user?.name || "-"}</span>
                          </div>
                          <div className="text-secondary small">{formatDateTime(h.created_at)}</div>
                        </div>
                        <div className="text-secondary small mt-1">
                          {h.assigned_by?.name ? `Assigned by ${h.assigned_by.name}` : ""}
                          {h.reason ? ` • ${h.reason}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showActivity} onHide={() => setShowActivity(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Add Activity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!assignedToMe && (
            <div className="alert alert-warning mb-3">
              You must <strong>Assign to me</strong> first to add activities.
            </div>
          )}

          <div className="small text-secondary mb-2">Please select the type of activity you want to add</div>

          <Form.Group className="mb-3">
            <Form.Label>Activity Type</Form.Label>
            <Form.Select value={activity.type} onChange={(e) => setActivity({ ...activity, type: e.target.value })}>
              <option value="call">Call</option>
              <option value="message">Message</option>
              <option value="meeting">Meeting</option>
              <option value="site_visit">Site Visit</option>
              <option value="follow_up">Follow-up</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Add Discussion Summary</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Add Discussion Summary.."
              value={activity.notes}
              onChange={(e) => setActivity({ ...activity, notes: e.target.value })}
            />
          </Form.Group>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Follow Up Date & Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={activity.follow_up_date}
                  onChange={(e) => setActivity({ ...activity, follow_up_date: e.target.value })}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Stage</Form.Label>
                <Form.Select
                  value={activity.lead_stage}
                  onChange={(e) => setActivity({ ...activity, lead_stage: e.target.value })}
                >
                  <option value="">Choose</option>
                  {(leadStages || []).map((s) => (
                    <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-100 d-flex gap-2 justify-content-end">
            <button className="btn btn-light" onClick={() => setShowActivity(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={addActivity} disabled={saving || !assignedToMe} style={{ minWidth: 140 }}>
              <i className="fas fa-save me-1"></i>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
