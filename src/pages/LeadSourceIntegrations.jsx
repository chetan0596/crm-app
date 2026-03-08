import { useEffect, useState } from "react";
import { Card, Button, Form, Modal, Badge, Alert, Tab, Tabs } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../api";
import { canEdit } from "../utils/permissions";

const SOURCES = [
  { key: "indiamart", name: "IndiaMART", color: "primary", icon: "fa-globe" },
  { key: "aajjo", name: "Aajjo", color: "success", icon: "fa-building" },
  { key: "tradeindia", name: "TradeIndia", color: "warning", icon: "fa-handshake" },
];

const ASSIGNMENT_MODES = [
  { value: "round_robin", label: "Round Robin", description: "Distribute leads equally among selected users" },
  { value: "fixed_user", label: "Fixed User", description: "Assign all leads to a specific user" },
  { value: "caller_response", label: "Caller Response (IndiaMART only)", description: "Assign to employee who responds to IndiaMART call" },
];

const DUPLICATE_HANDLING = [
  { value: "create_new", label: "Create New Lead", description: "Always create a new lead even if duplicate exists" },
  { value: "merge", label: "Merge Lead", description: "Merge with existing lead if same mobile number found" },
];

export default function LeadSourceIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [webhookUrls, setWebhookUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaStatus, setMetaStatus] = useState(null);
  const [metaPages, setMetaPages] = useState([]);
  const [metaSelectedPageId, setMetaSelectedPageId] = useState("");
  const [metaForms, setMetaForms] = useState([]);
  const [showMetaUsersModal, setShowMetaUsersModal] = useState(false);
  const [metaUsersFormId, setMetaUsersFormId] = useState(null);
  const [metaUsersSelectedIds, setMetaUsersSelectedIds] = useState([]);
  const [formData, setFormData] = useState({
    is_active: true,
    integration_type: "webhook",
    api_endpoint: "",
    docs_url: "",
    api_username: "",
    api_key: "",
    api_secret: "",
    assignment_mode: "round_robin",
    fixed_user_id: "",
    round_robin_users: [],
    duplicate_handling: "create_new",
    default_lead_source_id: "",
    default_lead_stage_id: "",
  });

  const [syncing, setSyncing] = useState(false);

  const canEditIntegrations = canEdit("leads");

  useEffect(() => {
    loadData();
    loadMeta("");
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, usersRes, urlsRes, sourcesRes, stagesRes] = await Promise.all([
        api.get("/lead-source-integrations"),
        api.get("/lead-source-integrations/available-users/list"),
        api.get("/lead-source-integrations/webhook-urls/all"),
        api.get("/lead-sources/list"),
        api.get("/lead-stages/list"),
      ]);

      setIntegrations(integrationsRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
      setWebhookUrls(urlsRes.data?.data || {});
      setLeadSources(sourcesRes.data?.data || []);
      setLeadStages(stagesRes.data?.data || []);
    } catch (e) {
      toast.error("Failed to load integration settings");
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async (pageId = metaSelectedPageId) => {
    try {
      setMetaLoading(true);
      const [statusRes, pagesRes] = await Promise.all([
        api.get("/meta-lead-ads/status"),
        api.get("/meta-lead-ads/pages"),
      ]);

      setMetaStatus(statusRes.data?.data?.connection || null);
      const pages = pagesRes.data?.data || [];
      setMetaPages(pages);

      const effectivePageId = pageId || (pages[0]?.page_id || "");
      setMetaSelectedPageId(effectivePageId);

      if (effectivePageId) {
        const formsRes = await api.get(`/meta-lead-ads/pages/${effectivePageId}/forms`);
        setMetaForms(formsRes.data?.data?.forms || []);
      } else {
        setMetaForms([]);
      }
    } catch (e) {
      toast.error("Failed to load Meta Lead Ads data");
    } finally {
      setMetaLoading(false);
    }
  };

  const connectMeta = async () => {
    try {
      const res = await api.get("/meta-lead-ads/connect-url");
      const url = res.data?.data?.url;
      if (!url) {
        toast.error("Connect URL not available");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      toast.info("Complete Meta login in the new tab, then click Refresh here.");
    } catch (e) {
      toast.error("Failed to start Meta connection");
    }
  };

  const selectMetaPage = async (pageId) => {
    setMetaSelectedPageId(pageId);
    if (!pageId) {
      setMetaForms([]);
      return;
    }

    try {
      setMetaLoading(true);
      const formsRes = await api.get(`/meta-lead-ads/pages/${pageId}/forms`);
      setMetaForms(formsRes.data?.data?.forms || []);
    } catch {
      toast.error("Failed to load forms");
    } finally {
      setMetaLoading(false);
    }
  };

  const setMetaFormEnabled = async (formId, isEnabled) => {
    try {
      await api.post(`/meta-lead-ads/forms/${formId}/enabled`, { is_enabled: isEnabled });
      setMetaForms((prev) => prev.map((f) => (f.form_id === formId ? { ...f, is_enabled: isEnabled } : f)));
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update form");
    }
  };

  const openMetaUsersModal = async (form) => {
    setMetaUsersFormId(form.form_id);
    const selected = (form.users || [])
      .filter((u) => u.is_active)
      .map((u) => u.user_id);
    setMetaUsersSelectedIds(selected);
    setShowMetaUsersModal(true);
  };

  const saveMetaUsers = async () => {
    if (!metaUsersFormId) return;
    try {
      await api.post(`/meta-lead-ads/forms/${metaUsersFormId}/users`, { user_ids: metaUsersSelectedIds });
      toast.success("Form users updated");
      setShowMetaUsersModal(false);
      loadMeta(metaSelectedPageId);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update users");
    }
  };

  const openEditModal = (sourceKey) => {
    const existing = integrations.find((i) => i.source_name === sourceKey);
    setSelectedSource(sourceKey);

    if (existing) {
      setFormData({
        is_active: existing.is_active ?? true,
        integration_type: existing.integration_type || "webhook",
        api_endpoint: existing.api_endpoint || "",
        docs_url: existing.docs_url || "",
        api_username: existing.api_username || "",
        api_key: existing.api_key || "",
        api_secret: existing.api_secret || "",
        assignment_mode: existing.assignment_mode || "round_robin",
        fixed_user_id: existing.fixed_user_id || "",
        round_robin_users: existing.round_robin_users || [],
        duplicate_handling: existing.duplicate_handling || "create_new",
        default_lead_source_id: existing.default_lead_source_id || "",
        default_lead_stage_id: existing.default_lead_stage_id || "",
      });
    } else {
      setFormData({
        is_active: true,
        integration_type: "webhook",
        api_endpoint: "",
        docs_url: "",
        api_username: "",
        api_key: "",
        api_secret: "",
        assignment_mode: "round_robin",
        fixed_user_id: "",
        round_robin_users: [],
        duplicate_handling: "create_new",
        default_lead_source_id: "",
        default_lead_stage_id: "",
      });
    }

    setShowModal(true);
  };

  const saveIntegration = async () => {
    if (!selectedSource) return;

    // Validation
    if (formData.integration_type === "pull_api") {
      if (selectedSource === "indiamart") {
        if (!formData.api_key?.trim()) {
          toast.error("Please enter IndiaMART CRM Key (glusr_crm_key)");
          return;
        }
      } else {
        if (!formData.api_endpoint?.trim()) {
          toast.error("Please enter API Endpoint URL");
          return;
        }
        if (!formData.api_username?.trim()) {
          toast.error(selectedSource === "tradeindia" ? "Please enter User ID" : "Please enter API Username");
          return;
        }
        if (!formData.api_key?.trim()) {
          toast.error(selectedSource === "tradeindia" ? "Please enter Key" : "Please enter API Key");
          return;
        }
      }
      if (selectedSource === "tradeindia" && !formData.api_secret?.trim()) {
        toast.error("Please enter Profile ID");
        return;
      }
    }

    if (formData.assignment_mode === "fixed_user" && !formData.fixed_user_id) {
      toast.error("Please select a fixed user");
      return;
    }

    if (formData.assignment_mode === "round_robin" && formData.round_robin_users.length === 0) {
      toast.error("Please select at least one user for round-robin");
      return;
    }

    if (formData.assignment_mode === "caller_response" && selectedSource !== "indiamart") {
      toast.error("Caller response mode is only available for IndiaMART");
      return;
    }

    try {
      setSaving(true);
      await api.post(`/lead-source-integrations/${selectedSource}`, formData);
      toast.success("Integration settings saved");
      setShowModal(false);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (sourceName) => {
    try {
      await api.post(`/lead-source-integrations/${sourceName}/toggle`);
      toast.success("Status updated");
      loadData();
    } catch (e) {
      toast.error("Failed to toggle status");
    }
  };

  const resetRoundRobin = async (sourceName) => {
    try {
      await api.post(`/lead-source-integrations/${sourceName}/reset-round-robin`);
      toast.success("Round-robin counter reset");
    } catch (e) {
      toast.error("Failed to reset counter");
    }
  };

  const syncAajjoNow = async (hours = 24) => {
    try {
      setSyncing(true);
      const res = await api.post("/lead-source-integrations/sync/aajjo", { hours });
      toast.success(res.data?.message || "Sync completed");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const syncTradeIndiaNow = async (hours = 24) => {
    try {
      setSyncing(true);
      const res = await api.post("/lead-source-integrations/sync/tradeindia", { hours });
      toast.success(res.data?.message || "Sync completed");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const syncIndiamartNow = async (hours = 24) => {
    try {
      setSyncing(true);
      const res = await api.post("/lead-source-integrations/sync/indiamart", { hours });
      toast.success(res.data?.message || "Sync completed");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const syncNowForSource = (sourceKey, hours = 24) => {
    if (sourceKey === "aajjo") return syncAajjoNow(hours);
    if (sourceKey === "tradeindia") return syncTradeIndiaNow(hours);
    if (sourceKey === "indiamart") return syncIndiamartNow(hours);
  };

  const getIntegration = (sourceKey) => {
    return integrations.find((i) => i.source_name === sourceKey);
  };

  const copyWebhookUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied to clipboard");
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold">Lead Source Integrations</h4>
        <Button variant="outline-primary" onClick={loadData} disabled={loading}>
          <i className="fas fa-sync-alt me-1"></i>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <Alert variant="info" className="mb-4">
        <i className="fas fa-info-circle me-2"></i>
        Configure how leads from external sources (IndiaMART, Aajjo, TradeIndia) are imported and assigned.
      </Alert>

      <div className="row g-4">
        {SOURCES.map((source) => {
          const integration = getIntegration(source.key);
          const isActive = integration?.is_active ?? false;
          const webhookUrl = webhookUrls[source.key]?.webhook_url || "";

          return (
            <div key={source.key} className="col-md-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <i className={`fas ${source.icon}`}></i>
                    <span className="fw-semibold">{source.name}</span>
                  </div>
                  <Badge bg={isActive ? "success" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <small className="text-muted">Assignment Mode</small>
                    <div className="fw-semibold">
                      {integration?.assignment_mode
                        ? ASSIGNMENT_MODES.find((m) => m.value === integration.assignment_mode)?.label
                        : "Not configured"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Duplicate Handling</small>
                    <div className="fw-semibold">
                      {integration?.duplicate_handling
                        ? DUPLICATE_HANDLING.find((d) => d.value === integration.duplicate_handling)?.label
                        : "Not configured"}
                    </div>
                  </div>

                  {integration?.assignment_mode === "round_robin" && (
                    <div className="mb-3">
                      <small className="text-muted">Round-Robin Users</small>
                      <div className="fw-semibold">
                        {integration?.round_robin_users?.length || 0} users
                      </div>
                    </div>
                  )}

                  {integration?.assignment_mode === "fixed_user" && integration?.fixed_user && (
                    <div className="mb-3">
                      <small className="text-muted">Fixed User</small>
                      <div className="fw-semibold">{integration.fixed_user.name}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <small className="text-muted">Integration Type</small>
                    <div className="fw-semibold">
                      {integration?.integration_type === "pull_api" ? "Pull API" : "Webhook"}
                    </div>
                  </div>

                  {integration?.integration_type === "pull_api" && (
                    <div className="mb-3">
                      <small className="text-muted">Last Sync</small>
                      <div className="fw-semibold">
                        {integration?.last_sync_at 
                          ? new Date(integration.last_sync_at).toLocaleString() 
                          : "Never"}
                      </div>
                    </div>
                  )}

                  {webhookUrls[source.key]?.type === "webhook" && (
                    <div className="mb-3">
                      <small className="text-muted d-block">Webhook URL</small>
                      <div className="input-group input-group-sm mt-1">
                        <input
                          type="text"
                          className="form-control"
                          value={webhookUrls[source.key]?.webhook_url || ""}
                          readOnly
                        />
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => copyWebhookUrl(webhookUrls[source.key]?.webhook_url)}
                        >
                          <i className="fas fa-copy"></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  {webhookUrls[source.key]?.type === "pull_api" && (
                    <div className="mb-3">
                      <small className="text-muted d-block">API Endpoint</small>
                      <div className="text-break small text-muted">
                        {webhookUrls[source.key]?.api_endpoint}
                      </div>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex gap-2">
                  {canEditIntegrations && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openEditModal(source.key)}
                        className="flex-grow-1"
                      >
                        <i className="fas fa-edit me-1"></i> Configure
                      </Button>
                      {integration?.integration_type === "pull_api" && isActive && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => syncNowForSource(source.key, 24)}
                          disabled={syncing}
                          title="Sync last 24 hours"
                        >
                          <i className={`fas fa-${syncing ? "spinner fa-spin" : "sync"}`}></i>
                        </Button>
                      )}
                      {integration && (
                        <Button
                          variant={isActive ? "outline-warning" : "outline-success"}
                          size="sm"
                          onClick={() => toggleStatus(source.key)}
                        >
                          <i className={`fas fa-${isActive ? "pause" : "play"}`}></i>
                        </Button>
                      )}
                    </>
                  )}
                </Card.Footer>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="fab fa-facebook"></i>
            <span className="fw-semibold">Meta (Facebook) Lead Ads</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg={metaStatus?.status === "connected" ? "success" : metaStatus?.status === "error" ? "danger" : "secondary"}>
              {metaStatus?.status ? metaStatus.status.toUpperCase() : "DISCONNECTED"}
            </Badge>
            <Button variant="outline-primary" size="sm" onClick={() => loadMeta()} disabled={metaLoading}>
              <i className={`fas fa-${metaLoading ? "spinner fa-spin" : "sync"} me-1`}></i>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div className="fw-semibold">Real-time lead sync via Meta Webhooks</div>
                <div className="small text-muted">Connect your Meta account, then enable the forms you want to sync.</div>
              </div>
              <Button variant="primary" onClick={connectMeta} disabled={!canEditIntegrations}>
                <i className="fas fa-link me-1"></i>
                Connect Meta Account
              </Button>
            </div>
            {metaStatus?.last_error && (
              <div className="mt-2 small text-danger">
                Error: {metaStatus.last_error}
              </div>
            )}
          </Alert>

          <div className="mb-3">
            <Form.Label className="fw-semibold">Facebook Page</Form.Label>
            <Form.Select value={metaSelectedPageId} onChange={(e) => selectMetaPage(e.target.value)} disabled={metaLoading}>
              <option value="">Select Page</option>
              {metaPages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  {p.page_name || p.page_id}
                </option>
              ))}
            </Form.Select>
          </div>

          {!metaSelectedPageId && (
            <div className="text-muted">Select a page to view its lead forms.</div>
          )}

          {metaSelectedPageId && (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Enabled</th>
                    <th>Form</th>
                    <th style={{ width: 220 }}>Assigned Users (Round Robin)</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 150 }}>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {metaForms.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-muted">
                        No forms found.
                      </td>
                    </tr>
                  )}
                  {metaForms.map((f) => {
                    const assignedCount = (f.users || []).filter((u) => u.is_active).length;
                    return (
                      <tr key={f.form_id}>
                        <td>
                          <Form.Check
                            type="switch"
                            checked={!!f.is_enabled}
                            onChange={(e) => setMetaFormEnabled(f.form_id, e.target.checked)}
                            disabled={!canEditIntegrations}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold">{f.form_name || "(Unnamed Form)"}</div>
                          <div className="small text-muted">{f.form_id}</div>
                          {!f.is_enabled && (
                            <div className="small text-muted">Enable to start syncing</div>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <span className="text-muted small">{assignedCount} users</span>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openMetaUsersModal(f)}
                              disabled={!canEditIntegrations}
                            >
                              Configure
                            </Button>
                          </div>
                        </td>
                        <td>
                          <Badge bg={f.status === "active" ? "success" : "danger"}>
                            {(f.status || "-").toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-muted small">
                          {f.last_sync_at ? new Date(f.last_sync_at).toLocaleString() : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            Configure{" "}
            {SOURCES.find((s) => s.key === selectedSource)?.name || "Integration"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value === "active" })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <hr className="my-4" />

            <h6 className="fw-semibold mb-3">
              {formData.integration_type === "pull_api" ? "API Configuration (Pull Mode)" : "API Configuration (Webhook Mode)"}
            </h6>

            {formData.integration_type === "pull_api" && (
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Pull API Mode:</strong> Your CRM will periodically fetch leads from {selectedSource === "indiamart" ? "IndiaMART" : "the source"} API.
                {selectedSource === "indiamart" && (
                  <div className="mt-2 small">
                    API: <code>https://mapi.indiamart.com/wservce/crm/crmListing/v2/</code>
                  </div>
                )}
              </Alert>
            )}

            {formData.integration_type === "webhook" && (
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Webhook Mode:</strong> Leads are sent to your CRM automatically when they arrive at the source.
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Integration Type</Form.Label>
              <Form.Select
                value={formData.integration_type}
                onChange={(e) =>
                  setFormData({ ...formData, integration_type: e.target.value })
                }
              >
                <option value="webhook">Webhook (Real-time)</option>
                <option value="pull_api">Pull API (Scheduled Fetch)</option>
              </Form.Select>
            </Form.Group>

            {formData.integration_type === "pull_api" && selectedSource !== "indiamart" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>API Endpoint URL <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://api.aajjo.com/api/cl/getleads"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    The full URL endpoint for fetching leads from {selectedSource === "tradeindia" ? "TradeIndia" : "Aajjo"} API
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {selectedSource === "tradeindia" ? "User ID" : "API Username"} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={selectedSource === "tradeindia" ? "e.g., 6797758" : "e.g., aajjo@yourcompany.com"}
                    value={formData.api_username}
                    onChange={(e) => setFormData({ ...formData, api_username: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    {selectedSource === "tradeindia"
                      ? "Your TradeIndia userid"
                      : "Your Aajjo API username for Basic Authentication"}
                  </Form.Text>
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                {selectedSource === "indiamart" 
                  ? "CRM Key (glusr_crm_key)" 
                  : selectedSource === "tradeindia"
                    ? "Key"
                    : "API Key (Password)"}
                {formData.integration_type === "pull_api" && <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={
                  selectedSource === "indiamart"
                    ? "Enter your IndiaMART CRM Key"
                    : selectedSource === "tradeindia"
                      ? "Enter TradeIndia key"
                      : "Enter API Key"
                }
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              />
              <Form.Text className="text-muted">
                {selectedSource === "indiamart"
                  ? "Your IndiaMART CRM Key from LMS > CRM Integration settings. Generate at: https://help.indiamart.com/knowledge-base/lms-crm-integration-v2/"
                  : selectedSource === "tradeindia"
                    ? "Your TradeIndia key"
                    : "Your API key for authentication"}
              </Form.Text>
            </Form.Group>

            {formData.integration_type === "pull_api" && selectedSource === "tradeindia" && (
              <Form.Group className="mb-3">
                <Form.Label>Profile ID <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 9430541"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                />
                <Form.Text className="text-muted">Your TradeIndia profile_id</Form.Text>
              </Form.Group>
            )}

            {formData.integration_type === "webhook" && (
              <Form.Group className="mb-3">
                <Form.Label>API Secret (Optional)</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter API Secret if required"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                />
              </Form.Group>
            )}

            <hr className="my-4" />

            <h6 className="fw-semibold mb-3">Default Lead Settings</h6>

            <Form.Group className="mb-3">
              <Form.Label>Default Lead Source</Form.Label>
              <Form.Select
                value={formData.default_lead_source_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, default_lead_source_id: e.target.value })
                }
              >
                <option value="">-- Use Source Name ({SOURCES.find((s) => s.key === selectedSource)?.name}) --</option>
                {leadSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Select a lead source to assign to leads from this integration. If not selected, the source name will be used.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Default Lead Stage</Form.Label>
              <Form.Select
                value={formData.default_lead_stage_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, default_lead_stage_id: e.target.value })
                }
              >
                <option value="">-- Default (New Lead) --</option>
                {leadStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Select a default stage for leads from this integration. If not selected, "New Lead" will be used.
              </Form.Text>
            </Form.Group>

            <hr className="my-4" />

            <h6 className="fw-semibold mb-3">Assignment Settings</h6>

            <Form.Group className="mb-3">
              <Form.Label>Assignment Mode</Form.Label>
              <Form.Select
                value={formData.assignment_mode}
                onChange={(e) =>
                  setFormData({ ...formData, assignment_mode: e.target.value })
                }
              >
                {ASSIGNMENT_MODES.filter(
                  (m) => m.value !== "caller_response" || selectedSource === "indiamart"
                ).map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {ASSIGNMENT_MODES.find((m) => m.value === formData.assignment_mode)?.description}
              </Form.Text>
            </Form.Group>

            {formData.assignment_mode === "fixed_user" && (
              <Form.Group className="mb-3">
                <Form.Label>Fixed User</Form.Label>
                <Form.Select
                  value={formData.fixed_user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, fixed_user_id: e.target.value })
                  }
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {formData.assignment_mode === "round_robin" && (
              <Form.Group className="mb-3">
                <Form.Label>Round-Robin Users</Form.Label>
                <div className="border rounded p-2" style={{ maxHeight: 200, overflow: "auto" }}>
                  {users.map((user) => (
                    <Form.Check
                      key={user.id}
                      type="checkbox"
                      id={`user-${user.id}`}
                      label={`${user.name} (${user.email})`}
                      checked={formData.round_robin_users.includes(user.id)}
                      onChange={(e) => {
                        const newUsers = e.target.checked
                          ? [...formData.round_robin_users, user.id]
                          : formData.round_robin_users.filter((id) => id !== user.id);
                        setFormData({ ...formData, round_robin_users: newUsers });
                      }}
                      className="mb-1"
                    />
                  ))}
                </div>
                <div className="mt-2 d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {formData.round_robin_users.length} users selected
                  </small>
                  {getIntegration(selectedSource)?.round_robin_index > 0 && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => resetRoundRobin(selectedSource)}
                    >
                      <i className="fas fa-undo me-1"></i> Reset Counter
                    </Button>
                  )}
                </div>
              </Form.Group>
            )}

            {formData.assignment_mode === "caller_response" && (
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                With Caller Response mode, leads will be assigned to the employee who first responds to the IndiaMART call. Make sure employees record their responses using the "Record IndiaMART Response" feature.
              </Alert>
            )}

            <hr className="my-4" />

            <h6 className="fw-semibold mb-3">Duplicate Handling</h6>

            <Form.Group className="mb-3">
              <Form.Label>When duplicate mobile number is found</Form.Label>
              <Form.Select
                value={formData.duplicate_handling}
                onChange={(e) =>
                  setFormData({ ...formData, duplicate_handling: e.target.value })
                }
              >
                {DUPLICATE_HANDLING.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {DUPLICATE_HANDLING.find((d) => d.value === formData.duplicate_handling)?.description}
              </Form.Text>
            </Form.Group>

            {formData.duplicate_handling === "merge" && (
              <Alert variant="warning" className="mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                When merging, new inquiries will be added as activities to the existing lead. If the existing lead is unassigned, it will be assigned according to the assignment rules above.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveIntegration} disabled={saving}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin me-1"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-1"></i> Save Settings
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showMetaUsersModal} onHide={() => setShowMetaUsersModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Assign Users (Form Round Robin)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="border rounded p-2" style={{ maxHeight: 320, overflow: "auto" }}>
            {users.map((u) => (
              <Form.Check
                key={u.id}
                type="checkbox"
                id={`meta-user-${u.id}`}
                label={`${u.name} (${u.email})`}
                checked={metaUsersSelectedIds.includes(u.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...metaUsersSelectedIds, u.id]
                    : metaUsersSelectedIds.filter((id) => id !== u.id);
                  setMetaUsersSelectedIds(next);
                }}
                className="mb-1"
              />
            ))}
          </div>
          <div className="small text-muted mt-2">{metaUsersSelectedIds.length} users selected</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowMetaUsersModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveMetaUsers}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
