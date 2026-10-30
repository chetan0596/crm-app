import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

import { Iconify } from '../iconify';
import { varAlpha } from '../../theme/utils';

// Ported from the `ui components` PayoutQueue pattern, generalized:
// card title (with optional summary suffix), action link on the right,
// rows of icon tile + primary/secondary text + right-aligned amount.
export function DataList({
  title,
  summary,
  items = [],
  actionLabel,
  actionTo,
  onAction,
  loading = false,
  emptyMessage = 'Nothing here yet.',
  minHeight = 180,
  sx,
  ...other
}) {
  return (
    <Card
      aria-busy={loading || undefined}
      sx={[
        {
          height: 1,
          p: { xs: 2.5, md: 2.5, xl: 3 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="h6" component="h2" noWrap sx={{ fontSize: { xs: 16, md: 15, xl: 17 }, minWidth: 0 }}>
          {title}
          {summary != null && (
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {' '}· {summary}
            </Box>
          )}
        </Typography>

        {actionLabel && (actionTo || onAction) && (
          <Link
            component={actionTo ? RouterLink : 'button'}
            to={actionTo}
            type={actionTo ? undefined : 'button'}
            underline="hover"
            onClick={onAction}
            sx={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'primary.main',
              fontSize: { xs: 13, xl: 14 },
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {actionLabel}
            <Iconify icon="eva:arrow-ios-forward-fill" width={14} />
          </Link>
        )}
      </Stack>

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} sx={{ mt: 1.5 }}>
        {loading &&
          Array.from({ length: 3 }, (_, index) => (
            <Stack key={index} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5 }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Skeleton width="52%" />
                <Skeleton width="28%" />
              </Stack>
              <Skeleton width={62} />
            </Stack>
          ))}

        {!loading && items.length === 0 && (
          <Box
            sx={{
              minHeight,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              color: 'text.secondary',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <Iconify icon="solar:database-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
              <Typography variant="body2">{emptyMessage}</Typography>
            </Stack>
          </Box>
        )}

        {!loading &&
          items.map((item) => {
            const clickable = Boolean(item.onClick);
            return (
              <Stack
                key={item.id}
                component={clickable ? 'button' : 'div'}
                type={clickable ? 'button' : undefined}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={item.onClick}
                sx={{
                  width: 1,
                  minWidth: 0,
                  py: 1.5,
                  px: clickable ? 1 : 0,
                  mx: clickable ? -1 : 0,
                  border: 0,
                  borderRadius: 1.5,
                  color: 'inherit',
                  font: 'inherit',
                  textAlign: 'left',
                  bgcolor: 'transparent',
                  cursor: clickable ? 'pointer' : 'default',
                  transition: (theme) => theme.transitions.create('background-color', { duration: theme.transitions.duration.shorter }),
                  ...(clickable && { '&:hover': { bgcolor: 'action.hover' } }),
                }}
              >
                <Box
                  aria-hidden
                  sx={[
                    (theme) => ({
                      width: { xs: 40, md: 36, xl: 42 },
                      height: { xs: 40, md: 36, xl: 42 },
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 1.5,
                      color: theme.vars.palette[item.color || 'primary'].dark,
                      bgcolor: varAlpha(theme.vars.palette[item.color || 'primary'].mainChannel, 0.14),
                    }),
                  ]}
                >
                  <Iconify icon={item.icon} width={20} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontSize: { xs: 14, md: 13, xl: 14 }, fontWeight: 600, lineHeight: 1.35 }}>
                    {item.primary}
                  </Typography>
                  <Typography noWrap variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12.5, md: 11.5, xl: 13 } }}>
                    {item.secondary}
                  </Typography>
                </Box>

                {item.trailing || (
                  item.amount != null && (
                    <Typography
                      noWrap
                      sx={{
                        flexShrink: 0,
                        fontSize: { xs: 14, md: 13, xl: 14 },
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: item.amountColor || 'text.primary',
                      }}
                    >
                      {item.amount}
                    </Typography>
                  )
                )}
              </Stack>
            );
          })}
      </Stack>
    </Card>
  );
}
