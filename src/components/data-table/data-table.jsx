import { useMemo, useState } from 'react';
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
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

import { Iconify } from '../iconify';

// TanStack-backed table, adapted for this app:
// - columns accept the app's shape: { key|id, label, sortField?, sortable?, width?, minWidth?, align?, render?(row), accessor?(row) }
// - `server` mode: caller controls page/perPage/sortField/sortDir (manual* flags)
// - client mode: TanStack paginates/sorts/filters the full `rows` array itself
// - sticky header, loading skeleton, empty state, optional selection & actions column
export function DataTable({
  columns,
  rows = [],
  loading = false,
  emptyMessage = 'No data',
  emptyTitle,
  emptyHint,
  minWidth = 640,
  maxHeight,
  // server mode
  server = false,
  total,
  page,               // 1-based, server mode
  perPage,            // server mode
  sortField,          // server mode
  sortDir,            // server mode
  onPageChange,       // (pageIndex0) => void
  onPerPageChange,    // (size) => void
  onSortChange,       // (field, dir) => void
  columnVisibility,   // { [columnId]: boolean }
  onColumnVisibilityChange,
  globalFilter,
  // client mode
  defaultPageSize = 5,
  rowsPerPageOptions = [5, 10, 25],
  // misc
  rowKey = 'id',
  onRowClick,
  selectable = false,
  selected = [],
  onSelect,
  renderActions,
  actionsLabel = 'Actions',
  dense = false,
}) {
  const [clientPagination, setClientPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });
  const [clientSorting, setClientSorting] = useState([]);

  const tanColumns = useMemo(
    () =>
      columns.map((column) => {
        const id = column.id ?? column.key;
        const sortFieldName = column.sortField ?? (column.sortable ? id : null);
        return {
          id,
          header: column.label,
          enableSorting: Boolean(sortFieldName),
          accessorFn: column.accessor ?? column.sortValue ?? (sortFieldName ? (row) => row[sortFieldName] : (row) => row[id]),
          meta: {
            sortField: sortFieldName,
            align: column.align,
            minWidth: column.minWidth,
            width: column.width,
          },
          cell: ({ row }) =>
            column.render ? column.render(row.original) : (row.original[id] ?? '-'),
        };
      }),
    [columns]
  );

  const pagination = server
    ? { pageIndex: Math.max((page ?? 1) - 1, 0), pageSize: perPage ?? defaultPageSize }
    : clientPagination;

  const sorting = useMemo(() => {
    if (!server) return clientSorting;
    const columnId = sortField
      ? (tanColumns.find((c) => c.meta?.sortField === sortField)?.id ?? sortField)
      : null;
    return columnId ? [{ id: columnId, desc: sortDir === 'desc' }] : [];
  }, [server, clientSorting, tanColumns, sortField, sortDir]);

  const table = useReactTable({
    data: rows,
    columns: tanColumns,
    state: {
      sorting,
      pagination,
      ...(columnVisibility ? { columnVisibility } : {}),
      ...(globalFilter != null ? { globalFilter } : {}),
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (server) {
        if (!first) return;
        const field = tanColumns.find((c) => c.id === first.id)?.meta?.sortField ?? first.id;
        onSortChange?.(field, first.desc ? 'desc' : 'asc');
      } else {
        setClientSorting(next);
      }
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      if (server) {
        if (next.pageSize !== pagination.pageSize) onPerPageChange?.(next.pageSize);
        if (next.pageIndex !== pagination.pageIndex) onPageChange?.(next.pageIndex);
      } else {
        setClientPagination(next);
      }
    },
    ...(onColumnVisibilityChange ? { onColumnVisibilityChange } : {}),
    getRowId: (row, index) => String(row?.[rowKey] ?? index),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: server,
    manualSorting: server,
    manualFiltering: server,
    enableSortingRemoval: false,
    pageCount: server ? Math.max(Math.ceil((total ?? 0) / (perPage || defaultPageSize)), 1) : -1,
    autoResetPageIndex: !server,
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const colCount = visibleColumns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0);
  const bodyRows = table.getRowModel().rows;

  const pageCountDisplay = server
    ? (total ?? 0)
    : (table.getFilteredRowModel()?.rows.length ?? rows.length);

  const allSelected = rows.length > 0 && selected.length === rows.length;

  const headCellSx = {
    color: 'text.secondary',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    px: 2,
    py: 1.5,
    whiteSpace: 'nowrap',
    borderBottom: '1px solid',
    borderColor: 'divider',
  };

  const bodyCellSx = {
    verticalAlign: 'middle',
    px: 2,
    py: dense ? 1 : 1.5,
    borderBottom: '1px solid #f1f5f9',
  };

  return (
    <>
      <TableContainer sx={{ overflowX: 'auto', ...(maxHeight ? { maxHeight } : {}) }}>
        <Table size="small" stickyHeader={Boolean(maxHeight)} sx={{ minWidth }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} sx={{ bgcolor: 'background.neutral' }}>
                {selectable && (
                  <TableCell padding="checkbox" sx={{ ...headCellSx, width: 48 }}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selected.length > 0 && !allSelected}
                      onChange={(event) =>
                        onSelect?.(event.target.checked ? rows.map((r) => r?.[rowKey] ?? r) : [])
                      }
                    />
                  </TableCell>
                )}
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta || {};
                  return (
                    <TableCell
                      key={header.id}
                      align={meta.align || 'left'}
                      sx={{ ...headCellSx, width: meta.width, minWidth: meta.minWidth }}
                    >
                      {header.column.getCanSort() ? (
                        <TableSortLabel
                          active={header.column.getIsSorted() !== false}
                          direction={header.column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableSortLabel>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableCell>
                  );
                })}
                {renderActions && (
                  <TableCell align="right" sx={{ ...headCellSx, width: 56 }}>
                    {actionsLabel}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  {selectable && <TableCell padding="checkbox"><Skeleton /></TableCell>}
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} align={column.columnDef.meta?.align || 'left'}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                  {renderActions && <TableCell align="right"><Skeleton width={24} sx={{ ml: 'auto' }} /></TableCell>}
                </TableRow>
              ))
            ) : bodyRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ py: 7, borderBottom: 'none' }}>
                  <Stack alignItems="center" spacing={0.5} sx={{ color: 'text.disabled' }}>
                    <Iconify icon="fa6-solid:folder-open" width={42} />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      {emptyTitle || emptyMessage}
                    </Typography>
                    {emptyHint && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {emptyHint}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              bodyRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  selected={selectable && selected.includes(row.original?.[rowKey] ?? row.original)}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  sx={{
                    ...(onRowClick ? { cursor: 'pointer' } : {}),
                    '&:hover': { bgcolor: 'rgba(6,40,73,.035)' },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(row.original?.[rowKey] ?? row.original)}
                        onChange={(event) => {
                          const key = row.original?.[rowKey] ?? row.original;
                          onSelect?.(
                            event.target.checked ? [...selected, key] : selected.filter((k) => k !== key)
                          );
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta || {};
                    return (
                      <TableCell key={cell.id} align={meta.align || 'left'} sx={bodyCellSx}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                  {renderActions && (
                    <TableCell align="right" sx={{ ...bodyCellSx, whiteSpace: 'nowrap' }}>
                      {renderActions(row.original)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(pageCountDisplay > 0 || server) && (
        <TablePagination
          component="div"
          count={pageCountDisplay}
          page={pagination.pageIndex}
          rowsPerPage={pagination.pageSize}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={(_, newPage) => table.setPageIndex(newPage)}
          onRowsPerPageChange={(event) => table.setPageSize(Number(event.target.value))}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
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
