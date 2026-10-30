import { useEffect, useMemo, useRef, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { varAlpha } from 'minimal-shared/utils';

import { Iconify } from '../iconify';
import { MODAL_POPOVER_Z_INDEX } from '../../constants/z-index';

export type AutocompleteFieldOption = {
  value: string;
  label?: string;
  description?: string;
};

type AutocompleteFieldProps = {
  value: string;
  options?: AutocompleteFieldOption[];
  onChange: (value: string) => void;
  onSearch?: (term: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  minSearchLength?: number;
  showSearchIcon?: boolean;
};

export default function AutocompleteField({
  value,
  options = [],
  onChange,
  onSearch,
  loading = false,
  placeholder,
  disabled = false,
  required = false,
  error,
  hint,
  minSearchLength = 0,
  showSearchIcon,
}: AutocompleteFieldProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState<AutocompleteFieldOption | null>(null);
  const previousValueRef = useRef(value);

  const serverMode = Boolean(onSearch);
  const trimmedSearch = searchTerm.trim();
  const needsMoreChars = serverMode && minSearchLength > 0 && trimmedSearch.length > 0 && trimmedSearch.length < minSearchLength;
  const showLeadingSearchIcon = showSearchIcon ?? serverMode;

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = options.find((option) => option.value === value);
    if (match) setSelectedOption(match);
  }, [value, options]);

  useEffect(() => {
    if (!serverMode) return;

    if (!value) {
      setInputValue('');
      previousValueRef.current = value;
      return;
    }

    if (!selectedOption || selectedOption.value !== value) return;

    const valueChanged = previousValueRef.current !== value;
    previousValueRef.current = value;
    const nextLabel = selectedOption.label ?? selectedOption.value;

    setInputValue((previous) => {
      if (valueChanged || !previous) return nextLabel;
      return previous;
    });
  }, [serverMode, value, selectedOption]);

  useEffect(() => {
    if (!onSearch) return undefined;

    const timer = setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (minSearchLength > 0 && nextTerm.length > 0 && nextTerm.length < minSearchLength) {
        onSearch('');
        return;
      }
      onSearch(nextTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, minSearchLength, onSearch]);

  const mergedOptions = useMemo(() => {
    if (selectedOption && !options.some((option) => option.value === selectedOption.value)) {
      return [selectedOption, ...options];
    }
    return options;
  }, [options, selectedOption]);

  const overlayPaperSx = {
    mt: { xs: 1, md: 0.75, lg: 0.75, xl: 1 },
    position: 'relative',
    overflow: 'hidden',
    borderRadius: { xs: 1.5, md: 1.2, lg: 1.2, xl: 1.5 },
    bgcolor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(18px)',
    border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    boxShadow: `0 18px 44px ${varAlpha(theme.vars.palette.grey['900Channel'], 0.12)}`,
    '&::before': {
      zIndex: 0,
      opacity: 0.12,
      content: "''",
      position: 'absolute',
      inset: 0,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundImage: 'url(/assets/background/overlay.jpg)',
    },
    '& .MuiAutocomplete-listbox': {
      position: 'relative',
      zIndex: 1,
      py: { xs: 1, md: 0.75, lg: 0.75, xl: 1 },
    },
    '& .MuiAutocomplete-option': {
      minHeight: { xs: 42, md: 34, lg: 34, xl: 42 },
      mx: { xs: 1, md: 0.75, lg: 0.75, xl: 1 },
      my: { xs: 0.25, md: 0.2, lg: 0.2, xl: 0.25 },
      borderRadius: { xs: 1, md: 0.8, lg: 0.8, xl: 1 },
      fontSize: { xs: 14, md: 12, lg: 12, xl: 14 },
      color: 'text.secondary',
      '&:hover, &.Mui-focused': {
        bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
      },
      '&[aria-selected="true"]': {
        color: 'text.primary',
        bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
      },
      '&[aria-selected="true"].Mui-focused': {
        bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
      },
    },
    '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': {
      position: 'relative',
      zIndex: 1,
      fontSize: { xs: 14, md: 12, lg: 12, xl: 14 },
    },
    '& .MuiTypography-root': {
      fontSize: { xs: 14, md: 12, lg: 12, xl: 14 },
    },
  };

  return (
    <Autocomplete<AutocompleteFieldOption, false, boolean, false>
      size="small"
      fullWidth
      value={selectedOption}
      options={mergedOptions}
      loading={loading}
      disabled={disabled}
      disableClearable={required}
      forcePopupIcon={!serverMode}
      openOnFocus={!serverMode}
      loadingText="Searching..."
      noOptionsText={
        needsMoreChars
          ? `Type at least ${minSearchLength} characters`
          : serverMode && minSearchLength > 0 && !trimmedSearch
            ? `Type at least ${minSearchLength} characters`
            : 'No results found'
      }
      getOptionLabel={(option) => option.label ?? option.value}
      isOptionEqualToValue={(option, selected) => option.value === selected.value}
      onChange={(_, option) => {
        onChange(option?.value ?? '');
        if (option) {
          setInputValue(option.label ?? option.value);
          setSearchTerm('');
        } else {
          setInputValue('');
          setSearchTerm('');
        }
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.value}>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 600 }}>{option.label ?? option.value}</Typography>
            {option.description ? <Typography noWrap variant="caption" color="text.secondary">{option.description}</Typography> : null}
          </Box>
        </Box>
      )}
      {...(serverMode
        ? {
            inputValue,
            filterOptions: (option: AutocompleteFieldOption[]) => option,
            onInputChange: (_: unknown, nextValue: string, reason: string) => {
              if (reason !== 'input' && reason !== 'clear') return;
              setInputValue(nextValue);
              setSearchTerm(nextValue);
              if (reason === 'clear') {
                onChange('');
              }
            },
          }
        : {})}
      slotProps={{
        popper: { sx: { zIndex: MODAL_POPOVER_Z_INDEX } },
        paper: { sx: overlayPaperSx },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          error={!!error}
          helperText={error ?? hint ?? ''}
          FormHelperTextProps={{ sx: { fontSize: 10.5, ml: 0 } }}
          InputProps={{
            ...params.InputProps,
            startAdornment: showLeadingSearchIcon ? (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" />
              </InputAdornment>
            ) : (
              params.InputProps.startAdornment
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
