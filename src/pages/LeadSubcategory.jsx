import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
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

export default function LeadSubcategory() {

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
  const [serverMode, setServerMode] = useState(false);

  const [cats, setCats] = useState([]);

  const [searchInput, setSearchInput] = useState(initialTable.search);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('subcategory-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: true,
      name: true,
      category: true,
      action: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('subcategory-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);

  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // ================= LOAD =================

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
    try {
      setLoading(true);
      const r = await api.get("/lead-subcategories", {
        params: table,
        signal,
      });

      const payload = r.data;

      if (payload && Array.isArray(payload.data)) {
        setServerMode(true);
        setRows(payload.data);
        setTotal(Number(payload.total) || 0);
        setRawRows([]);
      } else if (payload && Array.isArray(payload.data?.data)) {
        setServerMode(true);
        setRows(payload.data.data);
        setTotal(Number(payload.data.total) || 0);
        setRawRows([]);
      } else if (Array.isArray(payload?.data)) {
        setServerMode(false);
        setRawRows(payload.data);
      } else if (Array.isArray(payload)) {
        setServerMode(false);
        setRawRows(payload);
      } else {
        setServerMode(false);
        setRawRows([]);
      }

      const catsRes = await api.get("/lead-categories", {
        params: { perPage: 1000 },
        signal,
      });
      setCats(Array.isArray(catsRes.data?.data) ? catsRes.data.data : []);
    } catch {
      setServerMode(false);
      setRawRows([]);
      setRows([]);
      setTotal(0);
      setCats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [reloadKey, table]);

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

  // ================= MODAL =================

  const openAdd = ()=>{
    setEdit(null);
    setName("");
    setCatId("");
    setErr("");
    setShow(true);
  };

  const openEdit = (r)=>{
    setEdit(r);
    setName(r.name);
    setCatId(r.category_id);
    setErr("");
    setShow(true);
  };

  // ================= SAVE =================

  const save = async () => {

    if (!name.trim()) {
      toast.warning("Name required");
      setErr("Name required");
      return;
    }

    if (!catId) {
      toast.warning("Category required");
      setErr("Category required");
      return;
    }

    try {

      setSaving(true);
      setErr("");

      if (edit) {
        await api.put(`/lead-subcategories/${edit.id}`, {
          name,
          category_id: catId
        });
      } else {
        await api.post(`/lead-subcategories`, {
          name,
          category_id: catId
        });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("Subcategory saved successfully");

    } catch(e) {

      const msg = e.response?.data?.errors?.name?.[0] ?? "Save failed";
      toast.error(msg);
      setErr(msg);

    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================

  const del = (r) => {
    Swal.fire({
      title: "Delete subcategory?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await api.delete(`/lead-subcategories/${r.id}`);
        setReloadKey(k => k + 1);
        toast.success("Subcategory deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  // ================= TABLE =================

  const cols = useMemo(() => {
    const all = [
      visibleCols.id && {
        name: "ID",
        selector: r => r.id,
        sortable: true,
        sortField: "id",
        width: "100px",
      },
      visibleCols.name && {
        name: "Name",
        selector: r => r.name,
        sortable: true,
        sortField: "name",
      },
      visibleCols.category && {
        name: "Category",
        selector: r => r.category?.name,
      },
      visibleCols.action && {
        name: "Action",
        width: "140px",
        cell: r => (
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-primary"
              onClick={() => openEdit(r)}
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={() => del(r)}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ),
      },
    ];

    return all.filter(Boolean);
  }, [visibleCols]);

  // ================= UI =================

  return (
    <div className="card card-outline card-primary">

      <div className="card-header">
        <div className="row g-2 align-items-center">

          <div className="col-12 col-md-6">
            <h3 className="card-title">Subcategories</h3>
          </div>

          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 220 }}
                placeholder="Search..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />

              <button
                className="btn btn-primary btn-sm"
                onClick={openAdd}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 border-bottom bg-light">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted small fw-bold">Show columns:</span>

          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm" id="subcol-toggle">
              <i className="fas fa-columns me-1"></i>
              {[
                visibleCols.id && 'ID',
                visibleCols.name && 'Name',
                visibleCols.category && 'Category'
              ].filter(Boolean).join(', ') || 'None'}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item
                active={visibleCols.id}
                onClick={() => setVisibleCols(v => ({ ...v, id: !v.id }))}
              >
                <i className={`fas ${visibleCols.id ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                ID
              </Dropdown.Item>
              <Dropdown.Item
                active={visibleCols.name}
                onClick={() => setVisibleCols(v => ({ ...v, name: !v.name }))}
              >
                <i className={`fas ${visibleCols.name ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                Name
              </Dropdown.Item>
              <Dropdown.Item
                active={visibleCols.category}
                onClick={() => setVisibleCols(v => ({ ...v, category: !v.category }))}
              >
                <i className={`fas ${visibleCols.category ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                Category
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable keyField="id"
          className="modern-datatable"
          columns={cols}
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

      {/* ================= MODAL ================= */}

      <Modal show={show} onHide={() => setShow(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {edit?"Edit":"Add"} Subcategory
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form.Label>Category</Form.Label>
          <Form.Select
            value={catId}
            onChange={e=>setCatId(e.target.value)}
          >
            <option value="">Select Category</option>
            {cats.map(c=>(
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>

          <Form.Label className="mt-2">
            Name
          </Form.Label>

          <Form.Control
            value={name}
            onChange={e=>setName(e.target.value)}
          />

          {err && (
            <div className="text-danger mt-2">
              {err}
            </div>
          )}

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={()=>setShow(false)}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={save}
            disabled={saving}
          >
            {saving && (
              <span className="spinner-border spinner-border-sm me-2"/>
            )}
            Save
          </Button>

        </Modal.Footer>
      </Modal>

    </div>
  );
}
