import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Alert,
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
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
import api from "../api";
import Swal from "sweetalert2";
import { toast } from "react-toastify";


// ================= HELPERS =================

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};


// ================= REDUCER =================

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


// ================= COMPONENT =================

export default function LeadCategory() {

  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  // -------- INIT FROM URL --------
  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 25),
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

  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionRow, setActionRow] = useState(null);

  // -------- column visibility --------
  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('category-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return {
      id: true,
      name: true,
      action: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('category-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  // -------- modal --------
  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);



  // ================= URL SYNC =================

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



  // ================= LOAD DATA (NO DOUBLE CALL) =================

  useEffect(() => {

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);

        const res = await api.get("/lead-categories", {
          params: table,
          signal: controller.signal
        });

        setRows(toArray(res.data));
        setTotal(Number(res.data?.total) || 0);

      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();

  }, [table, reloadKey]);


  // ================= SEARCH DEBOUNCE =================

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) {
        dispatch({ type: "SEARCH", search: s });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput, table.search]);



  // ================= MODAL =================

  const openAdd = () => {
    setEditRow(null);
    setName("");
    setErr("");
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setName(row.name);
    setErr("");
    setShow(true);
  };



  // ================= SAVE =================

  const save = async () => {
    if (!name.trim()) {
      toast.warning("Category name required");
      return;
    }

    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/lead-categories/${editRow.id}`, { name });
      } else {
        await api.post(`/lead-categories`, { name });
      }

      setShow(false);
      setReloadKey(k => k + 1);
      toast.success("Category saved successfully");

    } catch (e) {
      toast.error(e.response?.data?.errors?.name?.[0] ?? "Save failed");
    }
    finally {
      setSaving(false);
    }
  };



  // ================= DELETE =================

  const remove = (row) => {
    Swal.fire({
      title: "Delete category?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      await api.delete(`/lead-categories/${row.id}`);
      setReloadKey(k => k + 1);
    });
  };



  // ================= TABLE =================

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

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setActionRow(null);
  };

  const runRowAction = (callback) => () => {
    const row = actionRow;
    closeActionMenu();
    if (row) callback(row);
  };

  const columnOptions = [
    ['id', 'ID'],
    ['name', 'Name'],
  ];

  const shownColumnLabel = [
    visibleCols.id && 'ID',
    visibleCols.name && 'Name',
  ].filter(Boolean).join(', ') || 'None';

  const columns = useMemo(() => [
    visibleCols.id && { key: 'id', label: 'ID', sortField: 'id', width: 100 },
    visibleCols.name && { key: 'name', label: 'Name', sortField: 'name' },
    visibleCols.action && {
      key: 'action',
      label: 'Action',
      width: 140,
      align: 'right',
      render: (row) => (
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setActionRow(row);
            setActionAnchorEl(event.currentTarget);
          }}
          aria-label="Category actions"
          aria-haspopup="true"
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <i className="fas fa-ellipsis-v" style={{ fontSize: 13 }} aria-hidden="true" />
        </IconButton>
      ),
    },
  ].filter(Boolean), [visibleCols]);



  // ================= UI =================

  return (
    <Box>
      <Card sx={cardSx}>

        {/* HEADER */}
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Categories
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
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
              <Button variant="contained" onClick={openAdd} startIcon={<i className="fas fa-plus" aria-hidden="true" />}>
                Add
              </Button>
            </Stack>
          </Box>
        </CardContent>

        {/* COLUMN TOGGLE */}
        <Divider />
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Show columns:
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={(event) => setColumnAnchorEl(event.currentTarget)}
            startIcon={<i className="fas fa-columns" aria-hidden="true" />}
          >
            {shownColumnLabel}
          </Button>
          <Menu anchorEl={columnAnchorEl} open={Boolean(columnAnchorEl)} onClose={() => setColumnAnchorEl(null)}>
            {columnOptions.map(([key, label]) => (
              <MenuItem key={key} onClick={() => setVisibleCols(v => ({ ...v, [key]: !v[key] }))}>
                <Checkbox checked={Boolean(visibleCols[key])} size="small" />
                <ListItemText primary={label} />
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* TABLE */}
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
              {rows.length === 0 && !loading ? (
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
              ) : rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${row.id}-${column.key}`}
                      align={column.align || 'left'}
                      sx={bodyCellSx}
                    >
                      {column.render ? column.render(row) : (
                        column.key === 'id'
                          ? <Typography variant="body2" sx={{ fontWeight: 700 }}>#{row.id}</Typography>
                          : row[column.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={closeActionMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: .75,
                minWidth: 180,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 12px 32px rgba(28,37,46,.14)',
              },
            },
          }}
        >
          <MenuItem onClick={runRowAction((row) => nav(`/lead-categories/${row.id}/subcategories`))}>
            <ListItemIcon><i className="fas fa-sitemap" style={{ color: '#062849' }} aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Subcategories" />
          </MenuItem>
          <MenuItem onClick={runRowAction((row) => nav(`/lead-categories/${row.id}/activity`))}>
            <ListItemIcon><i className="fas fa-history" style={{ color: '#00b8d9' }} aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Activity" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={runRowAction(openEdit)}>
            <ListItemIcon><i className="fas fa-edit" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          <MenuItem onClick={runRowAction(remove)} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><i className="fas fa-trash" aria-hidden="true" /></ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
        </Menu>

        <TablePagination
          component="div"
          count={total}
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



      {/* MODAL */}

      <Dialog
        open={show}
        onClose={handleDialogClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editRow ? "Edit Category" : "Add Category"}
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
          {err && (
            <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>
              {err}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
