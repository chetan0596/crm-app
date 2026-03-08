import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Badge, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canEdit, canDelete } from "../utils/permissions";

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

export default function Users() {
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

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]); // For reports_to dropdown

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", roles: [], reports_to: "" });
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
      const [usersRes, rolesRes, allUsersRes] = await Promise.all([
        api.get("/users", { params: table, signal }),
        api.get("/roles", { params: { perPage: 1000 }, signal }),
        api.get("/users", { params: { perPage: 1000 }, signal }) // For reports_to dropdown
      ]);
      setRows(usersRes.data.data || []);
      setTotal(usersRes.data.total || 0);
      setRoles(rolesRes.data.data || []);
      setUsers(allUsersRes.data.data || []);
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
    setForm({ name: "", email: "", password: "", roles: [], reports_to: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      email: row.email,
      password: "",
      roles: row.roles?.map(r => r.id) || [],
      reports_to: row.reports_to || ""
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name) { toast.warning("Name required"); return; }
    if (!form.email) { toast.warning("Email required"); return; }
    if (!editingId && !form.password) { toast.warning("Password required"); return; }

    try {
      setSaving(true);
      const data = { ...form };
      if (editingId && !data.password) delete data.password;

      if (editingId) {
        await api.put(`/users/${editingId}`, data);
        toast.success("User updated");
      } else {
        await api.post("/users", data);
        toast.success("User created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (row) => {
    Swal.fire({
      title: "Delete user?",
      text: `User: ${row.name}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/users/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("User deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const toggleRole = (roleId) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(roleId)
        ? f.roles.filter(id => id !== roleId)
        : [...f.roles, roleId]
    }));
  };

  const getRoleMeta = (roleName) => {
    const meta = {
      'Super Admin': { icon: 'fa-crown', color: 'danger', bg: '#ffebee', desc: 'Full access' },
      'Admin': { icon: 'fa-shield-alt', color: 'primary', bg: '#e3f2fd', desc: 'Manage system' },
      'Manager': { icon: 'fa-user-tie', color: 'warning', bg: '#fff3e0', desc: 'Manage operations' },
      'User': { icon: 'fa-user', color: 'info', bg: '#e3f2fd', desc: 'Standard user' },
    };
    return meta[roleName] || { icon: 'fa-user-circle', color: 'secondary', bg: '#f5f5f5', desc: 'Custom role' };
  };

  const columns = useMemo(() => [
    { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
    { name: "Name", selector: r => r.name, sortable: true, sortField: "name" },
    { name: "Email", selector: r => r.email, sortable: true, sortField: "email" },
    { name: "Roles", cell: row => (
      <div className="d-flex flex-wrap gap-1">
        {row.roles?.map(r => (
          <Badge key={r.id} bg="primary">{r.name}</Badge>
        ))}
        {!row.roles?.length && <span className="text-muted">-</span>}
      </div>
    )},
    { name: "Created", selector: r => new Date(r.created_at).toLocaleDateString(), width: "110px" },
    {
      name: "Action", width: "120px",
      cell: row => (
        <div className="btn-group btn-group-sm">
          {canEdit('users') && (
            <button className="btn btn-outline-primary" onClick={() => openEdit(row)}><i className="fas fa-edit"></i></button>
          )}
          {canDelete('users') && (
            <button className="btn btn-outline-danger" onClick={() => deleteUser(row)}><i className="fas fa-trash"></i></button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">User Management</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search users..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              {canCreate('users') && (
                <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> New User</button>
              )}
            </div>
          </div>
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

      {/* Add/Edit Modal */}
      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="lg">
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Edit User' : 'New User'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {/* User Info Section */}
          <div className="bg-light p-3 rounded border mb-3">
            <h6 className="text-primary mb-3 border-bottom pb-2">
              <i className="fas fa-user me-2"></i>User Information
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Full Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control size="sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter full name" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Email Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="email" size="sm" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-0">
              <Form.Label className="fw-bold small">Password {editingId ? <span className="text-muted">(leave blank to keep current)</span> : <span className="text-danger">*</span>}</Form.Label>
              <Form.Control type="password" size="sm" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter password" />
            </Form.Group>
            <Form.Group className="mb-0 mt-3">
              <Form.Label className="fw-bold small">Reports To <span className="text-muted">(Manager/Team Leader)</span></Form.Label>
              <Form.Select size="sm" value={form.reports_to || ""} onChange={e => setForm(f => ({ ...f, reports_to: e.target.value || null }))}>
                <option value="">-- Select Manager --</option>
                {users.filter(u => u.id !== editingId).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Roles Section */}
          <div className="bg-light p-3 rounded border">
            <h6 className="text-primary mb-3 border-bottom pb-2">
              <i className="fas fa-user-shield me-2"></i>Assign Roles
            </h6>
            <Row>
              {roles.map(role => {
                const meta = getRoleMeta(role.name);
                const isChecked = form.roles.includes(role.id);
                return (
                  <Col key={role.id} md={4} className="mb-3">
                    <div
                      className={`p-3 rounded border cursor-pointer transition ${isChecked ? 'border-primary shadow-sm' : 'border-light bg-white'}`}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isChecked ? meta.bg : '#fff',
                        transition: 'all 0.2s',
                        minHeight: '90px'
                      }}
                      onClick={() => toggleRole(role.id)}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: 48,
                            height: 48,
                            backgroundColor: isChecked ? '#fff' : meta.bg,
                            border: `2px solid ${isChecked ? '#0d6efd' : 'transparent'}`
                          }}
                        >
                          <i className={`fas ${meta.icon} text-${meta.color} fa-lg`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className={`fw-bold ${isChecked ? 'text-primary' : 'text-dark'}`}>
                            {role.name}
                          </div>
                          <div className="text-muted small">{meta.desc}</div>
                        </div>
                        {isChecked && <i className="fas fa-check-circle text-primary"></i>}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} {editingId ? 'Update User' : 'Save User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
