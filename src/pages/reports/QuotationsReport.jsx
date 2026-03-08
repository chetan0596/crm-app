import { useEffect, useState } from "react";
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
    "Quotation #",
    "Customer",
    "Status",
    "Subtotal",
    "Discount",
    "Tax",
    "Grand Total",
    "Converted Invoice",
  ];

  const lines = [header, ...rows.map(r => ([
    r.quotation_date,
    r.quotation_number,
    r.customer_name,
    r.status,
    r.subtotal,
    r.discount,
    r.tax,
    r.grand_total,
    r.converted_invoice_number,
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

const statusColor = (s) => {
  switch (s) {
    case "draft": return "secondary";
    case "sent": return "info";
    case "accepted": return "success";
    case "rejected": return "danger";
    case "converted": return "primary";
    default: return "secondary";
  }
};

export default function QuotationsReport() {
  const canViewReport = canView("quotations-report");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    grand_total: 0,
    draft_count: 0,
    sent_count: 0,
    accepted_count: 0,
    rejected_count: 0,
    converted_count: 0,
  });

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
  });

  const loadData = async () => {
    if (!canViewReport) return;
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;
      const res = await api.get("/reports/quotations", { params });
      setData(res.data.data || []);
      setSummary(res.data.summary || summary);
    } catch {
      setData([]);
      setSummary({
        count: 0,
        grand_total: 0,
        draft_count: 0,
        sent_count: 0,
        accepted_count: 0,
        rejected_count: 0,
        converted_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (csvLoading) return;
    setCsvLoading(true);
    setTimeout(() => {
      downloadCsv("quotations-report.csv", data);
      setCsvLoading(false);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    if (loading || pdfLoading) return;
    setPdfLoading(true);
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.status) params.status = filters.status;

    try {
      const res = await api.get("/reports/quotations/pdf", { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "quotations-report.pdf";
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
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Quotations Report</h4>
        <div className="text-secondary small">Quotation status tracking and totals</div>
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
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="converted">Converted</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex gap-2">
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
                      status: "",
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
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Total Quotations</div><div className="fw-bold">{summary.count}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Grand Total</div><div className="fw-bold">₹{formatMoney(summary.grand_total)}</div></Card.Body></Card></Col>
        <Col md={6}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body>
          <div className="text-secondary small mb-2">Status Counts</div>
          <div className="d-flex gap-2 flex-wrap">
            <Badge bg={statusColor("draft")}>Draft: {summary.draft_count}</Badge>
            <Badge bg={statusColor("sent")}>Sent: {summary.sent_count}</Badge>
            <Badge bg={statusColor("accepted")}>Accepted: {summary.accepted_count}</Badge>
            <Badge bg={statusColor("rejected")}>Rejected: {summary.rejected_count}</Badge>
            <Badge bg={statusColor("converted")}>Converted: {summary.converted_count}</Badge>
          </div>
        </Card.Body></Card></Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <div className="fw-semibold">Quotations</div>
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
                  <th>Quotation #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-end">Discount</th>
                  <th className="text-end">Tax</th>
                  <th className="text-end">Grand Total</th>
                  <th>Converted Invoice</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-4 text-secondary">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-4 text-secondary">No data</td></tr>
                ) : (
                  data.map((r) => (
                    <tr key={r.id}>
                      <td>{r.quotation_date}</td>
                      <td className="fw-semibold">{r.quotation_number}</td>
                      <td>{r.customer_name}</td>
                      <td><Badge bg={statusColor(r.status)}>{String(r.status || "").toUpperCase()}</Badge></td>
                      <td className="text-end">₹{formatMoney(r.subtotal)}</td>
                      <td className="text-end text-danger">-₹{formatMoney(r.discount)}</td>
                      <td className="text-end">₹{formatMoney(r.tax)}</td>
                      <td className="text-end fw-semibold">₹{formatMoney(r.grand_total)}</td>
                      <td className="text-muted small">{r.converted_invoice_number || "-"}</td>
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
