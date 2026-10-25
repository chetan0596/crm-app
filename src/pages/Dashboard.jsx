import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import api from "../api";
import { canView } from "../utils/permissions";

const formatMoney = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const cardSx = {
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const iconBoxSx = (background, color, size = 48) => ({
  width: size,
  height: size,
  borderRadius: 2,
  display: 'grid',
  placeItems: 'center',
  bgcolor: background,
  color,
  flexShrink: 0,
});

function MetricCard({ label, value, icon, color, background }) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={iconBoxSx(background, color)}>
            <i className={icon} style={{ fontSize: 20 }} aria-hidden="true" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: .5 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ color, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, subtitle, icon, iconColor, iconBackground, action, children, contentSx }) {
  return (
    <Card sx={cardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={iconBoxSx(iconBackground, iconColor, 40)}>
            <i className={icon} style={{ fontSize: 16 }} aria-hidden="true" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      <Divider />
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}

function DashboardTable({ columns, rows, renderRow, emptyMessage }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            {columns.map((column) => (
              <TableCell
                key={column.label}
                align={column.align || 'left'}
                sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', py: 1.5 }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : rows.map(renderRow)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const chartTooltipSx = {
  backgroundColor: '#fff',
  border: '1px solid rgba(145,158,171,.24)',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const TrendChart = ({ data, loading }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const chartData = useMemo(() => {
    return (data || []).map((d) => ({
      ...d,
      displayDate: formatDate(d.date),
    }));
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ height: 350, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!chartData.length) {
    return (
      <Box sx={{ height: 350, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        No data available
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 20, right: 24, left: 8, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,158,171,.22)" vertical={false} />
        <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#637381' }} tickMargin={10} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
        <Tooltip formatter={(value, name) => [`₹${formatMoney(value)}`, name]} labelStyle={{ color: '#637381' }} contentStyle={chartTooltipSx} />
        <Legend wrapperStyle={{ paddingTop: 16 }} />
        <Line type="monotone" dataKey="sales" name="Sales" stroke="#062849" strokeWidth={3} dot={{ fill: '#062849', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#6528e8" strokeWidth={3} dot={{ fill: '#6528e8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const MonthlySalesChart = ({ data }) => {
  const chartData = useMemo(() => data || [], [data]);

  if (!chartData.length) {
    return <Box sx={{ height: 280, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No data available</Box>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,158,171,.22)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#637381' }} tickMargin={10} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#637381' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
        <Tooltip formatter={(value) => [`₹${formatMoney(value)}`, "Sales"]} contentStyle={chartTooltipSx} />
        <Bar dataKey="sales" name="Sales" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#062849' : '#7b6bd8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const TopCustomersChart = ({ data }) => {
  const chartData = useMemo(() => (data || []).slice(0, 5), [data]);

  if (!chartData.length) {
    return <Box sx={{ height: 280, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No data available</Box>;
  }

  const colors = ['#062849', '#244f78', '#4d6e96', '#7a91b5', '#a7b8cf'];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,158,171,.22)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#637381' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#637381' }} axisLine={false} tickLine={false} width={110} interval={0} />
        <Tooltip formatter={(value) => [`₹${formatMoney(value)}`, "Total Sales"]} contentStyle={chartTooltipSx} />
        <Bar dataKey="sales" name="Sales" radius={[0, 6, 6, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

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

  const profitPositive = Number(kpi.profitMonth || 0) >= 0;
  const trendLabel = rangeMode === "custom"
    ? "Custom range"
    : days === 1
      ? "Today"
      : `Last ${days} days`;

  const primaryMetrics = [
    { label: 'Sales Today', value: `₹${formatMoney(kpi.salesToday)}`, icon: 'fas fa-calendar-day', color: '#062849', background: '#eaf0f6' },
    { label: 'Sales This Month', value: `₹${formatMoney(kpi.salesMonth)}`, icon: 'fas fa-chart-line', color: '#6528e8', background: '#f1ebfd' },
    { label: 'Purchases This Month', value: `₹${formatMoney(kpi.purchasesMonth)}`, icon: 'fas fa-cart-shopping', color: '#b76e00', background: '#fff4d6' },
    { label: 'Profit This Month', value: `₹${formatMoney(kpi.profitMonth)}`, icon: 'fas fa-coins', color: profitPositive ? '#118d57' : '#b71d18', background: profitPositive ? '#dbf5e9' : '#ffe4de' },
  ];

  const secondaryMetrics = [
    { label: 'Customers', value: kpi.customersCount || 0, icon: 'fas fa-users', color: '#006c9c', background: '#caf4ff' },
    { label: 'Vendors', value: kpi.vendorsCount || 0, icon: 'fas fa-truck', color: '#003768', background: '#d7e9ff' },
    { label: 'Low Stock Items', value: kpi.lowStockCount || 0, icon: 'fas fa-triangle-exclamation', color: '#b76e00', background: '#fff4d6' },
    { label: 'Out of Stock', value: kpi.outOfStockCount || 0, icon: 'fas fa-ban', color: '#b71d18', background: '#ffe4de' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
            Hi, Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Overview of sales, purchases, inventory, customers, and leads.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                size="small"
                label="To"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        {primaryMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        {secondaryMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <SectionCard
          title="Sales vs purchases"
          subtitle={trendLabel}
          icon="fas fa-chart-area"
          iconColor="#062849"
          iconBackground="#eaf0f6"
          action={loading ? <CircularProgress size={20} /> : null}
        >
          <TrendChart data={trend} loading={loading} />
        </SectionCard>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <SectionCard title="Monthly sales" subtitle="Last 6 months" icon="fas fa-chart-column" iconColor="#6528e8" iconBackground="#f1ebfd">
          <MonthlySalesChart data={monthlySales} />
        </SectionCard>
        <SectionCard title="Top customers" subtitle="Top 5 by sales" icon="fas fa-user-group" iconColor="#006c9c" iconBackground="#caf4ff">
          <TopCustomersChart data={topCustomers} />
        </SectionCard>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5, mb: 2.5 }}>
        <SectionCard title="Recent sales" icon="fas fa-file-invoice" iconColor="#118d57" iconBackground="#dbf5e9" contentSx={{ p: 0 }}>
          <DashboardTable
            columns={[{ label: 'ID' }, { label: 'Invoice' }, { label: 'Customer' }, { label: 'Amount', align: 'right' }]}
            rows={recentSales}
            emptyMessage="No data"
            renderRow={(row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>#{row.id}</TableCell>
                <TableCell><Chip label={row.invoice_number} size="small" variant="outlined" /></TableCell>
                <TableCell>{row.customer?.name || '-'}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>₹{formatMoney(row.grand_total)}</TableCell>
              </TableRow>
            )}
          />
        </SectionCard>

        <SectionCard title="Recent purchases" icon="fas fa-cart-shopping" iconColor="#b76e00" iconBackground="#fff4d6" contentSx={{ p: 0 }}>
          <DashboardTable
            columns={[{ label: 'ID' }, { label: 'Bill' }, { label: 'Vendor' }, { label: 'Amount', align: 'right' }]}
            rows={recentPurchases}
            emptyMessage="No data"
            renderRow={(row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>#{row.id}</TableCell>
                <TableCell><Chip label={row.bill_number} size="small" variant="outlined" /></TableCell>
                <TableCell>{row.vendor?.name || '-'}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 700 }}>₹{formatMoney(row.grand_total)}</TableCell>
              </TableRow>
            )}
          />
        </SectionCard>
      </Box>

      <SectionCard title="Low stock items" icon="fas fa-boxes-stacked" iconColor="#b76e00" iconBackground="#fff4d6" contentSx={{ p: 0 }}>
        <DashboardTable
          columns={[{ label: 'ID' }, { label: 'SKU' }, { label: 'Name' }, { label: 'Current stock', align: 'center' }, { label: 'Min stock', align: 'center' }, { label: 'Status', align: 'center' }]}
          rows={lowStockItems}
          emptyMessage="No low stock items"
          renderRow={(item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ fontWeight: 700 }}>#{item.id}</TableCell>
              <TableCell><Chip label={item.sku} size="small" variant="outlined" /></TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell align="center" sx={{ color: 'warning.main', fontWeight: 700 }}>{item.current_stock}</TableCell>
              <TableCell align="center" sx={{ color: 'text.secondary' }}>{item.min_stock}</TableCell>
              <TableCell align="center"><Chip label="Low stock" size="small" color="warning" variant="outlined" /></TableCell>
            </TableRow>
          )}
        />
      </SectionCard>
    </Box>
  );
}
