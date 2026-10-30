import { useState } from 'react';
import { Card, Divider, Table, TableBody, TableContainer, TablePagination, Box } from '@mui/material';

import { Scrollbar } from '../scrollbar';
import { CommonTableHead } from './common-table-head';
import { CommonTableRow } from './common-table-row';

type Column = {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
};

type CommonTableProps = {
  columns: Column[];
  data: any[];
  selectable?: boolean;
  actions?: boolean;
  maxHeight?: number;
};

export function CommonTable({ columns, data, selectable = false, actions = true, maxHeight = 500 }: CommonTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string | null>(null);

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!orderBy) return 0;

    const aVal = a[orderBy];
    const bVal = b[orderBy];

    if (aVal === undefined || bVal === undefined) return 0;

    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <Box sx={{ maxHeight, overflow: 'hidden' }}>
        <Scrollbar>
          <TableContainer sx={{ maxHeight }}>
            <Table stickyHeader>
              <CommonTableHead columns={columns} order={order} orderBy={orderBy} onSort={handleSort} showCheckbox={selectable} />

              <TableBody>
                {paginatedData.map((row, index) => (
                  <CommonTableRow key={row.id || index} row={row} columns={columns} showCheckbox={selectable} actions={actions} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Box>

      <Divider sx={{ borderStyle: 'solid' }} />

      <TablePagination
        component="div"
        count={data.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
}
