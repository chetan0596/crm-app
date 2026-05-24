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

const ACTION_META = {
  view:   { label: "View",   color: "info",      icon: "fa-eye" },
  create: { label: "Create", color: "success",   icon: "fa-plus" },
  edit:   { label: "Edit",   color: "warning",   icon: "fa-edit" },
  delete: { label: "Delete", color: "danger",    icon: "fa-trash" },
};

const getActionMeta = (permName) => {
  const action = permName.split("-").pop();
  return ACTION_META[action] || { label: action, color: "secondary", icon: "fa-check" };
};

const getScopeLabel = (permName) => {
  const parts = permName.split("-");
  const action = parts.pop();
  if (ACTION_META[action]) {
    if (parts[0] === "lead") parts.shift();
    if (parts[0] === "leads") parts.shift();
    return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Leads";
  }
  return parts.join("-").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

  // Group permissions by prefix and sort by action priority
  const groupedPermissions = useMemo(() => {
    const groups = {};
    const order = ["view", "create", "edit", "delete"];
    permissions.forEach(p => {
      const parts = p.name.split('-');
      const group = parts[0] || 'general';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    Object.keys(groups).forEach((g) => {
      groups[g].sort((a, b) => {
        const ai = order.indexOf(a.name.split("-").pop());
        const bi = order.indexOf(b.name.split("-").pop());
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    });
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
  }, [permissions]);

  const toggleGroup = (groupPerms, allChecked) => {
    setForm(f => {
      const next = new Set(f.permissions);
      groupPerms.forEach((p) => (allChecked ? next.delete(p.id) : next.add(p.id)));
      return { ...f, permissions: Array.from(next) };
    });
  };

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
          className="modern-datatable"
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          sortServer onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
          progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
          noDataComponent={
            <div className="p-5 text-center">
              <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
              <div className="fw-semibold text-secondary mb-1">No data found</div>
              <div className="small text-muted">Try adjusting your filters or check back later</div>
            </div>
          }
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
            <div className="p-0" style={{ maxHeight: 420, overflow: 'auto' }}>
              {Object.entries(groupedPermissions).map(([group, perms]) => {
                const selectedCount = perms.filter((p) => form.permissions.includes(p.id)).length;
                const allChecked = perms.every((p) => form.permissions.includes(p.id));
                const someChecked = perms.some((p) => form.permissions.includes(p.id));
                return (
                  <div key={group} className="mb-3" style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    {/* Module Header */}
                    <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 28, height: 28, background: "#e0e7ff", color: "#4f46e5", fontSize: 12 }}>
                        <i className="fas fa-layer-group" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold small" style={{ color: "#1e293b", textTransform: "capitalize" }}>
                            {group.replace(/-/g, " ")}
                          </span>
                          <Badge bg="light" text="dark" className="border fw-medium small">
                            {selectedCount} / {perms.length}
                          </Badge>
                        </div>
                        <div className="progress mt-1" style={{ height: 3, maxWidth: 160 }}>
                          <div className="progress-bar bg-primary" style={{ width: `${perms.length ? (selectedCount / perms.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div
                        className="flex-shrink-0 d-flex align-items-center justify-content-center"
                        onClick={() => toggleGroup(perms, allChecked)}
                        title={allChecked ? "Uncheck all" : "Check all"}
                        style={{ cursor: "pointer", width: 20, height: 20 }}
                      >
                        {allChecked ? (
                          <i className="fas fa-check-square text-primary" style={{ fontSize: 18 }}></i>
                        ) : someChecked ? (
                          <i className="fas fa-minus-square text-primary" style={{ fontSize: 18 }}></i>
                        ) : (
                          <i className="far fa-square text-muted" style={{ fontSize: 18 }}></i>
                        )}
                      </div>
                    </div>
                    {/* Permission Chips */}
                    <div className="p-3">
                      <div className="row g-2">
                        {perms.map((p) => {
                          const checked = form.permissions.includes(p.id);
                          const meta = getActionMeta(p.name);
                          return (
                            <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                              <div
                                className="d-flex align-items-center gap-2 p-2 rounded border"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: checked ? "#eff6ff" : "#fff",
                                  borderColor: checked ? "#3b82f6" : "#e2e8f0",
                                  transition: "all 0.15s ease",
                                  minHeight: 44,
                                }}
                                onClick={() => togglePermission(p.id)}
                                role="button"
                              >
                                <div className="flex-shrink-0" style={{ width: 16, textAlign: "center" }}>
                                  {checked ? (
                                    <i className="fas fa-check-square text-primary" style={{ fontSize: 14 }}></i>
                                  ) : (
                                    <i className="far fa-square text-muted" style={{ fontSize: 14 }}></i>
                                  )}
                                </div>
                                <div
                                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    backgroundColor: checked ? "#fff" : `#${meta.color === "info" ? "e0f2fe" : meta.color === "success" ? "dcfce7" : meta.color === "warning" ? "fef3c7" : meta.color === "danger" ? "fee2e2" : "f1f5f9"}`,
                                    color: `#${meta.color === "info" ? "0284c7" : meta.color === "success" ? "16a34a" : meta.color === "warning" ? "d97706" : meta.color === "danger" ? "dc2626" : "64748b"}`,
                                    fontSize: 11,
                                  }}
                                >
                                  <i className={`fas ${meta.icon}`} />
                                </div>
                                <span className="small fw-medium text-truncate flex-grow-1" title={p.name} style={{ color: checked ? "#1e40af" : "#334155", fontSize: "0.8rem" }}>
                                  <span style={{ color: "#94a3b8" }}>{getScopeLabel(p.name)}</span>
                                  <span className="mx-1" style={{ color: "#cbd5e1" }}>·</span>
                                  {meta.label}
                                </span>
                                {checked && <i className="fas fa-check-circle text-primary ms-auto flex-shrink-0" style={{ fontSize: 14 }}></i>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} {editingId ? 'Update Role' : 'Save Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
