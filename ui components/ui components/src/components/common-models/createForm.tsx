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
import { useState, useRef, useCallback, useEffect, type JSX } from 'react';
import * as z from 'zod';
import NumberField from './NumberField';
import DropdownList from './DropdownList';
import AutocompleteField from './AutocompleteField';
import { Iconify } from '../iconify';
import { desktopFont, desktopSpacing, desktopValue } from '../../theme/desktop-density';
import { formDensitySx } from './responsive-styles';

const responsiveControlSx = {
  '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
    height: { xs: 40, sm: 40, md: 40, xl: 40 },
  },
  '& .MuiOutlinedInput-root.MuiInputBase-multiline': {
    minHeight: { xs: 40, sm: 40, md: 40, xl: 40 },
  },
  '& .MuiInputBase-input': {
    fontSize: { xs: 14, sm: 14, md: 14, xl: 14 },
    px: { xs: 1, sm: 1.25, md: 1.25, xl: 1.25 },
    py: 0,
  },
  '& .MuiInputBase-inputMultiline': {
    fontSize: { xs: 14, sm: 14, md: 14, xl: 14 },
    px: { xs: 1, sm: 1.25, md: 1.25, xl: 1.25 },
    py: { xs: 0.75, md: 0.75, xl: 0.75 },
  },
  '& .MuiInputAdornment-root': {
    mr: { xs: 1, md: 1, xl: 1 },
  },
  '& .MuiInputAdornment-root svg': {
    width: { xs: 20, md: 22, xl: 22 },
    height: { xs: 20, md: 22, xl: 22 },
  },
  '& .MuiInputLabel-root': {
    fontSize: { xs: 14, sm: 14, md: 14, xl: 14 },
  },
  '& .MuiFormHelperText-root': {
    fontSize: desktopFont(10.5),
    ml: 0,
  },
};

const formLabelSx = {
  fontSize: desktopFont(11),
  fontWeight: 500,
  color: 'text.secondary',
  mb: { xs: 0.5, md: 0.5, xl: 0.5 },
};

const formErrorSx = {
  fontSize: desktopFont(10.5),
  color: '#e24b4a',
  mt: { xs: 0.5, md: 0.5, xl: 0.5 },
};

const responsiveButtonSx = {
  minHeight: { xs: 40, sm: 40, md: 36, xl: 36 },
  fontSize: { xs: 14, sm: 14, md: 14, xl: 14 },
  px: { xs: 2, sm: 2, md: 2, xl: 2 },
};

export { formLabelSx, formErrorSx, responsiveControlSx, responsiveButtonSx };

const uploadPreviewThumbSx = {
  width: desktopValue(100),
  height: desktopValue(100),
  borderRadius: 1,
  objectFit: 'cover',
  border: '0.5px solid',
  borderColor: 'divider',
};

const uploadRemoveBtnSx = {
  width: { xs: 22, md: 22, xl: 22 },
  height: { xs: 22, md: 22, xl: 22 },
  borderRadius: '50%',
  bgcolor: '#fee2e2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#a32d2d',
  fontSize: { xs: 14, md: 14, xl: 14 },
  '&:hover': { bgcolor: '#fca5a5' },
};

export type FieldOption = {
  value: string;
  label?: string;
  description?: string;
  color?: string;
  activeBg?: string;
  activeText?: string;
};

export type Field = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'autocomplete' | 'toggle' | 'image' | 'switch' | 'date' | 'video' | 'color';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
  defaultValue?: string;
  span?: 'full' | 'half';
  options?: FieldOption[];
  disabled?: boolean;
  resetFieldsOnChange?: string[];
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
  minSearchLength?: number;
  showSearchIcon?: boolean;
  previewIcon?: boolean;
  min?: number;
  max?: number;
  step?: number;
  format?: Intl.NumberFormatOptions;
  allowEmptyNumber?: boolean;
  maxSizeMB?: number;
  accept?: string;
  switchDescription?: string;
  onLabel?: string;
  offLabel?: string;
};

type CreateFormProps = {
  fields: Field[];
  schema?: z.ZodType<Record<string, unknown>>;
  onSubmit: (values: Record<string, string>, files: Record<string, File>) => void;
  onClose?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

function ColorField({
  value,
  onChange,
  error,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}) {
  const normalizedValue = value || '';
  const color = /^#[0-9a-fA-F]{6}$/.test(normalizedValue) ? normalizedValue : '#FFFFFF';

  return (
    <TextField
      value={normalizedValue}
      size="small"
      fullWidth
      placeholder="#FFFFFF"
      error={!!error}
      helperText={error ?? hint ?? 'Enter hex color or pick from selector'}
      onChange={(e) => onChange(e.target.value.trim().toUpperCase())}
      sx={responsiveControlSx}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Box
              component="label"
              aria-label="Pick color"
              sx={{
                width: { xs: 30, md: 30, xl: 30 },
                height: { xs: 30, md: 30, xl: 30 },
                borderRadius: 1,
                bgcolor: color,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.45)',
                '&:hover': {
                  borderColor: 'text.secondary',
                },
              }}
            >
              <Box
                component="input"
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
            </Box>
          </InputAdornment>
        ),
      }}
      FormHelperTextProps={{ sx: { fontSize: { xs: 10.5, md: 10.5, xl: 10.5 }, ml: 0 } }}
    />
  );
}

export function FormFieldLabel({ field }: { field: Pick<Field, 'label' | 'required'> }) {
  return (
    <Typography sx={formLabelSx}>
      {field.label}
      {field.required && <span style={{ color: '#e24b4a', marginLeft: 2 }}>*</span>}
    </Typography>
  );
}

export function FormField({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const labelEl = field.type !== 'switch' ? <FormFieldLabel field={field} /> : null;

  return (
    <Box>
      {labelEl}
      <TextField
        value={value}
        size="small"
        fullWidth
        type={field.type === 'textarea' ? 'text' : field.type}
        placeholder={field.placeholder}
        multiline={field.type === 'textarea'}
        rows={field.type === 'textarea' ? (field.rows ?? 3) : undefined}
        error={!!error}
        helperText={error ?? field.hint ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        inputProps={field.type === 'text' || field.type === 'textarea' ? { maxLength: 2000 } : undefined}
        sx={responsiveControlSx}
        InputProps={{
          endAdornment: field.previewIcon && value ? (
            <InputAdornment position="end">
              <Iconify icon={value as any} width={22} />
            </InputAdornment>
          ) : undefined,
        }}
        FormHelperTextProps={{ sx: { fontSize: { xs: 10.5, md: 10.5, xl: 10.5 }, ml: 0 } }}
      />
    </Box>
  );
}

export function ImageUploadField({
  field,
  file,
  onChange,
  error,
}: {
  field: Field;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const maxBytes = (field.maxSizeMB ?? 2) * 1024 * 1024;

  const acceptFile = (f: File) => {
    if (f.size > maxBytes) return;
    onChange(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview && file) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, md: 1.5, xl: 1.5 },
          p: { xs: 1.25, md: 1.25, xl: 1.25 },
          border: '0.5px solid',
          borderColor: error ? '#e24b4a' : 'divider',
          borderRadius: { xs: 1.5, md: 1.5, xl: 1.5 },
          bgcolor: 'background.paper',
        }}
      >
        <Box component="img" src={preview} alt="preview" sx={uploadPreviewThumbSx} />
        <Box flex={1} minWidth={0}>
          <Typography sx={{ fontSize: desktopFont(12), fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </Typography>
          <Typography sx={{ fontSize: desktopFont(11), color: 'text.disabled', mt: 0.25 }}>
            {(file.size / 1024).toFixed(0)} KB · click to replace
          </Typography>
        </Box>
        <Box onClick={removeFile} sx={uploadRemoveBtnSx}>
          ×
        </Box>
        <input ref={inputRef} type="file" accept={field.accept ?? 'image/*'} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])} />
      </Box>
    );
  }

  return (
    <>
      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith('image/')) acceptFile(f);
        }}
        sx={{
          border: '1.5px dashed',
          borderColor: error ? '#e24b4a' : drag ? 'text.primary' : 'divider',
          borderRadius: { xs: 1.5, md: 1.5, xl: 1.5 },
          p: { xs: '18px 16px', md: '18px 16px', xl: '18px 16px' },
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: drag ? 'action.hover' : 'background.default',
          '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' },
        }}
      >
        <Typography sx={{ fontSize: desktopFont(12), fontWeight: 500 }}>
          Drop image here or <span style={{ textDecoration: 'underline' }}>browse</span>
        </Typography>
        <Typography sx={{ fontSize: desktopFont(11), color: 'text.disabled', mt: 0.25 }}>
          PNG, JPG, WebP · max {field.maxSizeMB ?? 2} MB
        </Typography>
        <input ref={inputRef} type="file" accept={field.accept ?? 'image/*'} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])} />
      </Box>
      {error && <Typography sx={formErrorSx}>{error}</Typography>}
    </>
  );
}

export function MultiFileUploadField({
  files,
  onChange,
  error,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt',
  maxSizeMB = 10,
  maxFiles = 10,
  hint,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const maxBytes = maxSizeMB * 1024 * 1024;

  const fileKey = (file: File, index: number) => `${file.name}-${file.size}-${file.lastModified}-${index}`;

  useEffect(() => {
    const next: Record<string, string> = {};
    const objectUrls: string[] = [];

    files.forEach((file, index) => {
      const key = fileKey(file, index);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        next[key] = url;
      }
    });

    setPreviews(next);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const incoming = Array.from(fileList);
    const next = [...files];

    for (const file of incoming) {
      if (next.length >= maxFiles) break;
      if (file.size > maxBytes) continue;
      const duplicate = next.some(
        (existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified
      );
      if (duplicate) continue;
      next.push(file);
    }

    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(files.filter((_, itemIndex) => itemIndex !== index));
    if (inputRef.current) inputRef.current.value = '';
  };

  const thumbSlotSx = {
    width: 100,
    height: 100,
    borderRadius: 1.25,
    border: '1px solid',
    borderColor: error ? '#e24b4a' : 'divider',
    bgcolor: 'background.paper',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative' as const,
    flexShrink: 0,
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        {files.map((file, index) => {
          const key = fileKey(file, index);
          const preview = previews[key];

          return (
            <Box key={key} sx={thumbSlotSx}>
              {preview ? (
                <Box component="img" src={preview} alt={file.name} sx={{ width: 1, height: 1, objectFit: 'cover' }} />
              ) : (
                <Iconify icon={'solar:file-text-bold' as any} width={28} sx={{ color: 'text.secondary' }} />
              )}
              <Box
                onClick={(event) => removeFile(index, event)}
                sx={{
                  ...uploadRemoveBtnSx,
                  position: 'absolute',
                  top: 4,
                  right: 4,
                }}
              >
                ×
              </Box>
            </Box>
          );
        })}

        {files.length < maxFiles ? (
          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              ...thumbSlotSx,
              borderStyle: 'dashed',
              cursor: 'pointer',
              bgcolor: drag ? 'action.hover' : 'background.default',
              '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' },
            }}
          >
            <Iconify icon="mingcute:add-line" width={22} sx={{ color: 'text.secondary' }} />
            <input ref={inputRef} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={(event) => addFiles(event.target.files)} />
          </Box>
        ) : null}
      </Stack>
      <Typography sx={{ fontSize: desktopFont(11), color: 'text.disabled', mt: 0.75 }}>{hint || `PDF, DOC, XLS, PNG, JPG · max ${maxSizeMB} MB each · up to ${maxFiles} files`}</Typography>
      {error && <Typography sx={formErrorSx}>{error}</Typography>}
    </>
  );
}

function VideoUploadField({
  field,
  file,
  onChange,
  error,
}: {
  field: Field;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const maxBytes = (field.maxSizeMB ?? 50) * 1024 * 1024;

  const acceptFile = (f: File) => {
    if (f.size > maxBytes) return;
    onChange(f);
    setPreview(URL.createObjectURL(f));
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview && file) {
    return (
      <Box sx={{ border: '0.5px solid', borderColor: error ? '#e24b4a' : 'divider', borderRadius: { xs: 1.5, md: 1.5, xl: 1.5 }, overflow: 'hidden' }}>
        <Box component="video" src={preview} controls sx={{ width: '100%', display: 'block', maxHeight: { xs: 180, md: 180, xl: 180 }, bgcolor: '#000' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 1.5, xl: 1.5 }, px: { xs: 1.5, md: 1.5, xl: 1.5 }, py: { xs: 1, md: 1, xl: 1 } }}>
          <Box flex={1} minWidth={0}>
            <Typography sx={{ fontSize: desktopFont(12), fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</Typography>
            <Typography sx={{ fontSize: desktopFont(11), color: 'text.disabled', mt: 0.25 }}>{(file.size / (1024 * 1024)).toFixed(2)} MB · click to replace</Typography>
          </Box>
          <Box onClick={removeFile} sx={uploadRemoveBtnSx}>×</Box>
          <input ref={inputRef} type="file" accept={field.accept ?? 'video/*'} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])} />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith('video/')) acceptFile(f);
        }}
        sx={{
          border: '1.5px dashed',
          borderColor: error ? '#e24b4a' : drag ? 'text.primary' : 'divider',
          borderRadius: { xs: 1.5, md: 1.5, xl: 1.5 },
          p: { xs: '18px 16px', md: '18px 16px', xl: '18px 16px' },
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: drag ? 'action.hover' : 'background.default',
          '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' },
        }}
      >
        <Typography sx={{ fontSize: desktopFont(12), fontWeight: 500 }}>
          Drop video here or <span style={{ textDecoration: 'underline' }}>browse</span>
        </Typography>
        <Typography sx={{ fontSize: desktopFont(11), color: 'text.disabled', mt: 0.25 }}>
          MP4, WebM, MOV · max {field.maxSizeMB ?? 50} MB
        </Typography>
        <input ref={inputRef} type="file" accept={field.accept ?? 'video/*'} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])} />
      </Box>
      {error && <Typography sx={formErrorSx}>{error}</Typography>}
    </>
  );
}

function SwitchField({ field, checked, onChange }: { field: Field; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, md: 1.5, xl: 1.5 },
        py: { xs: 1, md: 1, xl: 1 },
        border: '0.5px solid',
        borderColor: 'divider',
        borderRadius: { xs: 1.5, md: 1.5, xl: 1.5 },
        bgcolor: 'background.default',
      }}
    >
      <Box>
        <Typography sx={{ fontSize: desktopFont(12.5), fontWeight: 500 }}>{field.label}</Typography>
        {field.switchDescription && <Typography sx={{ fontSize: desktopFont(11), color: 'text.disabled', mt: 0.25 }}>{field.switchDescription}</Typography>}
      </Box>
      <Stack direction="row" alignItems="center" gap={{ xs: 1, md: 1, xl: 1 }}>
        <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </Stack>
    </Box>
  );
}

export function CreateForm({ fields, schema, onSubmit, onClose, isSubmitting, submitLabel }: CreateFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      }
    });
    return initial;
  });

  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (fields.find((f) => f.name === name)?.resetFieldsOnChange) {
      const field = fields.find((f) => f.name === name);
      field?.resetFieldsOnChange?.forEach((resetName) => {
        setValues((prev) => ({ ...prev, [resetName]: '' }));
      });
    }

    fields.find((f) => f.name === name)?.onChange?.(value);
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
                <ImageUploadField field={field} file={files[field.name] || null} onChange={(f) => setFiles((prev) => ({ ...prev, [field.name]: f }))} error={error} />
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

          if (field.type === 'video') {
            return (
              <Box key={field.name}>
                <FormFieldLabel field={field} />
                <VideoUploadField field={field} file={files[field.name] || null} onChange={(f) => setFiles((prev) => ({ ...prev, [field.name]: f }))} error={error} />
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
          {submitLabel || 'Submit'}
        </Button>
      </Stack>
    </Box>
  );
}
