import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  CircularProgress,
} from '@mui/material';
import { useState, useRef, useCallback, type JSX } from 'react';
import * as z from 'zod';
import NumberField from './NumberField';
import DropdownList from './DropdownList';
import MultiSelectDropdownList from './MultiSelectDropdownList';
import AutocompleteField from './AutocompleteField';
import { Iconify } from '../iconify';
import { desktopFont, desktopSpacing, desktopValue } from '../../theme/desktop-density';
import { formDensitySx } from './responsive-styles';
import { formLabelSx, formErrorSx, responsiveControlSx, responsiveButtonSx, uploadPreviewThumbSx, uploadRemoveBtnSx, FieldOption, ColorField, FormFieldLabel, FormField, ImageUploadField, SwitchField } from './createForm';

export type Field = {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'number'
    | 'textarea'
    | 'select'
    | 'autocomplete'
    | 'toggle'
    | 'image'
    | 'switch'
    | 'date'
    | 'video'
    | 'color'
    | 'checkboxGrid'
    | 'multiSelect';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
  defaultValue?: string;
  span?: 'full' | 'half';
  disabled?: boolean;
  options?: FieldOption[];
  onSearch?: (value: string) => void;
  loading?: boolean;
  minSearchLength?: number;
  showSearchIcon?: boolean;

  // Number-specific
  min?: number;
  max?: number;
  step?: number;
  format?: Intl.NumberFormatOptions;

  // Image-specific
  maxSizeMB?: number;
  accept?: string;

  // Switch-specific
  switchDescription?: string;
  onLabel?: string;
  offLabel?: string;

  previewIcon?: boolean;
  generateValue?: () => string;
  generateLabel?: string;
};

type EditFormProps = {
  fields: Field[];
  initialValues?: Record<string, string>;
  initialFiles?: Record<string, File>;
  schema?: z.ZodType<Record<string, unknown>>;
  onSubmit: (values: Record<string, string>, files: Record<string, File>) => void;
  onClose?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function EditForm({
  fields,
  initialValues = {},
  initialFiles = {},
  schema,
  onSubmit,
  onClose,
  isSubmitting,
  submitLabel,
}: EditFormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [files, setFiles] = useState<Record<string, File>>(initialFiles);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (schema) {
      const result = schema.safeParse(values);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    onSubmit(values, files);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {fields.map((field) => {
          const error = errors[field.name];
          const value = values[field.name] || '';

          if (field.type === 'select') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <DropdownList
                  value={value}
                  options={field.options || []}
                  onChange={(v) => handleChange(field.name, v)}
                  error={!!error}
                  helperText={error || field.hint}
                  disabled={field.disabled}
                />
              </Box>
            );
          }

          if (field.type === 'autocomplete') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <AutocompleteField
                  value={value}
                  options={field.options || []}
                  onChange={(v) => handleChange(field.name, v)}
                  onSearch={field.onSearch}
                  loading={field.loading}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  required={field.required}
                  error={error}
                  hint={field.hint}
                  minSearchLength={field.minSearchLength}
                  showSearchIcon={field.showSearchIcon}
                />
              </Box>
            );
          }

          if (field.type === 'number') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <NumberField
                  label={field.label}
                  value={value ? parseFloat(value) : undefined}
                  onChange={(v) => handleChange(field.name, v?.toString() || '')}
                  error={!!error}
                  size="small"
                />
              </Box>
            );
          }

          if (field.type === 'image') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <ImageUploadField
                  field={field}
                  file={files[field.name] || null}
                  onChange={(f) => setFiles((prev) => ({ ...prev, [field.name]: f }))}
                  error={error}
                />
              </Box>
            );
          }

          if (field.type === 'color') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <ColorField value={value} onChange={(v) => handleChange(field.name, v)} error={error} hint={field.hint} />
              </Box>
            );
          }

          if (field.type === 'switch') {
            return <SwitchField key={field.name} field={field} checked={value === 'true'} onChange={(v) => handleChange(field.name, v.toString())} />;
          }

          if (field.type === 'multiSelect') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <MultiSelectDropdownList
                  value={value}
                  options={field.options || []}
                  onChange={(v) => handleChange(field.name, v)}
                  error={!!error}
                  helperText={error || field.hint}
                  disabled={field.disabled}
                />
              </Box>
            );
          }

          return (
            <FormField key={field.name} field={field} value={value} onChange={(v) => handleChange(field.name, v)} error={error} disabled={field.disabled} />
          );
        })}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        {onClose && (
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting} sx={responsiveButtonSx}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" color="success" disabled={isSubmitting} sx={responsiveButtonSx}>
          {isSubmitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {submitLabel || 'Save'}
        </Button>
      </Stack>
    </Box>
  );
}
