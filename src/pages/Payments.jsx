import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Badge, Row, Col, Card, Tab, Tabs } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";
import { canCreate, canEdit, canDelete, canView } from "../utils/permissions";

const tableReducer = (state, action) => {
  switch (action.type) {
    case "PAGE": return { ...state, page: action.page };
    case "PER_PAGE": return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH": return { ...state, search: action.search, page: 1 };
    case "SORT": return { ...state, sortField: action.field, sortDir: action.dir };
    default: return state;
  }
};

const getNum = (v, fallback = 1) => {
  const n = parseInt(v, 10);
  return isNaN(n) || n < 1 ? fallback : n;
};

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Payments() {
  const [params, setParams] = useSearchParams();
  const canViewPayments = canView("payments");

  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 10),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [activeTab, setActiveTab] = useState("payments");

  const [outstanding, setOutstanding] = useState([]);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [outstandingFilters, setOutstandingFilters] = useState({
    from: "",
    to: "",
    customer_id: "",
    vendor_id: "",
    status: "",
    warehouse_id: "",
  });
  const [summary, setSummary] = useState({
    today_received: 0,
    today_paid: 0,
    month_received: 0,
    month_paid: 0,
    total_outstanding_sales: 0,
    total_outstanding_purchases: 0,
  });

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    type: "sale",
    sale_id: "",
    purchase_id: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const downloadOutstandingPDF = () => {
    if (loading) return;
    const type = activeTab === "outstanding-sales" ? "sale" : "purchase";
    const params = { type };
    if (table.search) params.search = table.search;
    if (outstandingFilters.from) params.from = outstandingFilters.from;
    if (outstandingFilters.to) params.to = outstandingFilters.to;
    if (outstandingFilters.status) params.status = outstandingFilters.status;
    if (outstandingFilters.warehouse_id) params.warehouse_id = outstandingFilters.warehouse_id;
    if (type === "sale" && outstandingFilters.customer_id) params.customer_id = outstandingFilters.customer_id;
    if (type === "purchase" && outstandingFilters.vendor_id) params.vendor_id = outstandingFilters.vendor_id;

    api
      .get("/reports/outstanding/pdf", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = type === "sale" ? "outstanding-sales-report.pdf" : "outstanding-purchases-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {});
  };

  const downloadOutstandingExcel = () => {
    if (loading) return;
    const type = activeTab === "outstanding-sales" ? "sale" : "purchase";
    const params = { type };
    if (table.search) params.search = table.search;
    if (outstandingFilters.from) params.from = outstandingFilters.from;
    if (outstandingFilters.to) params.to = outstandingFilters.to;
    if (outstandingFilters.status) params.status = outstandingFilters.status;
    if (outstandingFilters.warehouse_id) params.warehouse_id = outstandingFilters.warehouse_id;
    if (type === "sale" && outstandingFilters.customer_id) params.customer_id = outstandingFilters.customer_id;
    if (type === "purchase" && outstandingFilters.vendor_id) params.vendor_id = outstandingFilters.vendor_id;

    api
      .get("/reports/outstanding/csv", { params, responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = type === "sale" ? "outstanding-sales-report.csv" : "outstanding-purchases-report.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page, perPage: table.perPage, search: table.search,
      sort: table.sortField, dir: table.sortDir,
    });
    if (newParams.toString() !== params.toString()) setParams(newParams);
  }, [table, params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) dispatch({ type: "SEARCH", search: s });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = async (signal) => {
    if (!canViewPayments) return;
    setLoading(true);
    try {
      const [payRes, sumRes] = await Promise.all([
        api.get("/payments", { params: { page: table.page, perPage: table.perPage, type: form.type }, signal }),
        api.get("/payment-summary", { signal }),
      ]);
      setRows(payRes.data.data || []);
      setTotal(payRes.data.total || 0);
      setSummary(sumRes.data);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  const loadOutstanding = async (signal) => {
    if (!canViewPayments) return;
    const type = activeTab === "outstanding-sales" ? "sale" : "purchase";
    setLoading(true);
    try {
      const [res, sumRes] = await Promise.all([
        api.get("/outstanding", {
          params: {
            type,
            search: table.search,
            perPage: table.perPage,
            page: table.page,
            from: outstandingFilters.from,
            to: outstandingFilters.to,
            status: outstandingFilters.status,
            warehouse_id: outstandingFilters.warehouse_id,
            customer_id: type === "sale" ? outstandingFilters.customer_id : "",
            vendor_id: type === "purchase" ? outstandingFilters.vendor_id : "",
          },
          signal,
        }),
        api.get("/payment-summary", { signal }),
      ]);
      setOutstanding(res.data.data || []);
      setOutstandingTotal(res.data.total || 0);
      setSummary(sumRes.data);
    } catch { 
      setOutstanding([]); 
      setOutstandingTotal(0); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === "payments") {
      setOutstanding([]); // Clear outstanding data when switching to payments
      load(controller.signal);
    } else {
      setRows([]); // Clear payments data when switching to outstanding
      loadOutstanding(controller.signal);
    }
    return () => controller.abort();
  }, [table, reloadKey, activeTab, canViewPayments, outstandingFilters]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [salesRes, purchRes, custRes, vendRes, warehouseRes] = await Promise.all([
          api.get("/sales", { params: { perPage: 1000 } }),
          api.get("/purchases", { params: { perPage: 1000 } }),
          api.get("/customers", { params: { perPage: 1000 } }),
          api.get("/vendors", { params: { perPage: 1000 } }),
          api.get("/warehouses/list"),
        ]);
        setSales(salesRes.data?.data || []);
        setPurchases(purchRes.data?.data || []);
        setCustomers(custRes.data?.data || []);
        setVendors(vendRes.data?.data || []);
        setWarehouses(warehouseRes.data?.data || warehouseRes.data || []);
      } catch {}
    };
    loadDropdowns();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      type: "sale",
      sale_id: "",
      purchase_id: "",
      amount: "",
      payment_method: "cash",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShow(true);
  };

  const openPaymentFor = (row, type) => {
    setEditingId(null);
    setForm({
      type,
      sale_id: type === "sale" ? row.id : "",
      purchase_id: type === "purchase" ? row.id : "",
      amount: row.outstanding,
      payment_method: "cash",
      reference_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShow(true);
  };

  const save = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.warning("Enter valid amount"); return; }
    if (form.type === "sale" && !form.sale_id) { toast.warning("Select invoice"); return; }
    if (form.type === "purchase" && !form.purchase_id) { toast.warning("Select purchase bill"); return; }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/payments/${editingId}`, form);
        toast.success("Payment updated");
      } else {
        await api.post("/payments", form);
        toast.success("Payment recorded");
      }
      setShow(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = (row) => {
    Swal.fire({
      title: "Delete payment?",
      text: `Amount: ₹${formatMoney(row.amount)}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/payments/${row.id}`);
        setReloadKey((k) => k + 1);
        toast.success("Payment deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const paymentColumns = useMemo(() => [
    { name: "ID", selector: (r) => r.id, sortable: true, sortField: "id", width: "70px" },
    { name: "Date", selector: (r) => r.payment_date, sortable: true, sortField: "payment_date", width: "110px" },
    { name: "Type", cell: (row) => <Badge bg={row.type === "sale" ? "success" : "warning"}>{row.type === "sale" ? "Received" : "Paid"}</Badge>, width: "100px" },
    { name: "Invoice/Bill", selector: (r) => r.sale?.invoice_number || r.purchase?.bill_number || "-" },
    { name: "Party", selector: (r) => r.sale?.customer?.name || r.purchase?.vendor?.name || "-" },
    { name: "Method", selector: (r) => r.payment_method.replace(/_/g, " ").toUpperCase() },
    { name: "Amount", selector: (r) => `₹${formatMoney(r.amount)}`, sortable: true, sortField: "amount" },
    { name: "Reference", selector: (r) => r.reference_number || "-" },
    {
      name: "Action",
      width: "120px",
      cell: (row) => (
        <div className="btn-group btn-group-sm">
          {canDelete("payments") && (
            <button className="btn btn-outline-danger" onClick={() => deletePayment(row)}><i className="fas fa-trash"></i></button>
          )}
        </div>
      ),
    },
  ], []);

  const outstandingColumns = useMemo(() => [
    { name: "Number", selector: (r) => r.number, sortable: true },
    { name: "Date", selector: (r) => r.date, sortable: true, width: "110px" },
    { name: "Party", selector: (r) => r.party },
    { name: "Warehouse", selector: (r) => r.warehouse_name || "-" },
    {
      name: "Total",
      selector: (r) => `₹${formatMoney(r.total)}`,
      sortable: true,
      cell: (row) => <span className="text-primary fw-bold">₹{formatMoney(row.total)}</span>,
    },
    {
      name: "Paid",
      selector: (r) => `₹${formatMoney(r.paid)}`,
      sortable: true,
      cell: (row) => <span className="text-success">₹{formatMoney(row.paid)}</span>,
    },
    {
      name: "Outstanding",
      selector: (r) => `₹${formatMoney(r.outstanding)}`,
      sortable: true,
      cell: (row) => <span className="text-danger fw-bold">₹{formatMoney(row.outstanding)}</span>,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge bg={row.status === "paid" ? "success" : row.status === "partial" ? "warning" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
    {
      name: "Action",
      width: "140px",
      cell: (row) => (
        row.outstanding > 0 && canCreate("payments") ? (
          <button className="btn btn-primary btn-sm" onClick={() => openPaymentFor(row, row.type)}>
            <i className="fas fa-plus me-1"></i> Pay
          </button>
        ) : (
          <span className="text-success"><i className="fas fa-check-circle"></i> Paid</span>
        )
      ),
    },
  ], []);

  if (!canViewPayments) {
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
        <h4 className="fw-semibold mb-1" style={{ color: "#1e293b" }}>Payments</h4>
        <div className="text-secondary small">Record payments and track outstanding amounts</div>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#f0fdf4" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Today Received</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#059669" }}>₹{formatMoney(summary.today_received)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#fef3c7" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Today Paid</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#d97706" }}>₹{formatMoney(summary.today_paid)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#eff6ff" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Month Received</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#2563eb" }}>₹{formatMoney(summary.month_received)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Month Paid</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#64748b" }}>₹{formatMoney(summary.month_paid)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#fef2f2" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Outstanding Sales</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#dc2626" }}>₹{formatMoney(summary.total_outstanding_sales)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border h-100" style={{ borderColor: "#e2e8f0", backgroundColor: "#fef2f2" }}>
            <Card.Body className="p-3">
              <div className="small text-secondary mb-1">Outstanding Purchases</div>
              <div className="h5 mb-0 fw-semibold" style={{ color: "#dc2626" }}>₹{formatMoney(summary.total_outstanding_purchases)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border" style={{ borderColor: "#e2e8f0" }}>
        <Card.Header className="bg-white border-bottom py-3" style={{ borderColor: "#e2e8f0" }}>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-0">
                <Tab eventKey="payments" title={<>Payments</>} />
                <Tab eventKey="outstanding-sales" title={<>Outstanding Sales</>} />
                <Tab eventKey="outstanding-purchases" title={<>Outstanding Purchases</>} />
              </Tabs>
            </div>
            <div className="col-12 col-md-6">
              <div className="d-flex gap-2 flex-wrap justify-content-md-end">
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 220 }}
                  placeholder={activeTab === "payments" ? "Search payments..." : "Search..."}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {activeTab === "payments" && canCreate("payments") && (
                  <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <i className="fas fa-plus"></i> Record Payment
                  </button>
                )}

                {activeTab !== "payments" && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={downloadOutstandingExcel} disabled={loading}>
                      <i className="fas fa-file-excel me-1"></i> Excel
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={downloadOutstandingPDF} disabled={loading}>
                      <i className="fas fa-file-pdf me-1"></i> PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {activeTab !== "payments" && (
            <div className="row g-2 mt-2">
              <div className="col-12 col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={outstandingFilters.from}
                  onChange={(e) => setOutstandingFilters((f) => ({ ...f, from: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-2">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={outstandingFilters.to}
                  onChange={(e) => setOutstandingFilters((f) => ({ ...f, to: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-2">
                <Form.Select
                  size="sm"
                  value={outstandingFilters.status}
                  onChange={(e) => setOutstandingFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </Form.Select>
              </div>
              <div className="col-12 col-md-3">
                <Form.Select
                  size="sm"
                  value={outstandingFilters.warehouse_id}
                  onChange={(e) => setOutstandingFilters((f) => ({ ...f, warehouse_id: e.target.value }))}
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-12 col-md-3">
                {activeTab === "outstanding-sales" ? (
                  <Form.Select
                    size="sm"
                    value={outstandingFilters.customer_id}
                    onChange={(e) => setOutstandingFilters((f) => ({ ...f, customer_id: e.target.value }))}
                  >
                    <option value="">All Customers</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Select
                    size="sm"
                    value={outstandingFilters.vendor_id}
                    onChange={(e) => setOutstandingFilters((f) => ({ ...f, vendor_id: e.target.value }))}
                  >
                    <option value="">All Vendors</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </Form.Select>
                )}
              </div>
            </div>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {activeTab === "payments" ? (
            <DataTable
          className="modern-datatable"
              columns={paymentColumns}
              data={rows}
              progressPending={loading}
          progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
persistTableHead
              pagination
              paginationServer
              paginationTotalRows={total}
              paginationPerPage={table.perPage}
              onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
              onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
              striped
              highlightOnHover
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
            <DataTable
              columns={outstandingColumns}
              data={outstanding}
              progressPending={loading}
              persistTableHead
              pagination
              paginationServer
              paginationTotalRows={outstandingTotal}
              paginationPerPage={table.perPage}
              onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
              onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
              striped
              highlightOnHover
              dense
              keyField="id"
            />
          )}
        </Card.Body>
      </Card>

      {/* Record Payment Modal */}
      <Modal show={show} onHide={() => setShow(false)} backdrop="static">
        <Modal.Header closeButton><Modal.Title>{editingId ? "Edit Payment" : "Record Payment"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Payment Type</Form.Label>
            <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, sale_id: "", purchase_id: "" })}>
              <option value="sale">Payment Received (from Customer)</option>
              <option value="purchase">Payment Paid (to Vendor)</option>
            </Form.Select>
          </Form.Group>

          {form.type === "sale" ? (
            <Form.Group className="mb-3">
              <Form.Label>Select Invoice <span className="text-danger">*</span></Form.Label>
              <Form.Select value={form.sale_id} onChange={(e) => setForm({ ...form, sale_id: e.target.value })}>
                <option value="">-- Select Invoice --</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>#{s.invoice_number} - {s.customer?.name} - ₹{formatMoney(s.grand_total)}</option>
                ))}
              </Form.Select>
            </Form.Group>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>Select Purchase Bill <span className="text-danger">*</span></Form.Label>
              <Form.Select value={form.purchase_id} onChange={(e) => setForm({ ...form, purchase_id: e.target.value })}>
                <option value="">-- Select Bill --</option>
                {purchases.map((p) => (
                  <option key={p.id} value={p.id}>#{p.bill_number} - {p.vendor?.name} - ₹{formatMoney(p.grand_total)}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Amount (₹) <span className="text-danger">*</span></Form.Label>
                <Form.Control type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Date</Form.Label>
                <Form.Control type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reference Number</Form.Label>
                <Form.Control value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="Cheque/UTR number" />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-0">
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} Record Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
