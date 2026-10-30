import type { ReactNode } from 'react';
import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { Iconify } from '../iconify';

export type StatTileColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type StatTileTrend = {
  direction: 'up' | 'down' | 'neutral';
  label: string;
};

export type StatTileProps = Omit<CardProps, 'title'> & {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  subtitle?: ReactNode;
  trend?: StatTileTrend;
  color?: StatTileColor;
  valueColor?: string;
  loading?: boolean;
};

const trendConfig = {
  up: {
    color: 'success.dark',
    icon: 'eva:trending-up-fill',
  },
  down: {
    color: 'error.dark',
    icon: 'eva:trending-down-fill',
  },
  neutral: {
    color: 'text.secondary',
    icon: null,
  },
} as const;

export function StatTile({ title, value, icon, subtitle, trend, color = 'primary', valueColor = 'text.primary', loading = false, sx, ...other }: StatTileProps) {
  const activeTrend = trend ? trendConfig[trend.direction] : null;

  return (
    <Card
      aria-busy={loading || undefined}
      sx={[
        {
          minHeight: { xs: 154, md: 104, lg: 104, xl: 124 },
          maxHeight: { xs: 154, md: 104, lg: 104, xl: 124 },
          p: { xs: 3.5, sm: 3.5, md: 1.75, lg: 1.75, xl: 2.5 },
          border: 0,
          borderColor: 'divider',
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2.5} sx={{ height: 1 }}>
        <Stack spacing={subtitle ? 0.55 : 1.25} sx={{ minWidth: 0, flex: 1 }}>
          {loading ? (
            <>
              <Skeleton width={132} height={24} />
              <Skeleton width={88} height={54} />
              <Skeleton width={148} height={24} />
            </>
          ) : (
            <>
              <Typography
                variant="overline"
                component="h6"
                noWrap
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: 14, sm: 14, md: 12, lg: 12.5, xl: 14 },
                  fontWeight: 500,
                  letterSpacing: 0,
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </Typography>

              <Typography component="p" noWrap sx={{ color: valueColor, fontSize: { xs: 28, sm: 28, md: 19, lg: 19, xl: 24 }, fontWeight: 500, lineHeight: 1, letterSpacing: 0 }}>
                {value}
              </Typography>

              {subtitle && <Typography noWrap variant="caption" color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25 }}>{subtitle}</Typography>}

              {trend && activeTrend && (
                <Stack direction="row" alignItems="center" spacing={0.75} aria-label={`${trend.direction} trend: ${trend.label}`} sx={{ color: activeTrend.color }}>
                  {activeTrend.icon && <Iconify icon={activeTrend.icon} width={20} />}
                  <Typography noWrap variant="subtitle1" sx={{ color: 'inherit', fontSize: { xs: 15, sm: 15, md: 13, lg: 13, xl: 15 }, fontWeight: 600 }}>
                    {trend.label}
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Stack>

        <Box
          aria-hidden
          sx={{
            width: { xs: 42, sm: 42, md: 34, lg: 34, xl: 42 },
            height: { xs: 42, sm: 42, md: 34, lg: 34, xl: 42 },
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: { xs: 1.4, sm: 1.4, md: 1, lg: 1, xl: 1.4 },
            color: `${color}.dark`,
            bgcolor: `${color}.lighter`,
            '& > svg': { width: { xs: 24, sm: 24, md: 20, lg: 20, xl: 24 }, height: { xs: 24, sm: 24, md: 20, lg: 20, xl: 24 } },
          }}
        >
          {loading ? <Skeleton variant="rounded" width={42} height={42} /> : icon}
        </Box>
      </Stack>
    </Card>
  );
}
