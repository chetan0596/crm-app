import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Badge, Row, Col, Table } from "react-bootstrap";
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

const statusColors = {
  draft: 'secondary',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  converted: 'primary',
};

export default function Quotations() {
  const [params, setParams] = useSearchParams();
  const canViewQuotations = canView("quotations");

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

  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const [show, setShow] = useState(false);
  const [viewShow, setViewShow] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [form, setForm] = useState({
    customer_id: "",
    quotation_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    notes: "",
    status: "draft",
    items: [{ item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }]
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
    if (!canViewQuotations) return;
    setLoading(true);
    try {
      const [quotRes, custRes, itemRes, taxRes] = await Promise.all([
        api.get("/quotations", { params: table, signal }),
        api.get("/customers", { params: { perPage: 1000 }, signal }),
        api.get("/items", { params: { perPage: 1000 }, signal }),
        api.get("/taxes", { params: { perPage: 1000 }, signal })
      ]);
      setRows(quotRes.data.data || []);
      setTotal(quotRes.data.total || 0);
      setCustomers(custRes.data.data || []);
      setItems(itemRes.data.data || []);
      setTaxes(taxRes.data.data || []);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [table, reloadKey, canViewQuotations]);

  const generateQuotationNumber = () => {
    const year = new Date().getFullYear();
    const prefix = `QT${year}`;
    const existing = rows.filter(r => r.quotation_number?.startsWith(prefix));
    const maxNum = existing.length > 0
      ? Math.max(...existing.map(r => parseInt(r.quotation_number.slice(-4)) || 0))
      : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      customer_id: "",
      quotation_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      notes: "",
      status: "draft",
      items: [{ item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }]
    });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      customer_id: row.customer_id || "",
      quotation_date: row.quotation_date ? row.quotation_date.split('T')[0] : new Date().toISOString().split('T')[0],
      expiry_date: row.expiry_date ? row.expiry_date.split('T')[0] : "",
      notes: row.notes || "",
      status: row.status || "draft",
      items: row.items?.map(it => ({
        item_id: it.item_id,
        quantity: it.quantity,
        price: it.price,
        discount: it.discount || 0,
        tax_percentage: it.tax_percentage || 0,
        description: it.description || ""
      })) || [{ item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }]
    });
    setShow(true);
  };

  const viewQuotation = (row) => {
    setViewData(row);
    setViewShow(true);
  };

  const addItemRow = () => {
    setForm(f => ({ ...f, items: [...f.items, { item_id: "", quantity: 1, price: 0, discount: 0, tax_percentage: 0, description: "" }] }));
  };

  const removeItemRow = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const formItems = [...f.items];
      formItems[idx] = { ...formItems[idx], [field]: value };
      if (field === 'item_id' && value) {
        const selectedItem = items.find(i => String(i.id) === String(value));
        if (selectedItem) {
          formItems[idx].price = selectedItem.sale_price || 0;
          formItems[idx].tax_percentage = selectedItem.tax?.percentage || 0;
        }
      }
      return { ...f, items: formItems };
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    form.items.forEach(it => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.price) || 0;
      const discount = parseFloat(it.discount) || 0;
      const taxPct = parseFloat(it.tax_percentage) || 0;

      const itemTotal = (qty * price) - discount;
      const taxAmount = (itemTotal * taxPct) / 100;

      subtotal += (qty * price);
      totalDiscount += discount;
      totalTax += taxAmount;
    });

    return {
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      grandTotal: subtotal - totalDiscount + totalTax
    };
  };

  const save = async () => {
    if (!form.customer_id) { toast.warning("Select customer"); return; }
    if (form.items.some(i => !i.item_id)) { toast.warning("Select all items"); return; }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/quotations/${editingId}`, form);
        toast.success("Quotation updated");
      } else {
        await api.post("/quotations", form);
        toast.success("Quotation created");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuotation = (row) => {
    Swal.fire({
      title: "Delete quotation?",
      text: `Quotation #${row.quotation_number}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/quotations/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Quotation deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const convertToSale = (row) => {
    Swal.fire({
      title: "Convert to Sale?",
      text: `Convert quotation #${row.quotation_number} to invoice?`,
      icon: "question", showCancelButton: true, confirmButtonText: "Convert"
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.post(`/quotations/${row.id}/convert`);
        setReloadKey(k => k + 1);
        toast.success("Converted to sale successfully");
      } catch (e) {
        toast.error(e.response?.data?.message || "Conversion failed");
      }
    });
  };

  const columns = useMemo(() => [
    { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "60px" },
    { name: "Quotation #", selector: r => r.quotation_number, sortable: true, sortField: "quotation_number" },
    { name: "Date", selector: r => r.quotation_date, sortable: true, sortField: "quotation_date", width: "110px" },
    { name: "Customer", selector: r => r.customer?.name },
    { name: "Amount", selector: r => `₹${formatMoney(r.grand_total)}`, sortable: true, sortField: "grand_total" },
    { 
      name: "Status", 
      cell: row => (
        <Badge bg={statusColors[row.status] || 'secondary'} className="py-2 px-3">
          {row.status?.toUpperCase()}
        </Badge>
      ), 
      width: "120px" 
    },
    {
      name: "Action", width: "220px",
      cell: row => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-outline-info" onClick={() => viewQuotation(row)} title="View"><i className="fas fa-eye"></i></button>
          {row.status !== 'converted' && canEdit("quotations") && (
            <button className="btn btn-outline-primary" onClick={() => openEdit(row)} title="Edit"><i className="fas fa-edit"></i></button>
          )}
          {row.status === 'accepted' && canCreate("quotations") && (
            <button className="btn btn-success" onClick={() => convertToSale(row)} title="Convert to Invoice">
              <i className="fas fa-file-invoice"></i>
            </button>
          )}
          {row.status !== 'converted' && canDelete("quotations") && (
            <button className="btn btn-outline-danger" onClick={() => deleteQuotation(row)} title="Delete"><i className="fas fa-trash"></i></button>
          )}
        </div>
      ),
    },
  ], []);

  const totals = calculateTotals();

  if (!canViewQuotations) {
    return (
      <div className="p-4">
        <div className="card"><div className="card-body text-center py-5"><div className="text-secondary">Access denied</div></div></div>
      </div>
    );
  }

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Quotations</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search quotations..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              {canCreate("quotations") && (
                <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> New Quotation</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable columns={columns} data={rows} progressPending={loading} persistTableHead
          className="modern-datatable"
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
          noDataComponent={
            <div className="p-5 text-center">
              <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
              <div className="fw-semibold text-secondary mb-1">No data found</div>
              <div className="small text-muted">Try adjusting your filters or check back later</div>
            </div>
          }
          striped highlightOnHover dense keyField="id" />
      </div>

      {/* Add/Edit Modal */}
      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="xl">
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Edit Quotation' : 'New Quotation'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Quotation Date <span className="text-danger">*</span></Form.Label>
                <Form.Control type="date" value={form.quotation_date} onChange={e => setForm(f => ({ ...f, quotation_date: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Expiry Date</Form.Label>
                <Form.Control type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </Form.Group>
            </Col>
          </Row>

          {editingId && (
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
          )}

          <div className="bg-light p-2 rounded border mb-3">
            <h6 className="text-primary mb-2 px-2"><i className="fas fa-box me-2"></i>Items</h6>
            <div className="table-responsive bg-white rounded">
              <Table bordered size="sm" className="mb-0">
                <thead className="bg-light">
                  <tr className="text-center">
                    <th style={{width: '40px'}}>#</th>
                    <th style={{width: '30%'}}>Item</th>
                    <th style={{width: '80px'}}>Qty</th>
                    <th style={{width: '100px'}}>Price</th>
                    <th style={{width: '80px'}}>Discount</th>
                    <th style={{width: '80px'}}>Tax %</th>
                    <th style={{width: '100px'}}>Amount</th>
                    <th style={{width: '40px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, idx) => {
                    const qty = parseFloat(it.quantity) || 0;
                    const price = parseFloat(it.price) || 0;
                    const discount = parseFloat(it.discount) || 0;
                    const amount = (qty * price) - discount;
                    return (
                    <tr key={idx}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <Form.Select size="sm" value={it.item_id} onChange={e => updateItem(idx, 'item_id', e.target.value)}>
                          <option value="">Select Item</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </Form.Select>
                      </td>
                      <td><Form.Control type="number" size="sm" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                      <td><Form.Control type="number" size="sm" step="0.01" value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} /></td>
                      <td><Form.Control type="number" size="sm" step="0.01" value={it.discount || ''} onChange={e => updateItem(idx, 'discount', e.target.value)} placeholder="0" /></td>
                      <td><Form.Control type="number" size="sm" step="0.01" value={it.tax_percentage || ''} onChange={e => updateItem(idx, 'tax_percentage', e.target.value)} placeholder="0" /></td>
                      <td className="text-end fw-bold">₹{amount.toFixed(2)}</td>
                      <td className="text-center">
                        <Button variant="outline-danger" size="sm" onClick={() => removeItemRow(idx)}><i className="fas fa-trash"></i></Button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            <div className="mt-2 px-2">
              <Button variant="outline-primary" size="sm" onClick={addItemRow}><i className="fas fa-plus me-1"></i>Add Item</Button>
            </div>
          </div>

          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Terms & conditions, delivery details, etc." />
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="bg-light p-3 rounded border">
                <Table bordered size="sm" className="mb-0 bg-white">
                  <tbody>
                    <tr><td className="text-end fw-bold" style={{width: '50%'}}>Subtotal:</td><td className="text-end">₹{totals.subtotal.toFixed(2)}</td></tr>
                    <tr><td className="text-end">Discount:</td><td className="text-end text-danger">-₹{totals.discount.toFixed(2)}</td></tr>
                    <tr><td className="text-end">Tax:</td><td className="text-end">₹{totals.tax.toFixed(2)}</td></tr>
                    <tr className="bg-primary text-white"><td className="text-end fw-bold">Grand Total:</td><td className="text-end fw-bold">₹{totals.grandTotal.toFixed(2)}</td></tr>
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} {editingId ? 'Update' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal */}
      <Modal show={viewShow} onHide={() => setViewShow(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quotation #{viewData?.quotation_number}</Modal.Title>
          <div className="ms-auto d-flex gap-2">
            {viewData?.status === 'accepted' && canCreate("quotations") && (
              <Button variant="success" size="sm" onClick={() => { setViewShow(false); convertToSale(viewData); }}>
                <i className="fas fa-file-invoice me-1"></i> Convert to Invoice
              </Button>
            )}
            {viewData?.status !== 'converted' && canEdit("quotations") && (
              <Button variant="primary" size="sm" onClick={() => { setViewShow(false); openEdit(viewData); }}>
                <i className="fas fa-edit me-1"></i> Edit
              </Button>
            )}
          </div>
        </Modal.Header>
        <Modal.Body>
          {viewData && (
            <>
              <div className="bg-light p-3 rounded border mb-3">
                <Row>
                  <Col md={4}><strong className="text-muted small">Customer:</strong><br/>{viewData.customer?.name}</Col>
                  <Col md={3}><strong className="text-muted small">Date:</strong><br/>{viewData.quotation_date}</Col>
                  <Col md={3}><strong className="text-muted small">Expiry:</strong><br/>{viewData.expiry_date || '-'}</Col>
                  <Col md={2}><strong className="text-muted small">Status:</strong><br/><Badge bg={statusColors[viewData.status]}>{viewData.status?.toUpperCase()}</Badge></Col>
                </Row>
              </div>
              
              {/* Status Workflow */}
              <div className="mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  {viewData.status === 'draft' && canEdit("quotations") && (
                    <>
                      <Button variant="outline-info" size="sm" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'sent'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Sent"); }}>
                        <i className="fas fa-paper-plane me-1"></i> Mark as Sent
                      </Button>
                      <Button variant="outline-success" size="sm" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'accepted'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Accepted"); }}>
                        <i className="fas fa-check me-1"></i> Mark as Accepted
                      </Button>
                    </>
                  )}
                  {viewData.status === 'sent' && canEdit("quotations") && (
                    <>
                      <Button variant="outline-success" size="sm" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'accepted'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Accepted"); }}>
                        <i className="fas fa-check me-1"></i> Mark as Accepted
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={async () => { await api.put(`/quotations/${viewData.id}`, {...viewData, status: 'rejected'}); setReloadKey(k => k + 1); setViewShow(false); toast.success("Marked as Rejected"); }}>
                        <i className="fas fa-times me-1"></i> Mark as Rejected
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Table bordered size="sm">
                <thead className="bg-light">
                  <tr><th>Item</th><th>Qty</th><th>Price</th><th>Discount</th><th>Tax</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {viewData.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.item?.name}</td>
                      <td>{it.quantity}</td>
                      <td>₹{it.price}</td>
                      <td>₹{it.discount || 0}</td>
                      <td>₹{it.tax_amount || 0}</td>
                      <td className="text-end fw-bold">₹{it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-3">
                <Table bordered size="sm" className="mb-0" style={{maxWidth: '400px', marginLeft: 'auto'}}>
                  <tbody>
                    <tr><td className="text-end fw-bold">Subtotal:</td><td className="text-end">₹{viewData.subtotal}</td></tr>
                    <tr><td className="text-end">Discount:</td><td className="text-end text-danger">-₹{viewData.discount}</td></tr>
                    <tr><td className="text-end">Tax:</td><td className="text-end">₹{viewData.tax}</td></tr>
                    <tr className="bg-primary text-white"><td className="text-end fw-bold">Grand Total:</td><td className="text-end fw-bold">₹{viewData.grand_total}</td></tr>
                  </tbody>
                </Table>
              </div>
              {viewData.notes && (
                <div className="mt-3 p-2 bg-light rounded">
                  <strong className="text-muted small">Notes:</strong>
                  <p className="mb-0">{viewData.notes}</p>
                </div>
              )}
              {viewData.converted_sale && (
                <div className="mt-3 p-2 bg-success text-white rounded">
                  <strong><i className="fas fa-check-circle me-2"></i>Converted to Invoice:</strong> {viewData.converted_sale.invoice_number}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewShow(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
