import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
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
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../api";
import { canEdit, canView, getUserData } from "../utils/permissions";
import WhatsAppSendModal from "../components/WhatsAppSendModal";

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

const stageChipSx = (stage) => {
  const s = (stage || "").toLowerCase();
  if (s.includes("new")) return { bgcolor: '#e0f2fe', color: '#075985' };
  if (s.includes("warm")) return { bgcolor: '#fff4d6', color: '#b76e00' };
  if (s.includes("hot")) return { bgcolor: '#ffe4de', color: '#b71d18' };
  if (s.includes("won")) return { bgcolor: '#dbf5e9', color: '#118d57' };
  return { bgcolor: '#f1f5f9', color: '#475569' };
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const fieldLabelSx = {
  color: 'text.secondary',
  fontWeight: 700,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  display: 'block',
  mb: .75,
};

const getInitials = (name) => (name || '-')
  .split(' ')
  .slice(0, 2)
  .map((p) => (p[0] || '').toUpperCase())
  .join('');

// Normalize any dropdown/master-data response shape to a plain array
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
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

function EditIconButton({ onClick }) {
  return (
    <Tooltip title="Edit">
      <IconButton
        size="small"
        onClick={onClick}
        aria-label="Edit"
        sx={{ border: '1px solid', borderColor: 'divider', width: 28, height: 28, flexShrink: 0 }}
      >
        <i className="fas fa-edit" style={{ fontSize: 11 }} aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}

function SaveCancelButtons({ field, saving, onSave, onCancel }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
      <Tooltip title="Save">
        <span>
          <IconButton
            size="small"
            onClick={() => onSave(field)}
            disabled={saving}
            aria-label="Save"
            sx={{ border: '1px solid', borderColor: 'success.main', color: 'success.dark', width: 28, height: 28 }}
          >
            {saving ? <CircularProgress size={12} color="inherit" /> : <i className="fas fa-check" style={{ fontSize: 11 }} aria-hidden="true" />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Cancel">
        <span>
          <IconButton
            size="small"
            onClick={onCancel}
            disabled={saving}
            aria-label="Cancel"
            sx={{ border: '1px solid', borderColor: 'divider', width: 28, height: 28 }}
          >
            <i className="fas fa-times" style={{ fontSize: 11 }} aria-hidden="true" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = getUserData();
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;

  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState(null);

  const [showActivity, setShowActivity] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
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

  const canViewLeads = canView("leads");
  const canEditLeads = canEdit("leads");

  const openActivityDialog = () => {
    // Format existing follow_up_date to datetime-local if present
    let followUpDateTime = "";
    if (lead?.next_follow_up_date) {
      const date = new Date(lead.next_follow_up_date);
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

  const load = useCallback(async (signal) => {
    if (!canViewLeads) return;
    setLoading(true);
    try {
      const res = await api.get(`/leads/${id}`, { signal });
      setLead(res.data.data);
    } catch (e) {
      if (signal?.aborted) return;
      toast.error(e.response?.data?.message || "Failed to load lead");
      setLead(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id, canViewLeads]);

  // Fetch master data for inline-edit dropdowns
  const loadDropdowns = useCallback(async () => {
    const [stagesRes, sourcesRes, catRes, subRes, usersRes, tagsRes, stageListRes] = await Promise.allSettled([
      api.get('/lead-stages?perPage=200'),
      api.get('/lead-sources?perPage=200'),
      api.get('/lead-categories?perPage=200'),
      api.get('/lead-subcategories?perPage=200'),
      api.get('/leads/assignable-users'), // Only users that can be assigned to
      api.get('/lead-tags?perPage=200'),
      api.get('/lead-stages/list'),
    ]);
    if (stagesRes.status === 'fulfilled') setLeadStages(toArray(stagesRes.value.data));
    if (sourcesRes.status === 'fulfilled') setLeadSources(toArray(sourcesRes.value.data));
    if (catRes.status === 'fulfilled') setCategories(toArray(catRes.value.data));
    if (subRes.status === 'fulfilled') setSubcategories(toArray(subRes.value.data));
    if (usersRes.status === 'fulfilled') setUsers(toArray(usersRes.value.data));
    if (tagsRes.status === 'fulfilled') setTags(toArray(tagsRes.value.data));
    // /lead-stages/list is authoritative for stage names when available
    if (stageListRes.status === 'fulfilled') setLeadStages(toArray(stageListRes.value.data));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

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

  const handleActivityDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShowActivity(false);
  };

  if (!canViewLeads) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        Access denied. You don’t have permission to view leads.
      </Alert>
    );
  }

  const activityItems = lead?.activities || [];
  const assignments = lead?.assignments || [];
  const editTagValues = (editForm.tags || []).map(String);
  const currentCategoryId = lead?.lead_category_id ?? lead?.category?.id ?? '';
  const filteredSubcategories = subcategories.filter(
    (s) => String(s.category_id || s.lead_category_id) === String(currentCategoryId)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Lead Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            Lead #{id}
            {lead?.assignee?.name ? (
              <> • Assigned to <strong>{lead.assignee.name}</strong></>
            ) : null}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            startIcon={<i className="fas fa-arrow-left" aria-hidden="true" />}
          >
            Back
          </Button>
          {lead?.phone && (
            <Button
              variant="contained"
              color="success"
              onClick={() => setShowWhatsApp(true)}
              startIcon={<i className="fab fa-whatsapp" aria-hidden="true" />}
            >
              Send WhatsApp
            </Button>
          )}
          {canEditLeads && !assignedToMe && (
            <Button
              variant="contained"
              onClick={claim}
              disabled={loading}
              startIcon={<i className="fas fa-user-check" aria-hidden="true" />}
            >
              Assign to me
            </Button>
          )}
          {canEditLeads && (
            <Button
              variant="contained"
              color="secondary"
              onClick={openActivityDialog}
              disabled={loading}
              startIcon={<i className="fas fa-plus" aria-hidden="true" />}
            >
              Add Activity
            </Button>
          )}
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {!lead && !loading && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>No data</Alert>
      )}

      {!lead && loading && (
        <Card sx={cardSx}>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </CardContent>
        </Card>
      )}

      {lead && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 2fr)' }, gap: 3, alignItems: 'start' }}>

          {/* Timeline */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Timeline</Typography>
                {canEditLeads && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={openActivityDialog}
                    disabled={loading}
                    startIcon={<i className="fas fa-plus" aria-hidden="true" />}
                  >
                    Add Activity
                  </Button>
                )}
              </Stack>
              <Divider sx={{ mb: 2.5 }} />

              {activityItems.length === 0 && (
                <Typography variant="body2" color="text.secondary">No activities</Typography>
              )}

              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 15,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    bgcolor: 'grey.200',
                  }}
                />
                <Stack spacing={2.5}>
                  {activityItems.map((a) => {
                    const isSystem = a.type === 'system';
                    return (
                      <Box key={a.id} sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: isSystem ? 'grey.100' : '#e0f2fe',
                            color: isSystem ? 'text.secondary' : '#0369a1',
                            zIndex: 1,
                          }}
                        >
                          <i className={typeIcons[a.type] || "fas fa-sticky-note"} style={{ fontSize: 12 }} aria-hidden="true" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {formatDateTime(a.activity_at || a.created_at)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: isSystem ? 'text.secondary' : 'text.primary' }}>
                            {typeLabels[a.type] || a.type}
                            {isSystem && (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: .5 }}>
                                (auto)
                              </Typography>
                            )}
                          </Typography>
                          {a.creator?.name ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              @ {a.creator.name}
                            </Typography>
                          ) : null}
                          {a.notes ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: .5, whiteSpace: 'pre-wrap' }}>
                              {a.notes}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Lead profile + fields */}
          <Box>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#eaf0f6', color: 'primary.main', fontSize: 18, fontWeight: 700 }}>
                      {getInitials(lead.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{lead.name}</Typography>
                      {lead.phone && <Typography variant="body2" color="text.secondary">{lead.phone}</Typography>}
                      {lead.email && <Typography variant="body2" color="text.secondary">{lead.email}</Typography>}
                    </Box>
                  </Stack>

                  <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={1} sx={{ flexShrink: 0 }}>
                    <Chip label={lead.stage || "-"} size="small" sx={{ ...stageChipSx(lead.stage), fontWeight: 700 }} />
                    {assignedToMe ? (
                      <Chip label="ASSIGNED TO YOU" size="small" sx={{ bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }} />
                    ) : (
                      <Chip label="NOT ASSIGNED TO YOU" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    )}
                  </Stack>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>

                  {/* Lead Source */}
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>Lead Source</Typography>
                    {editing === 'lead_source_id' ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.lead_source_id ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, lead_source_id: e.target.value })}
                            disabled={saving}
                            displayEmpty
                          >
                            <MenuItem value=""><em>Choose</em></MenuItem>
                            {leadSources.map(s => (
                              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <SaveCancelButtons field="lead_source_id" saving={saving} onSave={saveInlineEdit} onCancel={cancelEdit} />
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.source || "-"}</Typography>
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('lead_source_id', lead.lead_source_id || '')} />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Next Follow-up */}
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>Next Follow-up</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(lead.next_follow_up_date)}</Typography>
                  </Box>

                  {/* Category */}
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>Category</Typography>
                    {editing === 'lead_category_id' ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.lead_category_id ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, lead_category_id: e.target.value, lead_subcategory_id: '' })}
                            disabled={saving}
                            displayEmpty
                          >
                            <MenuItem value=""><em>Choose</em></MenuItem>
                            {categories.map(c => (
                              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <SaveCancelButtons field="lead_category_id" saving={saving} onSave={saveInlineEdit} onCancel={cancelEdit} />
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.category?.name || "-"}</Typography>
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('lead_category_id', lead.lead_category_id || '')} />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Subcategory */}
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>Subcategory</Typography>
                    {editing === 'lead_subcategory_id' ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.lead_subcategory_id ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, lead_subcategory_id: e.target.value })}
                            disabled={saving}
                            displayEmpty
                          >
                            <MenuItem value=""><em>Choose</em></MenuItem>
                            {filteredSubcategories.length === 0 ? (
                              <MenuItem disabled value="__none__">No subcategories for this category</MenuItem>
                            ) : (
                              filteredSubcategories.map(s => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                        <SaveCancelButtons field="lead_subcategory_id" saving={saving} onSave={saveInlineEdit} onCancel={cancelEdit} />
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.subcategory?.name || "-"}</Typography>
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('lead_subcategory_id', lead.lead_subcategory_id || '')} />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Assignee */}
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>Assignee</Typography>
                    {editing === 'assigned_to' ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.assigned_to ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                            disabled={saving}
                            displayEmpty
                          >
                            <MenuItem value=""><em>Select User</em></MenuItem>
                            {users.map(u => (
                              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <SaveCancelButtons field="assigned_to" saving={saving} onSave={saveInlineEdit} onCancel={cancelEdit} />
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.assignee?.name || "-"}</Typography>
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('assigned_to', lead.assigned_to || '')} />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Created */}
                  <Box>
                    <Typography variant="caption" sx={fieldLabelSx}>Created</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(lead.created_at)}</Typography>
                  </Box>

                  {/* Description */}
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={fieldLabelSx}>Description</Typography>
                    {editing === 'description' ? (
                      <Stack spacing={1}>
                        <TextField
                          size="small"
                          multiline
                          rows={3}
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          disabled={saving}
                          fullWidth
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => saveInlineEdit('description')}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <i className="fas fa-check" aria-hidden="true" />}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={cancelEdit}
                            disabled={saving}
                            startIcon={<i className="fas fa-times" aria-hidden="true" />}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', flex: 1 }}>
                          {lead.description || "-"}
                        </Typography>
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('description', lead.description || '')} />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Lead Stage */}
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={fieldLabelSx}>Lead Stage</Typography>
                    {editing === 'stage' ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: 420 }}>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editForm.stage ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                            disabled={saving}
                            displayEmpty
                          >
                            <MenuItem value=""><em>Choose</em></MenuItem>
                            {leadStages.map(s => (
                              <MenuItem key={s.id ?? s.name} value={s.name}>{s.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <SaveCancelButtons field="stage" saving={saving} onSave={saveInlineEdit} onCancel={cancelEdit} />
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Chip label={lead.stage || "-"} size="small" sx={{ ...stageChipSx(lead.stage), fontWeight: 700 }} />
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('stage', lead.stage || '')} />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Tags */}
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={fieldLabelSx}>Tags</Typography>
                    {editing === 'tags' ? (
                      <Stack spacing={1} sx={{ maxWidth: 420 }}>
                        <FormControl size="small" fullWidth>
                          <Select
                            multiple
                            displayEmpty
                            value={editTagValues}
                            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                            disabled={saving}
                            renderValue={(selected) =>
                              selected.length === 0
                                ? <em>Select tags</em>
                                : tags.filter(t => selected.includes(String(t.id))).map(t => t.name).join(', ')
                            }
                          >
                            {tags.map(t => (
                              <MenuItem key={t.id} value={String(t.id)}>
                                <Checkbox size="small" checked={editTagValues.includes(String(t.id))} />
                                <ListItemText primary={t.name} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => saveInlineEdit('tags')}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <i className="fas fa-check" aria-hidden="true" />}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={cancelEdit}
                            disabled={saving}
                            startIcon={<i className="fas fa-times" aria-hidden="true" />}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .75 }}>
                          {(lead.tags || []).length === 0 && (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                          {(lead.tags || []).map(t => (
                            <Chip key={t.id} label={t.name} size="small" variant="outlined" />
                          ))}
                        </Box>
                        {canEditLeads && assignedToMe && (
                          <EditIconButton onClick={() => startEdit('tags', (lead.tags || []).map(t => String(t.id)))} />
                        )}
                      </Stack>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Assignment History */}
            <Card sx={{ ...cardSx, mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Assignment History</Typography>
                <Divider sx={{ my: 2 }} />
                {assignments.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No history</Typography>
                )}
                {assignments.map((h) => (
                  <Box
                    key={h.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      p: 1.5,
                      mb: 1.5,
                      '&:last-of-type': { mb: 0 },
                    }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>{h.from_user?.name || "Unassigned"}</Box>
                        <Box component="span" sx={{ color: 'text.secondary', mx: .5 }}>→</Box>
                        <Box component="span" sx={{ fontWeight: 700 }}>{h.to_user?.name || "-"}</Box>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateTime(h.created_at)}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: .5 }}>
                      {h.assigned_by?.name ? `Assigned by ${h.assigned_by.name}` : ""}
                      {h.reason ? ` • ${h.reason}` : ""}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      <WhatsAppSendModal
        show={showWhatsApp}
        onHide={() => setShowWhatsApp(false)}
        toNumber={lead?.phone}
        toName={lead?.name}
        contextType="lead"
        contextId={id}
      />

      <Dialog
        open={showActivity}
        onClose={handleActivityDialogClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: '0 8px 24px rgba(28,37,46,.12)' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add Activity</Typography>
          <IconButton size="small" onClick={() => setShowActivity(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {!assignedToMe && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              You must <strong>Assign to me</strong> first to add activities.
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select the type of activity you want to add
          </Typography>

          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Activity Type</InputLabel>
              <Select
                label="Activity Type"
                value={activity.type}
                onChange={(e) => setActivity({ ...activity, type: e.target.value })}
              >
                <MenuItem value="call">Call</MenuItem>
                <MenuItem value="message">Message</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="site_visit">Site Visit</MenuItem>
                <MenuItem value="follow_up">Follow-up</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Add Discussion Summary"
              placeholder="Add Discussion Summary.."
              multiline
              rows={5}
              value={activity.notes}
              onChange={(e) => setActivity({ ...activity, notes: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                size="small"
                type="datetime-local"
                label="Follow Up Date & Time"
                value={activity.follow_up_date}
                onChange={(e) => setActivity({ ...activity, follow_up_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Lead Stage</InputLabel>
                <Select
                  label="Lead Stage"
                  value={activity.lead_stage}
                  onChange={(e) => setActivity({ ...activity, lead_stage: e.target.value })}
                >
                  <MenuItem value=""><em>Choose</em></MenuItem>
                  {(leadStages || []).map((s) => (
                    <MenuItem key={s.id ?? s.name} value={s.name}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShowActivity(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addActivity}
            disabled={saving || !assignedToMe}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-save" aria-hidden="true" />}
            sx={{ minWidth: 140 }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
