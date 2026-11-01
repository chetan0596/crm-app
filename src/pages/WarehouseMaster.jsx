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
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { canCreate, canDelete, canEdit, canView } from "../utils/permissions";
import api from "../api";
import { Iconify } from "../components/iconify";
import { DataTable } from "../components/data-table";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const actionBtnSx = { border: '1px solid', borderColor: 'divider' };

const formGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
  gap: 2,
};

const fullSpanSx = { gridColumn: '1 / -1' };

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
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");
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

  const loadWarehouses = useCallback(async () => {
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
      setWarehouses(toArray(res.data));
      setTotal(Number(res.data?.total ?? res.data?.data?.total) || 0);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    } finally {
      setLoading(false);
    }
  }, [canViewWarehouses, page, perPage, search]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

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

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShowModal(false);
  };

  const sortedWarehouses = useMemo(() => {
    if (!sortField) return warehouses;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...warehouses].sort((a, b) => {
      const av = a?.[sortField];
      const bv = b?.[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [warehouses, sortField, sortDir]);

  const columns = [
    {
      key: 'code', label: 'Code', sortField: 'code', width: 110,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.code || '-'}</Typography>,
    },
    {
      key: 'name', label: 'Name', sortField: 'name', minWidth: 170,
      render: (row) => row.name || '-',
    },
    {
      key: 'address', label: 'Address', minWidth: 190,
      render: (row) => (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.address || '-'}</Typography>
      ),
    },
    {
      key: 'phone', label: 'Phone', width: 130,
      render: (row) => row.phone || '-',
    },
    {
      key: 'status', label: 'Status', width: 110, align: 'center',
      render: (row) => (
        <Chip
          label={row.is_active ? 'Active' : 'Inactive'}
          size="small"
          sx={row.is_active
            ? { bgcolor: '#dbf5e9', color: '#118d57', fontWeight: 700 }
            : { bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }}
        />
      ),
    },
    {
      key: 'primary', label: 'Primary', width: 110, align: 'center',
      render: (row) => (row.is_primary
        ? <Chip label="Default" size="small" sx={{ bgcolor: '#eaf0f6', color: '#062849', fontWeight: 700 }} />
        : <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>),
    },
    {
      key: 'actions', label: 'Actions', width: 120, align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {canEditWarehouse && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(row)} sx={actionBtnSx} aria-label="Edit warehouse">
                <Iconify icon="fa6-solid:pen-to-square" width={13} />
              </IconButton>
            </Tooltip>
          )}
          {canDeleteWarehouse && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDelete(row)} sx={{ ...actionBtnSx, color: 'error.main' }} aria-label="Delete warehouse">
                <Iconify icon="fa6-solid:trash-can" width={13} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canViewWarehouses) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don&apos;t have permission to view warehouses.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Warehouse Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            Manage warehouses (godowns) used for stock and transfers.
          </Typography>
        </Box>
        {canCreateWarehouse && (
          <Button
            variant="contained"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            startIcon={<Iconify icon="fa6-solid:plus" width={16} />}
          >
            New Warehouse
          </Button>
        )}
      </Box>

      <Card sx={cardSx}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search warehouses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="fa6-solid:magnifying-glass" width={13} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total: {total} warehouses
          </Typography>
        </Box>
        <Divider />

        {loading && <LinearProgress />}
        <DataTable
          columns={columns}
          rows={sortedWarehouses}
          loading={loading}
          emptyMessage="No data found"
          emptyHint="Try adjusting your filters or check back later"
          minWidth={860}
          server
          total={total}
          page={page}
          perPage={perPage}
          sortField={sortField}
          sortDir={sortDir}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          onPerPageChange={(size) => setPerPage(size)}
          onSortChange={(field, dir) => { setSortField(field); setSortDir(dir); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Dialog
        open={showModal}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Iconify icon={editingId ? 'fa6-solid:pen-to-square' : 'fa6-solid:plus'} width={15} sx={{ color: '#062849' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? "Edit Warehouse" : "New Warehouse"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowModal(false)} aria-label="Close">
            <Iconify icon="fa6-solid:xmark" width={14} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={formGridSx}>
            <TextField
              size="small"
              label="Warehouse Code"
              required
              placeholder="e.g., WH001"
              value={formData.code}
              onChange={(e) => setFormData((d) => ({ ...d, code: e.target.value }))}
              error={Boolean(errors.code)}
              helperText={errors.code}
              fullWidth
            />
            <TextField
              size="small"
              label="Warehouse Name"
              required
              placeholder="Enter warehouse name"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
            />
            <TextField
              size="small"
              label="Address"
              multiline
              rows={2}
              placeholder="Enter warehouse address"
              value={formData.address}
              onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
              fullWidth
              sx={fullSpanSx}
            />
            <TextField
              size="small"
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              size="small"
              type="email"
              label="Email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData((d) => ({ ...d, is_active: e.target.checked }))}
                />
              )}
              label="Active"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.is_primary)}
                  onChange={(e) => setFormData((d) => ({ ...d, is_primary: e.target.checked }))}
                />
              )}
              label="Set as Default Warehouse"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<Iconify icon={editingId ? 'fa6-solid:check' : 'fa6-solid:plus'} width={16} />}
          >
            {editingId ? "Update" : "Create"} Warehouse
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
