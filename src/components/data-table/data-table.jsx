import { useState } from 'react';
import {
  Box,
  Checkbox,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';

import { Iconify } from '../iconify';

// Ported from the `ui components` CommonTable, adapted for this app:
// client-side sorting + pagination, sticky header, loading skeleton,
// icon empty state, optional selection and actions column.
export function DataTable({
  columns,
  rows = [],
  loading = false,
  emptyMessage = 'No data',
  maxHeight = 440,
  minWidth = 640,
  defaultRowsPerPage = 5,
  rowsPerPageOptions = [5, 10, 25],
  selectable = false,
  selected = [],
  onSelect,
  renderActions,
  actionsLabel = 'Actions',
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);

  const colCount = columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0);

  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const valueFor = (row, column) =>
    column.sortValue ? column.sortValue(row) : row[column.id];

  const sorted = [...rows].sort((a, b) => {
    if (!orderBy) return 0;
    const column = columns.find((c) => c.id === orderBy);
    if (!column) return 0;
    const aVal = valueFor(a, column);
    const bVal = valueFor(b, column);
    if (aVal == null || bVal == null) return 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return order === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const maxPage = Math.max(0, Math.ceil(sorted.length / rowsPerPage) - 1);
  const safePage = Math.min(page, maxPage);
  const paginated = sorted.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <>
      <TableContainer sx={{ maxHeight }}>
        <Table size="small" stickyHeader sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ width: 48 }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={(event) =>
                      onSelect?.(event.target.checked ? rows.map((r) => r.id ?? r) : [])
                    }
                  />
                </TableCell>
              )}
              {columns.map((column, index) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth,
                    whiteSpace: 'nowrap',
                    ...(index === 0 && !selectable && { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }),
                    ...(index === columns.length - 1 && !renderActions && { borderTopRightRadius: 12, borderBottomRightRadius: 12 }),
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {renderActions && (
                <TableCell align="right" sx={{ width: 56, borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>
                  {actionsLabel}
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  {selectable && <TableCell padding="checkbox"><Skeleton /></TableCell>}
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                  {renderActions && <TableCell align="right"><Skeleton width={24} sx={{ ml: 'auto' }} /></TableCell>}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ py: 5, borderBottom: 'none' }}>
                  <Stack alignItems="center" spacing={1} sx={{ color: 'text.disabled' }}>
                    <Iconify icon="solar:database-bold-duotone" width={36} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {emptyMessage}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, rowIndex) => (
                <TableRow key={row.id ?? rowIndex} hover selected={selectable && selected.includes(row.id ?? row)}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row.id ?? row)}
                        onChange={(event) => {
                          const key = row.id ?? row;
                          onSelect?.(
                            event.target.checked ? [...selected, key] : selected.filter((k) => k !== key)
                          );
                        }}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {column.render ? column.render(row) : (row[column.id] ?? '-')}
                    </TableCell>
                  ))}
                  {renderActions && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {renderActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > 0 && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <TablePagination
            component="div"
            count={rows.length}
            page={safePage}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        </>
      )}
    </>
  );
}

// Default action cell: three-dot menu button (match the app's row-action pattern).
export function TableActionsCell({ onClick }) {
  return (
    <Tooltip title="Actions">
      <IconButton size="small" onClick={onClick} sx={{ color: 'text.secondary' }}>
        <Iconify icon="eva:more-vertical-fill" width={18} />
      </IconButton>
    </Tooltip>
  );
}
