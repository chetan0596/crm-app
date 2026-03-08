import { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Form, Table, Button, Badge } from "react-bootstrap";
import api from "../../api";
import { canView } from "../../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const downloadCsv = (filename, rows) => {
  const escape = (val) => {
    const s = String(val ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const header = [
    "Date",
    "Type",
    "Invoice/Bill",
    "Party",
    "Method",
    "Reference",
    "Amount",
    "Notes",
  ];

  const lines = [header, ...rows.map(r => ([
    r.payment_date,
    r.type,
    r.invoice_number,
    r.party_name,
    r.payment_method,
    r.reference_number,
    r.amount,
    r.notes,
  ]))]
    .map(cols => cols.map(escape).join(","))
    .join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function PaymentsReport() {
  const canViewReport = canView("payments-report");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total_received: 0, total_paid: 0, net: 0, count: 0 });

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    type: "",
    payment_method: "",
  });

  const methods = useMemo(
    () => ["cash", "cheque", "bank_transfer", "upi", "card", "online"],
    []
  );

  const loadData = async () => {
    if (!canViewReport) return;
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.type) params.type = filters.type;
      if (filters.payment_method) params.payment_method = filters.payment_method;

      const res = await api.get("/reports/payments", { params });
      setData(res.data.data || []);
      setSummary(res.data.summary || { total_received: 0, total_paid: 0, net: 0, count: 0 });
    } catch {
      setData([]);
      setSummary({ total_received: 0, total_paid: 0, net: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (loading || pdfLoading) return;
    setPdfLoading(true);
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.type) params.type = filters.type;
    if (filters.payment_method) params.payment_method = filters.payment_method;

    try {
      const res = await api.get("/reports/payments/pdf", { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "payments-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (csvLoading) return;
    setCsvLoading(true);
    setTimeout(() => {
      downloadCsv("payments-report.csv", data);
      setCsvLoading(false);
    }, 100);
  };

  useEffect(() => {
    if (!canViewReport) return;
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters(prev => ({
      ...prev,
      from: firstDay.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    }));
  }, [canViewReport]);

  useEffect(() => {
    if (!canViewReport) return;
    if (!filters.from || !filters.to) return;
    loadData();
  }, [canViewReport, filters.from, filters.to]);

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
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Payments Report</h4>
        <div className="text-secondary small">All received and paid payments with filters</div>
      </div>

      <Card className="mb-4 border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Body>
          <Form onSubmit={(e) => { e.preventDefault(); loadData(); }}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>From</Form.Label>
                  <Form.Control type="date" value={filters.from} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>To</Form.Label>
                  <Form.Control type="date" value={filters.to} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
                    <option value="">All</option>
                    <option value="sale">Received</option>
                    <option value="purchase">Paid</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Method</Form.Label>
                  <Form.Select value={filters.payment_method} onChange={(e) => setFilters(f => ({ ...f, payment_method: e.target.value }))}>
                    <option value="">All</option>
                    {methods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Loading..." : "Filter"}
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  disabled={loading}
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setFilters({
                      from: firstDay.toISOString().split("T")[0],
                      to: today.toISOString().split("T")[0],
                      type: "",
                      payment_method: "",
                    });
                  }}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Received</div><div className="fw-bold">₹{formatMoney(summary.total_received)}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Paid</div><div className="fw-bold">₹{formatMoney(summary.total_paid)}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Net</div><div className="fw-bold">₹{formatMoney(summary.net)}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Count</div><div className="fw-bold">{summary.count}</div></Card.Body></Card></Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <div className="fw-semibold">Payments</div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={loading || data.length === 0 || csvLoading}
              onClick={handleDownloadCSV}
            >
              {csvLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Exporting...
                </>
              ) : (
                "Export CSV"
              )}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              disabled={loading || data.length === 0 || pdfLoading}
              onClick={handleDownloadPDF}
            >
              {pdfLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Downloading...
                </>
              ) : (
                "Download PDF"
              )}
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Invoice/Bill</th>
                  <th>Party</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="text-end">Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4 text-secondary">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-secondary">No data</td></tr>
                ) : (
                  data.map((r) => (
                    <tr key={r.id}>
                      <td>{r.payment_date}</td>
                      <td><Badge bg={r.type === "sale" ? "success" : "warning"}>{r.type === "sale" ? "Received" : "Paid"}</Badge></td>
                      <td>{r.invoice_number}</td>
                      <td>{r.party_name}</td>
                      <td>{r.payment_method}</td>
                      <td>{r.reference_number || "-"}</td>
                      <td className="text-end fw-semibold">₹{formatMoney(r.amount)}</td>
                      <td className="text-muted small">{r.notes || ""}</td>
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
