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
    "DN #",
    "Bill",
    "Vendor",
    "Warehouse",
    "Type",
    "Status",
    "Subtotal",
    "Discount",
    "Tax",
    "Grand Total",
  ];

  const lines = [header, ...rows.map(r => ([
    r.debit_note_date,
    r.debit_note_number,
    r.bill_number,
    r.vendor_name,
    r.warehouse_name,
    r.type,
    r.status,
    r.subtotal,
    r.discount,
    r.tax,
    r.grand_total,
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

const badge = {
  status: (s) => (s === "posted" ? "success" : "warning"),
  type: (t) => (t === "return" ? "info" : t === "discount" ? "primary" : "danger"),
};

export default function DebitNotesReport() {
  const canViewReport = canView("debit-notes-report");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ count: 0, grand_total: 0, draft_count: 0, posted_count: 0 });
  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
    type: "",
    warehouse_id: "",
  });

  const loadData = async () => {
    if (!canViewReport) return;
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;

      const res = await api.get("/reports/debit-notes", { params });
      setData(res.data.data || []);
      setSummary(res.data.summary || summary);

      // Load warehouses on first load
      if (warehouses.length === 0) {
        const warehouseRes = await api.get("/warehouses/list");
        setWarehouses(warehouseRes.data?.data || warehouseRes.data || []);
      }
    } catch {
      setData([]);
      setSummary({ count: 0, grand_total: 0, draft_count: 0, posted_count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (csvLoading) return;
    setCsvLoading(true);
    setTimeout(() => {
      downloadCsv("debit-notes-report.csv", data);
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
    if (filters.type) params.type = filters.type;

    try {
      const res = await api.get("/reports/debit-notes/pdf", { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "debit-notes-report.pdf";
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
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Debit Notes Report</h4>
        <div className="text-secondary small">Vendor returns/discount adjustments summary</div>
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
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="posted">Posted</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
                    <option value="">All</option>
                    <option value="return">Return</option>
                    <option value="discount">Discount</option>
                    <option value="damaged">Damaged</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Warehouse</Form.Label>
                  <Form.Select value={filters.warehouse_id} onChange={(e) => setFilters(f => ({ ...f, warehouse_id: e.target.value }))}>
                    <option value="">All</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
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
                      status: "",
                      type: "",
                      warehouse_id: "",
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
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Count</div><div className="fw-bold">{summary.count}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body><div className="text-secondary small">Grand Total</div><div className="fw-bold">₹{formatMoney(summary.grand_total)}</div></Card.Body></Card></Col>
        <Col md={6}><Card className="border" style={{ borderColor: "#e2e8f0" }}><Card.Body>
          <div className="text-secondary small mb-2">Status Counts</div>
          <div className="d-flex gap-2 flex-wrap">
            <Badge bg="warning">Draft: {summary.draft_count}</Badge>
            <Badge bg="success">Posted: {summary.posted_count}</Badge>
          </div>
        </Card.Body></Card></Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <div className="fw-semibold">Debit Notes</div>
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
                  <th>DN #</th>
                  <th>Bill</th>
                  <th>Vendor</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-end">Discount</th>
                  <th className="text-end">Tax</th>
                  <th className="text-end">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-4 text-secondary">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-4 text-secondary">No data</td></tr>
                ) : (
                  data.map((r) => (
                    <tr key={r.id}>
                      <td>{r.debit_note_date}</td>
                      <td className="fw-semibold">{r.debit_note_number}</td>
                      <td>{r.bill_number}</td>
                      <td>{r.vendor_name}</td>
                      <td>{r.warehouse_name || '-'}</td>
                      <td><Badge bg={badge.type(r.type)}>{r.type}</Badge></td>
                      <td><Badge bg={badge.status(r.status)}>{r.status}</Badge></td>
                      <td className="text-end">₹{formatMoney(r.subtotal)}</td>
                      <td className="text-end text-danger">-₹{formatMoney(r.discount)}</td>
                      <td className="text-end">₹{formatMoney(r.tax)}</td>
                      <td className="text-end fw-semibold">₹{formatMoney(r.grand_total)}</td>
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
