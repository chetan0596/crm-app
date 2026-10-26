import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
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
import { whatsappApi } from "../services/whatsapp";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
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

const bodyCellSx = { px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' };

const statusChipSx = (status) => {
  switch (status) {
    case "APPROVED":
      return { bgcolor: '#dbf5e9', color: '#118d57' };
    case "PENDING":
      return { bgcolor: '#fff4d6', color: '#b76e00' };
    case "REJECTED":
      return { bgcolor: '#ffe4de', color: '#b71d18' };
    default:
      return { bgcolor: '#f1f5f9', color: '#475569' };
  }
};

export default function WhatsAppSettings() {
  const [settings, setSettings] = useState({
    access_token: "",
    phone_number_id: "",
    business_account_id: "",
    webhook_verify_token: "",
    callback_url: "",
    is_active: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [webhookStatus, setWebhookStatus] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, tmplRes, statusRes] = await Promise.allSettled([
        whatsappApi.getSettings(),
        whatsappApi.getTemplates(),
        whatsappApi.getWebhookStatus(),
      ]);
      if (settingsRes.status === "fulfilled") {
        setSettings(prev => ({ ...prev, ...(settingsRes.value.data?.data || {}) }));
      }
      if (tmplRes.status === "fulfilled") {
        setTemplates(toArray(tmplRes.value.data?.data ?? tmplRes.value.data));
      }
      if (statusRes.status === "fulfilled") {
        setWebhookStatus(statusRes.value.data?.data || null);
      }
    } catch {
      toast.error("Failed to load WhatsApp settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await whatsappApi.saveSettings(settings);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    try {
      setTesting(true);
      await whatsappApi.testConnection();
      toast.success("Connection successful");
    } catch (e) {
      toast.error(e.response?.data?.message || "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const update = (field, value) => setSettings(s => ({ ...s, [field]: value }));

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(settings.callback_url || "");
    toast.success("Webhook URL copied");
  };

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                WhatsApp Settings
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
                Meta Business API configuration
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={test}
                disabled={testing}
                startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <i className="fas fa-plug" aria-hidden="true" />}
              >
                Test Connection
              </Button>
              <Button
                variant="contained"
                onClick={save}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <i className="fas fa-save" aria-hidden="true" />}
              >
                Save
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, 1fr)' }, gap: 3 }}>
          <Box sx={{ gridColumn: { lg: 'span 8' } }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                  API Configuration
                </Typography>
                <Divider sx={{ mb: 3, mx: -3 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.is_active}
                      onChange={e => update("is_active", e.target.checked)}
                    />
                  }
                  label="Enable WhatsApp Integration"
                  sx={{ mb: 2.5, display: 'flex' }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <TextField
                    size="small"
                    type="password"
                    label="Access Token"
                    required
                    value={settings.access_token}
                    onChange={e => update("access_token", e.target.value)}
                    placeholder="EAAB..."
                    helperText="Permanent token from Meta Developers"
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Phone Number ID"
                    required
                    value={settings.phone_number_id}
                    onChange={e => update("phone_number_id", e.target.value)}
                    placeholder="1234567890"
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Business Account ID"
                    value={settings.business_account_id}
                    onChange={e => update("business_account_id", e.target.value)}
                    placeholder="Optional"
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Webhook Verify Token"
                    value={settings.webhook_verify_token}
                    onChange={e => update("webhook_verify_token", e.target.value)}
                    placeholder="Random secret string"
                    helperText="Used for Meta webhook verification"
                    fullWidth
                  />
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: .5 }}>
                      Webhook Callback URL
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        value={settings.callback_url}
                        onChange={e => update("callback_url", e.target.value)}
                        placeholder="https://your-domain.com/api/v1/whatsapp/webhook"
                        helperText="Paste this in Meta App → Webhooks"
                        fullWidth
                      />
                      <Tooltip title="Copy webhook URL">
                        <IconButton
                          onClick={copyWebhookUrl}
                          aria-label="Copy webhook URL"
                          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 40, width: 40, alignSelf: 'flex-start' }}
                        >
                          <i className="fas fa-copy" style={{ fontSize: 13 }} aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { lg: 'span 4' }, display: 'grid', gap: 3, alignContent: 'start' }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Connection Status
                </Typography>
                {webhookStatus ? (
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <Chip
                        label={webhookStatus.connected ? "Connected" : "Disconnected"}
                        size="small"
                        sx={webhookStatus.connected
                          ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
                          : { bgcolor: '#ffe4de', color: '#b71d18', fontWeight: 700 }}
                      />
                      {webhookStatus.verified && (
                        <Chip label="Verified" size="small" sx={{ bgcolor: '#caf4ff', color: '#006c9c', fontWeight: 700 }} />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Phone: {webhookStatus.phone_number || "—"}<br />
                      Quality: {webhookStatus.quality_rating || "—"}<br />
                      Messages sent today: {webhookStatus.messages_sent_today || 0}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Click "Test Connection" to check status
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Alert severity="info">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Setup Steps:
              </Typography>
              <Box component="ol" sx={{ m: 0, mt: 0.5, pl: 2.5, '& li': { fontSize: '0.8125rem' } }}>
                <li>Create Meta Business App</li>
                <li>Add WhatsApp product</li>
                <li>Generate permanent token</li>
                <li>Register phone number</li>
                <li>Paste token & phone ID above</li>
                <li>Set webhook URL in Meta App</li>
              </Box>
            </Alert>
          </Box>

          <Box sx={{ gridColumn: '1 / -1' }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3, pb: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Message Templates ({templates.length})
                </Typography>
              </CardContent>
              <TableContainer sx={{ overflowX: 'auto', mt: 1 }}>
                <Table size="small" sx={{ minWidth: 640 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={headCellSx}>Name</TableCell>
                      <TableCell sx={headCellSx}>Category</TableCell>
                      <TableCell sx={headCellSx}>Language</TableCell>
                      <TableCell sx={headCellSx}>Status</TableCell>
                      <TableCell sx={headCellSx}>Preview</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary', borderBottom: 0 }}>
                          No templates found
                        </TableCell>
                      </TableRow>
                    ) : templates.map(t => (
                      <TableRow
                        key={t.name}
                        hover
                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell sx={{ ...bodyCellSx, fontWeight: 600 }}>{t.name}</TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: 'text.secondary' }}>{t.category}</TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: 'text.secondary' }}>{t.language}</TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Chip label={t.status} size="small" sx={{ ...statusChipSx(t.status), fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: 'text.secondary', maxWidth: 300 }}>
                          <Typography variant="body2" noWrap sx={{ color: 'text.secondary', maxWidth: 300 }}>
                            {t.components?.find(c => c.type === "BODY")?.text?.substring(0, 80) || "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
}
