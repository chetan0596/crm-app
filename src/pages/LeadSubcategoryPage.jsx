import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import api from "../api";

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function tableReducer(state, action) {
  switch (action.type) {
    case "PAGE":
      return { ...state, page: action.page };
    case "PER_PAGE":
      return { ...state, perPage: action.perPage, page: 1 };
    case "SEARCH":
      return { ...state, search: action.search, page: 1 };
    case "SORT":
      return { ...state, sortField: action.field, sortDir: action.dir };
    default:
      return state;
  }
}

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

export default function LeadSubcategoryPage() {

  const { id } = useParams();

  const [params, setParams] = useSearchParams();

  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 25),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };

  const [table, dispatch] = useReducer(tableReducer, initialTable);

  const [rawRows, setRawRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState(initialTable.search);
  const [serverMode, setServerMode] = useState(false);

  const [visibleCols, setVisibleCols] = useState({
    id: true,
    name: true,
    action: true,
  });

  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page,
      perPage: table.perPage,
      search: table.search,
      sort: table.sortField,
      dir: table.sortDir,
    });

    if (newParams.toString() !== params.toString()) {
      setParams(newParams);
    }
  }, [params, setParams, table]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) {
        dispatch({ type: "SEARCH", search: s });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput, table.search]);

  const load = useCallback(async (signal) => {
    if (!id) {
      setRawRows([]);
      setRows([]);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      const r = await api.get(`/lead-subcategories/${id}`, {
        params: table,
        signal,
      });

      const payload = r.data;

      if (payload && Array.isArray(payload.data)) {
        setServerMode(true);
        setRows(payload.data);
        setTotal(Number(payload.total) || 0);
        setRawRows([]);
      } else if (Array.isArray(payload)) {
        setServerMode(false);
        setRawRows(payload);
      } else {
        setServerMode(false);
        setRawRows([]);
      }
    } catch {
      setServerMode(false);
      setRawRows([]);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [id, table]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [reloadKey, load]);

  const clientRows = useMemo(() => {
    if (serverMode) return [];

    let data = rawRows;

    const q = table.search.trim().toLowerCase();
    if (q) {
      data = data.filter(r => (r?.name ?? "").toLowerCase().includes(q));
    }

    const dir = table.sortDir === "asc" ? 1 : -1;
    const field = table.sortField;

    const sorted = [...data].sort((a, b) => {
      const av = a?.[field];
      const bv = b?.[field];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }

      return String(av).localeCompare(String(bv)) * dir;
    });

    const start = (table.page - 1) * table.perPage;
    const end = start + table.perPage;
    return sorted.slice(start, end);
  }, [rawRows, serverMode, table.page, table.perPage, table.search, table.sortDir, table.sortField]);

  const clientTotal = useMemo(() => {
    const q = table.search.trim().toLowerCase();
    const filtered = q
      ? rawRows.filter(r => (r?.name ?? "").toLowerCase().includes(q))
      : rawRows;
    return filtered.length;
  }, [rawRows, table.search]);

  const displayRows = serverMode ? rows : clientRows;
  const displayTotal = serverMode ? total : clientTotal;

  const openAdd = () => {
    setEditRow(null);
    setName("");
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setName(row?.name ?? "");
    setShow(true);
  };

  const save = async () => {
    if (!id) return;

    const nm = name.trim();
    if (!nm) {
      toast.warning("Subcategory name required");
      return;
    }

    try {
      setSaving(true);

      if (editRow?.id) {
        await api.put(`/lead-subcategories/${editRow.id}`, {
          name: nm,
          category_id: id,
        });
      } else {
        await api.post("/lead-subcategories", {
          name: nm,
          category_id: id,
        });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("Subcategory saved successfully");
    } catch (e) {
      toast.error(e.response?.data?.errors?.name?.[0] ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    Swal.fire({
      title: "Delete subcategory?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await api.delete(`/lead-subcategories/${row.id}`);
        setReloadKey(k => k + 1);
        toast.success("Subcategory deleted");
      } catch {
        toast.error("Delete failed");
      }
    });
  };

  const handleSort = (field) => {
    const dir = table.sortField === field
      ? (table.sortDir === 'asc' ? 'desc' : 'asc')
      : 'asc';
    dispatch({ type: "SORT", field, dir });
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    setShow(false);
  };

  const columns = [
    visibleCols.id && { key: 'id', label: 'ID', sortField: 'id', width: 100 },
    visibleCols.name && { key: 'name', label: 'Subcategory Name', sortField: 'name' },
    visibleCols.action && {
      key: 'action',
      label: 'Action',
      width: 140,
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton size="small" color="primary" onClick={() => openEdit(row)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Edit">
            <i className="fas fa-edit" style={{ fontSize: 13 }} aria-hidden="true" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => remove(row)} sx={{ border: '1px solid', borderColor: 'divider' }} aria-label="Delete">
            <i className="fas fa-trash" style={{ fontSize: 13 }} aria-hidden="true" />
          </IconButton>
        </Stack>
      ),
    },
  ].filter(Boolean);

  return (
    <Box>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
                Subcategories — Category #{id ?? "-"}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                disabled={!id}
                sx={{ minWidth: { xs: '100%', sm: 220 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="fas fa-search" style={{ fontSize: 13 }} aria-hidden="true" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={openAdd}
                disabled={!id}
                startIcon={<i className="fas fa-plus" aria-hidden="true" />}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </CardContent>

        <Divider />
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Show columns:
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={visibleCols.id}
                onChange={() => setVisibleCols(v => ({ ...v, id: !v.id }))}
              />
            }
            label="ID"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={visibleCols.name}
                onChange={() => setVisibleCols(v => ({ ...v, name: !v.name }))}
              />
            }
            label="Name"
          />
        </Box>

        {loading && <LinearProgress />}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 560 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ ...headCellSx, width: column.width }}
                  >
                    {column.sortField ? (
                      <TableSortLabel
                        active={table.sortField === column.sortField}
                        direction={table.sortField === column.sortField ? table.sortDir : 'asc'}
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
              {displayRows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1)} align="center" sx={{ py: 7 }}>
                    <i className="fas fa-folder-open" style={{ color: '#637381', fontSize: 42, opacity: .4 }} aria-hidden="true" />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      No data found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try adjusting your filters or check back later
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayRows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${r.id}-${column.key}`}
                      align={column.align || 'left'}
                      sx={bodyCellSx}
                    >
                      {column.render ? column.render(r) : (
                        column.key === 'id'
                          ? <Typography variant="body2" sx={{ fontWeight: 700 }}>#{r.id}</Typography>
                          : r[column.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={displayTotal}
          page={Math.max(table.page - 1, 0)}
          rowsPerPage={table.perPage}
          rowsPerPageOptions={[10, 15, 20, 25, 30]}
          onPageChange={(event, page) => {
            const nextPage = page + 1;
            if (nextPage !== table.page) dispatch({ type: 'PAGE', page: nextPage });
          }}
          onRowsPerPageChange={(event) => {
            const nextSize = Number(event.target.value);
            if (nextSize !== table.perPage) dispatch({ type: 'PER_PAGE', perPage: nextSize });
          }}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>

      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editRow ? "Edit Subcategory" : "Add Subcategory"}
          </Typography>
          <IconButton size="small" onClick={() => setShow(false)} aria-label="Close">
            <i className="fas fa-times" style={{ fontSize: 14 }} aria-hidden="true" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <TextField
            size="small"
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !id}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
