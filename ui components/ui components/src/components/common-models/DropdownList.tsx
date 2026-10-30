import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';

import { getOverlayMenuProps } from '../../utils/overlay-menu-props';

export type DropdownListOption = {
  value: string;
  label?: string;
};

type DropdownListProps = {
  value: string;
  options?: DropdownListOption[];
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
};

export default function DropdownList({
  value,
  options = [],
  onChange,
  error = false,
  helperText = '',
  placeholder = 'Select',
  disabled = false,
  sx,
}: DropdownListProps) {
  const theme = useTheme();

  return (
    <TextField
      select
      value={value}
      size="small"
      fullWidth
      error={error}
      helperText={helperText}
      disabled={disabled}
      sx={sx}
      onChange={(event) => onChange(event.target.value)}
      SelectProps={{
        displayEmpty: true,
        MenuProps: getOverlayMenuProps(theme),
      }}
      FormHelperTextProps={{ sx: { fontSize: 10.5, ml: 0 } }}
    >
      <MenuItem value="" disabled>
        {placeholder}
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label ?? option.value}
        </MenuItem>
      ))}
    </TextField>
  );
}
