import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Table, Badge, Button } from "react-bootstrap";
import api from "../../api";
import { canView } from "../../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CustomerReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_customers: 0,
    total_sales: 0,
    total_transactions: 0,
    avg_transaction_value: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    customer_id: "",
    min_sales: "",
  });

  const canViewReport = canView("customer-report");

  const loadData = async () => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.customer_id) params.customer_id = filters.customer_id;
      if (filters.min_sales) params.min_sales = filters.min_sales;

      const res = await api.get("/reports/customers", { params });
      setData(res.data.data || []);
      setSummary(res.data.summary || {
        total_customers: 0,
        total_sales: 0,
        total_transactions: 0,
        avg_transaction_value: 0,
      });

      // Load customers dropdown on first load
      if (customers.length === 0) {
        const custRes = await api.get("/customers", { params: { perPage: 1000 } });
        setCustomers(custRes.data?.data || custRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load customer report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewReport) {
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
    if (filters.min_sales) params.min_sales = filters.min_sales;

    api
      .get("/reports/customers/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "customer-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download customer report PDF:", err);
      });
  };

  const handleClear = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters({
      from: firstDay.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
      customer_id: "",
      min_sales: "",
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

  return (
    <div className="p-4">
      <div className="mb-4">
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Customer Report</h4>
        <div className="text-secondary small">Customer sales analysis and top customers</div>
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
              <Col md={3}>
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
                <Form.Label className="small text-secondary mb-1">Min Sales (₹)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0"
                  value={filters.min_sales}
                  onChange={(e) => setFilters({ ...filters, min_sales: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                />
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
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Customers</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>{summary.total_customers}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Sales</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(summary.total_sales)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Transactions</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#2563eb" }}>{summary.total_transactions}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Avg Transaction</div>
              <div className="h5 mb-0 fw-bold" style={{ color: "#1e293b" }}>₹{formatMoney(summary.avg_transaction_value)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="fw-semibold" style={{ color: "#1e293b" }}>Customer Sales Details</div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contact</th>
                <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transactions</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Sales</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Order</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Purchase</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Top Item</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-secondary py-4">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-secondary py-4">No customers found</td></tr>
              ) : (
                data.map((customer, index) => (
                  <tr key={customer.customer_id} style={{ borderColor: "#f1f5f9" }}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {customer.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-medium" style={{ color: "#1e293b" }}>{customer.customer_name}</div>
                          <div className="small text-secondary">#{customer.customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#475569" }}>
                      <div className="small">{customer.customer_phone || '-'}</div>
                      <div className="small text-secondary">{customer.customer_email || '-'}</div>
                    </td>
                    <td className="text-center">
                      <Badge bg="info">{customer.transaction_count}</Badge>
                    </td>
                    <td className="text-end fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(customer.total_sales)}</td>
                    <td className="text-end" style={{ color: "#475569" }}>₹{formatMoney(customer.avg_order_value)}</td>
                    <td style={{ color: "#64748b" }}>
                      {customer.last_purchase_date ? (
                        <Badge bg="light" text="dark" className="border">{customer.last_purchase_date}</Badge>
                      ) : (
                        <span className="text-secondary">-</span>
                      )}
                    </td>
                    <td style={{ color: "#475569" }}>
                      {customer.top_item ? (
                        <div>
                          <div className="small fw-medium">{customer.top_item.name}</div>
                          <div className="small text-secondary">{customer.top_item.quantity.toFixed(0)} qty | ₹{formatMoney(customer.top_item.amount)}</div>
                        </div>
                      ) : (
                        <span className="text-secondary">-</span>
                      )}
                    </td>
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
