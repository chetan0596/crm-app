import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  useMediaQuery,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import api from "../api";
import { canView, getUserData } from "../utils/permissions";
import { varAlpha } from "../theme/utils";
import { Iconify } from "../components/iconify";
import { Label } from "../components/label";
import { Chart, useChart } from "../components/chart";
import { StatTile } from "../components/stat-tile";
import { DataList } from "../components/data-list";
import { DataTable } from "../components/data-table";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatShortMoney = (value) => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

// Percent change between the first and second half of a daily series.
const seriesDelta = (values) => {
  const nums = (values || []).map((v) => Number(v) || 0);
  if (nums.length < 4) return null;
  const mid = Math.floor(nums.length / 2);
  const first = nums.slice(0, mid).reduce((a, b) => a + b, 0);
  const last = nums.slice(mid).reduce((a, b) => a + b, 0);
  if (!first) return null;
  return Math.round(((last - first) / first) * 1000) / 10;
};

// ----------------------------------------------------------------------
// Minimal "analytics widget summary" card: title, total, % delta, sparkline.
// ----------------------------------------------------------------------

function WidgetSummary({ title, total, icon, color = 'primary', series = [], percent = null, caption, loading }) {
  const theme = useTheme();
  const pal = theme.vars ? theme.vars.palette : theme.palette;

  const chartOptions = useChart({
    colors: [pal[color].main],
    chart: { sparkline: { enabled: true } },
    plotOptions: { bar: { columnWidth: '64%', borderRadius: 2 } },
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { show: false },
    grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
    legend: { show: false },
    tooltip: { enabled: true, y: { formatter: (v) => `₹${formatMoney(v)}` }, marker: { show: false } },
  });

  return (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 3, height: '100%' }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, flexWrap: 'wrap', minHeight: 24 }}>
          {!loading && percent !== null && (
            <Label
              variant="soft"
              color={percent >= 0 ? 'success' : 'error'}
              startIcon={
                <Iconify width={14} icon={percent >= 0 ? 'eva:trending-up-fill' : 'eva:trending-down-fill'} />
              }
            >
              {percent >= 0 ? '+' : ''}{percent}%
            </Label>
          )}
          {caption && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {caption}
            </Typography>
          )}
        </Box>
        {loading ? (
          <Skeleton width="72%" height={40} sx={{ mt: 1 }} />
        ) : (
          <Typography
            variant="h3"
            title={total}
            sx={{ mt: 1, fontSize: { xs: '1.4rem', sm: '1.5rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {total}
          </Typography>
        )}
      </Box>

      <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            mx: 'auto',
            mb: 1,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            color: `${color}.main`,
            bgcolor: varAlpha(pal[color].mainChannel, 0.12),
            boxShadow: `inset 0 0 0 1px ${varAlpha(pal[color].mainChannel, 0.16)}`,
          }}
        >
          <Iconify icon={icon} width={26} />
        </Box>
        {series.length > 1 && (
          <Chart type="bar" height={40} width={72} series={[{ name: title, data: series }]} options={chartOptions} />
        )}
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Dark navy welcome banner (Minimal "App welcome" style)
// ----------------------------------------------------------------------

function WelcomeBanner() {
  const name = getUserData()?.name?.split(' ')[0] || 'there';

  return (
    <Card
      sx={[
        (theme) => ({
          height: '100%',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          p: { xs: 3, md: 4 },
          color: 'common.white',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(120deg, ${theme.vars.palette.primary.dark} 0%, ${theme.vars.palette.primary.main} 100%)`,
          boxShadow: `0 12px 24px -14px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.4)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.14) 1.25px, transparent 1.25px)',
            backgroundSize: '22px 22px',
            opacity: 0.22,
          },
        }),
      ]}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5, maxWidth: { sm: '62%' } }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Welcome back 👋
          </Typography>
          <Typography variant="h4">{name}</Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.72 }}>
          Track sales, purchases, inventory and leads — all in one place.
        </Typography>
        <Button
          component={RouterLink}
          to="/reports/sales"
          variant="contained"
          startIcon={<Iconify icon="solar:chart-square-bold-duotone" width={18} />}
          sx={{
            mt: 0.5,
            bgcolor: 'common.white',
            color: 'primary.dark',
            '&:hover': { bgcolor: 'grey.200' },
          }}
        >
          View sales report
        </Button>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: { sm: 8, md: 40 },
          transform: 'translateY(-50%)',
          display: { xs: 'none', sm: 'block' },
          zIndex: 0,
        }}
      >
        <Iconify
          icon="solar:graph-new-up-bold-duotone"
          width={160}
          sx={{ color: 'rgba(255,255,255,0.18)', transform: 'rotate(-8deg)' }}
        />
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Soft tinted stat card — lightweight alternative to the heavy gradient style
// ----------------------------------------------------------------------

function GradientStat({ label, value, icon, color = 'primary', loading }) {
  return (
    <Card
      sx={[
        (theme) => ({
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2.5,
          minHeight: 96,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: varAlpha(theme.vars.palette[color].mainChannel, 0.08),
          boxShadow: 'none',
          border: `dashed 1px ${varAlpha(theme.vars.palette[color].mainChannel, 0.2)}`,
        }),
      ]}
    >
      <Box
        sx={[
          (theme) => ({
            width: 44,
            height: 44,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color: `${color}.dark`,
            bgcolor: varAlpha(theme.vars.palette[color].mainChannel, 0.16),
          }),
        ]}
      >
        <Iconify icon={icon} width={22} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Typography>
        {loading ? (
          <Skeleton width={100} height={30} />
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 700, color: `${color}.dark` }} noWrap title={value}>
            {value}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

const TrendChart = ({ data, loading }) => {
  const downMd = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const categories = useMemo(
    () => (data || []).map((d) => new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
    [data]
  );

  const chartOptions = useChart({
    legend: { show: true, position: 'top', horizontalAlign: 'right' },
    xaxis: { categories, labels: { hideOverlappingLabels: true }, tickPlacement: 'on' },
    yaxis: { labels: { formatter: formatShortMoney } },
    tooltip: { y: { formatter: (v) => `₹${formatMoney(v)}` } },
    stroke: { curve: 'smooth', width: [3, 3] },
    markers: { size: 0, strokeWidth: 0, hover: { size: 6 } },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.24, opacityTo: 0.02 } },
  });

  if (loading) {
    return (
      <Box sx={{ height: downMd ? 260 : 350, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!categories.length) {
    return (
      <Box sx={{ height: downMd ? 260 : 350, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        No data available
      </Box>
    );
  }

  return (
    <Chart
      type="area"
      height={downMd ? 260 : 350}
      series={[
        { name: 'Sales', data: (data || []).map((d) => Number(d.sales) || 0) },
        { name: 'Purchases', data: (data || []).map((d) => Number(d.purchases) || 0) },
      ]}
      options={chartOptions}
    />
  );
};

const TopCustomersChart = ({ data }) => {
  const theme = useTheme();
  const pal = theme.vars ? theme.vars.palette : theme.palette;
  const sliceColors = [pal.primary.main, pal.warning.main, pal.info.main, pal.error.main, pal.success.main];

  const chartData = useMemo(() => (data || []).slice(0, 5), [data]);
  const total = chartData.reduce((sum, d) => sum + (Number(d.sales) || 0), 0);

  const chartOptions = useChart({
    colors: sliceColors,
    labels: chartData.map((d) => d.name),
    legend: { show: false },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `₹${formatMoney(v)}` } },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { fontSize: '12px' },
            value: { fontSize: '18px', fontWeight: 700, formatter: (v) => `₹${formatMoney(v)}` },
            total: {
              show: true,
              label: 'Top 5 total',
              fontSize: '12px',
              formatter: () => `₹${formatMoney(total)}`,
            },
          },
        },
      },
    },
  });

  if (!chartData.length) {
    return <Box sx={{ height: 300, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No data available</Box>;
  }

  return (
    <Box>
      <Chart
        type="donut"
        height={232}
        series={chartData.map((d) => Number(d.sales) || 0)}
        options={chartOptions}
      />
      <Stack spacing={1.25} sx={{ px: 3, pb: 2.5 }}>
        {chartData.map((d, index) => (
          <Box key={d.name || index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, bgcolor: sliceColors[index % sliceColors.length] }} />
            <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
              {d.name}
            </Typography>
            <Typography variant="subtitle2">₹{formatShortMoney(d.sales)}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const MonthlySalesChart = ({ data }) => {
  const downMd = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const chartData = useMemo(() => data || [], [data]);

  const chartOptions = useChart({
    colors: chartData.map((_, index) => (index === chartData.length - 1 ? '#062849' : '#8b5cf6')),
    plotOptions: { bar: { borderRadius: 6, columnWidth: '52%', distributed: true } },
    legend: { show: false },
    xaxis: { categories: chartData.map((d) => d.month) },
    yaxis: { labels: { formatter: formatShortMoney } },
    tooltip: { y: { formatter: (v) => `₹${formatMoney(v)}` } },
  });

  if (!chartData.length) {
    return <Box sx={{ height: downMd ? 240 : 300, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No data available</Box>;
  }

  return (
    <Chart
      type="bar"
      height={downMd ? 240 : 300}
      series={[{ name: 'Sales', data: chartData.map((d) => Number(d.sales) || 0) }]}
      options={chartOptions}
    />
  );
};

// ----------------------------------------------------------------------

function ViewAllButton({ to }) {
  return (
    <Button
      component={RouterLink}
      to={to}
      size="small"
      color="inherit"
      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
      sx={{ color: 'text.secondary' }}
    >
      View all
    </Button>
  );
}

// ----------------------------------------------------------------------

export default function Dashboard() {
  const [rangeMode, setRangeMode] = useState("last");
  const [days, setDays] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState({
    salesToday: 0,
    salesMonth: 0,
    purchasesToday: 0,
    purchasesMonth: 0,
    profitMonth: 0,
    customersCount: 0,
    vendorsCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [trend, setTrend] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const canSeeDashboard = canView("dashboard");

  const load = useCallback(async (signal) => {
    if (!canSeeDashboard) return;

    setLoading(true);
    try {
      const params = {};
      if (rangeMode === "custom") {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      } else {
        params.days = days;
      }
      const res = await api.get("/dashboard/analytics", { params, signal });
      setKpi(res.data.kpi || {});
      setTrend(res.data.trend || []);
      setRecentSales(res.data.recent?.sales || []);
      setRecentPurchases(res.data.recent?.purchases || []);
      setMonthlySales(res.data.monthlySales || []);
      setTopCustomers(res.data.topCustomers || []);
      setLowStockItems(res.data.lowStockItems || []);
    } catch {
      setKpi({
        salesToday: 0,
        salesMonth: 0,
        purchasesToday: 0,
        purchasesMonth: 0,
        profitMonth: 0,
        customersCount: 0,
        vendorsCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      });
      setTrend([]);
      setRecentSales([]);
      setRecentPurchases([]);
      setMonthlySales([]);
      setTopCustomers([]);
      setLowStockItems([]);
    } finally {
      setLoading(false);
    }
  }, [canSeeDashboard, rangeMode, days, customFrom, customTo]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (!canSeeDashboard) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        <AlertTitle>Access denied</AlertTitle>
        You don’t have permission to view the dashboard.
      </Alert>
    );
  }

  const trendLabel = rangeMode === "custom"
    ? "Custom range"
    : days === 1
      ? "Today"
      : `Last ${days} days`;

  const salesSeries = trend.map((d) => Number(d.sales) || 0);
  const purchasesSeries = trend.map((d) => Number(d.purchases) || 0);
  const profitSeries = trend.map((d) => (Number(d.sales) || 0) - (Number(d.purchases) || 0));

  const periodCaption = rangeMode === "custom" ? 'in range' : days === 1 ? 'today' : `last ${days} days`;

  const widgets = [
    {
      title: 'Sales this month',
      total: `₹${formatMoney(kpi.salesMonth)}`,
      icon: 'solar:graph-up-bold-duotone',
      color: 'secondary',
      series: salesSeries,
      percent: seriesDelta(salesSeries),
      caption: periodCaption,
    },
    {
      title: 'Purchases this month',
      total: `₹${formatMoney(kpi.purchasesMonth)}`,
      icon: 'solar:bag-4-bold-duotone',
      color: 'warning',
      series: purchasesSeries,
      percent: seriesDelta(purchasesSeries),
      caption: periodCaption,
    },
    {
      title: 'Profit this month',
      total: `₹${formatMoney(kpi.profitMonth)}`,
      icon: 'solar:wallet-money-bold-duotone',
      color: Number(kpi.profitMonth || 0) >= 0 ? 'success' : 'error',
      series: profitSeries,
      percent: seriesDelta(profitSeries),
      caption: periodCaption,
    },
  ];

  const stats = [
    { label: 'Customers', value: kpi.customersCount || 0, icon: 'solar:users-group-two-rounded-bold-duotone', color: 'info' },
    { label: 'Vendors', value: kpi.vendorsCount || 0, icon: 'solar:shop-2-bold-duotone', color: 'primary' },
    { label: 'Low stock items', value: kpi.lowStockCount || 0, icon: 'solar:danger-triangle-bold-duotone', color: 'warning' },
    { label: 'Out of stock', value: kpi.outOfStockCount || 0, icon: 'solar:forbidden-circle-bold-duotone', color: 'error' },
  ];

  return (
    <Box>
      {/* Range controls */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel id="dashboard-range-label">Range</InputLabel>
            <Select
              labelId="dashboard-range-label"
              label="Range"
              value={rangeMode === "custom" ? "custom" : String(days)}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "custom") {
                  setRangeMode("custom");
                  return;
                }
                setRangeMode("last");
                setDays(Number(value));
              }}
            >
              <MenuItem value="1">Today</MenuItem>
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="180">Last 180 days</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          {rangeMode === "custom" && (
            <>
              <TextField
                type="date"
                size="small"
                label="From"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              />
              <TextField
                type="date"
                size="small"
                label="To"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              />
            </>
          )}
        </Stack>
      </Box>

      {/* Welcome banner + gradient stats */}
      <Box sx={{ display: 'grid', gap: 3, mb: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(12, minmax(0, 1fr))' }, '& > *': { minWidth: 0 } }}>
        <Box sx={{ gridColumn: { lg: 'span 8' } }}>
          <WelcomeBanner />
        </Box>
        <Stack spacing={3} sx={{ gridColumn: { lg: 'span 4' } }}>
          <GradientStat
            label="Sales today"
            value={`₹${formatMoney(kpi.salesToday)}`}
            icon="solar:calendar-bold-duotone"
            color="primary"
            loading={loading}
          />
          <GradientStat
            label="Purchases today"
            value={`₹${formatMoney(kpi.purchasesToday)}`}
            icon="solar:bag-4-bold-duotone"
            color="secondary"
            loading={loading}
          />
        </Stack>
      </Box>

      {/* Widget summary cards */}
      <Box sx={{ display: 'grid', gap: 3, mb: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, '& > *': { minWidth: 0 } }}>
        {widgets.map((w) => <WidgetSummary key={w.title} loading={loading} {...w} />)}
      </Box>

      {/* Secondary stats */}
      <Box sx={{ display: 'grid', gap: 3, mb: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, '& > *': { minWidth: 0 } }}>
        {stats.map((s) => (
          <StatTile
            key={s.label}
            title={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            loading={loading}
          />
        ))}
      </Box>

      {/* Trend + top customers */}
      <Box sx={{ display: 'grid', gap: 3, mb: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(12, minmax(0, 1fr))' }, '& > *': { minWidth: 0 } }}>
        <Card sx={{ gridColumn: { lg: 'span 8' } }}>
          <CardHeader
            title="Sales vs purchases"
            subheader={trendLabel}
            action={loading ? <CircularProgress size={20} /> : null}
          />
          <Box sx={{ px: 2, pb: 2 }}>
            <TrendChart data={trend} loading={loading} />
          </Box>
        </Card>
        <Card sx={{ gridColumn: { lg: 'span 4' } }}>
          <CardHeader title="Top customers" subheader="Top 5 share by sales" />
          <Box sx={{ px: 2, pb: 2 }}>
            <TopCustomersChart data={topCustomers} />
          </Box>
        </Card>
      </Box>

      {/* Monthly sales + recent sales */}
      <Box sx={{ display: 'grid', gap: 3, mb: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(12, minmax(0, 1fr))' }, '& > *': { minWidth: 0 } }}>
        <Card sx={{ gridColumn: { lg: 'span 4' } }}>
          <CardHeader title="Monthly sales" subheader="Last 6 months" />
          <Box sx={{ px: 2, pb: 2 }}>
            <MonthlySalesChart data={monthlySales} />
          </Box>
        </Card>
        <Box sx={{ gridColumn: { lg: 'span 8' } }}>
          <DataList
            title="Recent sales"
            summary={recentSales.length ? `₹${formatShortMoney(recentSales.reduce((sum, r) => sum + (Number(r.grand_total) || 0), 0))}` : null}
            actionLabel="View all"
            actionTo="/inventory/sales"
            loading={loading}
            emptyMessage="No recent sales"
            items={recentSales.map((row) => ({
              id: row.id,
              icon: 'solar:receipt-bold-duotone',
              color: 'success',
              primary: row.customer?.name || `Invoice ${row.invoice_number}`,
              secondary: `#${row.id} · ${row.invoice_number}`,
              amount: `₹${formatMoney(row.grand_total)}`,
              amountColor: 'success.dark',
            }))}
          />
        </Box>
      </Box>

      {/* Recent purchases + low stock */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, '& > *': { minWidth: 0 } }}>
        <DataList
          title="Recent purchases"
          summary={recentPurchases.length ? `₹${formatShortMoney(recentPurchases.reduce((sum, r) => sum + (Number(r.grand_total) || 0), 0))}` : null}
          actionLabel="View all"
          actionTo="/inventory/purchases"
          loading={loading}
          emptyMessage="No recent purchases"
          items={recentPurchases.map((row) => ({
            id: row.id,
            icon: 'solar:bag-4-bold-duotone',
            color: 'warning',
            primary: row.vendor?.name || `Bill ${row.bill_number}`,
            secondary: `#${row.id} · ${row.bill_number}`,
            amount: `₹${formatMoney(row.grand_total)}`,
            amountColor: 'warning.dark',
          }))}
        />
        <Card>
          <CardHeader title="Low stock items" action={<ViewAllButton to="/inventory/items" />} />
          <DataTable
            loading={loading}
            minWidth={560}
            maxHeight={330}
            rows={lowStockItems}
            emptyMessage="Inventory looks healthy"
            columns={[
              {
                id: 'name',
                label: 'Item',
                sortable: true,
                render: (item) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>,
              },
              { id: 'sku', label: 'SKU', render: (item) => <Label variant="soft">{item.sku}</Label> },
              {
                id: 'current_stock',
                label: 'Stock',
                align: 'center',
                sortable: true,
                sortValue: (item) => Number(item.current_stock) || 0,
                render: (item) => {
                  const current = Number(item.current_stock) || 0;
                  const min = Number(item.min_stock) || 0;
                  const pct = min > 0 ? Math.min(100, Math.round((current / min) * 100)) : 100;
                  const stockColor = current <= 0 ? 'error' : 'warning';
                  return (
                    <Stack spacing={0.5} alignItems="center" sx={{ minWidth: 88 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: `${stockColor}.main` }}>
                        {item.current_stock}
                      </Typography>
                      <LinearProgress variant="determinate" value={pct} color={stockColor} sx={{ width: 56, height: 6 }} />
                    </Stack>
                  );
                },
              },
              { id: 'min_stock', label: 'Min', align: 'center' },
              {
                id: 'status',
                label: 'Status',
                align: 'center',
                render: (item) => {
                  const current = Number(item.current_stock) || 0;
                  return (
                    <Label variant="soft" color={current <= 0 ? 'error' : 'warning'}>
                      {current <= 0 ? 'Out of stock' : 'Low stock'}
                    </Label>
                  );
                },
              },
            ]}
          />
        </Card>
      </Box>
    </Box>
  );
}
