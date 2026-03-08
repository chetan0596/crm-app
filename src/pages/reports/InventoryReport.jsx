import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Table, Badge, Button } from "react-bootstrap";
import api from "../../api";
import { canView } from "../../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function InventoryReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_items: 0,
    total_stock_value: 0,
    total_stock_quantity: 0,
    in_stock_count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    stock_status: "all",
    from: "",
    to: "",
  });

  const canViewReport = canView("inventory-report");

  const loadData = async () => {
    if (!canViewReport) return;

    setLoading(true);
    try {
      const params = {};
      if (filters.stock_status && filters.stock_status !== "all") params.stock_status = filters.stock_status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await api.get("/reports/inventory", { params });
      setData(res.data.data || []);
      setSummary(res.data.summary || {
        total_items: 0,
        total_stock_value: 0,
        total_stock_quantity: 0,
        in_stock_count: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
      });
    } catch (err) {
      console.error("Failed to load inventory report:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewReport) {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      setFilters(prev => ({
        ...prev,
        from: lastMonth.toISOString().split("T")[0],
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
    if (filters.stock_status) params.stock_status = filters.stock_status;

    api
      .get("/reports/inventory/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "inventory-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download inventory report PDF:", err);
      });
  };

  const handleClear = () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    setFilters({
      stock_status: "all",
      from: lastMonth.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
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
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Inventory Report</h4>
        <div className="text-secondary small">Stock levels, valuation and movement summary</div>
      </div>

      <Card className="mb-4 border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleFilter}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="small text-secondary mb-1">Stock Status</Form.Label>
                <Form.Select
                  value={filters.stock_status}
                  onChange={(e) => setFilters({ ...filters, stock_status: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="all">All Items</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">Movement From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  style={{ borderColor: "#e2e8f0" }}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">Movement To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
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
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Items</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>{summary.total_items}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#f0fdf4" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">In Stock</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#059669" }}>{summary.in_stock_count}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#fffbeb" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Low Stock</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#d97706" }}>{summary.low_stock_count}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#fef2f2" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Out of Stock</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#dc2626" }}>{summary.out_of_stock_count}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Total Stock Qty</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#2563eb" }}>{summary.total_stock_quantity.toFixed(3)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Stock Value</div>
              <div className="h5 mb-0 fw-bold" style={{ color: "#1e293b" }}>₹{formatMoney(summary.total_stock_value)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="fw-semibold" style={{ color: "#1e293b" }}>Item Stock Details</div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>SKU</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unit</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Stock</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Min Stock</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sale Price</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Stock Value</th>
                <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Purchases (Period)</th>
                <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sales (Period)</th>
                <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-secondary py-4">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-secondary py-4">No items found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} style={{ borderColor: "#f1f5f9" }}>
                    <td style={{ color: "#1e293b" }} className="fw-medium">{item.name}</td>
                    <td style={{ color: "#475569" }}><Badge bg="light" text="dark" className="border">{item.sku}</Badge></td>
                    <td style={{ color: "#64748b" }}>{item.unit}</td>
                    <td className="text-end fw-medium" style={{ color: "#2563eb" }}>{item.current_stock.toFixed(3)}</td>
                    <td className="text-end" style={{ color: "#64748b" }}>{item.min_stock.toFixed(3)}</td>
                    <td className="text-end" style={{ color: "#475569" }}>₹{formatMoney(item.sale_price)}</td>
                    <td className="text-end fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(item.stock_value)}</td>
                    <td className="text-center" style={{ color: "#059669" }}>{item.purchases_in_period > 0 ? '+' + item.purchases_in_period.toFixed(3) : '-'}</td>
                    <td className="text-center" style={{ color: "#dc2626" }}>{item.sales_in_period > 0 ? '-' + item.sales_in_period.toFixed(3) : '-'}</td>
                    <td className="text-center">
                      <Badge
                        bg={item.status_color}
                        style={{ fontSize: "0.75rem", fontWeight: 500 }}
                      >
                        {item.status}
                      </Badge>
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
