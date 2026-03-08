import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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

const statusColors = { draft: 'warning', posted: 'success' };
const typeColors = { return: 'info', discount: 'primary', damaged: 'danger' };

export default function DebitNotes() {
  const [params, setParams] = useSearchParams();
  const canViewNotes = canView("debit-notes");
  const prefillAppliedRef = useRef(false);

  const initialTable = { page: getNum(params.get("page"), 1), perPage: getNum(params.get("perPage"), 10), search: params.get("search") || "" };
  const [table, dispatch] = useReducer(tableReducer, initialTable);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(initialTable.search);

  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [show, setShow] = useState(false);
  const [viewShow, setViewShow] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [form, setForm] = useState({
    purchase_id: "", warehouse_id: "", debit_note_date: new Date().toISOString().split('T')[0], type: "return", reason: "", items: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const newParams = new URLSearchParams({ page: table.page, perPage: table.perPage, search: table.search });
    if (newParams.toString() !== params.toString()) setParams(newParams);
  }, [table, params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => { const s = searchInput.trim(); if (s !== table.search) dispatch({ type: "SEARCH", search: s }); }, 400);
    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = async (signal) => {
    if (!canViewNotes) return;
    setLoading(true);
    try {
      const [notesRes, purchRes, itemsRes, warehousesRes] = await Promise.all([
        api.get("/debit-notes", { params: table, signal }),
        api.get("/purchases", { params: { perPage: 1000 }, signal }),
        api.get("/items", { params: { perPage: 1000 }, signal }),
        api.get("/warehouses/list", { signal })
      ]);
      setRows(notesRes.data.data || []);
      setTotal(notesRes.data.total || 0);
      setPurchases(purchRes.data.data || []);
      setItems(itemsRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [table, reloadKey, canViewNotes]);

  const selectPurchase = (purchaseId) => {
    const purchase = purchases.find(p => String(p.id) === String(purchaseId));
    setSelectedPurchase(purchase);
    if (purchase) {
      setForm(f => ({
        ...f, purchase_id: purchaseId,
        items: purchase.items?.map(it => ({
          item_id: it.item_id,
          original_quantity: it.quantity,
          quantity: 0,
          price: it.price,
          discount: it.discount || 0,
          tax_percentage: it.tax_percentage || 0,
          purchase_item_id: it.id,
          reason: ""
        })) || []
      }));
    }
  };

  // Option B: open modal + preselect bill based on URL param (?purchaseId=123)
  useEffect(() => {
    if (!canViewNotes) return;
    const purchaseId = params.get("purchaseId");
    if (!purchaseId) return;
    if (prefillAppliedRef.current) return;
    if (!purchases || purchases.length === 0) return;

    prefillAppliedRef.current = true;
    setShow(true);
    selectPurchase(purchaseId);
  }, [params, purchases, canViewNotes]);

  const updateItemQty = (idx, qty) => {
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], quantity: Math.max(0, parseFloat(qty) || 0) }; return { ...f, items }; });
  };

  const calculateTotals = () => {
    let subtotal = 0, discount = 0, tax = 0;
    form.items.forEach(it => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.price) || 0;
      const disc = parseFloat(it.discount) || 0;
      const taxPct = parseFloat(it.tax_percentage) || 0;
      const itemAmt = (qty * price) - disc;
      subtotal += (qty * price); discount += disc; tax += (itemAmt * taxPct) / 100;
    });
    return { subtotal, discount, tax, grandTotal: subtotal - discount + tax };
  };

  const save = async () => {
    if (!form.purchase_id) { toast.warning("Select purchase bill"); return; }
    if (form.items.every(i => i.quantity <= 0)) { toast.warning("Enter at least one item quantity"); return; }
    const validItems = form.items.filter(i => i.quantity > 0);
    if (validItems.length === 0) { toast.warning("No items with quantity > 0"); return; }

    try {
      setSaving(true);
      await api.post("/debit-notes", { ...form, items: validItems });
      toast.success("Debit Note created");
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) { toast.error(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const deleteNote = (row) => {
    Swal.fire({ title: "Delete Debit Note?", text: `#${row.debit_note_number}?`, icon: "warning", showCancelButton: true }).then(async (r) => {
      if (!r.isConfirmed) return;
      try { await api.delete(`/debit-notes/${row.id}`); setReloadKey(k => k + 1); toast.success("Deleted"); } catch { toast.error("Delete failed"); }
    });
  };

  const postNote = (row) => {
    Swal.fire({ title: "Post Debit Note?", text: `Post #${row.debit_note_number}?`, icon: "question", showCancelButton: true, confirmButtonText: "Post" }).then(async (r) => {
      if (!r.isConfirmed) return;
      try { await api.post(`/debit-notes/${row.id}/post`); setReloadKey(k => k + 1); toast.success("Posted"); } catch (e) { toast.error(e.response?.data?.message || "Post failed"); }
    });
  };

  const columns = useMemo(() => [
    { name: "DN #", selector: r => r.debit_note_number, sortable: true },
    { name: "Date", selector: r => r.debit_note_date, width: "110px" },
    { name: "Bill", selector: r => r.purchase?.bill_number },
    { name: "Vendor", selector: r => r.purchase?.vendor?.name },
    { name: "Type", cell: r => <Badge bg={typeColors[r.type]}>{r.type}</Badge>, width: "100px" },
    { name: "Amount", selector: r => `₹${formatMoney(r.grand_total)}`, sortable: true },
    { name: "Status", cell: r => <Badge bg={statusColors[r.status]}>{r.status}</Badge>, width: "90px" },
    { name: "Action", width: "180px", cell: row => (
      <div className="btn-group btn-group-sm">
        <button className="btn btn-outline-info" onClick={() => { setViewData(row); setViewShow(true); }}><i className="fas fa-eye"></i></button>
        {row.status === 'draft' && canEdit("debit-notes") && <button className="btn btn-outline-success" onClick={() => postNote(row)}><i className="fas fa-check"></i></button>}
        {row.status === 'draft' && canDelete("debit-notes") && <button className="btn btn-outline-danger" onClick={() => deleteNote(row)}><i className="fas fa-trash"></i></button>}
      </div>
    )},
  ], []);

  const totals = calculateTotals();

  if (!canViewNotes) return <div className="p-4"><div className="card"><div className="card-body text-center py-5"><div className="text-secondary">Access denied</div></div></div></div>;

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Debit Notes</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }} placeholder="Search..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              {canCreate("debit-notes") && <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}><i className="fas fa-plus"></i> New Debit Note</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable columns={columns} data={rows} progressPending={loading} persistTableHead
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          striped highlightOnHover dense keyField="id" />
      </div>

      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="xl">
        <Modal.Header closeButton><Modal.Title>New Debit Note</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group><Form.Label>Select Purchase Bill <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.purchase_id} onChange={e => selectPurchase(e.target.value)}>
                  <option value="">-- Select --</option>
                  {purchases.map(p => <option key={p.id} value={p.id}>#{p.bill_number} - {p.vendor?.name} - ₹{formatMoney(p.grand_total)}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group><Form.Label>From Godown <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}>
                  <option value="">-- Select Godown --</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} {w.is_primary ? '(Primary)' : ''}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group><Form.Label>Date <span className="text-danger">*</span></Form.Label>
                <Form.Control type="date" value={form.debit_note_date} onChange={e => setForm(f => ({ ...f, debit_note_date: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group><Form.Label>Type</Form.Label>
                <Form.Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="return">Return</option><option value="discount">Discount</option><option value="damaged">Damaged</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {selectedPurchase && (
            <div className="bg-light p-2 rounded border mb-3">
              <h6 className="text-primary mb-2 px-2">Items to Return/Debit</h6>
              <Table bordered size="sm" className="bg-white">
                <thead className="bg-light"><tr><th>Item</th><th>Original Qty</th><th>Debit Qty</th><th>Price</th><th>Reason</th></tr></thead>
                <tbody>
                  {form.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{items.find(i => String(i.id) === String(it.item_id))?.name || it.item_id}</td>
                      <td>{it.original_quantity}</td>
                      <td><Form.Control type="number" size="sm" min="0" max={it.original_quantity} value={it.quantity ?? ''} onChange={e => updateItemQty(idx, e.target.value)} /></td>
                      <td>₹{it.price}</td>
                      <td><Form.Control size="sm" placeholder="Reason" value={it.reason} onChange={e => { const items = [...form.items]; items[idx].reason = e.target.value; setForm(f => ({ ...f, items })); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <Row>
            <Col md={6}><Form.Group><Form.Label>Reason/Notes</Form.Label><Form.Control as="textarea" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></Form.Group></Col>
            <Col md={6}>
              <div className="bg-light p-3 rounded border">
                <Table bordered size="sm" className="mb-0 bg-white">
                  <tbody>
                    <tr><td className="text-end fw-bold">Subtotal:</td><td className="text-end">₹{totals.subtotal.toFixed(2)}</td></tr>
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
          <Button variant="primary" onClick={save} disabled={saving}>{saving && <span className="spinner-border spinner-border-sm me-2"></span>} Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={viewShow} onHide={() => setViewShow(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Debit Note #{viewData?.debit_note_number}</Modal.Title></Modal.Header>
        <Modal.Body>
          {viewData && (<>
            <div className="bg-light p-3 rounded border mb-3">
              <Row>
                <Col md={4}><strong className="text-muted small">Bill:</strong><br/>{viewData.purchase?.bill_number}</Col>
                <Col md={4}><strong className="text-muted small">Date:</strong><br/>{viewData.debit_note_date}</Col>
                <Col md={4}><strong className="text-muted small">Status:</strong><br/><Badge bg={statusColors[viewData.status]}>{viewData.status}</Badge></Col>
              </Row>
            </div>
            <Table bordered size="sm">
              <thead className="bg-light"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
              <tbody>
                {viewData.items?.map((it, idx) => (<tr key={idx}><td>{it.item?.name}</td><td>{it.quantity}</td><td>₹{it.price}</td><td>₹{it.amount}</td></tr>))}
              </tbody>
            </Table>
            <div className="mt-3"><Table bordered size="sm" className="mb-0" style={{ maxWidth: '400px', marginLeft: 'auto' }}>
              <tbody>
                <tr><td className="text-end fw-bold">Grand Total:</td><td className="text-end fw-bold">₹{viewData.grand_total}</td></tr>
              </tbody>
            </Table></div>
          </>)}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setViewShow(false)}>Close</Button></Modal.Footer>
      </Modal>
    </div>
  );
}
