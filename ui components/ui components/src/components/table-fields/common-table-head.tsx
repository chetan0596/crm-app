import { TableCell, TableHead, TableRow, Checkbox, TableSortLabel } from '@mui/material';

type Column = {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
};

type CommonTableHeadProps = {
  columns: Column[];
  order: 'asc' | 'desc';
  orderBy: string | null;
  onSort: (columnId: string) => void;
  showCheckbox: boolean;
};

export function CommonTableHead({ columns, order, orderBy, onSort, showCheckbox }: CommonTableHeadProps) {
  return (
    <TableHead>
      <TableRow>
        {showCheckbox && <TableCell padding="checkbox" sx={{ width: 48 }} />}
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align || 'left'}
            sortDirection={orderBy === column.id ? order : false}
            sx={{ width: column.width, minWidth: column.minWidth }}
          >
            {column.sortable ? (
              <TableSortLabel active={orderBy === column.id} direction={orderBy === column.id ? order : 'asc'} onClick={() => onSort(column.id)}>
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
        <TableCell sx={{ width: 100 }}>Actions</TableCell>
      </TableRow>
    </TableHead>
  );
}
