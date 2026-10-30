import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';

import { getOverlayMenuProps } from '../../utils/overlay-menu-props';

export type DropdownListOption = {
  value: string;
  label?: string;
};

type MultiSelectDropdownListProps = {
  value: string;
  options?: DropdownListOption[];
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
};

export default function MultiSelectDropdownList({
  value,
  options = [],
  onChange,
  error = false,
  helperText = '',
  placeholder = 'Select',
  disabled = false,
  sx,
}: MultiSelectDropdownListProps) {
  const theme = useTheme();
  const selectedValues = value.split(',').filter(Boolean);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const {
      target: { value },
    } = event;
    const newValue = typeof value === 'string' ? value : value.join(',');
    onChange(newValue);
  };

  return (
    <TextField
      select
      value={selectedValues}
      size="small"
      fullWidth
      error={error}
      helperText={helperText}
      disabled={disabled}
      sx={sx}
      onChange={handleChange}
      SelectProps={{
        displayEmpty: true,
        multiple: true,
        MenuProps: getOverlayMenuProps(theme),
        renderValue: (selected: unknown) => {
          if (selected.length === 0) return placeholder;
          const selectedArray = Array.isArray(selected) ? selected : [selected];
          return selectedArray.map((v) => options.find((o) => o.value === v)?.label || v).join(', ');
        },
      }}
      FormHelperTextProps={{ sx: { fontSize: 10.5, ml: 0 } }}
    >
      <MenuItem value="" disabled>
        {placeholder}
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          <Checkbox checked={selectedValues.indexOf(option.value) > -1} />
          <ListItemText primary={option.label ?? option.value} />
        </MenuItem>
      ))}
    </TextField>
  );
}
