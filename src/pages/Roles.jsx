import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canEdit, canDelete, hasPermission } from "../utils/permissions";

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

export default function Roles() {
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

  const [permissions, setPermissions] = useState([]);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", guard_name: "web", permissions: [] });
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
    setLoading(true);
    try {
      const rolesRes = await api.get("/roles", {
        params: {
          page: table.page,
          perPage: table.perPage,
          search: table.search,
          sortField: table.sortField,
          sortDir: table.sortDir,
        },
        signal,
      });

      setRows(rolesRes.data.data || []);
      setTotal(rolesRes.data.total || 0);

      if (hasPermission("permissions-view")) {
        try {
          const permRes = await api.get("/permissions", {
            params: {
              page: 1,
              perPage: 5000,
              sortField: "id",
              sortDir: "asc",
            },
            signal,
          });
          setPermissions(permRes.data.data || []);
        } catch (e) {
          const status = e?.response?.status;
          if (status === 403) {
            setPermissions([]);
          } else {
            throw e;
          }
        }
      } else {
        setPermissions([]);
      }
    } catch {
      setRows([]);
      setTotal(0);
      setPermissions([]);
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
    setForm({ name: "", guard_name: "web", permissions: [] });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      guard_name: row.guard_name || "web",
      permissions: row.permissions?.map(p => p.id) || []
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.name) { toast.warning("Role name required"); return; }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/roles/${editingId}`, form);
        toast.success("Role updated");
      } else {
        await api.post("/roles", form);
        toast.success("Role created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = (row) => {
    Swal.fire({
      title: "Delete role?",
      text: `Role: ${row.name}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/roles/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Role deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const togglePermission = (permId) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(permId)
        ? f.permissions.filter(id => id !== permId)
        : [...f.permissions, permId]
    }));
  };

  // Friendly labels and icons for permissions
  const getPermissionMeta = (permName) => {
    const action = permName.split('-').pop();
    const meta = {
      view: { label: 'View', icon: 'fa-eye', color: 'info', bg: '#e3f2fd' },
      create: { label: 'Create', icon: 'fa-plus', color: 'success', bg: '#e8f5e9' },
      edit: { label: 'Edit', icon: 'fa-edit', color: 'warning', bg: '#fff3e0' },
      delete: { label: 'Delete', icon: 'fa-trash', color: 'danger', bg: '#ffebee' },
    };
    return meta[action] || { label: action, icon: 'fa-check', color: 'secondary', bg: '#f5f5f5' };
  };

  // Group permissions by prefix
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach(p => {
      const parts = p.name.split('-');
      const group = parts[0] || 'general';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return groups;
  }, [permissions]);

  const columns = useMemo(() => [
    { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
    { name: "Name", selector: r => r.name, sortable: true, sortField: "name" },
    { name: "Guard", selector: r => r.guard_name, width: "100px" },
    { name: "Permissions", cell: row => (
      <div className="d-flex flex-wrap gap-1">
        {row.permissions?.slice(0, 3).map(p => (
          <Badge key={p.id} bg="info" className="text-capitalize">{p.name}</Badge>
        ))}
        {row.permissions?.length > 3 && (
          <Badge bg="secondary">+{row.permissions.length - 3}</Badge>
        )}
      </div>
    )},
    {
      name: "Action", width: "120px",
      cell: row => (
        <div className="btn-group btn-group-sm">
          {canEdit('roles') && (
            <button className="btn btn-outline-primary" onClick={() => openEdit(row)}><i className="fas fa-edit"></i></button>
          )}
          {canDelete('roles') && (
            <button className="btn btn-outline-danger" onClick={() => deleteRole(row)}><i className="fas fa-trash"></i></button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Roles Management</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search roles..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              {canCreate('roles') && (
                <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> New Role</button>
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
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Edit Role' : 'New Role'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Role Name <span className="text-danger">*</span></Form.Label>
            <Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Admin, Manager" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Guard Name</Form.Label>
            <Form.Select value={form.guard_name} onChange={e => setForm(f => ({ ...f, guard_name: e.target.value }))}>
              <option value="web">web</option>
              <option value="api">api</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-bold">Permissions</Form.Label>
            <div className="bg-light p-3 rounded border" style={{ maxHeight: 400, overflow: 'auto' }}>
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                    <span className="text-primary fw-bold text-capitalize fs-6">
                      <i className={`fas fa-folder me-2`}></i>
                      {group.replace(/-/g, ' ')}
                    </span>
                    <Badge bg="secondary" className="ms-auto">{perms.length} permissions</Badge>
                  </div>
                  <div className="row g-2">
                    {perms.map(p => {
                      const meta = getPermissionMeta(p.name);
                      const isChecked = form.permissions.includes(p.id);
                      return (
                        <div key={p.id} className="col-md-3 col-sm-6">
                          <div 
                            className={`p-2 rounded border cursor-pointer transition ${isChecked ? 'border-primary shadow-sm' : 'border-light'}`}
                            style={{ 
                              cursor: 'pointer', 
                              backgroundColor: isChecked ? meta.bg : '#fff',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => togglePermission(p.id)}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className={`d-flex align-items-center justify-content-center rounded`}
                                style={{ 
                                  width: 32, 
                                  height: 32, 
                                  backgroundColor: isChecked ? '#fff' : meta.bg,
                                  border: `2px solid ${isChecked ? '#0d6efd' : 'transparent'}`
                                }}
                              >
                                <i className={`fas ${meta.icon} text-${meta.color}`}></i>
                              </div>
                              <span className={`fw-medium ${isChecked ? 'text-primary' : 'text-dark'}`}>
                                {meta.label}
                              </span>
                              {isChecked && <i className="fas fa-check-circle text-primary ms-auto"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} {editingId ? 'Update Role' : 'Save Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
