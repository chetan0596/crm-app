import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useReducer, useState } from "react";
import DataTable from "react-data-table-component";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
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

export default function LeadSubcategoryPage() {

  const { id } = useParams();

  const [params, setParams] = useSearchParams();

  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 25),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };

  const [table, dispatch] = useReducer(tableReducer, initialTable);

  const [rawRows, setRawRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [serverMode, setServerMode] = useState(false);

  const [visibleCols, setVisibleCols] = useState({
    id: true,
    name: true,
    action: true,
  });

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page,
      perPage: table.perPage,
      search: table.search,
      sort: table.sortField,
      dir: table.sortDir,
    });

    if (newParams.toString() !== params.toString()) {
      setParams(newParams);
    }
  }, [params, setParams, table]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) {
        dispatch({ type: "SEARCH", search: s });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = async (signal) => {
    if (!id) {
      setRawRows([]);
      setRows([]);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      const r = await api.get(`/lead-subcategories/${id}`, {
        params: table,
        signal,
      });

      const payload = r.data;

      if (payload && Array.isArray(payload.data)) {
        setServerMode(true);
        setRows(payload.data);
        setTotal(Number(payload.total) || 0);
        setRawRows([]);
      } else if (Array.isArray(payload)) {
        setServerMode(false);
        setRawRows(payload);
      } else {
        setServerMode(false);
        setRawRows([]);
      }
    } catch {
      setServerMode(false);
      setRawRows([]);
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
  }, [id, reloadKey, table]);

  const clientRows = useMemo(() => {
    if (serverMode) return [];

    let data = rawRows;

    const q = table.search.trim().toLowerCase();
    if (q) {
      data = data.filter(r => (r?.name ?? "").toLowerCase().includes(q));
    }

    const dir = table.sortDir === "asc" ? 1 : -1;
    const field = table.sortField;

    const sorted = [...data].sort((a, b) => {
      const av = a?.[field];
      const bv = b?.[field];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }

      return String(av).localeCompare(String(bv)) * dir;
    });

    const start = (table.page - 1) * table.perPage;
    const end = start + table.perPage;
    return sorted.slice(start, end);
  }, [rawRows, serverMode, table.page, table.perPage, table.search, table.sortDir, table.sortField]);

  useEffect(() => {
    if (serverMode) return;

    const q = table.search.trim().toLowerCase();
    const filtered = q
      ? rawRows.filter(r => (r?.name ?? "").toLowerCase().includes(q))
      : rawRows;

    setTotal(filtered.length);
    setRows(clientRows);
  }, [clientRows, rawRows, serverMode, table.search]);

  const openAdd = () => {
    setEditRow(null);
    setName("");
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setName(row?.name ?? "");
    setShow(true);
  };

  const save = async () => {
    if (!id) return;

    const nm = name.trim();
    if (!nm) {
      toast.warning("Subcategory name required");
      return;
    }

    try {
      setSaving(true);

      if (editRow?.id) {
        await api.put(`/lead-subcategories/${editRow.id}`, {
          name: nm,
          category_id: id,
        });
      } else {
        await api.post("/lead-subcategories", {
          name: nm,
          category_id: id,
        });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("Subcategory saved successfully");
    } catch (e) {
      toast.error(e.response?.data?.errors?.name?.[0] ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    Swal.fire({
      title: "Delete subcategory?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/lead-subcategories/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Subcategory deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  const columns = useMemo(() => {
    const all = [
      visibleCols.id && {
        name: "ID",
        selector: r => r.id,
        sortable: true,
        sortField: "id",
        width: "100px",
      },
      visibleCols.name && {
        name: "Subcategory Name",
        selector: r => r.name,
        sortable: true,
        sortField: "name",
      },
      visibleCols.action && {
        name: "Action",
        width: "140px",
        cell: row => (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-primary" onClick={() => openEdit(row)}>
              <i className="fas fa-edit"></i>
            </button>
            <button className="btn btn-outline-danger" onClick={() => remove(row)}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ),
      },
    ];

    return all.filter(Boolean);
  }, [visibleCols]);

  return (
    <>
      <div className="card card-outline card-primary">
        <div className="card-header">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <h3 className="card-title">Subcategories — Category #{id ?? "-"}</h3>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex gap-2 flex-wrap justify-content-md-end">
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 220 }}
                  placeholder="Search..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  disabled={!id}
                />

                <button
                  className="btn btn-primary btn-sm"
                  onClick={openAdd}
                  disabled={!id}
                >
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 border-bottom">
          <label className="me-3">
            <input
              type="checkbox"
              checked={visibleCols.id}
              onChange={() => setVisibleCols(v => ({ ...v, id: !v.id }))}
            /> ID
          </label>

          <label className="me-3">
            <input
              type="checkbox"
              checked={visibleCols.name}
              onChange={() => setVisibleCols(v => ({ ...v, name: !v.name }))}
            /> Name
          </label>
        </div>

        <div className="card-body p-0">
          <DataTable keyField="id"
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
            onChangePage={(p) => {
              if (p !== table.page) {
                dispatch({ type: "PAGE", page: p });
              }
            }}
            onChangeRowsPerPage={(n) => {
              if (n !== table.perPage) {
                dispatch({ type: "PER_PAGE", perPage: n });
              }
            }}
            sortServer
            onSort={(col, dir) => {
              if (col.sortField) {
                dispatch({ type: "SORT", field: col.sortField, dir });
              }
            }}
            striped
            highlightOnHover
            dense
          noDataComponent={
            <div className="p-5 text-center">
              <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
              <div className="fw-semibold text-secondary mb-1">No data found</div>
              <div className="small text-muted">Try adjusting your filters or check back later</div>
            </div>
          }
          />
        </div>
      </div>

      <Modal show={show} onHide={() => setShow(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editRow ? "Edit Subcategory" : "Add Subcategory"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Label>Name</Form.Label>
          <Form.Control value={name} onChange={e => setName(e.target.value)} />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving || !id}>
            {saving && (
              <span className="spinner-border spinner-border-sm me-2"></span>
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
