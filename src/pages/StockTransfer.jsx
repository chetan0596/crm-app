import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";
import api from "../api";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const strVal = (v) => (v === "" || v == null ? "" : String(v));

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const headCellSx = {
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  px: 2,
  py: 1.5,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const bodyCellSx = {
  verticalAlign: 'middle',
  px: 2,
  py: 1.5,
  borderBottom: '1px solid #f1f5f9',
};

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const actionBtnSx = { border: '1px solid', borderColor: 'divider' };

const statusChipMap = {
  draft: { label: 'Draft', sx: { bgcolor: '#fff4d6', color: '#b76e00' } },
  completed: { label: 'Completed', sx: { bgcolor: '#dbf5e9', color: '#118d57' } },
  cancelled: { label: 'Cancelled', sx: { bgcolor: '#f1f5f9', color: '#475569' } },
};

const detailLabelSx = { color: 'text.secondary' };
const detailValueSx = { fontWeight: 700 };

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
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");
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

  const loadTransfers = useCallback(async () => {
    if (!canViewTransfers) return;
    setLoading(true);
    try {
      const res = await api.get("/stock-transfers", {
        params: { page, perPage },
      });
      setTransfers(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total) || 0);
    } catch (err) {
      console.error("Failed to load transfers:", err);
    } finally {
      setLoading(false);
    }
  }, [canViewTransfers, page, perPage]);

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await api.get("/warehouses/list");
      setWarehouses(toArray(res.data));
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get("/items", { params: { perPage: 1000 } });
      setItems(toArray(res.data));
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  }, []);

  useEffect(() => {
    loadTransfers();
    loadWarehouses();
    loadItems();
  }, [loadTransfers, loadWarehouses, loadItems]);

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
      toArray(res.data).forEach((stock) => {
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

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShowModal(false);
  };

  const sortedTransfers = useMemo(() => {
    if (!sortField) return transfers;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...transfers].sort((a, b) => {
      const av = a?.[sortField];
      const bv = b?.[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [transfers, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const columns = [
    {
      key: 'transfer_number', label: 'Transfer #', sortField: 'transfer_number', width: 140,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.transfer_number || '-'}</Typography>,
    },
    {
      key: 'transfer_date', label: 'Date', sortField: 'transfer_date', width: 120,
      render: (row) => new Date(row.transfer_date).toLocaleDateString(),
    },
    {
      key: 'from_warehouse', label: 'From Warehouse', minWidth: 150,
      render: (row) => row.from_warehouse?.name || '-',
    },
    {
      key: 'to_warehouse', label: 'To Warehouse', minWidth: 150,
      render: (row) => row.to_warehouse?.name || '-',
    },
    {
      key: 'items', label: 'Items', width: 80, align: 'center',
      render: (row) => row.items?.length || 0,
    },
    {
      key: 'status', label: 'Status', width: 120, align: 'center',
      render: (row) => {
        const badge = statusChipMap[row.status];
        return (
          <Chip
            label={badge?.label || row.status}
            size="small"
            sx={{ ...(badge?.sx || { bgcolor: '#f1f5f9', color: '#475569' }), fontWeight: 700 }}
          />
        );
      },
    },
    {
      key: 'actions', label: 'Actions', width: 170, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleView(row)} sx={{ ...actionBtnSx, color: 'info.main' }} aria-label="View transfer">
              <i className="fas fa-eye" style={{ fontSize: 13 }} aria-hidden="true" />
            </IconButton>
          </Tooltip>
          {row.status === "draft" && canEditTransfer && (
            <>
              <Tooltip title="Complete Transfer">
                <IconButton size="small" onClick={() => handleComplete(row)} sx={{ ...actionBtnSx, color: 'success.main' }} aria-label="Complete transfer">
                  <i className="fas fa-check" style={{ fontSize: 13 }} aria-hidden="true" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel Transfer">
                <IconButton size="small" onClick={() => handleCancel(row)} sx={{ ...actionBtnSx, color: 'warning.main' }} aria-label="Cancel transfer">
                  <i className="fas fa-times" style={{ fontSize: 13 }} aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {row.status === "draft" && canDeleteTransfer && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDelete(row)} sx={{ ...actionBtnSx, color: 'error.main' }} aria-label="Delete transfer">
                <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canViewTransfers) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don&apos;t have permission to view stock transfers.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Stock Transfers
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            Move stock between warehouses (godowns).
          </Typography>
        </Box>
        {canCreateTransfer && (
          <Button
            variant="contained"
            onClick={() => {
              resetForm();
              setFormData((d) => ({ ...d, transfer_number: generateTransferNumber() }));
              setShowModal(true);
            }}
            startIcon={<i className="fas fa-plus" aria-hidden="true" />}
          >
            New Transfer
          </Button>
        )}
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Transfer History
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total: {total} transfers
          </Typography>
        </Box>
        <Divider />

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 960 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ ...headCellSx, minWidth: column.minWidth, width: column.width }}
                  >
                    {column.sortField ? (
                      <TableSortLabel
                        active={sortField === column.sortField}
                        direction={sortField === column.sortField ? sortDir : 'asc'}
                        onClick={() => handleSort(column.sortField)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTransfers.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 7 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No data found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try adjusting your filters or check back later
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedTransfers.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'rgba(6,40,73,.035)' },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${row.id}-${column.key}`}
                      align={column.align || 'left'}
                      sx={bodyCellSx}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={Math.max(page - 1, 0)}
          rowsPerPage={perPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(event, nextPage) => setPage(nextPage + 1)}
          onRowsPerPageChange={(event) => setPerPage(Number(event.target.value))}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>

      {/* Create Transfer Modal */}
      <Dialog
        open={showModal}
        onClose={handleDialogClose}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <i className="fas fa-plus" style={{ color: '#062849', fontSize: 15 }} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              New Stock Transfer
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowModal(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
            <TextField
              size="small"
              label="Transfer Number"
              required
              value={formData.transfer_number}
              onChange={(e) => setFormData((d) => ({ ...d, transfer_number: e.target.value }))}
              error={Boolean(errors.transfer_number)}
              helperText={errors.transfer_number}
              fullWidth
            />
            <TextField
              size="small"
              type="date"
              label="Transfer Date"
              required
              value={formData.transfer_date}
              onChange={(e) => setFormData((d) => ({ ...d, transfer_date: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <FormControl size="small" fullWidth error={Boolean(errors.from_warehouse_id)}>
              <InputLabel id="transfer-from-label">From Warehouse</InputLabel>
              <Select
                labelId="transfer-from-label"
                label="From Warehouse"
                value={strVal(formData.from_warehouse_id)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((d) => ({ ...d, from_warehouse_id: value }));
                  loadWarehouseStocks(value);
                }}
              >
                <MenuItem value=""><em>Select Source</em></MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>
                ))}
              </Select>
              {errors.from_warehouse_id && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: .5 }}>
                  {errors.from_warehouse_id}
                </Typography>
              )}
            </FormControl>
            <FormControl size="small" fullWidth error={Boolean(errors.to_warehouse_id)}>
              <InputLabel id="transfer-to-label">To Warehouse</InputLabel>
              <Select
                labelId="transfer-to-label"
                label="To Warehouse"
                value={strVal(formData.to_warehouse_id)}
                onChange={(e) => setFormData((d) => ({ ...d, to_warehouse_id: e.target.value }))}
              >
                <MenuItem value=""><em>Select Destination</em></MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>
                ))}
              </Select>
              {errors.to_warehouse_id && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: .5 }}>
                  {errors.to_warehouse_id}
                </Typography>
              )}
            </FormControl>
          </Box>

          <TextField
            size="small"
            label="Notes"
            multiline
            rows={2}
            placeholder="Optional notes about this transfer"
            value={formData.notes}
            onChange={(e) => setFormData((d) => ({ ...d, notes: e.target.value }))}
            fullWidth
            sx={{ mb: 2.5 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Items to Transfer
            </Typography>
            <Button variant="outlined" size="small" onClick={addItemRow} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
              Add Item
            </Button>
          </Box>

          {errors.items && (
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
              {errors.items}
            </Alert>
          )}

          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ ...headCellSx, width: '40%' }}>Item</TableCell>
                  <TableCell sx={{ ...headCellSx, width: '25%' }}>Quantity</TableCell>
                  <TableCell sx={{ ...headCellSx, width: '25%' }}>Available Stock</TableCell>
                  <TableCell sx={{ ...headCellSx, width: '10%' }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={bodyCellSx}>
                      <FormControl size="small" fullWidth>
                        <Select
                          displayEmpty
                          value={strVal(item.item_id)}
                          onChange={(e) => updateItemRow(index, "item_id", e.target.value)}
                        >
                          <MenuItem value=""><em>Select Item</em></MenuItem>
                          {items.map((i) => (
                            <MenuItem key={i.id} value={String(i.id)}>{i.name} ({i.sku})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItemRow(index, "quantity", e.target.value)}
                        inputProps={{ min: "0.001", step: "0.001" }}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      {item.item_id && (
                        <Chip
                          label={`${warehouseStocks[item.item_id] || 0} available`}
                          size="small"
                          sx={warehouseStocks[item.item_id] > 0
                            ? { bgcolor: '#caf4ff', color: '#006c9c', fontWeight: 700 }
                            : { bgcolor: '#ffe4de', color: '#b71d18', fontWeight: 700 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={bodyCellSx}>
                      {formData.items.length > 1 && (
                        <Tooltip title="Remove item">
                          <IconButton size="small" onClick={() => removeItemRow(index)} sx={{ ...actionBtnSx, color: 'error.main' }} aria-label="Remove item">
                            <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Create Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Transfer Detail Modal */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Transfer Details - {selectedTransfer?.transfer_number}
          </Typography>
          <IconButton size="small" onClick={() => setShowDetailModal(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedTransfer && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={detailLabelSx}>Transfer Number</Typography>
                  <Typography variant="body2" sx={detailValueSx}>{selectedTransfer.transfer_number}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={detailLabelSx}>Transfer Date</Typography>
                  <Typography variant="body2" sx={detailValueSx}>{new Date(selectedTransfer.transfer_date).toLocaleDateString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={detailLabelSx}>From Warehouse</Typography>
                  <Typography variant="body2" sx={detailValueSx}>{selectedTransfer.from_warehouse?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={detailLabelSx}>To Warehouse</Typography>
                  <Typography variant="body2" sx={detailValueSx}>{selectedTransfer.to_warehouse?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={detailLabelSx}>Status</Typography>
                  <Box sx={{ mt: .5 }}>
                    <Chip
                      label={statusChipMap[selectedTransfer.status]?.label || selectedTransfer.status}
                      size="small"
                      sx={{ ...(statusChipMap[selectedTransfer.status]?.sx || { bgcolor: '#f1f5f9', color: '#475569' }), fontWeight: 700 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={detailLabelSx}>Created By</Typography>
                  <Typography variant="body2" sx={detailValueSx}>{selectedTransfer.created_by?.name || "-"}</Typography>
                </Box>
                {selectedTransfer.notes && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={detailLabelSx}>Notes</Typography>
                    <Typography variant="body2">{selectedTransfer.notes}</Typography>
                  </Box>
                )}
              </Box>

              <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700, mb: 1.5 }}>
                Items
              </Typography>
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={headCellSx}>Item</TableCell>
                      <TableCell sx={headCellSx}>SKU</TableCell>
                      <TableCell sx={headCellSx}>Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTransfer.items?.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={bodyCellSx}>{item.item?.name}</TableCell>
                        <TableCell sx={bodyCellSx}>{item.item?.sku}</TableCell>
                        <TableCell sx={bodyCellSx}>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
