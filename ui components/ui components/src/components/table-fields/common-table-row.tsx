import { TableCell, TableRow, IconButton } from '@mui/material';

import { Iconify } from '../iconify';

type Column = {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
};

type CommonTableRowProps = {
  row: any;
  columns: Column[];
  showCheckbox: boolean;
  actions: boolean;
};

export function CommonTableRow({ row, columns, showCheckbox, actions }: CommonTableRowProps) {
  return (
    <TableRow hover>
      {showCheckbox && <TableCell padding="checkbox"><Checkbox /></TableCell>}
      {columns.map((column) => (
        <TableCell key={column.id} align={column.align || 'left'}>
          {column.render ? column.render(row) : row[column.id]}
        </TableCell>
      ))}
      {actions && (
        <TableCell>
          <IconButton size="small">
            <Iconify icon="mingcute:edit-line" width={18} />
          </IconButton>
          <IconButton size="small" sx={{ color: 'error.main' }}>
            <Iconify icon="mingcute:delete-line" width={18} />
          </IconButton>
        </TableCell>
      )}
    </TableRow>
  );
}
