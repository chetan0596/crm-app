import { useEffect, useState } from "react";
import { Card, Row, Col, Form, Table, Badge, Button } from "react-bootstrap";
import api from "../../api";
import { canView } from "../../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ItemLedger() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_in: 0,
    total_out: 0,
    closing_balance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const canViewLedger = canView("item-ledger");

  const loadData = async () => {
    if (!canViewLedger) return;

    setLoading(true);
    try {
      const params = {};
      if (selectedItem) params.item_id = selectedItem;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get("/item-ledger", { params });
      console.log('ItemLedger Response:', res.data);
      setItems(res.data.items || []);
      setTransactions(res.data.transactions || []);
      setSummary(res.data.summary || { total_in: 0, total_out: 0, closing_balance: 0 });
    } catch (err) {
      console.error("Failed to load item ledger:", err);
      setTransactions([]);
      setSummary({ total_in: 0, total_out: 0, closing_balance: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewLedger) {
      loadData();
    }
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleClear = () => {
    setSelectedItem("");
    setFromDate("");
    setToDate("");
    loadData();
  };

  const handleDownloadPDF = () => {
    if (!selectedItem) {
      alert('Please select an item first');
      return;
    }

    if (loading) return;

    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    api
      .get(`/item-ledger/${selectedItem}/pdf`, { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `item-ledger-${selectedItem}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download item ledger PDF:", err);
      });
  };

  if (!canViewLedger) {
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

  const selectedItemData = items.find((i) => String(i.id) === String(selectedItem));

  const renderTransactionRows = () => {
    let runningBalance = 0;
    const rows = [];
    const firstSummary = transactions.find(t => t.type === 'summary');
    const openingBalance = Number(firstSummary?.opening_stock || 0);
    runningBalance = openingBalance;

    rows.push(
      <tr key="opening" style={{ backgroundColor: "#f8fafc" }}>
        <td style={{ color: "#1e293b", fontWeight: "bold" }}>{firstSummary?.date || '-'}</td>
        <td>
          <Badge bg="secondary" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
            Opening Balance
          </Badge>
        </td>
        <td colSpan={selectedItem ? 3 : 4} style={{ color: "#64748b" }}>-</td>
        <td className="text-end" style={{ color: "#475569" }}>-</td>
        <td className="text-end" style={{ color: "#475569" }}>-</td>
        <td className="text-end" style={{ color: "#475569" }}>-</td>
        <td className="text-end" style={{ color: "#475569" }}>-</td>
        <td className="text-end fw-semibold" style={{ color: "#2563eb" }}>{Number(runningBalance || 0).toFixed(3)}</td>
      </tr>
    );

    transactions.forEach((t, index) => {
      if (t.type === 'summary') {
        rows.push(
          <tr key={`summary-${index}`} style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
            <td style={{ color: "#1e293b", fontWeight: "bold" }}>{t.date}</td>
            <td>
              <Badge bg="primary" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                Daily Summary
              </Badge>
            </td>
            <td colSpan={selectedItem ? 3 : 4} style={{ color: "#1e293b", fontWeight: "bold" }}>
              Opening: {Number(t.opening_stock || 0).toFixed(3)} | Closing: {Number(t.closing_stock || 0).toFixed(3)}
            </td>
            <td className="text-end" style={{ color: "#475569" }}>-</td>
            <td className="text-end" style={{ color: "#475569" }}>-</td>
            <td className="text-end" style={{ color: "#475569" }}>-</td>
            <td className="text-end" style={{ color: "#475569" }}>-</td>
            <td className="text-end fw-semibold" style={{ color: "#2563eb" }}>{Number(t.closing_stock || 0).toFixed(3)}</td>
          </tr>
        );
      } else {
        const qtyIn = Number(t.quantity_in || 0);
        const qtyOut = Number(t.quantity_out || 0);
        if (qtyIn > 0) runningBalance += qtyIn;
        if (qtyOut > 0) runningBalance -= qtyOut;

        const getBadgeBg = (type) => {
          switch (type) {
            case 'Purchase': return 'success';
            case 'Sale': return 'danger';
            case 'Sale Return': return 'info';
            case 'Purchase Return': return 'warning';
            default: return 'secondary';
          }
        };

        rows.push(
          <tr key={`trans-${index}`} style={{ borderColor: "#f1f5f9" }}>
            <td style={{ color: "#475569" }}>{t.date}</td>
            <td>
              <Badge
                bg={getBadgeBg(t.type)}
                style={{ fontSize: "0.75rem", fontWeight: 500 }}
              >
                {t.type}
              </Badge>
            </td>
            <td style={{ color: "#1e293b" }}>{t.reference}</td>
            <td style={{ color: "#475569" }}>{t.party}</td>
            {!selectedItem && (
              <td style={{ color: "#1e293b" }}>
                <div className="small">{t.item_name}</div>
                <div className="small text-secondary">{t.item_sku}</div>
              </td>
            )}
            <td className="text-end fw-medium" style={{ color: "#059669" }}>
              {qtyIn > 0 ? qtyIn.toFixed(3) : "-"}
            </td>
            <td className="text-end fw-medium" style={{ color: "#dc2626" }}>
              {qtyOut > 0 ? qtyOut.toFixed(3) : "-"}
            </td>
            <td className="text-end" style={{ color: "#475569" }}>₹{formatMoney(t.rate)}</td>
            <td className="text-end fw-medium" style={{ color: "#1e293b" }}>₹{formatMoney(t.value)}</td>
            <td className="text-end fw-semibold" style={{ color: "#2563eb" }}>{Number(runningBalance || 0).toFixed(3)}</td>
          </tr>
        );
      }
    });

    return rows;
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Item Ledger</h4>
        <div className="text-secondary small">View item transaction history with running balance</div>
      </div>

      <Card className="mb-4 border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleFilter}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="small text-secondary mb-1">Item</Form.Label>
                <Form.Select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="">All Items</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ borderColor: "#e2e8f0" }}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="small text-secondary mb-1">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
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
                  <Button 
                    type="button" 
                    variant="success" 
                    onClick={handleDownloadPDF} 
                    disabled={!selectedItem || loading}
                  >
                    Download PDF
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>

          {selectedItemData && (
            <div className="mt-3 pt-3 border-top" style={{ borderColor: "#e2e8f0" }}>
              <Row className="g-3">
                <Col md={3}>
                  <div className="small text-secondary">Selected Item</div>
                  <div className="fw-semibold" style={{ color: "#1e293b" }}>{selectedItemData.name}</div>
                </Col>
                <Col md={3}>
                  <div className="small text-secondary">SKU</div>
                  <div className="fw-semibold" style={{ color: "#1e293b" }}>{selectedItemData.sku}</div>
                </Col>
                <Col md={3}>
                  <div className="small text-secondary">Current Stock</div>
                  <div className="fw-semibold" style={{ color: "#059669" }}>{selectedItemData.current_stock}</div>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="small text-secondary mb-1">Total In (Purchases)</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#059669" }}>{Number(summary.total_in || 0).toFixed(3)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="small text-secondary mb-1">Total Out (Sales)</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#dc2626" }}>{Number(summary.total_out || 0).toFixed(3)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="small text-secondary mb-1">Net Movement</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: Number(summary.total_in || 0) - Number(summary.total_out || 0) >= 0 ? "#059669" : "#dc2626" }}>
                {(Number(summary.total_in || 0) - Number(summary.total_out || 0)).toFixed(3)}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="small text-secondary mb-1">Closing Balance</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#2563eb" }}>{Number(summary.closing_balance || 0).toFixed(3)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="fw-semibold" style={{ color: "#1e293b" }}>Transaction History</div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Type</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reference</th>
                <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party</th>
                {!selectedItem && (
                  <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item</th>
                )}
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qty In</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Qty Out</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rate</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Value</th>
                <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={selectedItem ? 9 : 10} className="text-center text-secondary py-4">Loading...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={selectedItem ? 9 : 10} className="text-center text-secondary py-4">No transactions found</td>
                </tr>
              ) : (
                renderTransactionRows()
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
