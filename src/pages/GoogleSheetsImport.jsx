import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate } from "../utils/permissions";

const LEAD_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "whatsapp", label: "WhatsApp", required: false },
  { key: "email", label: "Email", required: false },
  { key: "website", label: "Website", required: false },
  { key: "company_name", label: "Company Name", required: false },
  { key: "lead_category", label: "Category (Name)", required: false },
  { key: "lead_subcategory", label: "Subcategory (Name)", required: false },
  { key: "source", label: "Source (Name)", required: false },
  { key: "stage", label: "Stage (Name)", required: false },
  { key: "description", label: "Description", required: false },
  { key: "address", label: "Address", required: false },
  { key: "pincode", label: "Pincode", required: false },
  { key: "country", label: "Country", required: false },
  { key: "state", label: "State (Name)", required: false },
  { key: "city", label: "City (Name)", required: false },
  { key: "gstin", label: "GSTIN", required: false },
  { key: "status", label: "Status", required: false },
  { key: "next_follow_up_date", label: "Next Follow-up Date", required: false },
  { key: "assigned_to", label: "Assigned To (Email or Name)", required: false },
  { key: "expected_close_date", label: "Expected Close Date", required: false },
  { key: "expected_value", label: "Expected Value", required: false },
  { key: "budget", label: "Budget", required: false },
  { key: "priority", label: "Priority", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "company_size", label: "Company Size", required: false },
  { key: "tags", label: "Tags (comma-separated)", required: false },
];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h) {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const AUTO_MAP = {
  name: ["name", "lead name", "full name", "contact name", "customer name"],
  phone: ["phone", "mobile", "contact number", "phone number", "mobile number", "cell", "tel"],
  whatsapp: ["whatsapp", "whatsapp number", "wa number"],
  email: ["email", "email address", "e mail", "mail"],
  website: ["website", "site", "url", "web"],
  company_name: ["company name", "company", "organization", "firm", "business name"],
  lead_category: ["category", "lead category", "category name"],
  lead_subcategory: ["subcategory", "lead subcategory", "sub category", "subcategory name"],
  source: ["source", "lead source", "source name", "origin"],
  stage: ["stage", "lead stage", "stage name", "status stage"],
  description: ["description", "desc", "details"],
  address: ["address", "addr", "street address"],
  pincode: ["pincode", "pin", "zip", "zip code", "postal code"],
  country: ["country"],
  state: ["state", "province", "region", "state name"],
  city: ["city", "town", "city name"],
  gstin: ["gstin", "gst", "gst number", "gst no"],
  status: ["status", "lead status"],
  next_follow_up_date: ["next follow up", "next followup", "follow up date", "followup date", "next follow up date"],
  assigned_to: ["assigned to", "assignee", "owner", "assigned", "user"],
  expected_close_date: ["expected close date", "expected close", "close date", "closing date"],
  expected_value: ["expected value", "deal value", "value", "amount"],
  budget: ["budget", "lead budget"],
  priority: ["priority", "lead priority"],
  notes: ["notes", "remarks", "comments", "comment"],
  industry: ["industry", "sector", "business type"],
  company_size: ["company size", "team size", "employees", "organization size"],
  tags: ["tags", "tag", "labels", "label"],
};

function guessMapping(headers) {
  const mapping = {};
  const normalizedHeaders = headers.map((h, i) => ({ idx: i, norm: normalizeHeader(h) }));

  Object.keys(AUTO_MAP).forEach((fieldKey) => {
    const candidates = AUTO_MAP[fieldKey];
    for (const { idx, norm } of normalizedHeaders) {
      if (candidates.includes(norm)) {
        mapping[fieldKey] = idx;
        break;
      }
    }
  });

  return mapping;
}

function downloadSampleCSV() {
  const headers = ["Name", "Phone", "Email", "Company Name", "Source", "Stage", "Description", "Address", "City", "State", "Country", "Pincode", "Tags"];
  const rows = [
    ["John Doe", "9876543210", "john@example.com", "Acme Corp", "Website", "New Lead", "Interested in bulk pricing", "123 Main St", "Mumbai", "Maharashtra", "India", "400001", "hot,enterprise"],
    ["Jane Smith", "9876543211", "jane@example.com", "Globex Ltd", "Referral", "Warm Lead", "Follow up next week", "456 Park Ave", "Delhi", "Delhi", "India", "110001", "follow-up"],
    ["Ravi Kumar", "9876543212", "ravi@example.com", "", "Google Ads", "Cold Lead", "Requested catalog", "789 Road Line", "Bangalore", "Karnataka", "India", "560001", ""],
  ];
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-leads.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function GoogleSheetsImport() {
  const canImport = canCreate("leads");

  const [step, setStep] = useState(1);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [importErrors, setImportErrors] = useState([]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/lead-categories?perPage=200"),
          api.get("/lead-subcategories?perPage=200"),
          api.get("/states?perPage=200"),
          api.get("/cities?perPage=500"),
          api.get("/lead-sources?perPage=200"),
          api.get("/lead-stages?perPage=200"),
          api.get("/leads/assignable-users"),
          api.get("/lead-tags?perPage=200"),
        ]);
        const resultValue = (result) => result.status === 'fulfilled' ? toArray(result.value.data) : [];
        setCategories(resultValue(results[0]));
        setSubcategories(resultValue(results[1]));
        setStates(resultValue(results[2]));
        setCities(resultValue(results[3]));
        setLeadSources(resultValue(results[4]));
        setLeadStages(resultValue(results[5]));
        setUsers(resultValue(results[6]));
        setTags(resultValue(results[7]));
      } catch {
        toast.error("Failed to load master data for mapping");
      }
    };
    loadMasters();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target.result);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!csvText.trim()) {
      toast.warning("Please paste CSV content or upload a file");
      return;
    }
    const result = parseCSV(csvText);
    if (result.headers.length === 0) {
      toast.error("Could not parse CSV headers");
      return;
    }
    setParsed(result);
    const guessed = guessMapping(result.headers);
    setMapping(guessed);
    setStep(2);
    toast.success(`Parsed ${result.rows.length} rows`);
  };

  const mappedPreview = useMemo(() => {
    if (!parsed.rows.length) return [];
    return parsed.rows.slice(0, 10).map((row, idx) => {
      const obj = { _rowIndex: idx + 2 };
      Object.entries(mapping).forEach(([field, colIdx]) => {
        obj[field] = row[colIdx] || "";
      });
      return obj;
    });
  }, [parsed, mapping]);

  function resolveMasterId(field, value) {
    const v = (value || "").toString().trim();
    if (!v) return "";
    switch (field) {
      case "lead_category": {
        const found = categories.find(
          (c) => c.name?.toLowerCase() === v.toLowerCase() || String(c.id) === v
        );
        return found ? found.id : "";
      }
      case "lead_subcategory": {
        const found = subcategories.find(
          (s) => s.name?.toLowerCase() === v.toLowerCase() || String(s.id) === v
        );
        return found ? found.id : "";
      }
      case "source": {
        const found = leadSources.find(
          (s) => s.name?.toLowerCase() === v.toLowerCase() || String(s.id) === v
        );
        return found ? found.id : "";
      }
      case "stage": {
        const found = leadStages.find(
          (s) => s.name?.toLowerCase() === v.toLowerCase() || String(s.id) === v
        );
        return found ? found.id : "";
      }
      case "state": {
        const found = states.find(
          (s) => s.name?.toLowerCase() === v.toLowerCase() || String(s.id) === v
        );
        return found ? found.id : "";
      }
      case "city": {
        const found = cities.find(
          (c) => c.name?.toLowerCase() === v.toLowerCase() || String(c.id) === v
        );
        return found ? found.id : "";
      }
      case "assigned_to": {
        const found = users.find(
          (u) =>
            u.email?.toLowerCase() === v.toLowerCase() ||
            u.name?.toLowerCase() === v.toLowerCase() ||
            String(u.id) === v
        );
        return found ? found.id : "";
      }
      default:
        return v;
    }
  }

  function buildLeadPayload(row) {
    const payload = {
      lead_type: "individual",
      name: "",
      phone_code: "+91 IN",
      phone: "",
      whatsapp_code: "+91 IN",
      whatsapp: "",
      email: "",
      website: "",
      company_name: "",
      lead_category_id: "",
      lead_subcategory_id: "",
      source: "",
      stage: "New Lead",
      description: "",
      address: "",
      pincode: "",
      country: "India",
      state_id: "",
      city_id: "",
      gstin: "",
      status: "open",
      next_follow_up_date: "",
      assigned_to: "",
      expected_close_date: "",
      expected_value: "",
      budget: "",
      priority: "medium",
      notes: "",
      industry: "",
      company_size: "",
      tags: [],
    };

    Object.entries(mapping).forEach(([field, colIdx]) => {
      const raw = (row[colIdx] || "").toString().trim();
      if (!raw) return;

      switch (field) {
        case "name":
          payload.name = raw;
          break;
        case "phone":
          payload.phone = raw;
          break;
        case "whatsapp":
          payload.whatsapp = raw;
          break;
        case "email":
          payload.email = raw;
          break;
        case "website":
          payload.website = raw;
          break;
        case "company_name":
          payload.company_name = raw;
          break;
        case "lead_category":
          payload.lead_category_id = resolveMasterId("lead_category", raw);
          break;
        case "lead_subcategory":
          payload.lead_subcategory_id = resolveMasterId("lead_subcategory", raw);
          break;
        case "source":
          payload.source = raw;
          payload.lead_source_id = resolveMasterId("source", raw);
          break;
        case "stage":
          payload.stage = raw || payload.stage;
          payload.lead_stage_id = resolveMasterId("stage", raw);
          break;
        case "description":
          payload.description = raw;
          break;
        case "address":
          payload.address = raw;
          break;
        case "pincode":
          payload.pincode = raw;
          break;
        case "country":
          payload.country = raw;
          break;
        case "state":
          payload.state_id = resolveMasterId("state", raw);
          break;
        case "city":
          payload.city_id = resolveMasterId("city", raw);
          break;
        case "gstin":
          payload.gstin = raw;
          break;
        case "status":
          payload.status = raw.toLowerCase();
          break;
        case "next_follow_up_date":
          payload.next_follow_up_date = raw;
          break;
        case "assigned_to":
          payload.assigned_to = resolveMasterId("assigned_to", raw);
          break;
        case "expected_close_date":
          payload.expected_close_date = raw;
          break;
        case "expected_value":
          payload.expected_value = raw;
          break;
        case "budget":
          payload.budget = raw;
          break;
        case "priority":
          payload.priority = raw.toLowerCase();
          break;
        case "notes":
          payload.notes = raw;
          break;
        case "industry":
          payload.industry = raw;
          break;
        case "company_size":
          payload.company_size = raw;
          break;
        case "tags": {
          const tagNames = raw.split(",").map((t) => t.trim()).filter(Boolean);
          payload.tags = tagNames
            .map((name) => {
              const found = tags.find((t) => t.name?.toLowerCase() === name.toLowerCase());
              return found ? found.id : null;
            })
            .filter((id) => id !== null);
          break;
        }
      }
    });

    return payload;
  }

  const handlePreview = () => {
    const nameField = mapping["name"];
    if (nameField === undefined) {
      toast.warning("Please map at least the 'Name' column");
      return;
    }
    setPreviewRows(mappedPreview);
    setStep(3);
  };

  const handleImport = async () => {
    const nameField = mapping["name"];
    if (nameField === undefined) {
      toast.warning("Name column must be mapped");
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    setImportErrors([]);

    const total = parsed.rows.length;
    let success = 0;
    let failed = 0;
    const errors = [];

    // Try bulk endpoint first
    try {
      const payloads = parsed.rows.map((row) => buildLeadPayload(row));
      const res = await api.post("/leads/bulk-import", { leads: payloads });
      if (res.data?.success || res.data?.data) {
        const data = res.data.data || {};
        setImportResult({
          total,
          success: data.imported || total,
          failed: data.failed || 0,
        });
        if (data.errors) {
          setImportErrors(data.errors);
        }
        setImportProgress(100);
        toast.success(`Imported ${data.imported || total} leads`);
        setImporting(false);
        return;
      }
    } catch {
      // Fallback to individual creation
    }

    // Individual fallback
    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const payload = buildLeadPayload(row);

      if (!payload.name) {
        failed++;
        errors.push({ row: i + 2, message: "Name is required" });
        setImportProgress(Math.round(((i + 1) / total) * 100));
        continue;
      }

      try {
        await api.post("/leads", payload);
        success++;
      } catch (e) {
        failed++;
        errors.push({
          row: i + 2,
          message: e.response?.data?.message || "Create failed",
        });
      }

      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    setImportResult({ total, success, failed });
    setImportErrors(errors);
    setImporting(false);

    if (failed === 0) {
      toast.success(`All ${success} leads imported successfully`);
    } else {
      toast.warning(`${success} imported, ${failed} failed`);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCsvText("");
    setFileName("");
    setParsed({ headers: [], rows: [] });
    setMapping({});
    setPreviewRows([]);
    setImportResult(null);
    setImportErrors([]);
    setImportProgress(0);
  };

  if (!canImport) {
    return <Alert severity="warning" sx={{ borderRadius: 3 }}>You do not have permission to import leads.</Alert>;
  }

  const mappedFields = Object.keys(mapping).filter((key) => mapping[key] !== undefined);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Import from Sheets
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            Upload a Google Sheets CSV export, map columns, and import leads
          </Typography>
        </Box>
        {step > 1 && (
          <Button variant="outlined" onClick={handleReset} startIcon={<i className="fas fa-undo" aria-hidden="true" />}>
            Reset
          </Button>
        )}
      </Box>

      <Card sx={cardSx}>
        {importing && <LinearProgress />}
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 4 }}>
            <Step><StepLabel>Upload CSV</StepLabel></Step>
            <Step><StepLabel>Map Columns</StepLabel></Step>
            <Step><StepLabel>Preview & Import</StepLabel></Step>
          </Stepper>

          {/* Step 1: Upload */}
          {step === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Export your Google Sheet as a <strong>CSV file</strong> (File &gt; Download &gt; Comma Separated Values), then upload it or paste the content below.
              </Alert>

              <Box sx={{ p: 2.5, border: '1px dashed', borderColor: 'rgba(145,158,171,.4)', borderRadius: 2.5, bgcolor: '#f8fafc' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Button component="label" variant="outlined" startIcon={<i className="fas fa-file-csv" aria-hidden="true" />}>
                    Upload CSV File
                    <input hidden type="file" accept=".csv,.txt" onChange={handleFileUpload} />
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {fileName || 'No file selected'}
                  </Typography>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Chip size="small" label="OR" />
              </Divider>

              <TextField
                fullWidth
                multiline
                minRows={10}
                label="Paste CSV Content"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`Name,Phone,Email,Stage,Source\nJohn Doe,9876543210,john@example.com,New Lead,Website\nJane Smith,9876543211,jane@example.com,Warm Lead,Referral`}
                slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={downloadSampleCSV} startIcon={<i className="fas fa-download" aria-hidden="true" />}>
                  Download Sample CSV
                </Button>
                <Button variant="contained" onClick={handleParse} startIcon={<i className="fas fa-file-import" aria-hidden="true" />}>
                  Parse CSV
                </Button>
              </Stack>
            </Box>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && parsed.headers.length > 0 && (
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip size="small" label={`${parsed.rows.length} rows`} />
                <Chip size="small" color="secondary" variant="outlined" label={`${parsed.headers.length} columns`} />
              </Stack>

              <TableContainer sx={{ maxHeight: 560, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table stickyHeader size="small" sx={{ minWidth: 780 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 220 }}>Lead Field</TableCell>
                      <TableCell sx={{ width: 240 }}>CSV Column</TableCell>
                      <TableCell>Sample Data</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {LEAD_FIELDS.map((field) => (
                      <TableRow key={field.key} hover>
                        <TableCell>
                          <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
                            {field.label}
                          </Typography>
                          {field.required && <Box component="span" sx={{ color: 'error.main', ml: .5 }}>*</Box>}
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <InputLabel>CSV column</InputLabel>
                            <Select
                              label="CSV column"
                              value={mapping[field.key] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMapping((m) => {
                                  const next = { ...m };
                                  if (val === "") delete next[field.key];
                                  else next[field.key] = Number(val);
                                  return next;
                                });
                              }}
                            >
                              <MenuItem value=""><em>Not mapped</em></MenuItem>
                              {parsed.headers.map((h, i) => <MenuItem key={`${field.key}-${i}`} value={i}>{h}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {mapping[field.key] !== undefined
                              ? parsed.rows
                                  .slice(0, 3)
                                  .map((r) => r[mapping[field.key]])
                                  .filter(Boolean)
                                  .join(", ") || "—"
                              : "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => setStep(1)} startIcon={<i className="fas fa-arrow-left" aria-hidden="true" />}>
                  Back
                </Button>
                <Button variant="contained" onClick={handlePreview} startIcon={<i className="fas fa-eye" aria-hidden="true" />}>
                  Preview & Import
                </Button>
              </Stack>
            </Box>
          )}

          {/* Step 3: Preview & Import */}
          {step === 3 && (
            <Box>
              {importResult && (
                <Alert severity={importResult.failed > 0 ? 'warning' : 'success'} sx={{ mb: 3 }} icon={<i className={`fas ${importResult.failed > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`} aria-hidden="true" />}>
                  <Typography variant="subtitle2">Import Complete</Typography>
                  <Typography variant="body2">
                    Total: {importResult.total} | Success: {importResult.success} | Failed: {importResult.failed}
                  </Typography>
                </Alert>
              )}

              {importing && (
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Importing leads…</Typography>
                    <Typography variant="caption" color="text.secondary">{importProgress}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={importProgress} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              )}

              {importErrors.length > 0 && (
                <TableContainer sx={{ mb: 3, maxHeight: 220, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 90 }}>Row</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importErrors.map((err, i) => (
                        <TableRow key={`${err.row}-${i}`} hover>
                          <TableCell>{err.row}</TableCell>
                          <TableCell sx={{ color: 'error.main' }}>{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Preview (first {previewRows.length} rows)
              </Typography>
              <TableContainer sx={{ mb: 3, maxHeight: 400, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table stickyHeader size="small" sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      {mappedFields.map((field) => (
                        <TableCell key={field}>
                          {LEAD_FIELDS.find((f) => f.key === field)?.label || field}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewRows.map((row) => (
                      <TableRow key={row._rowIndex} hover>
                        {mappedFields.map((field) => (
                          <TableCell key={`${row._rowIndex}-${field}`}>
                            <Typography variant="body2" color="text.secondary">
                              {row[field] || '—'}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
                <Button variant="outlined" onClick={() => setStep(2)} disabled={importing} startIcon={<i className="fas fa-arrow-left" aria-hidden="true" />}>
                  Back
                </Button>
                {!importResult && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleImport}
                    disabled={importing}
                    startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <i className="fas fa-cloud-upload-alt" aria-hidden="true" />}
                  >
                    {importing ? 'Importing…' : `Import ${parsed.rows.length} Lead${parsed.rows.length !== 1 ? 's' : ''}`}
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
