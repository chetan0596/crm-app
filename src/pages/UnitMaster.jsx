import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";

const tableReducer = (state, action) => {
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
};

const getNum = (v, fallback = 1) => {
  const n = parseInt(v, 10);
  return isNaN(n) || n < 1 ? fallback : n;
};

export default function UnitMaster() {
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
    const saved = localStorage.getItem('unit-visible-cols');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return { id: true, name: true, symbol: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('unit-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
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
  }, [table, params, setParams]);

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
      const res = await api.get("/units", { params: table, signal });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
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
  }, [table, reloadKey]);

  const openAdd = () => {
    setEditRow(null);
    setName("");
    setSymbol("");
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setName(row.name);
    setSymbol(row.symbol || "");
    setShow(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.warning("Unit name required");
      return;
    }
    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/units/${editRow.id}`, { name, symbol });
      } else {
        await api.post("/units", { name, symbol });
      }
      setShow(false);
      setReloadKey(k => k + 1);
      toast.success(editRow ? "Unit updated" : "Unit created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    Swal.fire({
      title: "Delete unit?",
      text: `Remove "${row.name}"?`,
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/units/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Unit deleted");
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
        width: "80px",
      },
      visibleCols.name && {
        name: "Unit Name",
        selector: r => r.name,
        sortable: true,
        sortField: "name",
      },
      visibleCols.symbol && {
        name: "Symbol",
        selector: r => r.symbol,
        sortable: true,
        sortField: "symbol",
        width: "120px",
      },
      visibleCols.action && {
        name: "Action",
        width: "120px",
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
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <h3 className="card-title">Unit Master</h3>
          </div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 220 }}
                placeholder="Search units..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <i className="fas fa-plus"></i> Add Unit
              </button>
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
              {[
                visibleCols.id && 'ID',
                visibleCols.name && 'Name',
                visibleCols.symbol && 'Symbol'
              ].filter(Boolean).join(', ') || 'None'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item active={visibleCols.id} onClick={() => setVisibleCols(v => ({ ...v, id: !v.id }))}>
                <i className={`fas ${visibleCols.id ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> ID
              </Dropdown.Item>
              <Dropdown.Item active={visibleCols.name} onClick={() => setVisibleCols(v => ({ ...v, name: !v.name }))}>
                <i className={`fas ${visibleCols.name ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Name
              </Dropdown.Item>
              <Dropdown.Item active={visibleCols.symbol} onClick={() => setVisibleCols(v => ({ ...v, symbol: !v.symbol }))}>
                <i className={`fas ${visibleCols.symbol ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i> Symbol
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable
          className="modern-datatable"
          keyField="id"
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
          sortServer
          onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
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

      <Modal show={show} onHide={() => setShow(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{editRow ? "Edit Unit" : "Add Unit"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Unit Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Piece, Kilogram, Liter"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Symbol</Form.Label>
            <Form.Control
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="e.g., pcs, kg, L"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
