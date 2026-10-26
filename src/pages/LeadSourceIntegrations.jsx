import { useCallback, useEffect, useState } from "react";
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
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../api";
import { canEdit } from "../utils/permissions";

const SOURCES = [
  { key: "indiamart", name: "IndiaMART", color: "primary", icon: "fa-globe" },
  { key: "aajjo", name: "Aajjo", color: "success", icon: "fa-building" },
  { key: "tradeindia", name: "TradeIndia", color: "warning", icon: "fa-handshake" },
  { key: "justdial", name: "JustDial", color: "danger", icon: "fa-phone" },
  { key: "google-sheets", name: "Google Sheets", color: "info", icon: "fa-table" },
  { key: "google-form", name: "Google Form", color: "secondary", icon: "fa-wpforms" },
  { key: "wordpress", name: "WordPress", color: "dark", icon: "fa-wordpress" },
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

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const cardHeaderSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  px: 3,
  py: 2,
  borderBottom: '1px solid',
  borderColor: 'divider',
  bgcolor: '#f8fafc',
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

const bodyCellSx = { verticalAlign: 'middle', px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' };

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const activeChipSx = (active) => ({
  fontWeight: 700,
  ...(active
    ? { bgcolor: '#dbf5e9', color: '#118d57' }
    : { bgcolor: '#f1f5f9', color: '#475569' }),
});

function DetailRow({ label, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {children}
      </Typography>
    </Box>
  );
}

const copyWebhookUrl = (url) => {
  navigator.clipboard.writeText(url);
  toast.success("Webhook URL copied to clipboard");
};

function WebhookUrlField({ url }) {
  return (
    <TextField
      size="small"
      value={url || ""}
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Copy webhook URL">
                <IconButton size="small" onClick={() => copyWebhookUrl(url)} aria-label="Copy webhook URL" edge="end">
                  <i className="fas fa-copy" style={{ fontSize: 13 }} aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

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
  const [gsScriptCopied, setGsScriptCopied] = useState(false);
  const [gsTestLoading, setGsTestLoading] = useState(false);
  const [gfScriptCopied, setGfScriptCopied] = useState(false);
  const [gfTestLoading, setGfTestLoading] = useState(false);
  const [wpScriptCopied, setWpScriptCopied] = useState(false);
  const [wpTestLoading, setWpTestLoading] = useState(false);

  const canEditIntegrations = canEdit("leads");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [integrationsRes, usersRes, urlsRes, sourcesRes, stagesRes] = await Promise.all([
        api.get("/lead-source-integrations"),
        api.get("/lead-source-integrations/available-users/list"),
        api.get("/lead-source-integrations/webhook-urls/all"),
        api.get("/lead-sources/list"),
        api.get("/lead-stages/list"),
      ]);

      setIntegrations(toArray(integrationsRes.data?.data ?? integrationsRes.data));
      setUsers(toArray(usersRes.data?.data ?? usersRes.data));
      setWebhookUrls(urlsRes.data?.data || {});
      setLeadSources(toArray(sourcesRes.data?.data ?? sourcesRes.data));
      setLeadStages(toArray(stagesRes.data?.data ?? stagesRes.data));
    } catch {
      toast.error("Failed to load integration settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async (pageId = "") => {
    try {
      setMetaLoading(true);
      const [statusRes, pagesRes] = await Promise.all([
        api.get("/meta-lead-ads/status"),
        api.get("/meta-lead-ads/pages"),
      ]);

      setMetaStatus(statusRes.data?.data?.connection || null);
      const pages = toArray(pagesRes.data?.data ?? pagesRes.data);
      setMetaPages(pages);

      const effectivePageId = pageId || (pages[0]?.page_id || "");
      setMetaSelectedPageId(effectivePageId);

      if (effectivePageId) {
        const formsRes = await api.get(`/meta-lead-ads/pages/${effectivePageId}/forms`);
        setMetaForms(toArray(formsRes.data?.data?.forms));
      } else {
        setMetaForms([]);
      }
    } catch {
      toast.error("Failed to load Meta Lead Ads data");
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadMeta("");
  }, [loadData, loadMeta]);

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
    } catch {
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
      setMetaForms(toArray(formsRes.data?.data?.forms));
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
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const resetRoundRobin = async (sourceName) => {
    try {
      await api.post(`/lead-source-integrations/${sourceName}/reset-round-robin`);
      toast.success("Round-robin counter reset");
    } catch {
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

  const generateGoogleScript = () => {
    const url = webhookUrls["google-sheets"]?.webhook_url || "YOUR_WEBHOOK_URL";
    const secret = webhookUrls["google-sheets"]?.secret || "YOUR_SECRET_KEY";
    return `function sendNewRowsToCRM() {
  const WEBHOOK_URL = "${url}";
  const SECRET = "${secret}";
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const props = PropertiesService.getScriptProperties();
  let lastRow = parseInt(props.getProperty('lastProcessedRow') || '1');

  if (data.length <= lastRow) return;

  for (let i = lastRow; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }

    const payload = {
      source: 'google-sheets',
      sheet_name: sheet.getName(),
      row_index: i + 1,
      data: row,
      secret: SECRET,
      timestamp: new Date().toISOString()
    };

    try {
      const res = UrlFetchApp.fetch(WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      if (res.getResponseCode() >= 400) {
        console.error('Row ' + (i+1) + ' failed: ' + res.getContentText());
      }
    } catch (e) {
      console.error('Row ' + (i+1) + ' error: ' + e);
    }
  }

  props.setProperty('lastProcessedRow', String(data.length));
}`;
  };

  const copyGoogleScript = () => {
    navigator.clipboard.writeText(generateGoogleScript());
    setGsScriptCopied(true);
    toast.success("Script copied to clipboard");
    setTimeout(() => setGsScriptCopied(false), 2000);
  };

  const testGoogleSheetsWebhook = async () => {
    try {
      setGsTestLoading(true);
      const url = webhookUrls["google-sheets"]?.webhook_url;
      if (!url) {
        toast.error("Webhook URL not available. Configure the integration first.");
        return;
      }
      const payload = {
        source: "google-sheets",
        sheet_name: "Test Sheet",
        row_index: 2,
        data: { Name: "Test Lead", Phone: "9876543210", Email: "test@example.com", Stage: "New Lead" },
        secret: webhookUrls["google-sheets"]?.secret || "",
        timestamp: new Date().toISOString(),
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success("Test lead sent successfully");
      } else {
        toast.error(data.message || `Test failed (HTTP ${res.status})`);
      }
    } catch (e) {
      toast.error("Test failed: " + (e.message || "Network error"));
    } finally {
      setGsTestLoading(false);
    }
  };

  const generateGoogleFormScript = () => {
    const url = webhookUrls["google-form"]?.webhook_url || "YOUR_WEBHOOK_URL";
    const secret = webhookUrls["google-form"]?.secret || "YOUR_SECRET_KEY";
    return `const WEBHOOK_URL = "${url}";
const SECRET = "${secret}";

function onFormSubmit(e) {
  const itemResponses = e.namedValues;
  const payload = {};

  for (const key in itemResponses) {
    if (Object.prototype.hasOwnProperty.call(itemResponses, key)) {
      payload[key] = itemResponses[key][0] || '';
    }
  }

  payload.form_id = e.source.getId();
  payload.response_id = e.response.getId();
  payload.submitted_at = new Date().toISOString();
  payload.secret = SECRET;

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    console.log('Webhook response: ' + response.getResponseCode());
  } catch (error) {
    console.error('Error: ' + error.toString());
  }
}`;
  };

  const copyGoogleFormScript = () => {
    navigator.clipboard.writeText(generateGoogleFormScript());
    setGfScriptCopied(true);
    toast.success("Script copied to clipboard");
    setTimeout(() => setGfScriptCopied(false), 2000);
  };

  const testGoogleFormWebhook = async () => {
    try {
      setGfTestLoading(true);
      const url = webhookUrls["google-form"]?.webhook_url;
      if (!url) {
        toast.error("Webhook URL not available. Configure the integration first.");
        return;
      }
      const payload = {
        Name: "Test Lead",
        Phone: "9876543210",
        Email: "test@example.com",
        "Company Name": "Test Company",
        City: "Mumbai",
        Product: "Solar Panels",
        Message: "Interested in solar installation",
        form_id: "test-form-123",
        response_id: "test-response-456",
        secret: webhookUrls["google-form"]?.secret || "",
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Test lead sent successfully");
      } else {
        toast.error(data.message || `Test failed (HTTP ${res.status})`);
      }
    } catch (e) {
      toast.error("Test failed: " + (e.message || "Network error"));
    } finally {
      setGfTestLoading(false);
    }
  };

  const generateWordPressSnippet = () => {
    const url = webhookUrls["wordpress"]?.webhook_url || "YOUR_WEBHOOK_URL";
    const secret = webhookUrls["wordpress"]?.secret || "YOUR_SECRET_KEY";
    return `add_action('wpcf7_mail_sent', 'crm_capture_wpcf7_lead');
add_action('wpforms_process_entry_save', 'crm_capture_wpforms_lead', 10, 4);

function crm_send_lead_to_crm($data) {
    $data['secret'] = '${secret}';
    wp_remote_post('${url}', [
        'headers' => ['Content-Type' => 'application/json'],
        'body'    => json_encode($data),
        'timeout' => 15,
    ]);
}

// Contact Form 7
function crm_capture_wpcf7_lead($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if ($submission) {
        $data = $submission->get_posted_data();
        crm_send_lead_to_crm($data);
    }
}

// WPForms
function crm_capture_wpforms_lead($fields, $entry, $form_id, $form_data) {
    $data = [];
    foreach ($fields as $field) {
        $data[$field['name']] = $field['value'];
    }
    crm_send_lead_to_crm($data);
}`;
  };

  const copyWordPressSnippet = () => {
    navigator.clipboard.writeText(generateWordPressSnippet());
    setWpScriptCopied(true);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setWpScriptCopied(false), 2000);
  };

  const testWordPressWebhook = async () => {
    try {
      setWpTestLoading(true);
      const url = webhookUrls["wordpress"]?.webhook_url;
      if (!url) {
        toast.error("Webhook URL not available. Configure the integration first.");
        return;
      }
      const payload = {
        "your-name": "Test Lead",
        "your-phone": "9876543210",
        "your-email": "test@example.com",
        company: "Test Company",
        city: "Mumbai",
        product: "Solar Panels",
        "your-message": "Interested in solar installation",
        secret: webhookUrls["wordpress"]?.secret || "",
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Test lead sent successfully");
      } else {
        toast.error(data.message || `Test failed (HTTP ${res.status})`);
      }
    } catch (e) {
      toast.error("Test failed: " + (e.message || "Network error"));
    } finally {
      setWpTestLoading(false);
    }
  };

  const getIntegration = (sourceKey) => {
    return integrations.find((i) => i.source_name === sourceKey);
  };

  const handleConfigDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShowModal(false);
  };

  const handleMetaUsersDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShowMetaUsersModal(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
          Lead Source Integrations
        </Typography>
        <Button
          variant="outlined"
          onClick={loadData}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <i className="fas fa-sync-alt" aria-hidden="true" />}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure how leads from external sources (IndiaMART, Aajjo, TradeIndia, JustDial, Google Sheets, Google Form, WordPress) are imported and assigned.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
        {SOURCES.map((source) => {
          const integration = getIntegration(source.key);
          const isActive = integration?.is_active ?? false;

          return (
            <Card key={source.key} sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={cardHeaderSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <i className={`fas ${source.icon}`} style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {source.name}
                  </Typography>
                </Box>
                <Chip
                  label={isActive ? "Active" : "Inactive"}
                  size="small"
                  sx={activeChipSx(isActive)}
                />
              </Box>
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <DetailRow label="Assignment Mode">
                  {integration?.assignment_mode
                    ? ASSIGNMENT_MODES.find((m) => m.value === integration.assignment_mode)?.label
                    : "Not configured"}
                </DetailRow>

                <DetailRow label="Duplicate Handling">
                  {integration?.duplicate_handling
                    ? DUPLICATE_HANDLING.find((d) => d.value === integration.duplicate_handling)?.label
                    : "Not configured"}
                </DetailRow>

                {integration?.assignment_mode === "round_robin" && (
                  <DetailRow label="Round-Robin Users">
                    {integration?.round_robin_users?.length || 0} users
                  </DetailRow>
                )}

                {integration?.assignment_mode === "fixed_user" && integration?.fixed_user && (
                  <DetailRow label="Fixed User">
                    {integration.fixed_user.name}
                  </DetailRow>
                )}

                <DetailRow label="Integration Type">
                  {integration?.integration_type === "pull_api" ? "Pull API" : "Webhook"}
                </DetailRow>

                {integration?.integration_type === "pull_api" && (
                  <DetailRow label="Last Sync">
                    {integration?.last_sync_at
                      ? new Date(integration.last_sync_at).toLocaleString()
                      : "Never"}
                  </DetailRow>
                )}

                {webhookUrls[source.key]?.type === "webhook" && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Webhook URL
                    </Typography>
                    <WebhookUrlField url={webhookUrls[source.key]?.webhook_url} />
                  </Box>
                )}

                {webhookUrls[source.key]?.type === "pull_api" && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      API Endpoint
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                      {webhookUrls[source.key]?.api_endpoint}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              {canEditIntegrations && (
                <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openEditModal(source.key)}
                    startIcon={<i className="fas fa-edit" aria-hidden="true" />}
                    sx={{ flexGrow: 1 }}
                  >
                    Configure
                  </Button>
                  {integration?.integration_type === "pull_api" && isActive && (
                    <Tooltip title="Sync last 24 hours">
                      <span>
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => syncNowForSource(source.key, 24)}
                          disabled={syncing}
                          sx={{ minWidth: 40, px: 1 }}
                        >
                          {syncing
                            ? <CircularProgress size={14} color="inherit" />
                            : <i className="fas fa-sync" style={{ fontSize: 13 }} aria-hidden="true" />}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  {integration && (
                    <Tooltip title={isActive ? "Deactivate" : "Activate"}>
                      <Button
                        variant="outlined"
                        color={isActive ? "warning" : "success"}
                        size="small"
                        onClick={() => toggleStatus(source.key)}
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <i className={`fas fa-${isActive ? "pause" : "play"}`} style={{ fontSize: 13 }} aria-hidden="true" />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Card>
          );
        })}
      </Box>

      {/* Meta (Facebook) Lead Ads */}
      <Card sx={{ ...cardSx, mt: 3 }}>
        <Box sx={cardHeaderSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fab fa-facebook" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Meta (Facebook) Lead Ads
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={metaStatus?.status ? metaStatus.status.toUpperCase() : "DISCONNECTED"}
              size="small"
              sx={
                metaStatus?.status === "connected"
                  ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
                  : metaStatus?.status === "error"
                    ? { bgcolor: '#ffe4de', color: '#b71d18', fontWeight: 700 }
                    : { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }
              }
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => loadMeta(metaSelectedPageId)}
              disabled={metaLoading}
              startIcon={metaLoading ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-sync" aria-hidden="true" />}
            >
              Refresh
            </Button>
          </Stack>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Real-time lead sync via Meta Webhooks
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Connect your Meta account, then enable the forms you want to sync.
                </Typography>
              </Box>
              <Button variant="contained" onClick={connectMeta} disabled={!canEditIntegrations} startIcon={<i className="fas fa-link" aria-hidden="true" />}>
                Connect Meta Account
              </Button>
            </Box>
            {metaStatus?.last_error && (
              <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
                Error: {metaStatus.last_error}
              </Typography>
            )}
          </Alert>

          <Box sx={{ mb: 3, maxWidth: 420 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Facebook Page</InputLabel>
              <Select
                label="Facebook Page"
                value={metaSelectedPageId}
                onChange={(e) => selectMetaPage(e.target.value)}
                disabled={metaLoading}
              >
                <MenuItem value=""><em>Select Page</em></MenuItem>
                {metaPages.map((p) => (
                  <MenuItem key={p.page_id} value={p.page_id}>
                    {p.page_name || p.page_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {!metaSelectedPageId && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Select a page to view its lead forms.
            </Typography>
          )}

          {metaSelectedPageId && (
            <TableContainer sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ ...headCellSx, width: 70 }}>Enabled</TableCell>
                    <TableCell sx={headCellSx}>Form</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 220 }}>Assigned Users (Round Robin)</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 120 }}>Status</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 150 }}>Last Sync</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metaForms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ ...bodyCellSx, color: 'text.secondary', borderBottom: 0 }}>
                        No forms found.
                      </TableCell>
                    </TableRow>
                  )}
                  {metaForms.map((f) => {
                    const assignedCount = (f.users || []).filter((u) => u.is_active).length;
                    return (
                      <TableRow key={f.form_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={bodyCellSx}>
                          <Switch
                            size="small"
                            checked={!!f.is_enabled}
                            onChange={(e) => setMetaFormEnabled(f.form_id, e.target.checked)}
                            disabled={!canEditIntegrations}
                          />
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {f.form_name || "(Unnamed Form)"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {f.form_id}
                          </Typography>
                          {!f.is_enabled && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Enable to start syncing
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {assignedCount} users
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openMetaUsersModal(f)}
                              disabled={!canEditIntegrations}
                            >
                              Configure
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Chip
                            label={(f.status || "-").toUpperCase()}
                            size="small"
                            sx={f.status === "active"
                              ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
                              : { bgcolor: '#ffe4de', color: '#b71d18', fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: 'text.secondary' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {f.last_sync_at ? new Date(f.last_sync_at).toLocaleString() : "-"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Google Sheets */}
      <Card sx={{ ...cardSx, mt: 3 }}>
        <Box sx={cardHeaderSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fab fa-google" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Google Sheets
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={getIntegration("google-sheets")?.is_active ? "ACTIVE" : "NOT CONFIGURED"}
              size="small"
              sx={activeChipSx(!!getIntegration("google-sheets")?.is_active)}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => openEditModal("google-sheets")}
              disabled={!canEditIntegrations}
              startIcon={<i className="fas fa-edit" aria-hidden="true" />}
            >
              Configure
            </Button>
          </Stack>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Real-time sync via Google Apps Script
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Install a script in your Google Sheet that sends new rows to this CRM automatically.
            </Typography>
          </Alert>

          {!webhookUrls["google-sheets"]?.webhook_url && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Not configured yet.</strong> Click <strong>Configure</strong> above and save the integration settings. The CRM will generate your unique webhook URL and secret key — then the script below will auto-fill with real values instead of placeholders.
            </Alert>
          )}

          {webhookUrls["google-sheets"]?.webhook_url && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                Webhook URL
              </Typography>
              <WebhookUrlField url={webhookUrls["google-sheets"].webhook_url} />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
            Setup Instructions
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, mb: 3, color: 'text.secondary', '& li': { fontSize: '0.8125rem', mb: 0.5 } }}>
            <li>Open your Google Sheet and click <strong>Extensions &gt; Apps Script</strong>.</li>
            <li>Delete any existing code in the editor.</li>
            <li>Paste the script below into the editor.</li>
            <li>Click the <strong>Save</strong> button (disk icon) and name the project "CRM Sync".</li>
            <li>Click the <strong>clock icon</strong> (Triggers) on the left sidebar.</li>
            <li>Click <strong>Add Trigger</strong>, choose function <code>sendNewRowsToCRM</code>, choose deployment <code>Head</code>, choose event source <code>Time-driven</code>, and select interval <code>Every minute</code>.</li>
            <li>Click <strong>Save</strong>. You may need to authorize the script the first time.</li>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Google Apps Script
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={copyGoogleScript}
                startIcon={<i className={`fas fa-${gsScriptCopied ? "check" : "copy"}`} aria-hidden="true" />}
              >
                {gsScriptCopied ? "Copied" : "Copy Script"}
              </Button>
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#f8fafc',
                maxHeight: 320,
                overflow: 'auto',
                fontSize: '0.8rem',
              }}
            >
              <code>{generateGoogleScript()}</code>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              color="success"
              size="small"
              onClick={testGoogleSheetsWebhook}
              disabled={gsTestLoading || !webhookUrls["google-sheets"]?.webhook_url}
              startIcon={gsTestLoading ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-vial" aria-hidden="true" />}
            >
              {gsTestLoading ? "Testing…" : "Send Test Lead"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Google Form */}
      <Card sx={{ ...cardSx, mt: 3 }}>
        <Box sx={cardHeaderSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fab fa-wpforms" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Google Form
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={getIntegration("google-form")?.is_active ? "ACTIVE" : "NOT CONFIGURED"}
              size="small"
              sx={activeChipSx(!!getIntegration("google-form")?.is_active)}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => openEditModal("google-form")}
              disabled={!canEditIntegrations}
              startIcon={<i className="fas fa-edit" aria-hidden="true" />}
            >
              Configure
            </Button>
          </Stack>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Real-time lead capture from Google Forms
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Install a script in your Google Form that sends responses to this CRM automatically on every submission.
            </Typography>
          </Alert>

          {!webhookUrls["google-form"]?.webhook_url && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Not configured yet.</strong> Click <strong>Configure</strong> above and save the integration settings. The CRM will generate your unique webhook URL and secret key.
            </Alert>
          )}

          {webhookUrls["google-form"]?.webhook_url && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                Webhook URL
              </Typography>
              <WebhookUrlField url={webhookUrls["google-form"].webhook_url} />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
            Setup Instructions
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, mb: 3, color: 'text.secondary', '& li': { fontSize: '0.8125rem', mb: 0.5 } }}>
            <li>Open your Google Form and click <strong>⋮ (More)</strong> → <strong>Script editor</strong>.</li>
            <li>Delete any existing code in the editor.</li>
            <li>Paste the script below into the editor.</li>
            <li>Click the <strong>Save</strong> button (disk icon) and name the project "CRM Form Integration".</li>
            <li>Click the <strong>clock icon</strong> (Triggers) on the left sidebar → <strong>Add Trigger</strong>.</li>
            <li>Select function <code>onFormSubmit</code>, event source <code>From form</code>, event type <code>On form submit</code>.</li>
            <li>Click <strong>Save</strong>. You may need to authorize the script the first time.</li>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Google Apps Script
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={copyGoogleFormScript}
                startIcon={<i className={`fas fa-${gfScriptCopied ? "check" : "copy"}`} aria-hidden="true" />}
              >
                {gfScriptCopied ? "Copied" : "Copy Script"}
              </Button>
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#f8fafc',
                maxHeight: 320,
                overflow: 'auto',
                fontSize: '0.8rem',
              }}
            >
              <code>{generateGoogleFormScript()}</code>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              color="success"
              size="small"
              onClick={testGoogleFormWebhook}
              disabled={gfTestLoading || !webhookUrls["google-form"]?.webhook_url}
              startIcon={gfTestLoading ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-vial" aria-hidden="true" />}
            >
              {gfTestLoading ? "Testing…" : "Send Test Lead"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* WordPress */}
      <Card sx={{ ...cardSx, mt: 3 }}>
        <Box sx={cardHeaderSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fab fa-wordpress" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              WordPress
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={getIntegration("wordpress")?.is_active ? "ACTIVE" : "NOT CONFIGURED"}
              size="small"
              sx={activeChipSx(!!getIntegration("wordpress")?.is_active)}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => openEditModal("wordpress")}
              disabled={!canEditIntegrations}
              startIcon={<i className="fas fa-edit" aria-hidden="true" />}
            >
              Configure
            </Button>
          </Stack>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Capture leads from WordPress forms
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Works with Contact Form 7, WPForms, Gravity Forms, Ninja Forms, and any form that can POST data.
            </Typography>
          </Alert>

          {!webhookUrls["wordpress"]?.webhook_url && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Not configured yet.</strong> Click <strong>Configure</strong> above and save the integration settings. The CRM will generate your unique webhook URL and secret key.
            </Alert>
          )}

          {webhookUrls["wordpress"]?.webhook_url && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                Webhook URL
              </Typography>
              <WebhookUrlField url={webhookUrls["wordpress"].webhook_url} />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
            Setup Instructions
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, mb: 3, color: 'text.secondary', '& li': { fontSize: '0.8125rem', mb: 0.5 } }}>
            <li>Add the PHP snippet below to your WordPress theme's <code>functions.php</code> file, or use the <strong>Code Snippets</strong> plugin.</li>
            <li>The snippet hooks into <strong>Contact Form 7</strong> and <strong>WPForms</strong> submissions automatically.</li>
            <li>For other form plugins, use their form submission action/filter hooks to call <code>crm_send_lead_to_crm($data)</code>.</li>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                WordPress PHP Snippet
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={copyWordPressSnippet}
                startIcon={<i className={`fas fa-${wpScriptCopied ? "check" : "copy"}`} aria-hidden="true" />}
              >
                {wpScriptCopied ? "Copied" : "Copy Snippet"}
              </Button>
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#f8fafc',
                maxHeight: 320,
                overflow: 'auto',
                fontSize: '0.8rem',
              }}
            >
              <code>{generateWordPressSnippet()}</code>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              color="success"
              size="small"
              onClick={testWordPressWebhook}
              disabled={wpTestLoading || !webhookUrls["wordpress"]?.webhook_url}
              startIcon={wpTestLoading ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-vial" aria-hidden="true" />}
            >
              {wpTestLoading ? "Testing…" : "Send Test Lead"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Configure Dialog */}
      <Dialog
        open={showModal}
        onClose={handleConfigDialogClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fas fa-cog" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Configure{" "}
              {SOURCES.find((s) => s.key === selectedSource)?.name || "Integration"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowModal(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={formData.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.value === "active" })
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {formData.integration_type === "pull_api" ? "API Configuration (Pull Mode)" : "API Configuration (Webhook Mode)"}
            </Typography>

            {formData.integration_type === "pull_api" && (
              <Alert severity="info">
                <strong>Pull API Mode:</strong> Your CRM will periodically fetch leads from {selectedSource === "indiamart" ? "IndiaMART" : "the source"} API.
                {selectedSource === "indiamart" && (
                  <Box sx={{ mt: 1, fontSize: '0.8125rem' }}>
                    API: <code>https://mapi.indiamart.com/wservce/crm/crmListing/v2/</code>
                  </Box>
                )}
              </Alert>
            )}

            {formData.integration_type === "webhook" && (
              <Alert severity="info">
                <strong>Webhook Mode:</strong> Leads are sent to your CRM automatically when they arrive at the source.
              </Alert>
            )}

            <FormControl size="small" fullWidth>
              <InputLabel>Integration Type</InputLabel>
              <Select
                label="Integration Type"
                value={formData.integration_type}
                onChange={(e) =>
                  setFormData({ ...formData, integration_type: e.target.value })
                }
              >
                <MenuItem value="webhook">Webhook (Real-time)</MenuItem>
                <MenuItem value="pull_api">Pull API (Scheduled Fetch)</MenuItem>
              </Select>
            </FormControl>

            {formData.integration_type === "pull_api" && selectedSource !== "indiamart" && (
              <>
                <TextField
                  size="small"
                  type="url"
                  label="API Endpoint URL"
                  required
                  placeholder="https://api.aajjo.com/api/cl/getleads"
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  helperText={`The full URL endpoint for fetching leads from ${selectedSource === "tradeindia" ? "TradeIndia" : "Aajjo"} API`}
                  fullWidth
                />

                <TextField
                  size="small"
                  label={selectedSource === "tradeindia" ? "User ID" : "API Username"}
                  required
                  placeholder={selectedSource === "tradeindia" ? "e.g., 6797758" : "e.g., aajjo@yourcompany.com"}
                  value={formData.api_username}
                  onChange={(e) => setFormData({ ...formData, api_username: e.target.value })}
                  helperText={selectedSource === "tradeindia"
                    ? "Your TradeIndia userid"
                    : "Your Aajjo API username for Basic Authentication"}
                  fullWidth
                />
              </>
            )}

            <TextField
              size="small"
              label={
                selectedSource === "indiamart"
                  ? "CRM Key (glusr_crm_key)"
                  : selectedSource === "tradeindia"
                    ? "Key"
                    : "API Key (Password)"
              }
              required={formData.integration_type === "pull_api"}
              placeholder={
                selectedSource === "indiamart"
                  ? "Enter your IndiaMART CRM Key"
                  : selectedSource === "tradeindia"
                    ? "Enter TradeIndia key"
                    : "Enter API Key"
              }
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              helperText={
                selectedSource === "indiamart"
                  ? "Your IndiaMART CRM Key from LMS > CRM Integration settings. Generate at: https://help.indiamart.com/knowledge-base/lms-crm-integration-v2/"
                  : selectedSource === "tradeindia"
                    ? "Your TradeIndia key"
                    : "Your API key for authentication"
              }
              fullWidth
            />

            {formData.integration_type === "pull_api" && selectedSource === "tradeindia" && (
              <TextField
                size="small"
                label="Profile ID"
                required
                placeholder="e.g., 9430541"
                value={formData.api_secret}
                onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                helperText="Your TradeIndia profile_id"
                fullWidth
              />
            )}

            {formData.integration_type === "webhook" && (
              <TextField
                size="small"
                type="password"
                label="API Secret (Optional)"
                placeholder="Enter API Secret if required"
                value={formData.api_secret}
                onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                fullWidth
              />
            )}

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Default Lead Settings
            </Typography>

            <FormControl size="small" fullWidth>
              <InputLabel>Default Lead Source</InputLabel>
              <Select
                label="Default Lead Source"
                value={formData.default_lead_source_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, default_lead_source_id: e.target.value })
                }
              >
                <MenuItem value="">
                  -- Use Source Name ({SOURCES.find((s) => s.key === selectedSource)?.name}) --
                </MenuItem>
                {leadSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
              Select a lead source to assign to leads from this integration. If not selected, the source name will be used.
            </Typography>

            <FormControl size="small" fullWidth>
              <InputLabel>Default Lead Stage</InputLabel>
              <Select
                label="Default Lead Stage"
                value={formData.default_lead_stage_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, default_lead_stage_id: e.target.value })
                }
              >
                <MenuItem value="">-- Default (New Lead) --</MenuItem>
                {leadStages.map((stage) => (
                  <MenuItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
              Select a default stage for leads from this integration. If not selected, "New Lead" will be used.
            </Typography>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Assignment Settings
            </Typography>

            <FormControl size="small" fullWidth>
              <InputLabel>Assignment Mode</InputLabel>
              <Select
                label="Assignment Mode"
                value={formData.assignment_mode}
                onChange={(e) =>
                  setFormData({ ...formData, assignment_mode: e.target.value })
                }
              >
                {ASSIGNMENT_MODES.filter(
                  (m) => m.value !== "caller_response" || selectedSource === "indiamart"
                ).map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
              {ASSIGNMENT_MODES.find((m) => m.value === formData.assignment_mode)?.description}
            </Typography>

            {formData.assignment_mode === "fixed_user" && (
              <FormControl size="small" fullWidth>
                <InputLabel>Fixed User</InputLabel>
                <Select
                  label="Fixed User"
                  value={formData.fixed_user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, fixed_user_id: e.target.value })
                  }
                >
                  <MenuItem value=""><em>Select User</em></MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.assignment_mode === "round_robin" && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>
                  Round-Robin Users
                </Typography>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {users.map((user) => (
                    <FormControlLabel
                      key={user.id}
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.round_robin_users.includes(user.id)}
                          onChange={(e) => {
                            const newUsers = e.target.checked
                              ? [...formData.round_robin_users, user.id]
                              : formData.round_robin_users.filter((id) => id !== user.id);
                            setFormData({ ...formData, round_robin_users: newUsers });
                          }}
                        />
                      }
                      label={`${user.name} (${user.email})`}
                      sx={{ display: 'flex', mb: 0.5 }}
                    />
                  ))}
                </Box>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formData.round_robin_users.length} users selected
                  </Typography>
                  {getIntegration(selectedSource)?.round_robin_index > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => resetRoundRobin(selectedSource)}
                      startIcon={<i className="fas fa-undo" aria-hidden="true" />}
                    >
                      Reset Counter
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            {formData.assignment_mode === "caller_response" && (
              <Alert severity="info">
                With Caller Response mode, leads will be assigned to the employee who first responds to the IndiaMART call. Make sure employees record their responses using the "Record IndiaMART Response" feature.
              </Alert>
            )}

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Duplicate Handling
            </Typography>

            <FormControl size="small" fullWidth>
              <InputLabel>When duplicate mobile number is found</InputLabel>
              <Select
                label="When duplicate mobile number is found"
                value={formData.duplicate_handling}
                onChange={(e) =>
                  setFormData({ ...formData, duplicate_handling: e.target.value })
                }
              >
                {DUPLICATE_HANDLING.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1.5 }}>
              {DUPLICATE_HANDLING.find((d) => d.value === formData.duplicate_handling)?.description}
            </Typography>

            {formData.duplicate_handling === "merge" && (
              <Alert severity="warning">
                When merging, new inquiries will be added as activities to the existing lead. If the existing lead is unassigned, it will be assigned according to the assignment rules above.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveIntegration}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <i className="fas fa-save" aria-hidden="true" />}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meta Form Users Dialog */}
      <Dialog
        open={showMetaUsersModal}
        onClose={handleMetaUsersDialogClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Assign Users (Form Round Robin)
          </Typography>
          <IconButton size="small" onClick={() => setShowMetaUsersModal(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 1,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {users.map((u) => (
              <FormControlLabel
                key={u.id}
                control={
                  <Checkbox
                    size="small"
                    checked={metaUsersSelectedIds.includes(u.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...metaUsersSelectedIds, u.id]
                        : metaUsersSelectedIds.filter((id) => id !== u.id);
                      setMetaUsersSelectedIds(next);
                    }}
                  />
                }
                label={`${u.name} (${u.email})`}
                sx={{ display: 'flex', mb: 0.5 }}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            {metaUsersSelectedIds.length} users selected
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowMetaUsersModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveMetaUsers}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
