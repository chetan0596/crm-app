import type { ReactNode } from 'react';
import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

export type ConversionFunnelStage = {
  id: string;
  label: string;
  value: number;
  color?: string;
  colorShade?: 'lighter' | 'light' | 'main' | 'dark';
};

export const conversionFunnelPalette = {
  base: '#96C458',
  highlight: '#EFA02A',
  terminal: '#3B6D0B',
} as const;

export type ConversionFunnelProps = Omit<CardProps, 'title'> & {
  title?: string;
  stages: ConversionFunnelStage[];
  total?: number;
  actionLabel?: string;
  onAction?: () => void;
  headerAction?: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  valueFormatter?: (value: number) => string;
};

const clampPercentage = (value: number) => Math.min(Math.max(value, 0), 100);

export function ConversionFunnel({
  title = 'Conversion funnel',
  stages,
  total,
  actionLabel,
  onAction,
  headerAction,
  loading = false,
  emptyMessage = 'No conversion data available.',
  valueFormatter = (value) => value.toLocaleString(),
  sx,
  ...other
}: ConversionFunnelProps) {
  const baseline = Math.max(total ?? stages[0]?.value ?? 0, 0);

  return (
    <Card
      aria-busy={loading || undefined}
      sx={[
        {
          p: { xs: 2.5, sm: 2.5, md: 2.5, lg: 2.5, xl: 2.5 },
          border: 1,
          borderColor: 'divider',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="h6" component="h2" sx={{ fontSize: { xs: 16, sm: 16, md: 15, lg: 15, xl: 18 } }}>
          {title}
        </Typography>

        {headerAction ||
          (actionLabel &&
            (onAction ? (
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={onAction}
                sx={{ flexShrink: 0, color: 'success.dark', fontSize: 12, fontWeight: 300, cursor: 'pointer' }}
              >
                {actionLabel} →
              </Link>
            ) : (
              <Typography sx={{ color: 'success.dark', fontSize: 12, fontWeight: 300 }}>{actionLabel}</Typography>
            )))}
      </Stack>

      <Stack spacing={1} sx={{ mt: 1 }}>
        {loading &&
          Array.from({ length: 5 }, (_, index) => (
            <Stack key={index} spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton width={100} />
                <Skeleton width={76} />
              </Stack>
              <Skeleton variant="rounded" height={24} />
            </Stack>
          ))}

        {!loading && stages.length === 0 && (
          <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center', borderRadius: 1.5, bgcolor: 'background.neutral' }}>
            <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
          </Box>
        )}

        {!loading &&
          stages.map((stage, index) => {
            const percentage = baseline > 0 ? clampPercentage((stage.value / baseline) * 100) : 0;
            const color = stage.color ?? (index < 3 ? 'success.light' : 'warning.light');

            return (
              <Stack key={stage.id} spacing={{ xs: 1.75, sm: 1.75, md: 1, lg: 1, xl: 1.75 }}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
                  <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontSize: { xs: 16, sm: 16, md: 13.5, lg: 13.5, xl: 16 } }}>
                    {stage.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap', fontSize: { xs: 16, sm: 16, md: 12, lg: 12, xl: 14 } }}>
                    {valueFormatter(stage.value)} · {Math.round(percentage)}%
                  </Typography>
                </Stack>

                <Box
                  role="progressbar"
                  aria-label={stage.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percentage)}
                  sx={{
                    height: { xs: 20, sm: 22, md: 18, lg: 18, xl: 22 },
                    overflow: 'hidden',
                    borderRadius: { xs: 1, sm: 1, md: 0.65, lg: 0.65, xl: 1 },
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Box
                    key={`${stage.id}-${stage.value}-${percentage}`}
                    sx={{
                      width: `${percentage}%`,
                      minWidth: percentage > 0 ? 8 : 0,
                      height: 1,
                      borderRadius: 'inherit',
                      bgcolor: color,
                      transformOrigin: 'left center',
                      willChange: 'transform, opacity',
                      animation: 'conversionFunnelReveal 720ms cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${Math.min(index * 70, 350)}ms`,
                      '@keyframes conversionFunnelReveal': {
                        '0%': { opacity: 0.45, transform: 'scaleX(0)' },
                        '100%': { opacity: 1, transform: 'scaleX(1)' },
                      },
                      '@media (prefers-reduced-motion: reduce)': { animation: 'none', willChange: 'auto' },
                    }}
                  />
                </Box>
              </Stack>
            );
          })}
      </Stack>
    </Card>
  );
}
