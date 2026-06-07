import { useState, useEffect, useCallback } from "react";
import { Card, Form, Button, Badge, Spinner, Row, Col, Table, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { whatsappApi } from "../services/whatsapp";

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
        setTemplates(tmplRes.value.data?.data || []);
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
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="m-0 fw-bold">WhatsApp Settings</h4>
          <div className="small text-muted">Meta Business API configuration</div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={test} disabled={testing}>
            {testing ? <Spinner size="sm" className="me-1" /> : <i className="fas fa-plug me-1"></i>}
            Test Connection
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? <Spinner size="sm" className="me-1" /> : <i className="fas fa-save me-1"></i>}
            Save
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : (
        <Row className="g-3">
          <Col lg={8}>
            <Card className="border" style={{ borderColor: "var(--c-border)" }}>
              <Card.Header className="bg-white border-bottom py-3">
                <div className="fw-semibold">API Configuration</div>
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="whatsapp-active"
                    label="Enable WhatsApp Integration"
                    checked={settings.is_active}
                    onChange={e => update("is_active", e.target.checked)}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Access Token <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="password"
                        value={settings.access_token}
                        onChange={e => update("access_token", e.target.value)}
                        placeholder="EAAB..."
                      />
                      <Form.Text className="text-muted">Permanent token from Meta Developers</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number ID <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        value={settings.phone_number_id}
                        onChange={e => update("phone_number_id", e.target.value)}
                        placeholder="1234567890"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Business Account ID</Form.Label>
                      <Form.Control
                        value={settings.business_account_id}
                        onChange={e => update("business_account_id", e.target.value)}
                        placeholder="Optional"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Webhook Verify Token</Form.Label>
                      <Form.Control
                        value={settings.webhook_verify_token}
                        onChange={e => update("webhook_verify_token", e.target.value)}
                        placeholder="Random secret string"
                      />
                      <Form.Text className="text-muted">Used for Meta webhook verification</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-0">
                  <Form.Label>Webhook Callback URL</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      value={settings.callback_url}
                      onChange={e => update("callback_url", e.target.value)}
                      placeholder="https://your-domain.com/api/v1/whatsapp/webhook"
                    />
                    <Button variant="outline-secondary" size="sm" onClick={copyWebhookUrl}>
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                  <Form.Text className="text-muted">Paste this in Meta App → Webhooks</Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border mb-3" style={{ borderColor: "var(--c-border)" }}>
              <Card.Header className="bg-white border-bottom py-3">
                <div className="fw-semibold">Connection Status</div>
              </Card.Header>
              <Card.Body>
                {webhookStatus ? (
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Badge bg={webhookStatus.connected ? "success" : "danger"}>
                        {webhookStatus.connected ? "Connected" : "Disconnected"}
                      </Badge>
                      {webhookStatus.verified && <Badge bg="info">Verified</Badge>}
                    </div>
                    <div className="small text-muted">
                      Phone: {webhookStatus.phone_number || "—"}<br />
                      Quality: {webhookStatus.quality_rating || "—"}<br />
                      Messages sent today: {webhookStatus.messages_sent_today || 0}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted small">Click "Test Connection" to check status</div>
                )}
              </Card.Body>
            </Card>

            <Alert variant="info" className="small">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Setup Steps:</strong>
              <ol className="mb-0 ps-3 mt-1">
                <li>Create Meta Business App</li>
                <li>Add WhatsApp product</li>
                <li>Generate permanent token</li>
                <li>Register phone number</li>
                <li>Paste token & phone ID above</li>
                <li>Set webhook URL in Meta App</li>
              </ol>
            </Alert>
          </Col>

          <Col lg={12}>
            <Card className="border" style={{ borderColor: "var(--c-border)" }}>
              <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <div className="fw-semibold">Message Templates ({templates.length})</div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      <th className="small text-muted" style={{ fontWeight: 500 }}>Name</th>
                      <th className="small text-muted" style={{ fontWeight: 500 }}>Category</th>
                      <th className="small text-muted" style={{ fontWeight: 500 }}>Language</th>
                      <th className="small text-muted" style={{ fontWeight: 500 }}>Status</th>
                      <th className="small text-muted" style={{ fontWeight: 500 }}>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-muted py-4">No templates found</td></tr>
                    ) : templates.map(t => (
                      <tr key={t.name}>
                        <td className="fw-medium">{t.name}</td>
                        <td className="small text-muted">{t.category}</td>
                        <td className="small text-muted">{t.language}</td>
                        <td>
                          <Badge bg={
                            t.status === "APPROVED" ? "success" :
                            t.status === "PENDING" ? "warning" :
                            t.status === "REJECTED" ? "danger" : "secondary"
                          }>{t.status}</Badge>
                        </td>
                        <td className="small text-muted text-truncate" style={{ maxWidth: 300 }}>
                          {t.components?.find(c => c.type === "BODY")?.text?.substring(0, 80) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
