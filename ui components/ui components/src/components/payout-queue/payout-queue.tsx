import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';

export type PayoutQueueItem = {
  requestID: number;
  leadName: string | null;
  sarthiName: string | null;
  capacity?: string | null;
  requestedPaymentMode?: string | null;
  amount: number;
};

export type PayoutQueueProps = Omit<CardProps, 'title'> & {
  payouts: PayoutQueueItem[];
  totalAmount?: number;
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  processLabel?: string;
  onProcessAll?: () => void;
  onPayoutClick?: (payout: PayoutQueueItem) => void;
  amountFormatter?: (amount: number) => string;
};

const formatIndianAmount = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatCompactIndianAmount = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);

function WalletIcon() {
  return (
    <SvgIcon viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M5 3h12a3 3 0 0 1 3 3v2.17A3 3 0 0 1 22 11v5a3 3 0 0 1-2 2.83V19a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3m0 2a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3h10V6a1 1 0 0 0-1-1zm3 5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1zm9 2h2v3h-2a1.5 1.5 0 0 1 0-3"
      />
    </SvgIcon>
  );
}

export function PayoutQueue({
  payouts,
  totalAmount = payouts.reduce((total, payout) => total + payout.amount, 0),
  title = 'Payout queue',
  loading = false,
  emptyMessage = 'No payouts waiting to be processed.',
  processLabel = 'Process',
  onProcessAll,
  onPayoutClick,
  amountFormatter = formatIndianAmount,
  sx,
  ...other
}: PayoutQueueProps) {
  return (
    <Card
      aria-busy={loading || undefined}
      sx={[
        {
          height: 1,
          p: { xs: 2.5, sm: 3, md: 2.5, lg: 2.5, xl: 3 },
          border: 1,
          borderColor: 'divider',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="h6" component="h2" sx={{ fontSize: { xs: 16, sm: 18, md: 14.5, lg: 14.5, xl: 18 } }}>
          {title} · {formatCompactIndianAmount(totalAmount)}
        </Typography>

        {onProcessAll && (
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={onProcessAll}
            sx={{ flexShrink: 0, color: 'success.dark', fontSize: { xs: 14, sm: 14, md: 12.5, lg: 12.5, xl: 14 }, fontWeight: 600, cursor: 'pointer' }}
          >
            {processLabel} →
          </Link>
        )}
      </Stack>

      <Stack divider={<Divider flexItem />} sx={{ mt: 2.25 }}>
        {loading &&
          Array.from({ length: 3 }, (_, index) => (
            <Stack key={index} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5 }}>
              <Skeleton variant="rounded" width={46} height={46} />
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Skeleton width="52%" />
                <Skeleton width="28%" />
              </Stack>
              <Skeleton width={62} />
            </Stack>
          ))}

        {!loading && payouts.length === 0 && (
          <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center', borderRadius: 1.5, bgcolor: 'background.neutral' }}>
            <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
          </Box>
        )}

        {!loading &&
          payouts.map((payout) => {
            const isClickable = Boolean(onPayoutClick);
            const leadName = payout.leadName?.trim() || 'Lead';
            const sarthiName = payout.sarthiName?.trim() || 'Solar Sarthi';
            const metadata = [payout.capacity?.trim(), payout.requestedPaymentMode?.trim()].filter(Boolean).join(' · ');

            return (
              <Stack
                key={payout.requestID}
                component={isClickable ? 'button' : 'div'}
                type={isClickable ? 'button' : undefined}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={isClickable ? () => onPayoutClick?.(payout) : undefined}
                sx={{
                  width: 1,
                  minWidth: 0,
                  py: 1.5,
                  px: isClickable ? 1 : 0,
                  mx: isClickable ? -1 : 0,
                  border: 0,
                  borderRadius: 1.5,
                  color: 'inherit',
                  font: 'inherit',
                  textAlign: 'left',
                  bgcolor: 'transparent',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: (theme) => theme.transitions.create('background-color', { duration: theme.transitions.duration.shorter }),
                  ...(isClickable && {
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'success.main', outlineOffset: 2 },
                  }),
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: { xs: 46, sm: 46, md: 36, lg: 36, xl: 46 },
                    height: { xs: 46, sm: 46, md: 36, lg: 36, xl: 46 },
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 1.5,
                    color: 'secondary.dark',
                    bgcolor: 'secondary.lighter',
                    '& svg': { width: { xs: 22, sm: 22, md: 18, lg: 18, xl: 22 }, height: { xs: 22, sm: 22, md: 18, lg: 18, xl: 22 } },
                  }}
                >
                  <WalletIcon />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontSize: { xs: 15, sm: 15, md: 13, lg: 13, xl: 15 }, fontWeight: 600, lineHeight: 1.35 }}>
                    {leadName} → {sarthiName}
                  </Typography>
                  <Typography noWrap variant="body2" color="text.secondary" sx={{ fontSize: { xs: 13, sm: 13, md: 11, lg: 11, xl: 14 } }}>
                    {metadata || 'Payment details unavailable'}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    flexShrink: 0,
                    fontSize: { xs: 15, sm: 15, md: 13, lg: 13, xl: 15 },
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {amountFormatter(payout.amount)}
                </Typography>
              </Stack>
            );
          })}
      </Stack>
    </Card>
  );
}
