import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Card, Row, Col, Form, Dropdown, Badge, ProgressBar } from "react-bootstrap";
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

export default function InventoryDashboard() {
  const [params, setParams] = useSearchParams();
  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 10),
    search: params.get("search") || "",
    sortField: params.get("sort") || "current_stock",
    sortDir: params.get("dir") || "asc",
  };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 });
  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [filterStatus, setFilterStatus] = useState("all");

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('inventory-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { id: true, name: true, sku: true, unit: true, stock: true, min_stock: true, status: true, value: true };
  });

  useEffect(() => {
    localStorage.setItem('inventory-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

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
      const res = await api.get("/items/inventory", { 
        params: { ...table, status: filterStatus !== 'all' ? filterStatus : '' }, 
        signal 
      });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || { totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 });
    } catch { 
      setRows([]); 
      setTotal(0); 
      setStats({ totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 });
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [table, filterStatus]);

  const getStockStatus = (row) => {
    const stock = parseFloat(row.current_stock) || 0;
    const min = parseFloat(row.min_stock) || 0;
    if (stock <= 0) return { label: "Out of Stock", variant: "danger", progress: 0 };
    if (stock <= min) return { label: "Low Stock", variant: "warning", progress: (stock / (min * 2)) * 100 };
    return { label: "In Stock", variant: "success", progress: Math.min(100, (stock / (min * 3)) * 100) };
  };

  const columns = useMemo(() => {
    const all = [
      visibleCols.id && { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
      visibleCols.name && { name: "Item Name", selector: r => r.name, sortable: true, sortField: "name" },
      visibleCols.sku && { name: "SKU", selector: r => r.sku, sortable: true, sortField: "sku", width: "120px" },
      visibleCols.unit && { name: "Unit", selector: r => r.unit?.symbol || r.unit?.name, width: "80px" },
      visibleCols.stock && { 
        name: "Current Stock", 
        selector: r => r.current_stock || 0, 
        sortable: true, 
        sortField: "current_stock", 
        width: "110px",
        cell: row => <strong>{row.current_stock || 0}</strong>
      },
      visibleCols.min_stock && { 
        name: "Min Stock", 
        selector: r => r.min_stock || 0, 
        sortable: true, 
        sortField: "min_stock", 
        width: "100px" 
      },
      visibleCols.status && {
        name: "Status",
        width: "130px",
        cell: row => {
          const status = getStockStatus(row);
          return (
            <div>
              <Badge bg={status.variant}>{status.label}</Badge>
              <ProgressBar 
                variant={status.variant} 
                now={status.progress} 
                style={{ height: '4px', marginTop: '4px' }} 
              />
            </div>
          );
        }
      },
      visibleCols.value && { 
        name: "Stock Value", 
        selector: r => `₹${((r.current_stock || 0) * (r.purchase_price || 0)).toFixed(2)}`, 
        width: "120px" 
      },
    ];
    return all.filter(Boolean);
  }, [visibleCols]);

  return (
    <div>
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={2}><Card className="text-center border-primary"><Card.Body>
          <h4 className="text-primary">{stats.totalItems}</h4><small className="text-muted">Total Items</small>
        </Card.Body></Card></Col>
        <Col md={2}><Card className="text-center border-success"><Card.Body>
          <h4 className="text-success">{stats.totalStock}</h4><small className="text-muted">Total Stock</small>
        </Card.Body></Card></Col>
        <Col md={2}><Card className="text-center border-warning"><Card.Body>
          <h4 className="text-warning">{stats.lowStock}</h4><small className="text-muted">Low Stock</small>
        </Card.Body></Card></Col>
        <Col md={2}><Card className="text-center border-danger"><Card.Body>
          <h4 className="text-danger">{stats.outOfStock}</h4><small className="text-muted">Out of Stock</small>
        </Card.Body></Card></Col>
        <Col md={4}><Card className="text-center border-info"><Card.Body>
          <h4 className="text-info">₹{stats.stockValue?.toFixed(2)}</h4><small className="text-muted">Total Stock Value</small>
        </Card.Body></Card></Col>
      </Row>

      {/* Inventory Table */}
      <Card className="card-outline card-primary">
        <Card.Header>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4"><h3 className="card-title m-0">Inventory Status</h3></div>
            <div className="col-12 col-md-8">
              <div className="d-flex gap-2 flex-wrap justify-content-md-end">
                <Form.Select size="sm" style={{ width: '140px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="out">Out of Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="ok">In Stock</option>
                </Form.Select>
                <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                  placeholder="Search items..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              </div>
            </div>
          </div>
        </Card.Header>

        <div className="p-2 border-bottom bg-light">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small fw-bold">Show columns:</span>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <i className="fas fa-columns me-1"></i>
                {[visibleCols.id && 'ID', visibleCols.name && 'Name', visibleCols.sku && 'SKU', visibleCols.stock && 'Stock', visibleCols.status && 'Status'].filter(Boolean).join(', ') || 'None'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {['id','name','sku','unit','stock','min_stock','status','value'].map(col => (
                  <Dropdown.Item key={col} active={visibleCols[col]} onClick={() => setVisibleCols(v => ({ ...v, [col]: !v[col] }))}>
                    <i className={`fas ${visibleCols[col] ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                    {col === 'min_stock' ? 'Min Stock' : col === 'sku' ? 'SKU' : col.charAt(0).toUpperCase() + col.slice(1)}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <Card.Body className="p-0">
          <DataTable columns={columns} 
          className="modern-datatable"
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
    </div>
  );
}
