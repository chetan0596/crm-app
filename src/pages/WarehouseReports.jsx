import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { Card, Form, Button, Badge, Row, Col, Tabs, Tab } from "react-bootstrap";
import api from "../api";

export default function WarehouseReports() {
  const [activeTab, setActiveTab] = useState("stock");
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  // Report Data
  const [stockData, setStockData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [transferData, setTransferData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);

  useEffect(() => {
    loadWarehouses();
    loadItems();
  }, []);

  const loadWarehouses = async () => {
    try {
      const res = await api.get("/warehouses/list");
      setWarehouses(res.data.data || []);
    } catch {
      setWarehouses([]);
    }
  };

  const loadItems = async () => {
    try {
      const res = await api.get("/items", { params: { perPage: 1000 } });
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    }
  };

  const loadStockByWarehouse = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-stock", {
        params: { warehouse_id: selectedWarehouse, search }
      });
      setStockData(res.data.data || []);
    } catch {
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-summary");
      setSummaryData(res.data.data || []);
    } catch {
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-ledger", {
        params: { warehouse_id: selectedWarehouse, item_id: selectedItem }
      });
      setLedgerData(res.data.data || []);
    } catch {
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTransferReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-transfers", {
        params: {
          from_date: fromDate,
          to_date: toDate,
          from_warehouse_id: selectedWarehouse
        }
      });
      setTransferData(res.data.data || []);
    } catch {
      setTransferData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLowStock = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/warehouse-low-stock");
      setLowStockData(res.data.data || []);
    } catch {
      setLowStockData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    switch (activeTab) {
      case "stock":
        loadStockByWarehouse();
        break;
      case "summary":
        loadWarehouseSummary();
        break;
      case "ledger":
        loadLedger();
        break;
      case "transfers":
        loadTransferReport();
        break;
      case "lowstock":
        loadLowStock();
        break;
    }
  }, [activeTab]);

  const stockColumns = useMemo(() => [
    { name: "Godown", selector: r => r.warehouse_name, sortable: true },
    { name: "Item", selector: r => r.item_name, sortable: true },
    { name: "SKU", selector: r => r.sku, sortable: true, width: "120px" },
    { name: "Unit", selector: r => r.unit, width: "80px" },
    { name: "Quantity", selector: r => r.quantity, sortable: true, width: "100px", right: true },
    { name: "Purchase Price", selector: r => `₹${r.purchase_price || 0}`, width: "120px", right: true },
    { name: "Stock Value", selector: r => `₹${Number(r.stock_value || 0).toFixed(2)}`, width: "120px", right: true },
  ], []);

  const summaryColumns = useMemo(() => [
    { name: "Godown Name", selector: r => r.name, sortable: true },
    { name: "Location", selector: r => r.location || "-" },
    { name: "Primary", cell: r => r.is_primary ? <Badge bg="primary">Yes</Badge> : <Badge bg="secondary">No</Badge>, width: "80px" },
    { name: "Total Items", selector: r => r.total_items, sortable: true, width: "100px", right: true },
    { name: "Total Qty", selector: r => r.total_quantity, sortable: true, width: "100px", right: true },
    { name: "Stock Value", selector: r => `₹${Number(r.stock_value || 0).toFixed(2)}`, width: "120px", right: true },
  ], []);

  const ledgerColumns = useMemo(() => [
    { name: "Date", selector: r => new Date(r.date).toLocaleDateString(), sortable: true, width: "100px" },
    { name: "Type", cell: r => (
      <Badge bg={r.type === 'Transfer In' ? 'success' : r.type === 'Transfer Out' ? 'warning' : 'info'}>
        {r.type}
      </Badge>
    ), width: "100px" },
    { name: "Reference", selector: r => r.reference, width: "120px" },
    { name: "Item", selector: r => r.item_name },
    { name: "Qty", selector: r => r.quantity, width: "80px", right: true },
    { name: "Godown", selector: r => r.warehouse || "-" },
  ], []);

  const transferColumns = useMemo(() => [
    { name: "Date", selector: r => new Date(r.transfer_date).toLocaleDateString(), sortable: true, width: "100px" },
    { name: "Transfer #", selector: r => r.transfer_number, width: "120px" },
    { name: "From Godown", selector: r => r.from_warehouse },
    { name: "To Godown", selector: r => r.to_warehouse },
    { name: "Status", cell: r => (
      <Badge bg={r.status === 'completed' ? 'success' : r.status === 'draft' ? 'warning' : 'secondary'}>
        {r.status}
      </Badge>
    ), width: "100px" },
    { name: "Items", selector: r => r.total_items, width: "80px", right: true },
    { name: "Qty", selector: r => r.total_quantity, width: "80px", right: true },
  ], []);

  const lowStockColumns = useMemo(() => [
    { name: "Godown", selector: r => r.warehouse_name, sortable: true },
    { name: "Item", selector: r => r.item_name, sortable: true },
    { name: "SKU", selector: r => r.sku, width: "120px" },
    { name: "Unit", selector: r => r.unit, width: "80px" },
    { name: "Current", selector: r => r.current_stock, width: "80px", right: true },
    { name: "Min Stock", selector: r => r.min_stock, width: "80px", right: true },
    { name: "Status", cell: r => (
      <Badge bg={r.current_stock <= 0 ? 'danger' : 'warning'}>
        {r.current_stock <= 0 ? 'Out of Stock' : 'Low Stock'}
      </Badge>
    ), width: "120px" },
  ], []);

  return (
    <div className="container-fluid py-4">
      <h4 className="fw-bold mb-4">Warehouse (Godown) Reports</h4>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="stock" title="📦 Stock by Godown">
          <Card>
            <Card.Header className="bg-white">
              <Row className="g-2">
                <Col md={4}>
                  <Form.Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                    <option value="">All Godowns</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Control placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={loadStockByWarehouse}>Load</Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable className="modern-datatable" columns={stockColumns} data={stockData} progressPending={loading} striped highlightOnHover dense progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} / progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No data found</div>
                <div className="small text-muted">Try adjusting your filters or check back later</div>
              </div>
            }>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="summary" title="🏭 Godown Summary">
          <Card>
            <Card.Header className="bg-white d-flex justify-content-between">
              <span className="fw-bold">Godown-wise Stock Summary</span>
              <Button variant="outline-primary" size="sm" onClick={loadWarehouseSummary}>Refresh</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable className="modern-datatable" columns={summaryColumns} data={summaryData} progressPending={loading} striped highlightOnHover dense progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} / progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No data found</div>
                <div className="small text-muted">Try adjusting your filters or check back later</div>
              </div>
            }>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="ledger" title="📋 Item Ledger">
          <Card>
            <Card.Header className="bg-white">
              <Row className="g-2">
                <Col md={4}>
                  <Form.Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                    <option value="">Select Godown</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                    <option value="">All Items</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={loadLedger} disabled={!selectedWarehouse}>Load</Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable className="modern-datatable" columns={ledgerColumns} data={ledgerData} progressPending={loading} striped highlightOnHover dense progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} / progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No data found</div>
                <div className="small text-muted">Try adjusting your filters or check back later</div>
              </div>
            }>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="transfers" title="🔄 Transfer History">
          <Card>
            <Card.Header className="bg-white">
              <Row className="g-2">
                <Col md={3}>
                  <Form.Control type="date" placeholder="From Date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Form.Control type="date" placeholder="To Date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Form.Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                    <option value="">From/To Godown</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={loadTransferReport}>Load</Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable className="modern-datatable" columns={transferColumns} data={transferData} progressPending={loading} striped highlightOnHover dense progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} / progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No data found</div>
                <div className="small text-muted">Try adjusting your filters or check back later</div>
              </div>
            }>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="lowstock" title="⚠️ Low Stock">
          <Card>
            <Card.Header className="bg-white d-flex justify-content-between">
              <span className="fw-bold">Low Stock Items by Godown</span>
              <Button variant="outline-primary" size="sm" onClick={loadLowStock}>Refresh</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <DataTable className="modern-datatable" columns={lowStockColumns} data={lowStockData} progressPending={loading} striped highlightOnHover dense progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} / progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>} noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No data found</div>
                <div className="small text-muted">Try adjusting your filters or check back later</div>
              </div>
            }>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
