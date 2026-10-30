import { useEffect, useState, type ReactNode } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

import { Iconify } from '../iconify';
import { desktopDensityQuery, desktopFontSize, desktopSize, desktopSizeMin } from '../../theme/desktop-density';

export type ViewFieldTone = 'default' | 'primary' | 'success' | 'warning' | 'error';

export type ViewField = {
  label: string;
  value?: ReactNode;
  type?: 'text' | 'boolean' | 'status' | 'custom';
  tone?: ViewFieldTone;
  span?: 1 | 2;
  hidden?: boolean;
};

export type ViewSection = {
  title: string;
  fields?: ViewField[];
  content?: ReactNode;
  hidden?: boolean;
  compact?: boolean;
  dense?: boolean;
};

type ViewModalSnapshot = {
  title: ReactNode;
  sections: ViewSection[];
  footer?: ReactNode;
  loading: boolean;
  compact: boolean;
  reducedHorizontalSpacing: boolean;
  maxWidth: number;
};

export type ViewModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sections: ViewSection[];
  loading?: boolean;
  emptyText?: string;
  maxWidth?: number;
  footer?: ReactNode;
  compact?: boolean;
  reducedHorizontalSpacing?: boolean;
  onExited?: () => void;
  disableEnforceFocus?: boolean;
};

const isEmptyValue = (value: ReactNode) => value === null || value === undefined || value === '';

function BooleanValue({ value }: { value: ReactNode }) {
  if (isEmptyValue(value)) {
    return <Typography sx={{ color: 'primary.main', fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 }, lineHeight: { xs: 1.45, md: 1.45, lg: 1.55, xl: 1.55 } }}>-</Typography>;
  }

  const enabled = value === true || value === 'Yes' || value === 'yes' || value === 1;

  return (
    <Typography
      sx={{
        color: enabled ? 'success.dark' : 'error.dark',
        fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 },
        lineHeight: { xs: 1.45, md: 1.45, lg: 1.55, xl: 1.55 },
        fontWeight: 600,
      }}
    >
      {enabled ? 'Yes' : 'No'}
    </Typography>
  );
}

const statusToneColor: Record<ViewFieldTone, string> = {
  default: 'text.primary',
  primary: 'primary.main',
  success: 'success.dark',
  warning: 'warning.dark',
  error: 'error.dark',
};

function StatusValue({ value, tone = 'default' }: { value: ReactNode; tone?: ViewFieldTone }) {
  return (
    <Typography
      sx={{
        color: statusToneColor[tone] || 'primary.main',
        fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 },
        lineHeight: { xs: 1.45, md: 1.45, lg: 1.55, xl: 1.55 },
        fontWeight: 600,
        overflowWrap: 'anywhere',
      }}
    >
      {isEmptyValue(value) ? '-' : value}
    </Typography>
  );
}

function FieldValue({ field }: { field: ViewField }) {
  if (field.type === 'boolean') return <BooleanValue value={field.value} />;
  if (field.type === 'status') return <StatusValue value={field.value} tone={field.tone} />;
  if (field.type === 'custom') return <Box sx={{ minWidth: 0 }}>{field.value}</Box>;

  return (
    <Typography
      component="div"
      sx={{
        minWidth: 0,
        color: 'primary.main',
        fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 },
        lineHeight: { xs: 1.45, md: 1.45, lg: 1.55, xl: 1.55 },
        overflowWrap: 'anywhere',
      }}
    >
      {isEmptyValue(field.value) ? '-' : field.value}
    </Typography>
  );
}

function DetailField({ field }: { field: ViewField }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px, 46%) minmax(0, 1fr)' },
        gap: { xs: 0.25, sm: 1, md: 0.9, lg: desktopSize(10), xl: 1.25 },
        alignItems: 'start',
        gridColumn: field.span === 2 ? '1 / -1' : 'auto',
        minWidth: 0,
      }}
    >
      <Typography
        component="div"
        sx={{
          color: 'text.primary',
          fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 },
          lineHeight: { xs: 1.45, md: 1.45, lg: 1.55, xl: 1.55 },
          textAlign: { xs: 'left', sm: 'right' },
          whiteSpace: { xs: 'normal', sm: 'pre-line' },
        }}
      >
        {field.label} :
      </Typography>
      <FieldValue field={field} />
    </Box>
  );
}

export function ViewDetailSection({ section }: { section: ViewSection }) {
  const fields = (section.fields || []).filter((field) => !field.hidden);

  if (!fields.length && !section.content) return null;

  return (
    <Box component="section">
      {section.title && (
        <Box
          sx={{
            position: 'relative',
            mb: section.dense ? { xs: 0.75, md: 0.75, lg: desktopSize(8), xl: 1 } : { xs: 1.5, md: 1.5, lg: desktopSize(18), xl: 2.25 },
            pt: section.dense ? { xs: 0.5, md: 0.5, lg: desktopSize(6), xl: 0.75 } : { xs: 1.25, md: 1.25, lg: desktopSize(16), xl: 2 },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: 0,
              left: 0,
              borderTop: 1,
              borderColor: 'divider',
            }}
          />
          <Typography
            component="h3"
            sx={{
              position: 'relative',
              display: 'inline-flex',
              m: 0,
              px: { xs: 1.25, sm: 1.5, md: 1.25, lg: desktopSize(14), xl: 1.75 },
              py: { xs: 0.35, md: 0.3, lg: desktopSize(3.6), xl: 0.45 },
              color: '#8b1111',
              bgcolor: '#fff0e3',
              fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 },
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            {section.title}
          </Typography>
        </Box>
      )}

      {section.content ? (
        <Box sx={{ px: section.compact ? 0 : { xs: 0, sm: 2, md: 2.25, lg: desktopSize(24), xl: 3 }, pb: section.compact ? 0 : { xs: 2, md: 2.25, lg: desktopSize(24), xl: 3 } }}>{section.content}</Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            columnGap: { md: section.dense ? 2.25 : 3.5, lg: desktopSize(section.dense ? 24 : 40), xl: section.dense ? 3 : 5 },
            rowGap: section.dense ? { xs: 0.35, md: 0.3, lg: desktopSize(2.8), xl: 0.35 } : { xs: 1, md: 0.9, lg: desktopSize(10), xl: 1.25 },
            px: { xs: 0, sm: section.dense ? 2 : 4, md: section.dense ? 2.25 : 3.5, lg: desktopSize(section.dense ? 24 : 40), xl: section.dense ? 3 : 5 },
            pb: section.dense ? { xs: 1.25, md: 1.25, lg: desktopSize(12), xl: 1.5 } : { xs: 2, md: 2.25, lg: desktopSize(24), xl: 3 },
          }}
        >
          {fields.map((field, index) => (
            <DetailField key={`${field.label}-${index}`} field={field} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function ViewModal({
  open,
  onClose,
  title = 'View',
  sections,
  loading = false,
  emptyText = 'No details available.',
  maxWidth = 1080,
  footer,
  compact = false,
  reducedHorizontalSpacing = false,
  onExited,
  disableEnforceFocus = false,
}: ViewModalProps) {
  const [closeSnapshot, setCloseSnapshot] = useState<ViewModalSnapshot | null>(null);

  useEffect(() => {
    if (!open) return;

    setCloseSnapshot({
      title,
      sections,
      footer,
      loading,
      compact,
      reducedHorizontalSpacing,
      maxWidth,
    });
  }, [open, title, sections, footer, loading, compact, reducedHorizontalSpacing, maxWidth]);

  const display = open
    ? { title, sections, footer, loading, compact, reducedHorizontalSpacing, maxWidth }
    : closeSnapshot ?? { title, sections, footer, loading, compact, reducedHorizontalSpacing, maxWidth };

  const visibleSections = display.sections.filter((section) => !section.hidden);
  const hasDetails = visibleSections.some((section) => Boolean(section.content) || (section.fields || []).some((field) => !field.hidden));

  const handleExited = () => {
    setCloseSnapshot(null);
    onExited?.();
  };

  return (
    <Dialog
      open={open}
      onClose={display.loading ? undefined : onClose}
      disableEnforceFocus={disableEnforceFocus}
      fullWidth
      maxWidth={false}
      aria-labelledby="common-view-modal-title"
      slotProps={{
        transition: {
          onExited: handleExited,
        },
        backdrop: {
          sx: {
            bgcolor: 'rgba(46, 57, 68, 0.48)',
          },
        },
        paper: {
          sx: {
            width: { xs: `min(${display.maxWidth}px, calc(100vw - 24px))`, sm: `min(${display.maxWidth}px, calc(100vw - 32px))` },
            maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100dvh - 40px)', md: 'calc(100dvh - 48px)', lg: `calc(100dvh - ${desktopSize(64)})`, xl: 'calc(100dvh - 64px)' },
            m: display.reducedHorizontalSpacing ? { xs: 0.75, sm: 1, md: 0.75, lg: desktopSize(8), xl: 1 } : { xs: 1.5, sm: 2, md: 1.5, lg: desktopSize(16), xl: 2 },
            borderRadius: { xs: 1.5, sm: 2, md: 1.75, lg: desktopSize(18), xl: 2.25 },
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(24, 33, 43, 0.24)',
            [desktopDensityQuery]: {
              maxHeight: `calc(100dvh - ${desktopSize(64)})`,
              m: display.reducedHorizontalSpacing ? desktopSize(8) : desktopSize(16),
              borderRadius: desktopSize(18),
              '& .MuiTypography-root': { fontSize: desktopFontSize(16) },
              '& .MuiButton-root': {
                fontSize: desktopSizeMin(14),
                minHeight: desktopSizeMin(36),
                px: desktopSizeMin(16),
                py: desktopSizeMin(6),
                borderRadius: desktopSizeMin(8),
              },
            },
          },
        },
      }}
    >
      <DialogTitle
        id="common-view-modal-title"
        component="div"
        sx={{
          minHeight: { xs: 46, sm: 48, md: 44, lg: desktopSize(50), xl: 50 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1.25, sm: 1.5, md: 1.25, lg: desktopSize(16), xl: 2 },
          px: display.reducedHorizontalSpacing
            ? { xs: 1, sm: 1.25, md: 1, lg: desktopSize(10), xl: 1.25 }
            : { xs: 1.5, sm: 1.75, md: 1.75, lg: desktopSize(17.2), xl: 2.15 },
          py: { xs: 0.75, sm: 0.85, md: 0.65, lg: desktopSize(8), xl: 1 },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.200',
        }}
      >
        <Typography component="h2" noWrap sx={{ minWidth: 0, fontSize: { xs: 15, sm: 16, md: 14, lg: desktopFontSize(17), xl: 17 }, fontWeight: 600, color: 'text.primary' }}>
          {display.title}
        </Typography>

        <IconButton
          aria-label="Close details"
          onClick={onClose}
          disabled={display.loading}
          sx={{
            flexShrink: 0,
            width: { xs: 26, sm: 27, md: 24, lg: desktopSize(28), xl: 28 },
            height: { xs: 26, sm: 27, md: 24, lg: desktopSize(28), xl: 28 },
            borderRadius: { xs: 1, md: 0.9, lg: desktopSize(9.6), xl: 1.2 },
            color: 'common.white',
            bgcolor: '#ff5733',
            '&:hover': { bgcolor: '#e94725' },
            '&.Mui-disabled': { color: 'common.white', bgcolor: '#ff8b72' },
          }}
        >
          <Iconify icon="mingcute:close-line" sx={{ width: { xs: 18, md: 17, lg: desktopSize(20), xl: 20 }, height: { xs: 18, md: 17, lg: desktopSize(20), xl: 20 } }} />
        </IconButton>
      </DialogTitle>

      {display.loading && <LinearProgress />}

      <DialogContent
        dividers={false}
        sx={{
          px: display.reducedHorizontalSpacing
            ? { xs: 0.75, sm: 1, md: 0.75, lg: desktopSize(8), xl: 1 }
            : display.compact
              ? { xs: 1.5, sm: 2, md: 1.75, lg: desktopSize(17.2), xl: 2.15 }
              : { xs: 1.5, sm: 2.25, md: 2, lg: desktopSize(20), xl: 2.5 },
          py: display.compact ? { xs: 1.5, sm: 1.75, md: 1.5, lg: desktopSize(16), xl: 2 } : { xs: 1.75, sm: 2.25, md: 2, lg: desktopSize(20), xl: 2.5 },
          bgcolor: 'background.paper',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99, 115, 129, 0.45) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(99, 115, 129, 0.45)', borderRadius: 999 },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(99, 115, 129, 0.7)' },
        }}
      >
        {display.loading && !hasDetails && (
          <Box sx={{ minHeight: { xs: 180, sm: 200, md: 180, lg: desktopSize(220), xl: 220 }, display: 'grid', placeItems: 'center' }}>
            <CircularProgress sx={{ width: { xs: 26, sm: 27, md: 24, lg: desktopSize(28), xl: 28 }, height: { xs: 26, sm: 27, md: 24, lg: desktopSize(28), xl: 28 } }} />
          </Box>
        )}

        {!display.loading && !hasDetails && (
          <Box sx={{ minHeight: { xs: 150, sm: 165, md: 150, lg: desktopSize(180), xl: 180 }, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: 14, sm: 15, md: 14, lg: desktopFontSize(16), xl: 16 } }}>{emptyText}</Typography>
          </Box>
        )}

        {hasDetails && (
          <Box sx={{ display: 'grid', gap: { xs: 0.2, md: 0.2, lg: desktopSize(2), xl: 0.25 }, opacity: display.loading ? 0.72 : 1, pointerEvents: display.loading ? 'none' : 'auto', transition: 'opacity 160ms ease' }}>
            {visibleSections.map((section, index) => (
              <ViewDetailSection key={`${section.title}-${index}`} section={section} />
            ))}
          </Box>
        )}
      </DialogContent>

      {display.footer && (
        <DialogActions
          sx={{
            minHeight: display.compact ? { xs: 56, sm: 60, md: 54, lg: desktopSize(64), xl: 64 } : { xs: 64, sm: 68, md: 60, lg: desktopSize(72), xl: 72 },
            px: { xs: 1.5, sm: 2.25, md: 2, lg: desktopSize(20), xl: 2.5 },
            py: display.compact ? { xs: 0.75, md: 0.75, lg: desktopSize(8), xl: 1 } : { xs: 1, md: 1, lg: desktopSize(12), xl: 1.5 },
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {display.footer}
        </DialogActions>
      )}
    </Dialog>
  );
}
