import { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
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

const cardSx = {
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const iconBoxSx = {
  width: 40,
  height: 40,
  borderRadius: 2,
  display: 'grid',
  placeItems: 'center',
  bgcolor: '#eaf0f6',
  color: 'primary.main',
  flexShrink: 0,
};

const helperSx = {
  display: 'block',
  color: 'text.secondary',
  fontSize: 12,
  mt: .5,
};

function SectionCard({ icon, title, children, contentSx }) {
  return (
    <Card sx={cardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2.5 }}>
        <Box sx={iconBoxSx}>
          <i className={icon} style={{ fontSize: 16 }} aria-hidden="true" />
        </Box>
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      <Divider />
      <CardContent sx={{ p: 3, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}

function ImageSlot({ preview, emptyText }) {
  return preview ? (
    <Box
      component="img"
      src={preview}
      alt={emptyText}
      sx={{ maxHeight: 60, maxWidth: 120, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: '2px' }}
    />
  ) : (
    <Box
      sx={{
        width: 120,
        textAlign: 'center',
        py: 1.25,
        px: 1,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        color: 'text.secondary',
        fontSize: 12,
      }}
    >
      {emptyText}
    </Box>
  );
}

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

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

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
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>Invoice Settings</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Configure company details, branding, and PDF invoice output</Typography>
        </Box>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-save" aria-hidden="true" />}>
          Save Settings
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        These settings control how your PDF invoices, quotations, credit notes, and debit notes look. Upload your logo and stamp once — they will appear on every generated document.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
        {/* Company Information */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <SectionCard icon="fas fa-building" title="Company Information">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
              <TextField
                size="small"
                label="Company Name"
                value={settings.company_name}
                onChange={e => update("company_name", e.target.value)}
                placeholder="Your Company Pvt Ltd"
              />
              <TextField
                size="small"
                label="GSTIN / VAT Number"
                value={settings.company_gstin}
                onChange={e => update("company_gstin", e.target.value)}
                placeholder="22AAAAA0000A1Z5"
              />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <TextField
                  size="small"
                  label="Company Address"
                  multiline
                  rows={2}
                  fullWidth
                  value={settings.company_address}
                  onChange={e => update("company_address", e.target.value)}
                  placeholder="Plot No, Street, City, State - PIN"
                />
              </Box>
              <TextField
                size="small"
                label="Phone"
                value={settings.company_phone}
                onChange={e => update("company_phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
              <TextField
                size="small"
                type="email"
                label="Email"
                value={settings.company_email}
                onChange={e => update("company_email", e.target.value)}
                placeholder="accounts@company.com"
              />
            </Box>
          </SectionCard>
        </Box>

        {/* Logo & Branding */}
        <SectionCard icon="fas fa-image" title="Logo & Branding">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1 }}>
                Company Logo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: .5 }}>
                <ImageSlot preview={settings.logo} emptyText="No logo" />
                <Box>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    hidden
                    onChange={e => handleFileUpload("logo", e.target.files?.[0])}
                  />
                  <Button variant="outlined" size="small" onClick={() => logoRef.current?.click()} startIcon={<i className="fas fa-upload" aria-hidden="true" />}>
                    Upload
                  </Button>
                  {settings.logo && (
                    <IconButton size="small" color="error" sx={{ ml: .5, border: '1px solid', borderColor: 'divider' }} onClick={() => update("logo", "")} aria-label="Remove logo">
                      <i className="fas fa-times" style={{ fontSize: 12 }} aria-hidden="true" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <Typography sx={helperSx}>PNG, JPEG, or SVG. Max 2MB.</Typography>
            </Box>

            <Box>
              <TextField
                size="small"
                fullWidth
                label="Invoice Title"
                value={settings.invoice_title}
                onChange={e => update("invoice_title", e.target.value)}
                placeholder="TAX INVOICE"
              />
              <Typography sx={helperSx}>Shown as the heading on the PDF. Use "TAX INVOICE" or "RETAIL INVOICE".</Typography>
            </Box>

            <Box>
              <TextField
                size="small"
                fullWidth
                label="Invoice Prefix"
                value={settings.invoice_prefix}
                onChange={e => update("invoice_prefix", e.target.value)}
                placeholder="INV"
              />
              <Typography sx={helperSx}>Used when generating new invoice numbers (e.g. INV-001).</Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1 }}>
                Theme Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  component="input"
                  type="color"
                  value={settings.theme_color}
                  onChange={e => update("theme_color", e.target.value)}
                  sx={{ width: 50, height: 38, p: '2px', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff', cursor: 'pointer' }}
                />
                <TextField
                  size="small"
                  sx={{ maxWidth: 140 }}
                  value={settings.theme_color}
                  onChange={e => update("theme_color", e.target.value)}
                  placeholder="#1e3a5f"
                />
              </Box>
            </Box>
          </Box>
        </SectionCard>

        {/* Bank Details */}
        <SectionCard icon="fas fa-university" title="Bank Details">
          <TextField
            size="small"
            label="Bank Account Information"
            multiline
            rows={8}
            fullWidth
            value={settings.bank_details}
            onChange={e => update("bank_details", e.target.value)}
            placeholder={"Bank Name: HDFC Bank\nAccount Name: Your Company Pvt Ltd\nAccount No: 1234567890\nIFSC: HDFC0001234\nBranch: Mumbai"}
          />
          <Typography sx={helperSx}>Displayed in the bank details section of the PDF.</Typography>
        </SectionCard>

        {/* Signature & Stamp */}
        <SectionCard icon="fas fa-stamp" title="Authorized Signatory & Stamp">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              size="small"
              label="Authorized Signatory Name"
              value={settings.signatory_name}
              onChange={e => update("signatory_name", e.target.value)}
              placeholder="John Doe"
            />
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1 }}>
                Stamp / Signature Image
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: .5 }}>
                <ImageSlot preview={settings.stamp} emptyText="No stamp" />
                <Box>
                  <input
                    ref={stampRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    hidden
                    onChange={e => handleFileUpload("stamp", e.target.files?.[0])}
                  />
                  <Button variant="outlined" size="small" onClick={() => stampRef.current?.click()} startIcon={<i className="fas fa-upload" aria-hidden="true" />}>
                    Upload
                  </Button>
                  {settings.stamp && (
                    <IconButton size="small" color="error" sx={{ ml: .5, border: '1px solid', borderColor: 'divider' }} onClick={() => update("stamp", "")} aria-label="Remove stamp">
                      <i className="fas fa-times" style={{ fontSize: 12 }} aria-hidden="true" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <Typography sx={helperSx}>Transparent PNG works best. Max 2MB.</Typography>
            </Box>
          </Box>
        </SectionCard>

        {/* Terms, Notes & Footer */}
        <SectionCard icon="fas fa-file-contract" title="Terms, Notes & Footer">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              size="small"
              label="Terms & Conditions"
              multiline
              rows={4}
              fullWidth
              value={settings.terms}
              onChange={e => update("terms", e.target.value)}
              placeholder={"1. Goods once sold will not be taken back.\n2. Payment within 30 days of invoice date.\n3. Subject to local jurisdiction."}
            />
            <TextField
              size="small"
              label="Additional Invoice Notes"
              multiline
              rows={2}
              fullWidth
              value={settings.notes}
              onChange={e => update("notes", e.target.value)}
              placeholder="Any extra notes shown on the invoice..."
            />
            <TextField
              size="small"
              label="Footer Text"
              fullWidth
              value={settings.footer_text}
              onChange={e => update("footer_text", e.target.value)}
              placeholder="Thank you for your business!"
            />
          </Box>
        </SectionCard>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <i className="fas fa-save" aria-hidden="true" />}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
}
