import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { Iconify } from '../iconify';

const TREND_CONFIG = {
  up: { color: 'success.dark', icon: 'eva:trending-up-fill' },
  down: { color: 'error.dark', icon: 'eva:trending-down-fill' },
  neutral: { color: 'text.secondary', icon: null },
};

// Ported from the `ui components` StatTile: uppercase title, big value,
// subtitle, optional trend row, and a colored icon tile (color.lighter bg).
export function StatTile({ title, value, icon, subtitle, trend, color = 'primary', valueColor = 'text.primary', loading = false, sx, ...other }) {
  const activeTrend = trend ? TREND_CONFIG[trend.direction] : null;

  return (
    <Card
      aria-busy={loading || undefined}
      sx={[
        {
          minHeight: { xs: 132, md: 104, xl: 120 },
          p: { xs: 3, sm: 3, md: 2, xl: 2.5 },
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2.5} sx={{ height: 1 }}>
        <Stack spacing={subtitle || trend ? 0.55 : 1.25} justifyContent="center" sx={{ minWidth: 0, flex: 1 }}>
          {loading ? (
            <>
              <Skeleton width={132} height={20} />
              <Skeleton width={88} height={34} />
              <Skeleton width={120} height={18} />
            </>
          ) : (
            <>
              <Typography
                variant="overline"
                component="h6"
                noWrap
                sx={{ color: 'text.secondary', fontSize: { xs: 13, md: 12, xl: 13 }, fontWeight: 500, letterSpacing: 0 }}
              >
                {title}
              </Typography>

              <Typography
                component="p"
                noWrap
                title={typeof value === 'string' ? value : undefined}
                sx={{ color: valueColor, fontSize: { xs: 26, md: 20, xl: 24 }, fontWeight: 600, lineHeight: 1.1, letterSpacing: 0 }}
              >
                {value}
              </Typography>

              {subtitle && (
                <Typography noWrap variant="caption" color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25 }}>
                  {subtitle}
                </Typography>
              )}

              {trend && activeTrend && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: activeTrend.color }}>
                  {activeTrend.icon && <Iconify icon={activeTrend.icon} width={18} />}
                  <Typography noWrap variant="subtitle2" sx={{ color: 'inherit', fontSize: { xs: 14, md: 12.5, xl: 14 }, fontWeight: 600 }}>
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
            width: { xs: 42, md: 36, xl: 42 },
            height: { xs: 42, md: 36, xl: 42 },
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: { xs: 1.4, md: 1, xl: 1.4 },
            color: `${color}.dark`,
            bgcolor: `${color}.lighter`,
            alignSelf: 'flex-start',
          }}
        >
          {loading ? <Skeleton variant="rounded" width={42} height={42} /> : <Iconify icon={icon} width={22} />}
        </Box>
      </Stack>
    </Card>
  );
}
