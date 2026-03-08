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

export default function City() {

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

  const [states, setStates] = useState([]);

  const [searchInput, setSearchInput] = useState(initialTable.search);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('city-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: true,
      name: true,
      state: true,
      pincode: true,
      status: true,
      action: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('city-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);

  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState(true);
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
      const r = await api.get("/cities", {
        params: {
          ...table,
          with: 'state'
        },
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

      const statesRes = await api.get("/states", {
        params: { perPage: 1000 },
        signal,
      });
      setStates(Array.isArray(statesRes.data?.data) ? statesRes.data.data : []);
    } catch {
      setServerMode(false);
      setRawRows([]);
      setRows([]);
      setTotal(0);
      setStates([]);
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
    setStateId("");
    setPincode("");
    setStatus(true);
    setErr("");
    setShow(true);
  };

  const openEdit = (r)=>{
    setEdit(r);
    setName(r.name);
    setStateId(r.state_id);
    setPincode(r.pincode || "");
    setStatus(r.status === 1 || r.status === true);
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

    if (!stateId) {
      toast.warning("State required");
      setErr("State required");
      return;
    }

    try {

      setSaving(true);
      setErr("");

      if (edit) {
        await api.put(`/cities/${edit.id}`, {
          name,
          state_id: stateId,
          pincode: pincode.trim() || null,
          status: status ? 1 : 0
        });
      } else {
        await api.post(`/cities`, {
          name,
          state_id: stateId,
          pincode: pincode.trim() || null,
          status: status ? 1 : 0
        });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("City saved successfully");

    } catch(e) {

      const msg = e.response?.data?.errors?.name?.[0] ?? 
                  e.response?.data?.errors?.state_id?.[0] ?? 
                  e.response?.data?.message ??
                  "Save failed";
      toast.error(msg);
      setErr(msg);

    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================

  const del = (r) => {
    Swal.fire({
      title: "Delete city?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await api.delete(`/cities/${r.id}`);
        setReloadKey(k => k + 1);
        toast.success("City deleted");
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
      visibleCols.state && {
        name: "State",
        selector: r => r.state?.name,
        sortable: true,
        sortField: "state.name",
      },
      visibleCols.pincode && {
        name: "Pincode",
        selector: r => r.pincode || "-",
        sortable: true,
        sortField: "pincode",
        width: "120px",
      },
      visibleCols.status && {
        name: "Status",
        selector: r => (
          <span className={`badge ${r.status ? 'bg-success' : 'bg-secondary'}`}>
            {r.status ? 'Active' : 'Inactive'}
          </span>
        ),
        sortable: true,
        sortField: "status",
        width: "100px",
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
            <h3 className="card-title">Cities</h3>
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
            <Dropdown.Toggle variant="outline-secondary" size="sm" id="citycol-toggle">
              <i className="fas fa-columns me-1"></i>
              {[
                visibleCols.id && 'ID',
                visibleCols.name && 'Name',
                visibleCols.state && 'State',
                visibleCols.pincode && 'Pincode',
                visibleCols.status && 'Status'
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
                active={visibleCols.state}
                onClick={() => setVisibleCols(v => ({ ...v, state: !v.state }))}
              >
                <i className={`fas ${visibleCols.state ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                State
              </Dropdown.Item>
              <Dropdown.Item
                active={visibleCols.pincode}
                onClick={() => setVisibleCols(v => ({ ...v, pincode: !v.pincode }))}
              >
                <i className={`fas ${visibleCols.pincode ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                Pincode
              </Dropdown.Item>
              <Dropdown.Item
                active={visibleCols.status}
                onClick={() => setVisibleCols(v => ({ ...v, status: !v.status }))}
              >
                <i className={`fas ${visibleCols.status ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                Status
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable
          keyField="id"
          columns={cols}
          data={rows}
          progressPending={loading}
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
        />
      </div>


      {/* ================= MODAL ================= */}

      <Modal show={show} onHide={() => setShow(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {edit?"Edit":"Add"} City
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Label>State</Form.Label>
          <Form.Select
            value={stateId}
            onChange={e=>setStateId(e.target.value)}
          >
            <option value="">Select State</option>
            {states.map(s=>(
              <option key={s.id} value={s.id}>
                {s.name}
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

          <Form.Label className="mt-2">
            Pincode
          </Form.Label>

          <Form.Control
            value={pincode}
            onChange={e=>setPincode(e.target.value)}
            placeholder="Enter pincode (optional)"
          />

          <Form.Check
            type="switch"
            id="city-status-switch"
            label="Active"
            checked={status}
            onChange={e=>setStatus(e.target.checked)}
            className="mt-3"
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
