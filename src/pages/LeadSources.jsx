import { useEffect, useMemo, useReducer, useState } from "react";
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
    default:
      return state;
  }
}

export default function LeadSources() {
  const canViewPage = canView("leads");

  const [table, dispatch] = useReducer(tableReducer, {
    page: 1,
    perPage: 25,
    search: "",
  });

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "",
    status: true,
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
      const r = await api.get("/lead-sources", {
        params: {
          page: table.page,
          perPage: table.perPage,
          search: table.search,
        },
        signal,
      });

      const data = Array.isArray(r.data?.data) ? r.data.data : [];
      const sorted = [...data].sort((a, b) => {
        const ap = getNum(a?.priority, 0);
        const bp = getNum(b?.priority, 0);
        if (ap !== bp) return ap - bp;
        return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
      });
      setRows(sorted);
      setTotal(Number(r.data?.total) || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const moveRow = async (row, dir) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const targetIdx = idx + (dir === "up" ? -1 : 1);
    if (idx < 0 || targetIdx < 0 || targetIdx >= rows.length) return;

    try {
      const newOrder = [...rows];
      const [moved] = newOrder.splice(idx, 1);
      newOrder.splice(targetIdx, 0, moved);

      await api.post('/lead-sources/reorder', {
        ordered_ids: newOrder.map((r) => r.id),
      });

      toast.success("Priority updated");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Reorder failed");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [reloadKey, table, canViewPage]);

  const openAdd = () => {
    setEdit(null);
    setForm({ name: "", description: "", priority: "", status: true });
    setShow(true);
  };

  const openEdit = (row) => {
    setEdit(row);
    setForm({
      name: row?.name || "",
      description: row?.description || "",
      priority: row?.priority ?? 0,
      status: !!row?.status,
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
        name: form.name.trim(),
        description: form.description || null,
        status: !!form.status,
      };

      if (String(form.priority).trim() !== "") {
        payload.priority = getNum(form.priority, 0);
      }

      if (edit?.id) {
        await api.put(`/lead-sources/${edit.id}`, payload);
        toast.success("Lead Source updated");
      } else {
        await api.post(`/lead-sources`, payload);
        toast.success("Lead Source created");
      }

      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const ok = await Swal.fire({
      title: "Delete Lead Source?",
      text: row?.name || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!ok.isConfirmed) return;

    try {
      await api.delete(`/lead-sources/${row.id}`);
      toast.success("Deleted");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      { name: "ID", selector: (r) => r.id, width: "80px" },
      { name: "Name", selector: (r) => r.name, sortable: true },
      {
        name: "Priority",
        width: "150px",
        cell: (r) => (
          <div className="d-flex align-items-center gap-2">
            <span className="small">{r.priority ?? 0}</span>
            {canEdit("leads") && (
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => moveRow(r, "up")}
                  disabled={rows.findIndex((x) => x.id === r.id) <= 0}
                >
                  <i className="fas fa-arrow-up"></i>
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => moveRow(r, "down")}
                  disabled={(() => {
                    const idx = rows.findIndex((x) => x.id === r.id);
                    return idx < 0 || idx >= rows.length - 1;
                  })()}
                >
                  <i className="fas fa-arrow-down"></i>
                </button>
              </div>
            )}
          </div>
        ),
      },
      {
        name: "Status",
        width: "110px",
        cell: (r) => (
          <span className={`badge ${r.status ? "bg-success" : "bg-secondary"}`}>
            {r.status ? "Active" : "Inactive"}
          </span>
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
    [moveRow, rows]
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
          <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Lead Sources</h4>
          <div className="text-secondary small">Set priority to control dropdown order</div>
        </div>
        {canCreate("leads") && (
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="fas fa-plus me-1"></i> New
          </button>
        )}
      </div>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <input
              className="form-control form-control-sm"
              style={{ maxWidth: 260 }}
              placeholder="Search"
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
        </Card.Body>
      </Card>

      <Modal show={show} onHide={() => setShow(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{edit ? "Edit" : "Create"} Lead Source</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name <span className="text-danger">*</span></Form.Label>
            <Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Form.Group>

          <div className="row g-2">
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Control
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                />
                {!edit && (
                  <div className="small text-secondary mt-1">Leave blank to auto-set priority</div>
                )}
              </Form.Group>
            </div>
            <div className="col-12 col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select value={form.status ? "1" : "0"} onChange={(e) => setForm({ ...form, status: e.target.value === "1" })}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-light" onClick={() => setShow(false)} disabled={saving}>Close</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
