import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Card, Form, Modal, Row, Col, Badge, Table } from "react-bootstrap";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";
import api from "../api";

export default function StockTransfer() {
  const canViewTransfers = canView("stock-transfers");
  const canCreateTransfer = canCreate("stock-transfers");
  const canEditTransfer = canEdit("stock-transfers");
  const canDeleteTransfer = canDelete("stock-transfers");

  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  
  const [formData, setFormData] = useState({
    transfer_number: "",
    transfer_date: new Date().toISOString().split("T")[0],
    from_warehouse_id: "",
    to_warehouse_id: "",
    notes: "",
    items: [{ item_id: "", quantity: "" }],
  });
  const [warehouseStocks, setWarehouseStocks] = useState({});
  const [errors, setErrors] = useState({});

  const statusBadge = {
    draft: { bg: "warning", label: "Draft" },
    completed: { bg: "success", label: "Completed" },
    cancelled: { bg: "secondary", label: "Cancelled" },
  };

  const columns = useMemo(
    () => [
      {
        name: "Transfer #",
        selector: (row) => row.transfer_number,
        sortable: true,
        width: "120px",
      },
      {
        name: "Date",
        selector: (row) => row.transfer_date,
        cell: (row) => new Date(row.transfer_date).toLocaleDateString(),
        sortable: true,
        width: "110px",
      },
      {
        name: "From Warehouse",
        selector: (row) => row.from_warehouse?.name || "-",
      },
      {
        name: "To Warehouse",
        selector: (row) => row.to_warehouse?.name || "-",
      },
      {
        name: "Items",
        selector: (row) => row.items?.length || 0,
        width: "80px",
        center: true,
      },
      {
        name: "Status",
        selector: (row) => row.status,
        cell: (row) => {
          const badge = statusBadge[row.status];
          return <Badge bg={badge?.bg || "secondary"}>{badge?.label || row.status}</Badge>;
        },
        width: "100px",
        center: true,
      },
      {
        name: "Actions",
        cell: (row) => (
          <div className="d-flex gap-1">
            <Button variant="outline-info" size="sm" onClick={() => handleView(row)}>
              <i className="fas fa-eye"></i>
            </Button>
            {row.status === "draft" && canEditTransfer && (
              <>
                <Button variant="outline-success" size="sm" onClick={() => handleComplete(row)} title="Complete Transfer">
                  <i className="fas fa-check"></i>
                </Button>
                <Button variant="outline-warning" size="sm" onClick={() => handleCancel(row)} title="Cancel Transfer">
                  <i className="fas fa-times"></i>
                </Button>
              </>
            )}
            {row.status === "draft" && canDeleteTransfer && (
              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(row)}>
                <i className="fas fa-trash"></i>
              </Button>
            )}
          </div>
        ),
        width: "150px",
        center: true,
      },
    ],
    [canEditTransfer, canDeleteTransfer]
  );

  const loadTransfers = async () => {
    if (!canViewTransfers) return;
    setLoading(true);
    try {
      const res = await api.get("/stock-transfers", {
        params: { page, perPage },
      });
      setTransfers(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to load transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await api.get("/warehouses/list");
      setWarehouses(res.data.data || []);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    }
  };

  const loadItems = async () => {
    try {
      const res = await api.get("/items", { params: { perPage: 1000 } });
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  };

  useEffect(() => {
    loadTransfers();
    loadWarehouses();
    loadItems();
  }, [page, perPage]);

  const handleView = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
  };

  const handleComplete = async (transfer) => {
    if (!confirm("Complete this stock transfer? Stock will be moved from source to destination warehouse.")) return;
    try {
      await api.post(`/stock-transfers/${transfer.id}/complete`);
      loadTransfers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete transfer");
    }
  };

  const handleCancel = async (transfer) => {
    if (!confirm("Cancel this stock transfer?")) return;
    try {
      await api.post(`/stock-transfers/${transfer.id}/cancel`);
      loadTransfers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel transfer");
    }
  };

  const handleDelete = async (transfer) => {
    if (!confirm(`Delete transfer "${transfer.transfer_number}"?`)) return;
    try {
      await api.delete(`/stock-transfers/${transfer.id}`);
      loadTransfers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete transfer");
    }
  };

  const addItemRow = () => {
    setFormData((d) => ({
      ...d,
      items: [...d.items, { item_id: "", quantity: "" }],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((d) => ({
      ...d,
      items: d.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemRow = (index, field, value) => {
    setFormData((d) => ({
      ...d,
      items: d.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSave = async () => {
    setErrors({});
    try {
      await api.post("/stock-transfers", formData);
      setShowModal(false);
      resetForm();
      loadTransfers();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || "Failed to create transfer");
      }
    }
  };

  const loadWarehouseStocks = async (warehouseId) => {
    if (!warehouseId) {
      setWarehouseStocks({});
      return;
    }
    try {
      const res = await api.get(`/warehouses/${warehouseId}/stock`);
      const stocks = {};
      (res.data.data || []).forEach((stock) => {
        stocks[stock.item_id] = stock.available_quantity || 0;
      });
      setWarehouseStocks(stocks);
    } catch (err) {
      console.error("Failed to load warehouse stocks:", err);
      setWarehouseStocks({});
    }
  };

  const resetForm = () => {
    setFormData({
      transfer_number: "",
      transfer_date: new Date().toISOString().split("T")[0],
      from_warehouse_id: "",
      to_warehouse_id: "",
      notes: "",
      items: [{ item_id: "", quantity: "" }],
    });
    setErrors({});
    setWarehouseStocks({});
  };

  const generateTransferNumber = () => {
    const prefix = "ST";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${random}`;
  };

  if (!canViewTransfers) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">You don't have permission to view stock transfers.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Stock Transfers</h4>
        {canCreateTransfer && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setFormData((d) => ({ ...d, transfer_number: generateTransferNumber() }));
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus me-2"></i>New Transfer
          </Button>
        )}
      </div>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <div className="fw-semibold">Transfer History</div>
          <div className="text-muted small">Total: {total} transfers</div>
        </Card.Header>
        <Card.Body className="p-0">
          <DataTable
          className="modern-datatable"
            columns={columns}
            data={transfers}
            progressPending={loading}
          progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
persistTableHead
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={perPage}
            onChangePage={setPage}
            onChangeRowsPerPage={setPerPage}
            highlightOnHover
            striped
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

      {/* Create Transfer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="xl">
        <Modal.Header closeButton>
          <Modal.Title>New Stock Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small">
                  Transfer Number <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  value={formData.transfer_number}
                  onChange={(e) => setFormData((d) => ({ ...d, transfer_number: e.target.value }))}
                  isInvalid={!!errors.transfer_number}
                />
                <Form.Control.Feedback type="invalid">{errors.transfer_number}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small">
                  Transfer Date <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={formData.transfer_date}
                  onChange={(e) => setFormData((d) => ({ ...d, transfer_date: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small">
                  From Warehouse <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={formData.from_warehouse_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((d) => ({ ...d, from_warehouse_id: value }));
                    loadWarehouseStocks(value);
                  }}
                  isInvalid={!!errors.from_warehouse_id}
                >
                  <option value="">Select Source</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.from_warehouse_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small">
                  To Warehouse <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={formData.to_warehouse_id}
                  onChange={(e) => setFormData((d) => ({ ...d, to_warehouse_id: e.target.value }))}
                  isInvalid={!!errors.to_warehouse_id}
                >
                  <option value="">Select Destination</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.to_warehouse_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              size="sm"
              value={formData.notes}
              onChange={(e) => setFormData((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Optional notes about this transfer"
            />
          </Form.Group>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 fw-bold">Items to Transfer</h6>
            <Button variant="outline-primary" size="sm" onClick={addItemRow}>
              <i className="fas fa-plus me-1"></i>Add Item
            </Button>
          </div>

          {errors.items && <div className="text-danger small mb-2">{errors.items}</div>}

          <Table bordered size="sm">
            <thead className="bg-light">
              <tr>
                  <th style={{ width: "40%" }}>Item</th>
                <th style={{ width: "25%" }}>Quantity</th>
                <th style={{ width: "25%" }}>Available Stock</th>
                <th style={{ width: "10%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <Form.Select
                      size="sm"
                      value={item.item_id}
                      onChange={(e) => updateItemRow(index, "item_id", e.target.value)}
                    >
                      <option value="">Select Item</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      min="0.001"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => updateItemRow(index, "quantity", e.target.value)}
                      placeholder="Qty"
                    />
                  </td>
                  <td className="align-middle">
                    {item.item_id && (
                      <Badge bg={warehouseStocks[item.item_id] > 0 ? "info" : "danger"}>
                        {warehouseStocks[item.item_id] || 0} available
                      </Badge>
                    )}
                  </td>
                  <td>
                    {formData.items.length > 1 && (
                      <Button variant="outline-danger" size="sm" onClick={() => removeItemRow(index)}>
                        <i className="fas fa-trash"></i>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Create Transfer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Transfer Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Transfer Details - {selectedTransfer?.transfer_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransfer && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="small text-muted">Transfer Number</div>
                  <div className="fw-bold">{selectedTransfer.transfer_number}</div>
                </Col>
                <Col md={6}>
                  <div className="small text-muted">Transfer Date</div>
                  <div className="fw-bold">{new Date(selectedTransfer.transfer_date).toLocaleDateString()}</div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="small text-muted">From Warehouse</div>
                  <div className="fw-bold">{selectedTransfer.from_warehouse?.name}</div>
                </Col>
                <Col md={6}>
                  <div className="small text-muted">To Warehouse</div>
                  <div className="fw-bold">{selectedTransfer.to_warehouse?.name}</div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="small text-muted">Status</div>
                  <div>
                    <Badge bg={statusBadge[selectedTransfer.status]?.bg || "secondary"}>
                      {statusBadge[selectedTransfer.status]?.label || selectedTransfer.status}
                    </Badge>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="small text-muted">Created By</div>
                  <div className="fw-bold">{selectedTransfer.created_by?.name || "-"}</div>
                </Col>
              </Row>
              {selectedTransfer.notes && (
                <div className="mb-3">
                  <div className="small text-muted">Notes</div>
                  <div>{selectedTransfer.notes}</div>
                </div>
              )}

              <h6 className="fw-bold mb-2">Items</h6>
              <Table bordered size="sm">
                <thead className="bg-light">
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransfer.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item?.name}</td>
                      <td>{item.item?.sku}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
