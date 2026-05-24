import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Card, Form, Modal, Row, Col, Badge } from "react-bootstrap";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";
import api from "../api";

export default function WarehouseMaster() {
  const canViewWarehouses = canView("warehouses");
  const canCreateWarehouse = canCreate("warehouses");
  const canEditWarehouse = canEdit("warehouses");
  const canDeleteWarehouse = canDelete("warehouses");

  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    is_primary: false,
  });
  const [errors, setErrors] = useState({});

  const columns = useMemo(
    () => [
      {
        name: "Code",
        selector: (row) => row.code,
        sortable: true,
        width: "100px",
      },
      {
        name: "Name",
        selector: (row) => row.name,
        sortable: true,
      },
      {
        name: "Address",
        selector: (row) => row.address || "-",
        cell: (row) => <span className="text-muted small">{row.address || "-"}</span>,
      },
      {
        name: "Phone",
        selector: (row) => row.phone || "-",
        width: "120px",
      },
      {
        name: "Status",
        selector: (row) => row.is_active,
        cell: (row) => (
          <Badge bg={row.is_active ? "success" : "secondary"}>
            {row.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
        width: "100px",
        center: true,
      },
      {
        name: "Primary",
        selector: (row) => row.is_primary,
        cell: (row) =>
          row.is_primary ? (
            <Badge bg="primary">Default</Badge>
          ) : (
            <span className="text-muted">-</span>
          ),
        width: "100px",
        center: true,
      },
      {
        name: "Actions",
        cell: (row) => (
          <div className="d-flex gap-1">
            {canEditWarehouse && (
              <Button variant="outline-primary" size="sm" onClick={() => handleEdit(row)}>
                <i className="fas fa-edit"></i>
              </Button>
            )}
            {canDeleteWarehouse && (
              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(row)}>
                <i className="fas fa-trash"></i>
              </Button>
            )}
          </div>
        ),
        width: "100px",
        center: true,
      },
    ],
    [canEditWarehouse, canDeleteWarehouse]
  );

  const loadWarehouses = async () => {
    if (!canViewWarehouses) return;
    setLoading(true);
    try {
      const res = await api.get("/warehouses", {
        params: {
          page,
          perPage,
          search,
        },
      });
      setWarehouses(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [page, perPage, search]);

  const handleEdit = (warehouse) => {
    setEditingId(warehouse.id);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || "",
      phone: warehouse.phone || "",
      email: warehouse.email || "",
      is_active: warehouse.is_active,
      is_primary: warehouse.is_primary,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (warehouse) => {
    if (!confirm(`Delete warehouse "${warehouse.name}"?`)) return;
    try {
      await api.delete(`/warehouses/${warehouse.id}`);
      loadWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete warehouse");
    }
  };

  const handleSave = async () => {
    setErrors({});
    try {
      if (editingId) {
        await api.put(`/warehouses/${editingId}`, formData);
      } else {
        await api.post("/warehouses", formData);
      }
      setShowModal(false);
      loadWarehouses();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || "Failed to save warehouse");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      is_active: true,
      is_primary: false,
    });
    setErrors({});
  };

  if (!canViewWarehouses) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">You don't have permission to view warehouses.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Warehouse Management</h4>
        {canCreateWarehouse && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus me-2"></i>New Warehouse
          </Button>
        )}
      </div>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              type="text"
              placeholder="Search warehouses..."
              size="sm"
              style={{ width: "250px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-muted small">
            Total: {total} warehouses
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <DataTable
          className="modern-datatable"
            columns={columns}
            data={warehouses}
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
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Edit Warehouse" : "New Warehouse"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">
                  Warehouse Code <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  value={formData.code}
                  onChange={(e) => setFormData((d) => ({ ...d, code: e.target.value }))}
                  placeholder="e.g., WH001"
                  isInvalid={!!errors.code}
                />
                <Form.Control.Feedback type="invalid">{errors.code}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">
                  Warehouse Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  size="sm"
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Enter warehouse name"
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              size="sm"
              value={formData.address}
              onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
              placeholder="Enter warehouse address"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Phone</Form.Label>
                <Form.Control
                  size="sm"
                  value={formData.phone}
                  onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Email</Form.Label>
                <Form.Control
                  size="sm"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                  placeholder="Enter email address"
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="is_active"
                  label="Active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((d) => ({ ...d, is_active: e.target.checked }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="is_primary"
                  label="Set as Default Warehouse"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData((d) => ({ ...d, is_primary: e.target.checked }))}
                  help="This will be the default warehouse for single-warehouse clients"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {editingId ? "Update" : "Create"} Warehouse
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
