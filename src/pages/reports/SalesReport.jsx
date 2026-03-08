import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Table, Badge, Button } from "react-bootstrap";
import api from "../../api";
import { canView } from "../../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      group_by: "date",
    });
    loadData();
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
      <div className="mb-4">
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Sales Report</h4>
        <div className="text-secondary small">Detailed sales analysis with grouping options</div>
      </div>

      <Card className="mb-4 border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleFilter}>
            <Row className="g-3 align-items-end">
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">Customer</Form.Label>
                <Form.Select
                  value={filters.customer_id}
                  onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">Item</Form.Label>
                <Form.Select
                  value={filters.item_id}
                  onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="">All Items</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">Warehouse</Form.Label>
                <Form.Select
                  value={filters.warehouse_id}
                  onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">Group By</Form.Label>
                <Form.Select
                  value={filters.group_by}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="date">Date</option>
                  <option value="customer">Customer</option>
                  <option value="item">Item</option>
                </Form.Select>
              </Col>
              <Col md="auto">
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Loading..." : "Apply Filters"}
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={handleClear} disabled={loading}>
                    Clear
                  </Button>
                  <Button type="button" variant="success" onClick={handleDownloadPDF} disabled={loading}>
                    <i className="fas fa-file-pdf me-1"></i> PDF
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Row className="g-4 mb-4">
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Sales</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(summary.total_sales)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Quantity</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#2563eb" }}>{summary.total_quantity.toFixed(3)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Discount</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#d97706" }}>₹{formatMoney(summary.total_discount)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Tax</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#64748b" }}>₹{formatMoney(summary.total_tax)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Grand Total</div>
              <div className="h4 mb-0 fw-bold" style={{ color: "#1e293b" }}>₹{formatMoney(summary.grand_total)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="fw-semibold" style={{ color: "#1e293b" }}>
            {isGrouped ? `Grouped by ${filters.group_by.charAt(0).toUpperCase() + filters.group_by.slice(1)}` : "Transaction Details"}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                {!isGrouped && (
                  <>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Warehouse</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qty</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rate</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Discount</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tax</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</th>
                  </>
                )}
                {isGrouped && filters.group_by === "customer" && (
                  <>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer</th>
                    <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transactions</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Qty</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Amount</th>
                  </>
                )}
                {isGrouped && filters.group_by === "item" && (
                  <>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>SKU</th>
                    <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transactions</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Qty</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-secondary py-4">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-secondary py-4">No data found</td></tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} style={{ borderColor: "#f1f5f9" }}>
                    {!isGrouped && (
                      <>
                        <td style={{ color: "#475569" }}>{row.date}</td>
                        <td><Badge bg="light" text="dark" className="border" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>{row.invoice_number}</Badge></td>
                        <td style={{ color: "#1e293b" }}>{row.customer_name}</td>
                        <td style={{ color: "#475569" }}>{row.warehouse_name}</td>
                        <td style={{ color: "#475569" }}>
                          <div className="small">{row.item_name}</div>
                          <div className="small text-secondary">{row.item_sku}</div>
                        </td>
                        <td className="text-end fw-medium" style={{ color: "#2563eb" }}>{row.quantity.toFixed(3)}</td>
                        <td className="text-end" style={{ color: "#475569" }}>₹{formatMoney(row.rate)}</td>
                        <td className="text-end" style={{ color: "#d97706" }}>₹{formatMoney(row.discount)}</td>
                        <td className="text-end" style={{ color: "#64748b" }}>₹{formatMoney(row.tax_amount)}</td>
                        <td className="text-end fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(row.total)}</td>
                      </>
                    )}
                    {isGrouped && filters.group_by === "customer" && (
                      <>
                        <td style={{ color: "#1e293b" }} className="fw-medium">{row.customer_name}</td>
                        <td className="text-center"><Badge bg="info">{row.transaction_count}</Badge></td>
                        <td className="text-end fw-medium" style={{ color: "#2563eb" }}>{row.total_quantity.toFixed(3)}</td>
                        <td className="text-end fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(row.total_amount)}</td>
                      </>
                    )}
                    {isGrouped && filters.group_by === "item" && (
                      <>
                        <td style={{ color: "#1e293b" }} className="fw-medium">{row.item_name}</td>
                        <td style={{ color: "#475569" }}><Badge bg="light" text="dark" className="border">{row.item_sku}</Badge></td>
                        <td className="text-center"><Badge bg="info">{row.transaction_count}</Badge></td>
                        <td className="text-end fw-medium" style={{ color: "#2563eb" }}>{row.total_quantity.toFixed(3)}</td>
                        <td className="text-end fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(row.total_amount)}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
