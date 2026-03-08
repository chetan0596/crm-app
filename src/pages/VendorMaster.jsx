import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Dropdown, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";

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

export default function VendorMaster() {
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

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('vendor-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { id: true, name: true, email: true, phone: true, gst: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('vendor-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", gst_number: "",
    address: "", city: "", state: "", pincode: ""
  });
  const [saving, setSaving] = useState(false);

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
    try {
      setLoading(true);
      const res = await api.get("/vendors", { params: table, signal });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [table, reloadKey]);

  const openAdd = () => {
    setEditRow(null);
    setForm({ name: "", email: "", phone: "", gst_number: "", address: "", city: "", state: "", pincode: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      name: row.name || "", email: row.email || "", phone: row.phone || "",
      gst_number: row.gst_number || "", address: row.address || "",
      city: row.city || "", state: row.state || "", pincode: row.pincode || ""
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Vendor name required");
      return;
    }
    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/vendors/${editRow.id}`, form);
      } else {
        await api.post("/vendors", form);
      }
      setShow(false);
      setReloadKey(k => k + 1);
      toast.success(editRow ? "Vendor updated" : "Vendor created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    Swal.fire({
      title: "Delete vendor?",
      text: `Remove "${row.name}"?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/vendors/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Vendor deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const columns = useMemo(() => {
    const all = [
      visibleCols.id && { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
      visibleCols.name && { name: "Vendor Name", selector: r => r.name, sortable: true, sortField: "name" },
      visibleCols.email && { name: "Email", selector: r => r.email, sortable: true, sortField: "email", width: "180px" },
      visibleCols.phone && { name: "Phone", selector: r => r.phone, sortable: true, sortField: "phone", width: "130px" },
      visibleCols.gst && { name: "GST", selector: r => r.gst_number, sortable: true, sortField: "gst_number", width: "140px" },
      visibleCols.action && {
        name: "Action", width: "120px",
        cell: row => (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-primary" onClick={() => openEdit(row)}><i className="fas fa-edit"></i></button>
            <button className="btn btn-outline-danger" onClick={() => remove(row)}><i className="fas fa-trash"></i></button>
          </div>
        ),
      },
    ];
    return all.filter(Boolean);
  }, [visibleCols]);

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Vendor Master</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search vendors..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> Add Vendor</button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 border-bottom bg-light">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted small fw-bold">Show columns:</span>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <i className="fas fa-columns me-1"></i>
              {[visibleCols.id && 'ID', visibleCols.name && 'Name', visibleCols.email && 'Email', visibleCols.phone && 'Phone', visibleCols.gst && 'GST'].filter(Boolean).join(', ') || 'None'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {['id','name','email','phone','gst'].map(col => (
                <Dropdown.Item key={col} active={visibleCols[col]} onClick={() => setVisibleCols(v => ({ ...v, [col]: !v[col] }))}>
                  <i className={`fas ${visibleCols[col] ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable columns={columns} data={rows} progressPending={loading} persistTableHead
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          sortServer onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
          striped highlightOnHover dense keyField="id" />
      </div>

      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="lg">
        <Modal.Header closeButton><Modal.Title>{editRow ? "Edit Vendor" : "Add Vendor"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control value={form.name} onChange={e => updateField('name', e.target.value)} />
            </Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>GST Number</Form.Label>
              <Form.Control value={form.gst_number} onChange={e => updateField('gst_number', e.target.value)} placeholder="e.g., 22AAAAA0000A1Z5" />
            </Form.Group></Col>
          </Row>
          <Row>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
            </Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={form.phone} onChange={e => updateField('phone', e.target.value)} />
            </Form.Group></Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.address} onChange={e => updateField('address', e.target.value)} />
          </Form.Group>
          <Row>
            <Col md={4}><Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control value={form.city} onChange={e => updateField('city', e.target.value)} />
            </Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3">
              <Form.Label>State</Form.Label>
              <Form.Control value={form.state} onChange={e => updateField('state', e.target.value)} />
            </Form.Group></Col>
            <Col md={4}><Form.Group>
              <Form.Label>Pincode</Form.Label>
              <Form.Control value={form.pincode} onChange={e => updateField('pincode', e.target.value)} />
            </Form.Group></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
