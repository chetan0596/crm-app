import { useEffect, useMemo, useReducer, useState, useCallback } from "react";
import { Card, Form, Modal } from "react-bootstrap";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
}

function tableReducer(state, action) {
  switch (action.type) {
    case "PAGE":
      return { ...state, page: action.page };
    case "PER_PAGE":
      return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH":
      return { ...state, search: action.search, page: 1 };
    case "SORT":
      return { ...state, sortField: action.field, sortDir: action.dir };
    default:
      return state;
  }
}

export default function LeadsExtended() {
  const canViewPage = canView("leads");

  const [table, dispatch] = useReducer(tableReducer, {
    page: 1,
    perPage: 25,
    search: "",
    sortField: "id",
    sortDir: "desc",
  });

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [users, setUsers] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [leadStages, setLeadStages] = useState([]);
  const [tags, setTags] = useState([]);
  const [showAdvance, setShowAdvance] = useState(false);

  const [form, setForm] = useState({
    lead_type: "individual",
    name: "",
    phone_code: "+91 IN",
    phone: "",
    whatsapp_code: "+91 IN",
    whatsapp: "",
    email: "",
    lead_category_id: "",
    lead_subcategory_id: "",
    source: "",
    stage: "",
    description: "",
    address: "",
    pincode: "",
    country: "India",
    state_id: "",
    city_id: "",
    gstin: "",
    assigned_to: "",
    expected_close_date: "",
    follow_up_date: "",
    expected_value: "",
    company_name: "",
    industry: "",
    company_size: "",
    source_other: "",
    notes: "",
    tags: [],
  });

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) dispatch({ type: "SEARCH", search: s });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = async (signal) => {
    if (!canViewPage) return;
    try {
      setLoading(true);
      const r = await api.get("/leads", {
        params: table,
        signal,
      });

      const payload = r.data;

      if (payload && Array.isArray(payload.data)) {
        setRows(payload.data);
        setTotal(Number(payload.total) || 0);
      } else if (Array.isArray(payload)) {
        setRows(payload);
        setTotal(0);
      } else {
        setRows([]);
        setTotal(0);
      }
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
  }, [reloadKey, table, canViewPage]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [catRes, subRes, srcRes, stageRes, userRes, tagRes] = await Promise.all([
          api.get("/lead-categories", { params: { perPage: 200 } }),
          api.get("/lead-subcategories", { params: { perPage: 200 } }),
          api.get("/lead-sources/list"),
          api.get("/lead-stages/list"),
          api.get("/users", { params: { perPage: 200 } }),
          api.get("/lead-tags", { params: { status: 1 } }),
        ]);
        setCategories(catRes.data?.data || catRes.data || []);
        setSubcategories(subRes.data?.data || subRes.data || []);
        setLeadSources(srcRes.data?.data || []);
        setLeadStages(stageRes.data?.data || []);
        setUsers(userRes.data?.data || userRes.data || []);
        setTags(tagRes.data?.data || tagRes.data || []);
      } catch {}
    };
    loadMasters();
  }, []);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const res = await api.get("/states");
        setStates(res.data?.data || []);
      } catch {}
    };
    loadStates();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      const stateId = form.state_id;
      if (!stateId) {
        setCities([]);
        return;
      }

      try {
        const res = await api.get(`/states/${stateId}/cities`);
        setCities(res.data?.data || []);
      } catch {
        setCities([]);
      }
    };
    loadCities();
  }, [form.state_id]);

  const openAdd = () => {
    setForm({
      lead_type: "individual",
      name: "",
      phone_code: "+91 IN",
      phone: "",
      whatsapp_code: "+91 IN",
      whatsapp: "",
      email: "",
      lead_category_id: "",
      lead_subcategory_id: "",
      source: "",
      stage: "",
      description: "",
      address: "",
      pincode: "",
      country: "India",
      state_id: "",
      city_id: "",
      gstin: "",
      assigned_to: "",
      expected_close_date: "",
      follow_up_date: "",
      expected_value: "",
      company_name: "",
      industry: "",
      company_size: "",
      source_other: "",
      notes: "",
      tags: [],
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Name required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags.map((t) => (typeof t === "object" ? t.id : t)) : [],
      };

      if (form.editId) {
        await api.put(`/leads/${form.editId}`, payload);
        toast.success("Lead updated");
      } else {
        await api.post("/leads", payload);
        toast.success("Lead created");
      }

      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = useCallback(async (row) => {
    const ok = await Swal.fire({
      title: "Delete Lead?",
      text: row?.name || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/leads/${row.id}`);
      toast.success("Deleted");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  }, []);

  const columns = useMemo(
    () => [
      { name: "ID", selector: (r) => r.id, width: "80px" },
      { name: "Name", selector: (r) => r.name, sortable: true },
      { name: "Phone", selector: (r) => r.phone, sortable: true },
      { name: "Email", selector: (r) => r.email, sortable: true },
      { name: "Stage", selector: (r) => r.stage, sortable: true },
      { name: "Source", selector: (r) => r.source, sortable: true },
      { name: "Assigned To", selector: (r) => r.assigned_to_user?.name ?? "-", sortable: true },
      { name: "Expected Close", selector: (r) => r.expected_close_date, sortable: true },
      { name: "Follow Up", selector: (r) => r.follow_up_date, sortable: true },
      { name: "Expected Value", selector: (r) => r.expected_value, sortable: true },
      {
        name: "Tags",
        cell: (r) => (
          <div className="d-flex flex-wrap gap-1">
            {(Array.isArray(r.tags) ? r.tags : []).map((t) => (
              <span
                key={typeof t === "object" ? t.id : t}
                className="badge bg-secondary text-white"
                style={{ backgroundColor: t.color ?? "#6c757d", marginRight: 2 }}
              >
                {typeof t === "object" ? t.name : t}
              </span>
            ))}
          </div>
        ),
      },
      {
        name: "Action",
        width: "140px",
        cell: (row) => (
          <div className="btn-group btn-group-sm">
            {canEdit("leads") && (
              <button className="btn btn-outline-primary" onClick={() => openEdit(row)}>
                <i className="fas fa-edit"></i>
              </button>
            )}
            {canDelete("leads") && (
              <button className="btn btn-outline-danger" onClick={() => remove(row)}>
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        ),
      },
    ],
    [remove]
  );

  if (!canViewPage) {
    return (
      <div className="p-4">
        <Card className="border" style={{ borderColor: "#e2e8f0" }}>
          <Card.Body className="text-center py-5">
            <div className="text-secondary">Access denied</div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Leads (Extended)</h4>
          <div className="text-secondary small">All fields enabled</div>
        </div>
        {canCreate("leads") && (
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="fas fa-plus me-1"></i> New Lead
          </button>
        )}
      </div>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <input
              className="form-control form-control-sm"
              style={{ maxWidth: 260 }}
              placeholder="Search name/phone/email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <DataTable
          className="modern-datatable"
            columns={columns}
            data={rows}
            progressPending={loading}
          progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
persistTableHead
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={table.perPage}
            onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
            onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
            striped
            highlightOnHover
            dense
            keyField="id"
          noDataComponent={
            <div className="p-5 text-center">
              <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
              <div className="fw-semibold text-secondary mb-1">No data found</div>
              <div className="small text-muted">Try adjusting your filters or check back later</div>
            </div>
          }
          />
      </Card>

      <Modal show={show} onHide={() => setShow(false)} backdrop="static" centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{form.editId ? "Edit" : "Create"} Lead (Extended)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <div className="small text-secondary mb-2">
              <span className="fw-semibold">Type</span> <span className="text-danger">*</span>
            </div>
            <div className="d-flex gap-4">
              <Form.Check
                type="radio"
                id="lead-type-business"
                label="Business"
                checked={form.lead_type === "business"}
                onChange={() => setForm({ ...form, lead_type: "business" })}
              />
              <Form.Check
                type="radio"
                id="lead-type-individual"
                label="Individual"
                checked={form.lead_type === "individual"}
                onChange={() => setForm({ ...form, lead_type: "individual" })}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Form.Group>
            </div>

            <div className="col-12 col-md-6">
              <div className="row g-2">
                <div className="col-5">
                  <Form.Group className="mb-3">
                    <Form.Label>Code <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={form.phone_code}
                      onChange={(e) => setForm({ ...form, phone_code: e.target.value })}
                    >
                      <option value="+91 IN">+91 IN</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-7">
                  <Form.Group className="mb-3">
                    <Form.Label>Phone no <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      placeholder="Phone no"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Stage <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  {(leadStages.length ? leadStages : [{ id: 0, name: 'New Lead' }]).map((s) => (
                    <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Assigned To</Form.Label>
                <Form.Select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                  <option value="">Choose</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Category</Form.Label>
                <Form.Select value={form.lead_category_id} onChange={(e) => setForm({ ...form, lead_category_id: e.target.value, lead_subcategory_id: "" })}>
                  <option value="">Choose</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Lead Source</Form.Label>
                <Form.Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="">Choose</option>
                  {leadSources.map((s) => (
                    <option key={s.id ?? s.name} value={s.name}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            {form.source === "Other" && (
              <div className="col-12 col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Source (Other)</Form.Label>
                  <Form.Control
                    placeholder="Specify source"
                    value={form.source_other}
                    onChange={(e) => setForm({ ...form, source_other: e.target.value })}
                  />
                </Form.Group>
              </div>
            )}
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Form.Group>

          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="fw-semibold text-secondary">Advance Options</div>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => setShowAdvance(!showAdvance)}
              style={{ textDecoration: "none" }}
            >
              {showAdvance ? "Click to hide" : "Click to show"}
            </button>
          </div>

          {showAdvance && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Form.Group>

              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Pincode</Form.Label>
                    <Form.Control
                      placeholder="Pincode"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                      <option value="India">India</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Select
                      value={form.state_id}
                      onChange={(e) => setForm({ ...form, state_id: e.target.value, city_id: "" })}
                    >
                      <option value="">Choose</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Select
                      value={form.city_id}
                      onChange={(e) => setForm({ ...form, city_id: e.target.value })}
                      disabled={!form.state_id}
                    >
                      <option value="">Choose</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>GSTIN (TAX No.)</Form.Label>
                    <Form.Control
                      placeholder="GSTIN (TAX No.)"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Assigned To</Form.Label>
                    <Form.Select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                      <option value="">Choose</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Close Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.expected_close_date}
                      onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Follow Up Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.follow_up_date}
                      onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Value</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={form.expected_value}
                      onChange={(e) => setForm({ ...form, expected_value: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              {form.lead_type === "business" && (
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Company Name</Form.Label>
                      <Form.Control
                        placeholder="Company Name"
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12 col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Industry</Form.Label>
                      <Form.Control
                        placeholder="Industry"
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12 col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Company Size</Form.Label>
                      <Form.Select value={form.company_size} onChange={(e) => setForm({ ...form, company_size: e.target.value })}>
                        <option value="">Choose</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <Form.Select
                  multiple
                  value={form.tags}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => ({
                      id: o.value,
                      name: o.label,
                      color: o.dataset.color || "#6c757d",
                    }));
                    setForm({ ...form, tags: selected });
                  }}
                >
                  {tags.map((t) => (
                    <option key={t.id} value={t.id} data-color={t.color}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Internal notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-light" onClick={() => setShow(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
