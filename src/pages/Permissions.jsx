import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Badge, Row, Col } from "react-bootstrap";
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

export default function Permissions() {
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
  const [form, setForm] = useState({ name: "", guard_name: "web" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      const res = await api.get("/permissions", { params: table, signal });
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
    setEditingId(null);
    setForm({ name: "", guard_name: "web" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, guard_name: row.guard_name || "web" });
    setShow(true);
  };

  const save = async () => {
    if (!form.name) { toast.warning("Permission name required"); return; }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/permissions/${editingId}`, form);
        toast.success("Permission updated");
      } else {
        await api.post("/permissions", form);
        toast.success("Permission created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePermission = (row) => {
    Swal.fire({
      title: "Delete permission?",
      text: `Permission: ${row.name}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/permissions/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Permission deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  // Group permissions
  const groupedPermissions = useMemo(() => {
    const groups = {};
    rows.forEach(p => {
      const parts = p.name.split('-');
      const group = parts[0] || 'general';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return groups;
  }, [rows]);

  const columns = useMemo(() => [
    { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
    { name: "Name", selector: r => r.name, sortable: true, sortField: "name" },
    { name: "Guard", selector: r => r.guard_name, width: "100px" },
    { name: "Group", cell: row => {
      const group = row.name.split('-')[0] || 'general';
      return <Badge bg="secondary" className="text-capitalize">{group}</Badge>;
    }, width: "120px" },
    {
      name: "Action", width: "120px",
      cell: row => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-primary" onClick={() => openEdit(row)}><i className="fas fa-edit"></i></button>
          <button className="btn btn-outline-danger" onClick={() => deletePermission(row)}><i className="fas fa-trash"></i></button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Permissions Management</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search permissions..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> New Permission</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Permission Groups Summary */}
        <Row className="mb-3">
          {Object.entries(groupedPermissions).map(([group, perms]) => (
            <Col key={group} md={3} className="mb-2">
              <div className="bg-light p-2 rounded border text-center">
                <h6 className="text-primary text-capitalize mb-1">{group}</h6>
                <Badge bg="info">{perms.length} permissions</Badge>
              </div>
            </Col>
          ))}
        </Row>

        <DataTable columns={columns} data={rows} progressPending={loading} persistTableHead
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          sortServer onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
          striped highlightOnHover dense keyField="id" />
      </div>

      {/* Add/Edit Modal */}
      <Modal show={show} onHide={() => setShow(false)} backdrop="static">
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Edit Permission' : 'New Permission'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Permission Name <span className="text-danger">*</span></Form.Label>
            <Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., users-create, items-edit" />
            <Form.Text className="text-muted">Use format: module-action (e.g., users-create, sales-view)</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Guard Name</Form.Label>
            <Form.Select value={form.guard_name} onChange={e => setForm(f => ({ ...f, guard_name: e.target.value }))}>
              <option value="web">web</option>
              <option value="api">api</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} {editingId ? 'Update Permission' : 'Save Permission'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
