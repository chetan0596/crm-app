import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Table, Badge, Button, Dropdown } from "react-bootstrap";
import api from "../../api";
import { canView } from "../../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const dateRanges = {
  today: () => {
    const d = new Date().toISOString().split("T")[0];
    return { from: d, to: d };
  },
  thisWeek: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  },
  lastMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: start.toISOString().split("T")[0], to: end.toISOString().split("T")[0] };
  },
  thisYear: () => {
    const now = new Date();
    return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().split("T")[0] };
  },
};

export default function SalesReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_sales: 0,
    total_quantity: 0,
    total_discount: 0,
    total_tax: 0,
    grand_total: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    customer_id: "",
    item_id: "",
    warehouse_id: "",
    group_by: "date",
  });

  const canViewReport = canView("sales-report");

  const loadData = async () => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.customer_id) params.customer_id = filters.customer_id;
      if (filters.item_id) params.item_id = filters.item_id;
      if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
      if (filters.group_by) params.group_by = filters.group_by;

      const res = await api.get("/reports/sales", { params });
      setData(res.data.data || []);
      setSummary(res.data.summary || {
        total_sales: 0,
        total_quantity: 0,
        total_discount: 0,
        total_tax: 0,
        grand_total: 0,
      });

      // Load dropdown data on first load
      if (customers.length === 0 || items.length === 0 || warehouses.length === 0) {
        const itemsRes = await api.get("/items", { params: { perPage: 1000 } });
        setItems(itemsRes.data?.data || itemsRes.data || []);

        const custRes = await api.get("/customers", { params: { perPage: 1000 } });
        setCustomers(custRes.data?.data || custRes.data || []);

        const warehouseRes = await api.get("/warehouses/list");
        setWarehouses(warehouseRes.data?.data || warehouseRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load sales report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewReport) {
      // Set default dates
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilters(prev => ({
        ...prev,
        from: firstDay.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      }));
      loadData();
    }
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDownloadPDF = () => {
    if (loading) return;

    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.customer_id) params.customer_id = filters.customer_id;
    if (filters.item_id) params.item_id = filters.item_id;
    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
    if (filters.group_by) params.group_by = filters.group_by;

    api
      .get("/reports/sales/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "sales-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download sales report PDF:", err);
      });
  };

  const handleClear = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters({
      from: firstDay.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
      customer_id: "",
      item_id: "",
      warehouse_id: "",
      group_by: "date",
    });
    loadData();
  };

  const applyRange = (key) => {
    const range = dateRanges[key]();
    setFilters((prev) => ({ ...prev, ...range }));
  };

  if (!canViewReport) {
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

  const isGrouped = filters.group_by !== "date";

  return (
    <div className="p-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-slate-800">Sales Report</h4>
          <p className="text-secondary small mb-0">Analyze sales by date, customer, or item</p>
        </div>
        <div className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm" id="sales-export-dd" disabled={loading}>
              <i className="fas fa-download me-1"></i> Export
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleDownloadPDF}><i className="fas fa-file-pdf text-danger me-2"></i>Download PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-3">
          <Form onSubmit={handleFilter}>
            <Row className="g-2 align-items-end">
              <Col xs={12} md={6} lg={2}>
                <Form.Label className="small text-muted fw-medium mb-1">From</Form.Label>
                <Form.Control type="date" size="sm" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
              </Col>
              <Col xs={12} md={6} lg={2}>
                <Form.Label className="small text-muted fw-medium mb-1">To</Form.Label>
                <Form.Control type="date" size="sm" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
              </Col>
              <Col xs={12} md={6} lg={2}>
                <Form.Label className="small text-muted fw-medium mb-1">Customer</Form.Label>
                <Form.Select size="sm" value={filters.customer_id} onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}>
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12} md={6} lg={2}>
                <Form.Label className="small text-muted fw-medium mb-1">Item</Form.Label>
                <Form.Select size="sm" value={filters.item_id} onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}>
                  <option value="">All Items</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12} md={6} lg={2}>
                <Form.Label className="small text-muted fw-medium mb-1">Group By</Form.Label>
                <Form.Select size="sm" value={filters.group_by} onChange={(e) => setFilters({ ...filters, group_by: e.target.value })}>
                  <option value="date">Date</option>
                  <option value="customer">Customer</option>
                  <option value="item">Item</option>
                </Form.Select>
              </Col>
              <Col xs={12} md={6} lg={2}>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" size="sm" disabled={loading} className="flex-fill">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search me-1"></i>}
                    {loading ? " " : "Apply"}
                  </Button>
                  <Button type="button" variant="outline-secondary" size="sm" onClick={handleClear} disabled={loading}>
                    <i className="fas fa-undo"></i>
                  </Button>
                </div>
              </Col>
            </Row>
            <div className="d-flex flex-wrap gap-2 mt-3">
              {Object.entries({ today: "Today", thisWeek: "This Week", thisMonth: "This Month", lastMonth: "Last Month", thisYear: "This Year" }).map(([key, label]) => (
                <Button key={key} variant="outline-light" size="sm" className="text-secondary border" onClick={() => applyRange(key)}>{label}</Button>
              ))}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col xs={6} md={4} lg>
          <Card className="border-0 shadow-sm h-100 stat-card-green">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="stat-icon stat-icon-green"><i className="fas fa-cash-register"></i></div>
              <div>
                <div className="small text-muted">Total Sales</div>
                <div className="h5 mb-0 fw-bold">₹{formatMoney(summary.total_sales)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg>
          <Card className="border-0 shadow-sm h-100 stat-card-blue">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="stat-icon stat-icon-blue"><i className="fas fa-cubes"></i></div>
              <div>
                <div className="small text-muted">Total Quantity</div>
                <div className="h5 mb-0 fw-bold">{summary.total_quantity.toFixed(3)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4} lg>
          <Card className="border-0 shadow-sm h-100 stat-card-amber">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="stat-icon stat-icon-amber"><i className="fas fa-tag"></i></div>
              <div>
                <div className="small text-muted">Total Discount</div>
                <div className="h5 mb-0 fw-bold">₹{formatMoney(summary.total_discount)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={6} lg>
          <Card className="border-0 shadow-sm h-100 stat-card-slate">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="stat-icon stat-icon-slate"><i className="fas fa-receipt"></i></div>
              <div>
                <div className="small text-muted">Total Tax</div>
                <div className="h5 mb-0 fw-bold">₹{formatMoney(summary.total_tax)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg>
          <Card className="border-0 shadow-sm h-100 stat-card-dark">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div className="stat-icon stat-icon-dark"><i className="fas fa-wallet"></i></div>
              <div>
                <div className="small text-white-50">Grand Total</div>
                <div className="h5 mb-0 fw-bold text-white">₹{formatMoney(summary.grand_total)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
          <div className="fw-semibold text-slate-800">
            {isGrouped ? `Grouped by ${filters.group_by.charAt(0).toUpperCase() + filters.group_by.slice(1)}` : "Transaction Details"}
          </div>
          <Badge bg="light" text="dark" className="border">{data.length} records</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle report-table">
              <thead>
                <tr>
                  {!isGrouped && (
                    <>
                      <th>Date</th>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th className="d-none d-lg-table-cell">Warehouse</th>
                      <th>Item</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end d-none d-md-table-cell">Rate</th>
                      <th className="text-end d-none d-md-table-cell">Discount</th>
                      <th className="text-end d-none d-lg-table-cell">Tax</th>
                      <th className="text-end">Total</th>
                    </>
                  )}
                  {isGrouped && filters.group_by === "customer" && (
                    <>
                      <th>Customer</th>
                      <th className="text-center">Transactions</th>
                      <th className="text-end">Total Qty</th>
                      <th className="text-end">Total Amount</th>
                    </>
                  )}
                  {isGrouped && filters.group_by === "item" && (
                    <>
                      <th>Item</th>
                      <th className="d-none d-md-table-cell">SKU</th>
                      <th className="text-center">Transactions</th>
                      <th className="text-end">Total Qty</th>
                      <th className="text-end">Total Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={10} className="p-0"><div className="skeleton-row" /></td></tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      <div className="empty-state">
                        <i className="fas fa-inbox empty-state-icon"></i>
                        <div className="fw-semibold text-secondary">No data found</div>
                        <div className="small text-muted">Try adjusting your date range or filters</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={index}>
                      {!isGrouped && (
                        <>
                          <td><span className="text-muted small">{row.date}</span></td>
                          <td><Badge bg="light" text="dark" className="border fw-medium">{row.invoice_number}</Badge></td>
                          <td className="fw-medium">{row.customer_name}</td>
                          <td className="d-none d-lg-table-cell text-muted small">{row.warehouse_name}</td>
                          <td>
                            <div className="small fw-medium">{row.item_name}</div>
                            <div className="small text-muted">{row.item_sku}</div>
                          </td>
                          <td className="text-end fw-medium text-blue">{row.quantity.toFixed(3)}</td>
                          <td className="text-end d-none d-md-table-cell text-muted">₹{formatMoney(row.rate)}</td>
                          <td className="text-end d-none d-md-table-cell text-amber">₹{formatMoney(row.discount)}</td>
                          <td className="text-end d-none d-lg-table-cell text-muted">₹{formatMoney(row.tax_amount)}</td>
                          <td className="text-end fw-semibold text-green">₹{formatMoney(row.total)}</td>
                        </>
                      )}
                      {isGrouped && filters.group_by === "customer" && (
                        <>
                          <td className="fw-medium">{row.customer_name}</td>
                          <td className="text-center"><Badge bg="info" className="fw-medium">{row.transaction_count}</Badge></td>
                          <td className="text-end fw-medium text-blue">{row.total_quantity.toFixed(3)}</td>
                          <td className="text-end fw-semibold text-green">₹{formatMoney(row.total_amount)}</td>
                        </>
                      )}
                      {isGrouped && filters.group_by === "item" && (
                        <>
                          <td className="fw-medium">{row.item_name}</td>
                          <td className="d-none d-md-table-cell"><Badge bg="light" text="dark" className="border">{row.item_sku}</Badge></td>
                          <td className="text-center"><Badge bg="info" className="fw-medium">{row.transaction_count}</Badge></td>
                          <td className="text-end fw-medium text-blue">{row.total_quantity.toFixed(3)}</td>
                          <td className="text-end fw-semibold text-green">₹{formatMoney(row.total_amount)}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
