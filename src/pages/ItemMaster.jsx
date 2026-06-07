import { useEffect, useMemo, useReducer, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Dropdown, Row, Col, Table, Badge } from "react-bootstrap";
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

export default function ItemMaster() {
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

  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemWarehouseStocks, setItemWarehouseStocks] = useState([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('item-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { id: true, name: true, sku: true, unit: true, price: true, stock: true, tax: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('item-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({
    name: "", sku: "", unit_id: "", tax_id: "",
    purchase_price: "", sale_price: "", opening_stock: "0", min_stock: "0"
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

  const loadTable = async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/items", { params: table, signal });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setRows([]); setTotal(0);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async (signal) => {
    const [unitsRes, taxesRes, warehousesRes] = await Promise.allSettled([
      api.get("/units", { params: { perPage: 200 }, signal }),
      api.get("/taxes", { params: { perPage: 200 }, signal }),
      api.get("/warehouses/list", { signal })
    ]);

    if (unitsRes.status === 'fulfilled') {
      setUnits(unitsRes.value.data.data || []);
    } else { setUnits([]); toast.error("Failed to load units"); }

    if (taxesRes.status === 'fulfilled') {
      setTaxes(taxesRes.value.data.data || []);
    } else { setTaxes([]); toast.error("Failed to load taxes"); }

    if (warehousesRes.status === 'fulfilled') {
      setWarehouses(warehousesRes.value.data.data || []);
    } else { setWarehouses([]); }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadTable(controller.signal);
    return () => controller.abort();
  }, [table, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    loadDropdowns(controller.signal);
    return () => controller.abort();
  }, [reloadKey]);

  const openAdd = () => {
    setEditRow(null);
    setForm({ name: "", sku: "", unit_id: "", tax_id: "", purchase_price: "", sale_price: "", opening_stock: "0", min_stock: "0" });
    setShow(true);
  };

  const openEdit = useCallback((row) => {
    setEditRow(row);
    setForm({
      name: row.name || "", sku: row.sku || "", unit_id: row.unit_id || "",
      tax_id: row.tax_id || "", purchase_price: row.purchase_price || "",
      sale_price: row.sale_price || "", opening_stock: row.opening_stock || "0",
      min_stock: row.min_stock || "0"
    });
    setShow(true);
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      toast.warning("Item name required");
      return;
    }
    if (!form.unit_id) {
      toast.warning("Unit required");
      return;
    }
    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/items/${editRow.id}`, form);
      } else {
        await api.post("/items", form);
      }
      setShow(false);
      setReloadKey(k => k + 1);
      toast.success(editRow ? "Item updated" : "Item created");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openWarehouseStock = useCallback(async (row) => {
    setSelectedItem(row);
    setShowStockModal(true);
    setLoadingStock(true);
    try {
      const res = await api.get(`/items/${row.id}/warehouse-stock`);
      setItemWarehouseStocks(res.data.data || []);
    } catch {
      setItemWarehouseStocks([]);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  const remove = useCallback((row) => {
    Swal.fire({
      title: "Delete item?",
      text: `Remove "${row.name}"?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/items/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Item deleted");
      } catch { toast.error("Delete failed"); }
    });
  }, []);

  const updateField = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);

  const columns = useMemo(() => {
    const all = [
      visibleCols.id && { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
      visibleCols.name && { name: "Item Name", selector: r => r.name, sortable: true, sortField: "name" },
      visibleCols.sku && { name: "SKU/Code", selector: r => r.sku, sortable: true, sortField: "sku", width: "120px" },
      visibleCols.unit && { name: "Unit", selector: r => r.unit?.symbol || r.unit?.name, sortable: true, sortField: "unit_id", width: "80px" },
      visibleCols.price && { name: "Sale Price", selector: r => `₹${r.sale_price}`, sortable: true, sortField: "sale_price", width: "100px" },
      visibleCols.stock && { name: "Stock", selector: r => r.current_stock || 0, sortable: true, sortField: "current_stock", width: "80px", cell: row => (
        <div className="d-flex align-items-center gap-2">
          <span>{row.current_stock || 0}</span>
          <button className="btn btn-link btn-sm p-0 text-primary" onClick={(e) => { e.stopPropagation(); openWarehouseStock(row); }} title="View Godown-wise Stock">
            <i className="fas fa-warehouse"></i>
          </button>
        </div>
      ) },
      visibleCols.tax && { name: "Tax", selector: r => r.tax ? `${r.tax.name} (${r.tax.percentage}%)` : '-', sortable: true, sortField: "tax_id", width: "120px" },
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
  }, [visibleCols, openEdit, openWarehouseStock, remove]);

  const stockStatus = useCallback((row) => {
    const stock = row.current_stock || 0;
    const min = row.min_stock || 0;
    if (stock <= 0) return <span className="badge bg-danger">Out of Stock</span>;
    if (stock <= min) return <span className="badge bg-warning text-dark">Low Stock</span>;
    return <span className="badge bg-success">In Stock</span>;
  }, []);

  const progressComponent = useMemo(() => (
    <div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>
  ), []);

  const noDataComponent = useMemo(() => (
    <div className="p-5 text-center">
      <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
      <div className="fw-semibold text-secondary mb-1">No data found</div>
      <div className="small text-muted">Try adjusting your filters or check back later</div>
    </div>
  ), []);

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Item Master</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search items..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> Add Item</button>
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
              {[visibleCols.id && 'ID', visibleCols.name && 'Name', visibleCols.sku && 'SKU', visibleCols.unit && 'Unit', visibleCols.price && 'Price', visibleCols.stock && 'Stock', visibleCols.tax && 'Tax'].filter(Boolean).join(', ') || 'None'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {['id','name','sku','unit','price','stock','tax'].map(col => (
                <Dropdown.Item key={col} active={visibleCols[col]} onClick={() => setVisibleCols(v => ({ ...v, [col]: !v[col] }))}>
                  <i className={`fas ${visibleCols[col] ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  {col === 'sku' ? 'SKU' : col.charAt(0).toUpperCase() + col.slice(1)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable columns={columns} data={rows} progressPending={loading} persistTableHead
          className="modern-datatable"
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          sortServer onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
          progressComponent={progressComponent}
          noDataComponent={noDataComponent}
          striped highlightOnHover dense keyField="id" />
      </div>

      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="lg">
        <Modal.Header closeButton><Modal.Title>{editRow ? "Edit Item" : "Add Item"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Item Name <span className="text-danger">*</span></Form.Label>
              <Form.Control value={form.name} onChange={e => updateField('name', e.target.value)} />
            </Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>SKU / Code</Form.Label>
              <Form.Control value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="Unique item code" />
            </Form.Group></Col>
          </Row>
          <Row>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
              <Form.Select value={form.unit_id} onChange={e => updateField('unit_id', e.target.value)}>
                <option value="">Select Unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </Form.Select>
            </Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Tax</Form.Label>
              <Form.Select value={form.tax_id} onChange={e => updateField('tax_id', e.target.value)}>
                <option value="">No Tax</option>
                {taxes.map(t => <option key={t.id} value={t.id}>{t.name} - {t.percentage}%</option>)}
              </Form.Select>
            </Form.Group></Col>
          </Row>
          <Row>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Purchase Price (₹)</Form.Label>
              <Form.Control type="number" step="0.01" value={form.purchase_price} onChange={e => updateField('purchase_price', e.target.value)} />
            </Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3">
              <Form.Label>Sale Price (₹)</Form.Label>
              <Form.Control type="number" step="0.01" value={form.sale_price} onChange={e => updateField('sale_price', e.target.value)} />
            </Form.Group></Col>
          </Row>
          {!editRow && (
            <Row>
              <Col md={6}><Form.Group className="mb-3">
                <Form.Label>Opening Stock</Form.Label>
                <Form.Control type="number" value={form.opening_stock} onChange={e => updateField('opening_stock', e.target.value)} />
              </Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3">
                <Form.Label>Minimum Stock Alert</Form.Label>
                <Form.Control type="number" value={form.min_stock} onChange={e => updateField('min_stock', e.target.value)} />
              </Form.Group></Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Warehouse Stock Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>Warehouse-wise Stock - {selectedItem?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingStock ? (
            <div className="text-center py-4">
              <span className="spinner-border spinner-border-sm me-2"></span> Loading...
            </div>
          ) : (
            <>
              <div className="mb-3">
                <strong>SKU:</strong> {selectedItem?.sku || '-'} | 
                <strong> Total Stock:</strong> {selectedItem?.current_stock || 0}
              </div>
              <Table bordered size="sm">
                <thead className="bg-light">
                  <tr>
                    <th>Warehouse (Godown)</th>
                    <th className="text-end">Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map(wh => {
                    const stock = itemWarehouseStocks.find(s => s.warehouse_id === wh.id);
                    const qty = stock?.quantity || 0;
                    return (
                      <tr key={wh.id}>
                        <td>
                          {wh.name}
                          {wh.is_primary && <Badge bg="primary" className="ms-2">Primary</Badge>}
                        </td>
                        <td className="text-end fw-bold">{qty}</td>
                        <td>
                          {qty > 0 ? (
                            <Badge bg="success">In Stock</Badge>
                          ) : (
                            <Badge bg="danger">Out</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {warehouses.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">No warehouses configured</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowStockModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
