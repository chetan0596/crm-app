import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canEdit, canDelete, canView } from "../utils/permissions";

const tableReducer = (state, action) => {
  switch (action.type) {
    case "PAGE": return { ...state, page: action.page };
    case "PER_PAGE": return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH": return { ...state, search: action.search, page: 1 };
    case "SORT": return { ...state, sortField: action.field, sortDir: action.dir };
    default: return state;
  }
};

const getNum = (v, fallback = 1) => {
  const n = parseInt(v, 10);
  return isNaN(n) || n < 1 ? fallback : n;
};

const EVENT_OPTIONS = [
  { value: "lead.created", label: "Lead Created" },
  { value: "lead.updated", label: "Lead Updated" },
  { value: "lead.deleted", label: "Lead Deleted" },
  { value: "lead.assigned", label: "Lead Assigned" },
  { value: "follow-up.created", label: "Follow-up Created" },
  { value: "follow-up.completed", label: "Follow-up Completed" },
];

export default function Webhooks() {
  const [params, setParams] = useSearchParams();
  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 10),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(initialTable.search);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    type: "push",
    events: [],
    active: true,
    secret: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testLoading, setTestLoading] = useState(null);

  const canViewWebhooks = canView("webhooks");
  const canCreateWebhook = canCreate("webhooks");
  const canEditWebhook = canEdit("webhooks");
  const canDeleteWebhook = canDelete("webhooks");

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page, perPage: table.perPage, search: table.search,
      sort: table.sortField, dir: table.sortDir,
    });
    if (newParams.toString() !== params.toString()) setParams(newParams);
  }, [table, params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) dispatch({ type: "SEARCH", search: s });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = async (signal) => {
    setLoading(true);
    try {
      const res = await api.get("/webhooks", {
        params: {
          page: table.page,
          perPage: table.perPage,
          search: table.search,
          sortField: table.sortField,
          sortDir: table.sortDir,
        },
        signal,
      });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [table, reloadKey]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", url: "", type: "push", events: [], active: true, secret: "", description: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      url: row.url,
      type: row.type || "push",
      events: row.events || [],
      active: row.active ?? true,
      secret: row.secret || "",
      description: row.description || "",
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name || !form.url) {
      toast.warning("Name and URL are required");
      return;
    }
    if (!form.events.length) {
      toast.warning("Select at least one event");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/webhooks/${editingId}`, form);
        toast.success("Webhook updated");
      } else {
        await api.post("/webhooks", form);
        toast.success("Webhook created");
      }
      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteWebhook = (row) => {
    Swal.fire({
      title: "Delete webhook?",
      text: `Webhook: ${row.name}?`,
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/webhooks/${row.id}`);
        setReloadKey((k) => k + 1);
        toast.success("Webhook deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  const testWebhook = async (row) => {
    try {
      setTestLoading(row.id);
      const res = await api.post(`/webhooks/${row.id}/test`);
      if (res.data?.success) {
        toast.success(`Webhook test sent — Status: ${res.data.status || "OK"}`);
      } else {
        toast.error(`Webhook test failed — ${res.data?.message || "Unknown error"}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Test failed");
    } finally {
      setTestLoading(null);
    }
  };

  const toggleEvent = (eventValue) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(eventValue)
        ? f.events.filter((e) => e !== eventValue)
        : [...f.events, eventValue],
    }));
  };

  const columns = useMemo(() => [
    { name: "ID", selector: (r) => r.id, sortable: true, sortField: "id", width: "70px" },
    { name: "Name", selector: (r) => r.name, sortable: true, sortField: "name" },
    { name: "URL", cell: (row) => (
      <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: 240 }} title={row.url}>
        {row.url}
      </span>
    )},
    { name: "Type", cell: (row) => (
      <Badge bg={row.type === "push" ? "primary" : "info"} className="text-capitalize">
        {row.type}
      </Badge>
    ), width: "80px" },
    { name: "Events", cell: (row) => (
      <div className="d-flex flex-wrap gap-1">
        {(row.events || []).slice(0, 2).map((e) => (
          <Badge key={e} bg="secondary" className="small">{e}</Badge>
        ))}
        {(row.events || []).length > 2 && (
          <Badge bg="light" text="dark" className="small">+{(row.events || []).length - 2}</Badge>
        )}
      </div>
    )},
    { name: "Status", cell: (row) => (
      <Badge bg={row.active ? "success" : "secondary"} className="small">
        {row.active ? "Active" : "Inactive"}
      </Badge>
    ), width: "90px" },
    {
      name: "Action",
      width: "160px",
      cell: (row) => (
        <div className="d-flex gap-1">
          {canEditWebhook && (
            <button className="btn btn-outline-primary btn-sm" onClick={() => openEdit(row)} title="Edit">
              <i className="fas fa-edit"></i>
            </button>
          )}
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => testWebhook(row)}
            disabled={testLoading === row.id}
            title="Test webhook"
          >
            {testLoading === row.id ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="fas fa-vial"></i>
            )}
          </button>
          {canDeleteWebhook && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => deleteWebhook(row)} title="Delete">
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      ),
    },
  ], [testLoading]);

  if (!canViewWebhooks) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">You do not have permission to view webhooks.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="card card-outline card-primary">
        <div className="card-header" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="fas fa-link text-primary small"></i>
              <span className="fw-semibold" style={{ color: "#1e293b" }}>Webhooks</span>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
                <span className="input-group-text bg-white" style={{ borderColor: "#cbd5e1" }}>
                  <i className="fas fa-search text-muted" style={{ fontSize: 12 }}></i>
                </span>
                <input
                  className="form-control bg-white"
                  placeholder="Search webhooks..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ borderColor: "#cbd5e1", fontSize: "0.85rem" }}
                />
              </div>
              {canCreateWebhook && (
                <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ borderRadius: 6, fontWeight: 500, fontSize: "0.8rem" }}>
                  <i className="fas fa-plus" style={{ fontSize: 11 }}></i> New Webhook
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <DataTable
            columns={columns}
            data={rows}
            progressPending={loading}
            persistTableHead
            className="modern-datatable"
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={table.perPage}
            onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
            onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
            sortServer
            onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
            progressComponent={
              <div className="p-4 text-center">
                <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                <span className="text-muted small">Loading webhooks...</span>
              </div>
            }
            noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No webhooks found</div>
                <div className="small text-muted">Create a webhook to push or pull lead data</div>
              </div>
            }
            striped
            highlightOnHover
            dense
            keyField="id"
            customStyles={{
              rows: { style: { fontSize: "0.875rem", minHeight: "48px" } },
              headCells: {
                style: {
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#64748b",
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Edit Webhook" : "New Webhook"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Slack Lead Notification"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Webhook URL <span className="text-danger">*</span></Form.Label>
            <Form.Control
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://hooks.example.com/lead-events"
            />
            <Form.Text className="text-muted small">
              {form.type === "push" ? "We will POST lead data to this URL when events occur." : "We will periodically fetch leads from this URL."}
            </Form.Text>
          </Form.Group>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Type</Form.Label>
                <Form.Select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="push">Push (send data out)</option>
                  <option value="pull">Pull (fetch data in)</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Status</Form.Label>
                <Form.Select
                  value={form.active ? "1" : "0"}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "1" }))}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Secret Key (optional)</Form.Label>
            <Form.Control
              type="password"
              value={form.secret}
              onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
              placeholder="For HMAC signature verification"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Description (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g., Sends new leads to Slack #leads channel. Maintained by IT team."
              style={{ resize: "vertical", fontSize: "0.9rem" }}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label className="small fw-semibold">Events <span className="text-danger">*</span></Form.Label>
            <div className="row g-2">
              {EVENT_OPTIONS.map((evt) => {
                const checked = form.events.includes(evt.value);
                return (
                  <div key={evt.value} className="col-12 col-sm-6">
                    <div
                      className="d-flex align-items-center gap-2 p-2 rounded border"
                      style={{
                        cursor: "pointer",
                        backgroundColor: checked ? "#eff6ff" : "#fff",
                        borderColor: checked ? "#3b82f6" : "#e2e8f0",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => toggleEvent(evt.value)}
                      role="button"
                    >
                      <div className="flex-shrink-0" style={{ width: 16, textAlign: "center" }}>
                        {checked ? (
                          <i className="fas fa-check-square text-primary" style={{ fontSize: 14 }}></i>
                        ) : (
                          <i className="far fa-square text-muted" style={{ fontSize: 14 }}></i>
                        )}
                      </div>
                      <span className="small fw-medium" style={{ color: checked ? "#1e40af" : "#334155" }}>
                        {evt.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
            {editingId ? "Update Webhook" : "Save Webhook"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
