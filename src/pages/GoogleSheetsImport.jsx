import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Form, Badge, ProgressBar, Alert } from "react-bootstrap";
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
        const [c, s, st, ci, ls, lsg, u, t] = await Promise.all([
          api.get("/lead-categories?perPage=200"),
          api.get("/lead-subcategories?perPage=200"),
          api.get("/states?perPage=200"),
          api.get("/cities?perPage=500"),
          api.get("/lead-sources?perPage=200"),
          api.get("/lead-stages?perPage=200"),
          api.get("/leads/assignable-users"),
          api.get("/lead-tags?perPage=200"),
        ]);
        setCategories(c.data?.data || []);
        setSubcategories(s.data?.data || []);
        setStates(st.data?.data || []);
        setCities(ci.data?.data || []);
        setLeadSources(ls.data?.data || []);
        setLeadStages(lsg.data?.data || []);
        setUsers(u.data?.data || []);
        setTags(t.data?.data || []);
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
    return parsed.rows.slice(0, 5).map((row, idx) => {
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
    const preview = parsed.rows.slice(0, 10).map((row, idx) => buildLeadPayload(row));
    setPreviewRows(preview);
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
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">You do not have permission to import leads.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="card card-outline card-primary">
        <div className="card-header" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="fab fa-google text-danger small"></i>
              <span className="fw-semibold" style={{ color: "#1e293b" }}>Import Leads from Google Sheets</span>
            </div>
            <div className="d-flex gap-2">
              {step > 1 && (
                <Button variant="outline-secondary" size="sm" onClick={handleReset}>
                  <i className="fas fa-undo me-1"></i> Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Progress Steps */}
          <div className="d-flex justify-content-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <StepBadge num={1} label="Upload CSV" active={step === 1} done={step > 1} />
              <div className="text-muted" style={{ width: 24, borderTop: "2px solid #e2e8f0" }}></div>
              <StepBadge num={2} label="Map Columns" active={step === 2} done={step > 2} />
              <div className="text-muted" style={{ width: 24, borderTop: "2px solid #e2e8f0" }}></div>
              <StepBadge num={3} label="Preview & Import" active={step === 3} done={false} />
            </div>
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <Alert variant="info" className="small">
                <i className="fas fa-info-circle me-2"></i>
                Export your Google Sheet as a <strong>CSV file</strong> (File &gt; Download &gt; Comma Separated Values) and upload it here.
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Upload CSV File</Form.Label>
                <Form.Control type="file" accept=".csv,.txt" onChange={handleFileUpload} size="sm" />
                {fileName && <div className="small text-muted mt-1">Selected: {fileName}</div>}
              </Form.Group>

              <div className="text-center text-muted small mb-2">— OR —</div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Paste CSV Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={10}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Name,Phone,Email,Stage,Source\nJohn Doe,9876543210,john@example.com,New Lead,Website\nJane Smith,9876543211,jane@example.com,Warm Lead,Referral`}
                  style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <Button variant="outline-secondary" size="sm" onClick={downloadSampleCSV}>
                  <i className="fas fa-download me-1"></i> Download Sample CSV
                </Button>
                <Button variant="primary" size="sm" onClick={handleParse}>
                  <i className="fas fa-file-csv me-1"></i> Parse CSV
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && parsed.headers.length > 0 && (
            <div>
              <div className="mb-3">
                <Badge bg="secondary" className="me-2">{parsed.rows.length} rows</Badge>
                <Badge bg="info">{parsed.headers.length} columns</Badge>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 200 }}>Lead Field</th>
                      <th style={{ width: 200 }}>CSV Column</th>
                      <th>Sample Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEAD_FIELDS.map((field) => (
                      <tr key={field.key}>
                        <td>
                          <span className="small fw-medium">{field.label}</span>
                          {field.required && <span className="text-danger ms-1">*</span>}
                        </td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={mapping[field.key] ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMapping((m) => {
                                const next = { ...m };
                                if (val === "") {
                                  delete next[field.key];
                                } else {
                                  next[field.key] = Number(val);
                                }
                                return next;
                              });
                            }}
                          >
                            <option value="">— Not Mapped —</option>
                            {parsed.headers.map((h, i) => (
                              <option key={i} value={i}>
                                {h}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td className="small text-muted">
                          {mapping[field.key] !== undefined
                            ? parsed.rows
                                .slice(0, 3)
                                .map((r) => r[mapping[field.key]])
                                .filter(Boolean)
                                .join(", ") || "—"
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" size="sm" onClick={() => setStep(1)}>
                  <i className="fas fa-arrow-left me-1"></i> Back
                </Button>
                <Button variant="primary" size="sm" onClick={handlePreview}>
                  <i className="fas fa-eye me-1"></i> Preview & Import
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Import */}
          {step === 3 && (
            <div>
              {importResult && (
                <Alert variant={importResult.failed > 0 ? "warning" : "success"} className="mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className={`fas ${importResult.failed > 0 ? "fa-exclamation-triangle" : "fa-check-circle"} fa-lg`}></i>
                    <div>
                      <strong>Import Complete</strong>
                      <div className="small">
                        Total: {importResult.total} | Success: {importResult.success} | Failed: {importResult.failed}
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              {importing && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Importing leads…</span>
                    <span>{importProgress}%</span>
                  </div>
                  <ProgressBar now={importProgress} animated variant="primary" style={{ height: 8 }} />
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="mb-3" style={{ maxHeight: 200, overflow: "auto" }}>
                  <table className="table table-sm table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th>Row</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importErrors.map((err, i) => (
                        <tr key={i}>
                          <td className="small">{err.row}</td>
                          <td className="small text-danger">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h6 className="fw-semibold mb-2 small">Preview (first {previewRows.length} rows)</h6>
              <div className="mb-3" style={{ maxHeight: 400, overflow: "auto" }}>
                <DataTable
                  columns={Object.keys(mapping)
                    .filter((k) => mapping[k] !== undefined)
                    .map((k) => ({
                      name: LEAD_FIELDS.find((f) => f.key === k)?.label || k,
                      selector: (r) => r[k] || "—",
                      sortable: false,
                      wrap: true,
                      cell: (row) => <span className="small">{row[k] || "—"}</span>,
                    }))}
                  data={previewRows}
                  dense
                  striped
                  highlightOnHover
                  customStyles={{
                    rows: { style: { fontSize: "0.8rem", minHeight: "36px" } },
                    headCells: {
                      style: {
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                      },
                    },
                  }}
                />
              </div>

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" size="sm" onClick={() => setStep(2)} disabled={importing}>
                  <i className="fas fa-arrow-left me-1"></i> Back
                </Button>
                {!importResult && (
                  <Button variant="success" size="sm" onClick={handleImport} disabled={importing}>
                    {importing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Importing…
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt me-1"></i>
                        Import {parsed.rows.length} Lead{parsed.rows.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBadge({ num, label, active, done }) {
  return (
    <div className="d-flex flex-column align-items-center gap-1">
      <div
        className="d-flex align-items-center justify-content-center fw-bold small"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: done ? "#198754" : active ? "#0d6efd" : "#e2e8f0",
          color: done || active ? "#fff" : "#64748b",
          fontSize: "0.8rem",
        }}
      >
        {done ? <i className="fas fa-check" style={{ fontSize: 12 }}></i> : num}
      </div>
      <span className="small" style={{ color: active ? "#0d6efd" : "#64748b", fontWeight: active ? 600 : 400, fontSize: "0.75rem" }}>
        {label}
      </span>
    </div>
  );
}
