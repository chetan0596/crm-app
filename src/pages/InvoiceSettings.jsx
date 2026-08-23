import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Form, Button, Spinner, Row, Col, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../api";

const DEFAULTS = {
  company_name: "",
  company_address: "",
  company_phone: "",
  company_email: "",
  company_gstin: "",
  logo: "",
  invoice_title: "TAX INVOICE",
  invoice_prefix: "INV",
  theme_color: "#1e3a5f",
  bank_details: "",
  footer_text: "",
  terms: "",
  signatory_name: "",
  stamp: "",
  notes: "",
};

export default function InvoiceSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef(null);
  const stampRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/invoice-settings");
      if (res.data?.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch {
      toast.error("Failed to load invoice settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await api.post("/invoice-settings", settings);
      toast.success("Invoice settings saved successfully");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setSettings(s => ({ ...s, [field]: value }));

  const handleFileUpload = (field, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update(field, reader.result);
      toast.success("Image loaded — click Save to persist");
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner /></div>;
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="m-0 fw-bold">Invoice Settings</h4>
          <div className="small text-muted">Configure company details, branding, and PDF invoice output</div>
        </div>
        <Button variant="primary" size="sm" onClick={save} disabled={saving}>
          {saving ? <Spinner size="sm" className="me-1" /> : <i className="fas fa-save me-1"></i>}
          Save Settings
        </Button>
      </div>

      <Row className="g-3">
        {/* Company Information */}
        <Col xs={12}>
          <Card>
            <Card.Header>
              <i className="fas fa-building me-2"></i>Company Information
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Company Name</Form.Label>
                    <Form.Control
                      size="sm"
                      value={settings.company_name}
                      onChange={e => update("company_name", e.target.value)}
                      placeholder="Your Company Pvt Ltd"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">GSTIN / VAT Number</Form.Label>
                    <Form.Control
                      size="sm"
                      value={settings.company_gstin}
                      onChange={e => update("company_gstin", e.target.value)}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Company Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      size="sm"
                      value={settings.company_address}
                      onChange={e => update("company_address", e.target.value)}
                      placeholder="Plot No, Street, City, State - PIN"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Phone</Form.Label>
                    <Form.Control
                      size="sm"
                      value={settings.company_phone}
                      onChange={e => update("company_phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Email</Form.Label>
                    <Form.Control
                      size="sm"
                      type="email"
                      value={settings.company_email}
                      onChange={e => update("company_email", e.target.value)}
                      placeholder="accounts@company.com"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Logo & Branding */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <i className="fas fa-image me-2"></i>Logo &amp; Branding
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Company Logo</Form.Label>
                <div className="d-flex align-items-center gap-3 mb-2">
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Logo preview"
                      style={{ maxHeight: 60, maxWidth: 120, border: "1px solid #ddd", borderRadius: 4, padding: 2 }}
                    />
                  ) : (
                    <div className="text-muted small" style={{ width: 120, textAlign: "center", padding: 10, border: "1px dashed #ccc", borderRadius: 4 }}>
                      No logo
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="d-none"
                      onChange={e => handleFileUpload("logo", e.target.files?.[0])}
                    />
                    <Button variant="outline-primary" size="sm" onClick={() => logoRef.current?.click()}>
                      <i className="fas fa-upload me-1"></i>Upload
                    </Button>
                    {settings.logo && (
                      <Button variant="outline-danger" size="sm" className="ms-1" onClick={() => update("logo", "")}>
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                </div>
                <Form.Text className="text-muted">PNG, JPEG, or SVG. Max 2MB.</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Invoice Title</Form.Label>
                <Form.Control
                  size="sm"
                  value={settings.invoice_title}
                  onChange={e => update("invoice_title", e.target.value)}
                  placeholder="TAX INVOICE"
                />
                <Form.Text className="text-muted">Shown as the heading on the PDF. Use "TAX INVOICE" or "RETAIL INVOICE".</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Invoice Prefix</Form.Label>
                <Form.Control
                  size="sm"
                  value={settings.invoice_prefix}
                  onChange={e => update("invoice_prefix", e.target.value)}
                  placeholder="INV"
                />
                <Form.Text className="text-muted">Used when generating new invoice numbers (e.g. INV-001).</Form.Text>
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold small">Theme Color</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="color"
                    style={{ width: 50, height: 38, padding: 2 }}
                    value={settings.theme_color}
                    onChange={e => update("theme_color", e.target.value)}
                  />
                  <Form.Control
                    size="sm"
                    style={{ maxWidth: 120 }}
                    value={settings.theme_color}
                    onChange={e => update("theme_color", e.target.value)}
                    placeholder="#1e3a5f"
                  />
                </div>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Bank Details */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <i className="fas fa-university me-2"></i>Bank Details
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label className="fw-bold small">Bank Account Information</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  size="sm"
                  value={settings.bank_details}
                  onChange={e => update("bank_details", e.target.value)}
                  placeholder={"Bank Name: HDFC Bank\nAccount Name: Your Company Pvt Ltd\nAccount No: 1234567890\nIFSC: HDFC0001234\nBranch: Mumbai"}
                />
                <Form.Text className="text-muted">Displayed in the bank details section of the PDF.</Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Signature & Stamp */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <i className="fas fa-stamp me-2"></i>Authorized Signatory &amp; Stamp
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Authorized Signatory Name</Form.Label>
                <Form.Control
                  size="sm"
                  value={settings.signatory_name}
                  onChange={e => update("signatory_name", e.target.value)}
                  placeholder="John Doe"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="fw-bold small">Stamp / Signature Image</Form.Label>
                <div className="d-flex align-items-center gap-3 mb-2">
                  {settings.stamp ? (
                    <img
                      src={settings.stamp}
                      alt="Stamp preview"
                      style={{ maxHeight: 70, maxWidth: 120, border: "1px solid #ddd", borderRadius: 4, padding: 2 }}
                    />
                  ) : (
                    <div className="text-muted small" style={{ width: 120, textAlign: "center", padding: 12, border: "1px dashed #ccc", borderRadius: 4 }}>
                      No stamp
                    </div>
                  )}
                  <div>
                    <input
                      ref={stampRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="d-none"
                      onChange={e => handleFileUpload("stamp", e.target.files?.[0])}
                    />
                    <Button variant="outline-primary" size="sm" onClick={() => stampRef.current?.click()}>
                      <i className="fas fa-upload me-1"></i>Upload
                    </Button>
                    {settings.stamp && (
                      <Button variant="outline-danger" size="sm" className="ms-1" onClick={() => update("stamp", "")}>
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                </div>
                <Form.Text className="text-muted">Transparent PNG works best. Max 2MB.</Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Terms, Notes & Footer */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <i className="fas fa-file-contract me-2"></i>Terms, Notes &amp; Footer
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Terms &amp; Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  size="sm"
                  value={settings.terms}
                  onChange={e => update("terms", e.target.value)}
                  placeholder={"1. Goods once sold will not be taken back.\n2. Payment within 30 days of invoice date.\n3. Subject to local jurisdiction."}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Additional Invoice Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={settings.notes}
                  onChange={e => update("notes", e.target.value)}
                  placeholder="Any extra notes shown on the invoice..."
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="fw-bold small">Footer Text</Form.Label>
                <Form.Control
                  size="sm"
                  value={settings.footer_text}
                  onChange={e => update("footer_text", e.target.value)}
                  placeholder="Thank you for your business!"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-end mt-3">
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? <Spinner size="sm" className="me-1" /> : <i className="fas fa-save me-1"></i>}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
