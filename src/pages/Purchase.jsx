import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Modal, Button, Form, Dropdown, Row, Col, Table } from "react-bootstrap";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";

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

export default function Purchase() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
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

  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [show, setShow] = useState(false);
  const [viewShow, setViewShow] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [form, setForm] = useState({
    vendor_id: "",
    warehouse_id: "",
    invoice_type: "Retail",
    bill_date: new Date().toISOString().split('T')[0],
    bill_number: "",
    notes: "",
    discount: 0,
    discount_percentage: 0,
    tax: 0,
    tax_percentage: 0,
    tax_name: "",
    tax_type: "Tax Exclusive",
    gst_type: "CGST/SGST",
    addless_amount: 0,
    addless_title: "Addless",
    items: []
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('purchase-visible-cols');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { id: true, bill_number: true, vendor: true, warehouse: true, date: true, total: true, action: true };
  });

  useEffect(() => {
    localStorage.setItem('purchase-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

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
    try {
      setLoading(true);
      const [purchaseRes, vendorRes, itemRes, taxRes, warehouseRes] = await Promise.all([
        api.get("/purchases", { params: table, signal }),
        api.get("/vendors", { params: { perPage: 1000 }, signal }),
        api.get("/items", { params: { perPage: 1000 }, signal }),
        api.get("/taxes", { params: { perPage: 1000 }, signal }),
        api.get("/warehouses/list", { signal }),
      ]);
      setRows(purchaseRes.data.data || []);
      setTotal(purchaseRes.data.total || 0);
      setVendors(vendorRes.data.data || []);
      setItems(itemRes.data.data || []);
      setTaxes(taxRes.data.data || []);
      setWarehouses(warehouseRes.data.data || []);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [table, reloadKey]);

  const generateBillNumber = () => {
    if (!rows || rows.length === 0) return 'PUR001';
    const numbers = rows.map(row => {
      const match = row.bill_number?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `PUR${String(maxNum + 1).padStart(3, '0')}`;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      vendor_id: "",
      warehouse_id: "",
      invoice_type: "Retail",
      bill_date: new Date().toISOString().split('T')[0],
      bill_number: generateBillNumber(),
      notes: "",
      discount: 0,
      discount_percentage: 0,
      tax: 0,
      tax_percentage: 0,
      tax_name: "",
      tax_type: "Tax Exclusive",
      gst_type: "CGST/SGST",
      addless_amount: 0,
      addless_title: "Addless",
      items: [{ item_id: "", quantity: 1, price: 0, tax_id: null, discount: 0 }]
    });
    setShow(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      vendor_id: row.vendor_id || "",
      warehouse_id: row.warehouse_id ? String(row.warehouse_id) : "",
      bill_date: row.bill_date ? row.bill_date.split('T')[0] : new Date().toISOString().split('T')[0],
      bill_number: row.bill_number || "",
      invoice_type: row.invoice_type || "Retail",
      notes: row.notes || "",
      discount: row.discount || 0,
      discount_percentage: row.discount_percentage || 0,
      tax: row.tax || 0,
      tax_percentage: row.tax_percentage || 0,
      tax_name: row.tax_name || "",
      tax_type: row.tax_type || "Tax Exclusive",
      gst_type: row.gst_type || "CGST/SGST",
      addless_amount: row.addless_amount || 0,
      addless_title: row.addless_title || "Addless",
      items: row.items?.map(it => ({ item_id: it.item_id, quantity: it.quantity, price: it.price, tax_id: it.tax_id || null, discount: it.discount || 0 })) || [{ item_id: "", quantity: 1, price: 0, tax_id: null, discount: 0 }]
    });
    setShow(true);
  };

  const viewPurchase = (row) => {
    setViewData(row);
    setViewShow(true);
  };

  const handleDownloadPDF = (row) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const url = `${baseUrl}/purchase/${row.id}/download`;
    window.open(url, '_blank');
  };

  const addItemRow = () => {
    setForm(f => ({ ...f, items: [...f.items, { item_id: "", quantity: 1, price: 0, tax_id: null, discount: 0 }] }));
  };

  const removeItemRow = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const itemsList = [...f.items];
      itemsList[idx] = { ...itemsList[idx], [field]: value };
      if (field === 'item_id' && value) {
        const selected = items.find(i => String(i.id) === String(value));
        if (selected) itemsList[idx].price = selected.purchase_price || 0;
      }
      return { ...f, items: itemsList };
    });
  };

  const getItemTaxInfo = (itemId, taxId, quantity, price, discount = 0) => {
    if (!itemId || form.invoice_type !== 'Tax Invoice') {
      return { taxAmount: 0, taxPercentage: 0, taxName: '', baseAmount: 0, isInclusive: false };
    }

    let effectiveTaxId = taxId;
    if (!effectiveTaxId) {
      const selectedItem = items.find(i => String(i.id) === String(itemId));
      effectiveTaxId = selectedItem?.tax_id;
    }

    if (!effectiveTaxId) {
      return { taxAmount: 0, taxPercentage: 0, taxName: '', baseAmount: 0, isInclusive: false };
    }

    const itemTax = taxes.find(t => String(t.id) === String(effectiveTaxId));
    if (!itemTax) return { taxAmount: 0, taxPercentage: 0, taxName: '', baseAmount: 0, isInclusive: false };

    const itemTotal = ((parseFloat(quantity) || 0) * (parseFloat(price) || 0)) - (parseFloat(discount) || 0);
    const taxPercentage = parseFloat(itemTax.percentage) || 0;
    const isInclusive = form.tax_type === 'Tax Inclusive';

    let baseAmount, taxAmount;
    if (isInclusive) {
      baseAmount = itemTotal / (1 + taxPercentage / 100);
      taxAmount = itemTotal - baseAmount;
    } else {
      baseAmount = itemTotal;
      taxAmount = (itemTotal * taxPercentage) / 100;
    }

    return {
      taxAmount,
      taxPercentage,
      taxName: itemTax.name,
      baseAmount,
      isInclusive,
      effectiveTaxId,
    };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalTax = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    form.items.forEach(it => {
      const taxInfo = getItemTaxInfo(it.item_id, it.tax_id, it.quantity, it.price, it.discount);
      const itemNetAmount = taxInfo.isInclusive ? taxInfo.baseAmount : ((parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0) - (parseFloat(it.discount) || 0));
      const itemDiscount = parseFloat(it.discount) || 0;

      subtotal += itemNetAmount;
      totalItemDiscount += itemDiscount;
      totalTax += taxInfo.taxAmount;

      if (form.gst_type === 'CGST/SGST' && taxInfo.taxAmount > 0) {
        cgstTotal += taxInfo.taxAmount / 2;
        sgstTotal += taxInfo.taxAmount / 2;
      } else {
        igstTotal += taxInfo.taxAmount;
      }
    });

    const discount = parseFloat(form.discount) || 0;
    const discountPercentage = parseFloat(form.discount_percentage) || 0;
    const addlessAmount = parseFloat(form.addless_amount) || 0;
    const grandTotal = subtotal - discount + totalTax + addlessAmount;

    return {
      subtotal,
      discount,
      discountPercentage,
      tax: totalTax,
      taxPercentage: 0,
      addlessAmount,
      grandTotal,
      totalItemDiscount,
      cgst: cgstTotal,
      sgst: sgstTotal,
      igst: igstTotal,
    };
  };

  const handleDiscountChange = (field, value) => {
    const subtotal = form.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0), 0);

    if (field === 'discount') {
      const discountAmount = parseFloat(value) || 0;
      const percentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
      setForm(f => ({ ...f, discount: discountAmount, discount_percentage: percentage.toFixed(2) }));
    } else if (field === 'discount_percentage') {
      const percentage = parseFloat(value) || 0;
      const amount = (percentage / 100) * subtotal;
      setForm(f => ({ ...f, discount_percentage: percentage, discount: amount.toFixed(2) }));
    }
  };

  const save = async () => {
    if (!form.vendor_id) { toast.warning("Select vendor"); return; }
    if (!form.warehouse_id) { toast.warning("Select warehouse"); return; }
    if (!form.bill_number) { toast.warning("Bill number required"); return; }
    if (form.items.some(i => !i.item_id)) { toast.warning("Select all items"); return; }

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/purchases/${editingId}`, form);
        toast.success("Purchase updated");
      } else {
        await api.post("/purchases", form);
        toast.success("Purchase saved");
      }
      setShow(false);
      setReloadKey(k => k + 1);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = (row) => {
    Swal.fire({
      title: "Delete purchase?",
      text: `Bill #${row.bill_number}?`,
      icon: "warning", showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/purchases/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Purchase deleted");
      } catch { toast.error("Delete failed"); }
    });
  };

  const columns = useMemo(() => {
    const all = [
      visibleCols.id && { name: "ID", selector: r => r.id, sortable: true, sortField: "id", width: "70px" },
      visibleCols.bill_number && { name: "Bill #", selector: r => r.bill_number, sortable: true, sortField: "bill_number" },
      visibleCols.vendor && { name: "Vendor", selector: r => r.vendor?.name, sortable: true, sortField: "vendor_id" },
      visibleCols.warehouse && { name: "Godown", selector: r => r.warehouse?.name || '-', sortable: true, sortField: "warehouse_id", width: "140px" },
      visibleCols.date && { name: "Date", selector: r => r.bill_date, sortable: true, sortField: "bill_date", width: "110px" },
      visibleCols.total && { name: "Total", selector: r => `₹${r.total_amount}`, sortable: true, sortField: "total_amount", width: "110px" },
      visibleCols.action && {
        name: "Action", width: "180px",
        cell: row => (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-info" onClick={() => viewPurchase(row)}><i className="fas fa-eye"></i></button>
            <button className="btn btn-outline-success" onClick={() => handleDownloadPDF(row)} title="Download PDF"><i className="fas fa-file-pdf"></i></button>
            <button className="btn btn-outline-primary" onClick={() => openEdit(row)}><i className="fas fa-edit"></i></button>
            <button className="btn btn-outline-danger" onClick={() => deletePurchase(row)}><i className="fas fa-trash"></i></button>
          </div>
        ),
      },
    ];
    return all.filter(Boolean);
  }, [visibleCols]);

  const totals = calculateTotals();
  const { subtotal, discount, discountPercentage, tax, addlessAmount, grandTotal, cgst, sgst, igst } = totals;

  return (
    <div className="card card-outline card-primary">
      <div className="card-header">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6"><h3 className="card-title">Purchase Orders</h3></div>
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
                placeholder="Search purchases..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus"></i> New Purchase</button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 border-bottom bg-light">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted small fw-bold">Show columns:</span>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <i className="fas fa-columns me-1"></i>
              {[visibleCols.id && 'ID', visibleCols.bill_number && 'Bill', visibleCols.vendor && 'Vendor', visibleCols.warehouse && 'Godown', visibleCols.date && 'Date', visibleCols.total && 'Total'].filter(Boolean).join(', ') || 'None'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {['id','bill_number','vendor','warehouse','date','total'].map(col => (
                <Dropdown.Item key={col} active={visibleCols[col]} onClick={() => setVisibleCols(v => ({ ...v, [col]: !v[col] }))}>
                  <i className={`fas ${visibleCols[col] ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  {col === 'bill_number' ? 'Bill #' : col === 'warehouse' ? 'Godown' : col === 'id' ? 'ID' : col.charAt(0).toUpperCase() + col.slice(1)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className="card-body p-0">
        <DataTable columns={columns} data={rows} progressPending={loading} persistTableHead
          pagination paginationServer paginationTotalRows={total} paginationPerPage={table.perPage}
          onChangePage={(p) => p !== table.page && dispatch({ type: "PAGE", page: p })}
          onChangeRowsPerPage={(n) => n !== table.perPage && dispatch({ type: "PER_PAGE", perPage: n })}
          sortServer onSort={(col, dir) => col.sortField && dispatch({ type: "SORT", field: col.sortField, dir })}
          striped highlightOnHover dense keyField="id" />
      </div>

      {/* Add/Edit Purchase Modal */}
      <Modal show={show} onHide={() => setShow(false)} backdrop="static" size="xl">
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Edit Purchase' : 'New Purchase'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {/* Header Section - Two Columns */}
          <Row className="mb-3">
            {/* Vendor Info */}
            <Col md={6}>
              <div className="bg-light p-3 rounded border h-100">
                <h6 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-user me-2"></i>Vendor Info
                </h6>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Vendor Name <span className="text-danger">*</span></Form.Label>
                  <Form.Select size="sm" value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Discount (₹)</Form.Label>
                      <Form.Control type="number" size="sm" step="0.01" value={form.discount} onChange={e => handleDiscountChange('discount', e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Discount (%)</Form.Label>
                      <Form.Control type="number" size="sm" step="0.01" value={form.discount_percentage} onChange={e => handleDiscountChange('discount_percentage', e.target.value)} />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Bill Info */}
            <Col md={6}>
              <div className="bg-light p-3 rounded border h-100">
                <h6 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-file-invoice me-2"></i>Bill Info
                </h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Bill # <span className="text-danger">*</span></Form.Label>
                      <Form.Control size="sm" value={form.bill_number} onChange={e => setForm(f => ({ ...f, bill_number: e.target.value }))} placeholder="e.g., PUR-001" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Bill Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="date" size="sm" value={form.bill_date} onChange={e => setForm(f => ({ ...f, bill_date: e.target.value }))} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Warehouse <span className="text-danger">*</span></Form.Label>
                      <Form.Select size="sm" value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: String(e.target.value) }))}>
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Invoice Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select size="sm" value={form.invoice_type} onChange={e => setForm(f => ({ ...f, invoice_type: e.target.value }))}>
                        <option value="Retail">Retail</option>
                        <option value="Tax Invoice">Tax Invoice</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Tax Rate Type</Form.Label>
                      <Form.Select size="sm" value={form.tax_type || 'Tax Exclusive'} onChange={e => setForm(f => ({ ...f, tax_type: e.target.value }))} disabled={form.invoice_type === 'Retail'}>
                        <option value="Tax Exclusive">Tax Exclusive</option>
                        <option value="Tax Inclusive">Tax Inclusive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-0">
                  <Form.Label className="fw-bold small">Tax (GST) Type</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check 
                      type="radio" 
                      label="CGST/SGST" 
                      name="gst_type" 
                      value="CGST/SGST" 
                      checked={form.gst_type === 'CGST/SGST'}
                      onChange={e => setForm(f => ({ ...f, gst_type: e.target.value }))}
                      disabled={form.invoice_type === 'Retail'}
                    />
                    <Form.Check 
                      type="radio" 
                      label="IGST" 
                      name="gst_type" 
                      value="IGST" 
                      checked={form.gst_type === 'IGST'}
                      onChange={e => setForm(f => ({ ...f, gst_type: e.target.value }))}
                      disabled={form.invoice_type === 'Retail'}
                    />
                  </div>
                </Form.Group>
              </div>
            </Col>
          </Row>

          {/* Item Info Section */}
          <div className="bg-light p-2 rounded border mb-3">
            <h6 className="text-primary mb-2 px-2">
              <i className="fas fa-box me-2"></i>Item Info
            </h6>
            <div className="table-responsive bg-white rounded">
              <Table bordered size="sm" className="mb-0">
                <thead className="bg-light">
                  <tr className="text-center">
                    <th style={{width: '40px'}}>#</th>
                    <th style={{width: '25%'}}>Item</th>
                    <th style={{width: '80px'}}>Qty</th>
                    <th style={{width: '100px'}}>Price (₹)</th>
                    <th style={{width: '80px'}}>Discount</th>
                    <th style={{width: '100px'}}>Amount</th>
                    <th style={{width: '120px'}}>Tax (%)</th>
                    <th style={{width: '80px'}}>Tax Amt</th>
                    <th style={{width: '40px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, idx) => {
                    const itemDiscount = parseFloat(it.discount) || 0;
                    const itemAmount = ((parseFloat(it.quantity)||0) * (parseFloat(it.price)||0)) - itemDiscount;
                    const taxInfo = getItemTaxInfo(it.item_id, it.tax_id, it.quantity, it.price, it.discount);
                    return (
                    <tr key={idx}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <Form.Select size="sm" value={it.item_id} onChange={e => updateItem(idx, 'item_id', e.target.value)}>
                          <option value="">Select Item</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.current_stock})</option>)}
                        </Form.Select>
                      </td>
                      <td><Form.Control type="number" size="sm" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                      <td><Form.Control type="number" size="sm" step="0.01" value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} /></td>
                      <td><Form.Control type="number" size="sm" step="0.01" value={it.discount || ''} onChange={e => updateItem(idx, 'discount', e.target.value)} placeholder="0" /></td>
                      <td className="text-end fw-bold">₹{itemAmount.toFixed(2)}</td>
                      <td>
                        <Form.Select size="sm" value={it.tax_id || ''} onChange={e => updateItem(idx, 'tax_id', e.target.value)} disabled={!it.item_id || form.invoice_type === 'Retail'}>
                          <option value="">No Tax</option>
                          {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>)}
                        </Form.Select>
                      </td>
                      <td className="text-end text-muted">{taxInfo.taxAmount > 0 ? `₹${taxInfo.taxAmount.toFixed(2)}` : '-'}</td>
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

          {/* Bottom Section - Addless, Notes, Summary */}
          <Row className="mt-3">
            <Col md={7}>
              <div className="bg-light p-3 rounded border h-100">
                <h6 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-edit me-2"></i>Additional Details
                </h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Addless Title</Form.Label>
                      <Form.Control size="sm" value={form.addless_title} onChange={e => setForm(f => ({ ...f, addless_title: e.target.value }))} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="fw-bold small">Addless Amount (₹)</Form.Label>
                      <Form.Control type="number" size="sm" step="0.01" value={form.addless_amount} onChange={e => setForm(f => ({ ...f, addless_amount: e.target.value }))} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-0">
                  <Form.Label className="fw-bold small">Notes</Form.Label>
                  <Form.Control as="textarea" rows={2} size="sm" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Enter any additional notes..." />
                </Form.Group>
              </div>
            </Col>

            <Col md={5}>
              <div className="bg-light p-3 rounded border h-100">
                <h6 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-calculator me-2"></i>Summary
                </h6>
                <Table bordered size="sm" className="mb-0 bg-white">
                  <tbody>
                    <tr><td className="text-end fw-bold" style={{width: '50%'}}>Subtotal:</td><td className="text-end">₹{subtotal.toFixed(2)}</td></tr>
                    <tr><td className="text-end">Discount:</td><td className="text-end text-danger">-₹{discount.toFixed(2)} ({discountPercentage.toFixed(1)}%)</td></tr>
                    {form.invoice_type === 'Tax Invoice' && form.gst_type === 'CGST/SGST' ? (
                      <>
                        <tr><td className="text-end">CGST:</td><td className="text-end">₹{cgst.toFixed(2)}</td></tr>
                        <tr><td className="text-end">SGST:</td><td className="text-end">₹{sgst.toFixed(2)}</td></tr>
                      </>
                    ) : form.invoice_type === 'Tax Invoice' && (
                      <tr><td className="text-end">IGST:</td><td className="text-end">₹{igst.toFixed(2)}</td></tr>
                    )}
                    <tr><td className="text-end">{form.addless_title}:</td><td className="text-end">₹{addlessAmount.toFixed(2)}</td></tr>
                    <tr className="bg-primary text-white"><td className="text-end fw-bold">Grand Total:</td><td className="text-end fw-bold">₹{grandTotal.toFixed(2)}</td></tr>
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2"></span>} {editingId ? 'Update Purchase' : 'Save Purchase'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Purchase Modal */}
      <Modal show={viewShow} onHide={() => setViewShow(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Purchase Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {viewData && (
            <>
              {/* Header Info */}
              <div className="bg-light p-3 rounded border mb-3">
                <Row className="mb-2">
                  <Col md={3}><strong className="text-muted small">Vendor:</strong><br/>{viewData.vendor?.name}</Col>
                  <Col md={3}><strong className="text-muted small">Bill #:</strong><br/>{viewData.bill_number}</Col>
                  <Col md={3}><strong className="text-muted small">Type:</strong><br/>{viewData.invoice_type}</Col>
                  <Col md={3}><strong className="text-muted small">Date:</strong><br/>{viewData.bill_date ? new Date(viewData.bill_date).toLocaleDateString('en-IN') : '-'}</Col>
                </Row>
                <Row className="mb-2">
                  <Col md={3}><strong className="text-muted small">Godown:</strong><br/>{viewData.warehouse?.name || '-'}</Col>
                  <Col md={3}><strong className="text-muted small">Invoice Type:</strong><br/>{viewData.invoice_type}</Col>
                </Row>
                {viewData.invoice_type === 'Tax Invoice' && (
                  <Row>
                    <Col md={3}><strong className="text-muted small">Tax Rate Type:</strong><br/>{viewData.tax_type || 'Tax Exclusive'}</Col>
                    <Col md={3}><strong className="text-muted small">GST Type:</strong><br/>{viewData.gst_type || 'CGST/SGST'}</Col>
                  </Row>
                )}
              </div>

              {/* Items Table */}
              <div className="table-responsive">
                <Table bordered size="sm">
                  <thead className="bg-light">
                    <tr className="text-center">
                      <th>#</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price (₹)</th>
                      <th>Discount (₹)</th>
                      <th>Amount (₹)</th>
                      <th>Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{it.item?.name}</td>
                        <td className="text-center">{it.quantity}</td>
                        <td className="text-end">₹{parseFloat(it.price).toFixed(2)}</td>
                        <td className="text-end">{it.discount ? `₹${parseFloat(it.discount).toFixed(2)}` : '-'}</td>
                        <td className="text-end fw-bold">₹{parseFloat(it.amount || (it.quantity * it.price - (it.discount || 0))).toFixed(2)}</td>
                        <td className="text-end text-muted small">{it.tax_amount ? `₹${parseFloat(it.tax_amount).toFixed(2)}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-3">
                <Table bordered size="sm" className="mb-0" style={{maxWidth: '400px', marginLeft: 'auto'}}>
                  <tbody>
                    <tr><td className="text-end fw-bold" style={{width: '60%'}}>Subtotal:</td><td className="text-end">₹{parseFloat(viewData.total_amount || 0).toFixed(2)}</td></tr>
                    <tr><td className="text-end">Discount:</td><td className="text-end text-danger">-₹{parseFloat(viewData.discount || 0).toFixed(2)}</td></tr>
                    {viewData.invoice_type === 'Tax Invoice' && viewData.gst_type === 'CGST/SGST' ? (
                      <>
                        <tr><td className="text-end">CGST:</td><td className="text-end">₹{(parseFloat(viewData.tax || 0) / 2).toFixed(2)}</td></tr>
                        <tr><td className="text-end">SGST:</td><td className="text-end">₹{(parseFloat(viewData.tax || 0) / 2).toFixed(2)}</td></tr>
                      </>
                    ) : viewData.invoice_type === 'Tax Invoice' && viewData.gst_type === 'IGST' ? (
                      <tr><td className="text-end">IGST:</td><td className="text-end">₹{parseFloat(viewData.tax || 0).toFixed(2)}</td></tr>
                    ) : viewData.invoice_type === 'Tax Invoice' && (
                      <tr><td className="text-end">Tax:</td><td className="text-end">₹{parseFloat(viewData.tax || 0).toFixed(2)}</td></tr>
                    )}
                    <tr><td className="text-end">{viewData.addless_title || 'Addless'}:</td><td className="text-end">₹{parseFloat(viewData.addless_amount || 0).toFixed(2)}</td></tr>
                    <tr className="bg-primary text-white"><td className="text-end fw-bold">Grand Total:</td><td className="text-end fw-bold">₹{parseFloat(viewData.grand_total || 0).toFixed(2)}</td></tr>
                  </tbody>
                </Table>
              </div>

              {viewData.notes && (
                <div className="mt-3 p-2 bg-light rounded">
                  <strong className="text-muted small">Notes:</strong>
                  <p className="mb-0">{viewData.notes}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            onClick={() => {
              if (!viewData?.id) return;
              setViewShow(false);
              nav(`/debit-notes?purchaseId=${viewData.id}`);
            }}
          >
            Create Debit Note
          </Button>
          <Button variant="secondary" onClick={() => setViewShow(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
