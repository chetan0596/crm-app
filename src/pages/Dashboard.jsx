import { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Form, Table, Badge } from "react-bootstrap";
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
      <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-muted">Loading chart...</div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-muted">No data available</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#fd7e14" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 12 }}
          tickMargin={10}
          stroke="#6c757d"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#6c757d"
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          formatter={(value, name) => [formatMoney(value), name]}
          labelStyle={{ color: "#6c757d" }}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: 20 }} />
        <Line
          type="monotone"
          dataKey="sales"
          name="Sales"
          stroke="#0d6efd"
          strokeWidth={3}
          dot={{ fill: "#0d6efd", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
          fillOpacity={0.1}
        />
        <Line
          type="monotone"
          dataKey="purchases"
          name="Purchases"
          stroke="#fd7e14"
          strokeWidth={3}
          dot={{ fill: "#fd7e14", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
          fillOpacity={0.1}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const MonthlySalesChart = ({ data }) => {
  const chartData = useMemo(() => data || [], [data]);

  if (!chartData.length) {
    return (
      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-secondary">No data available</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickMargin={10}
          stroke="#94a3b8"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          stroke="#94a3b8"
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          formatter={(value) => [formatMoney(value), "Sales"]}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
        <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? "#2563eb" : "#60a5fa"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const TopCustomersChart = ({ data }) => {
  const chartData = useMemo(() => (data || []).slice(0, 5), [data]);

  if (!chartData.length) {
    return (
      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-secondary">No data available</div>
      </div>
    );
  }

  const colors = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#64748b" }}
          stroke="#94a3b8"
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          stroke="#94a3b8"
          width={100}
          interval={0}
        />
        <Tooltip
          formatter={(value) => [formatMoney(value), "Total Sales"]}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
        <Bar dataKey="sales" name="Sales" radius={[0, 4, 4, 0]}>
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

  const load = async (signal) => {
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
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [rangeMode, days, customFrom, customTo, canSeeDashboard]);

  if (!canSeeDashboard) {
    return (
      <Card className="card-outline card-danger">
        <Card.Body>
          <h5 className="mb-1">Access denied</h5>
          <div className="text-muted">You don’t have permission to view the dashboard.</div>
        </Card.Body>
      </Card>
    );
  }

  const profitVariant = Number(kpi.profitMonth || 0) >= 0 ? "success" : "danger";
  const trendLabel = rangeMode === "custom"
    ? "Custom range"
    : days === 1
      ? "Today"
      : `Last ${days} days`;

  return (
    <div>
      <Row className="mb-3 align-items-end">
        <Col md={8}>
          <h3 className="mb-1">Analytics Dashboard</h3>
          <div className="text-muted">Quick overview of sales, purchases, inventory and customers.</div>
        </Col>
        <Col md={4} className="d-flex justify-content-md-end">
          <div style={{ maxWidth: 520, width: "100%" }}>
            <div className="d-flex gap-2 justify-content-md-end flex-wrap">
              <Form.Select
                value={rangeMode === "custom" ? "custom" : String(days)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") {
                    setRangeMode("custom");
                    return;
                  }
                  setRangeMode("last");
                  setDays(Number(v));
                }}
                style={{ maxWidth: 220 }}
              >
                <option value={"1"}>Today</option>
                <option value={"7"}>Last 7 Days</option>
                <option value={"30"}>Last 30 Days</option>
                <option value={"90"}>Last 90 Days</option>
                <option value={"180"}>Last 180 Days</option>
                <option value={"custom"}>Custom</option>
              </Form.Select>

              {rangeMode === "custom" && (
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    style={{ maxWidth: 160 }}
                  />
                  <Form.Control
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    style={{ maxWidth: 160 }}
                  />
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#eff6ff" }}>
                  <svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12h6M12 9v6"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Sales Today</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>₹{formatMoney(kpi.salesToday)}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#f0fdf4" }}>
                  <svg width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18M18 9l-5 5-3-3-4 4"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Sales This Month</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>₹{formatMoney(kpi.salesMonth)}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#fff7ed" }}>
                  <svg width="22" height="22" fill="none" stroke="#ea580c" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Purchases This Month</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>₹{formatMoney(kpi.purchasesMonth)}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: Number(kpi.profitMonth || 0) >= 0 ? "#ecfdf5" : "#fef2f2" }}>
                  <svg width="22" height="22" fill="none" stroke={Number(kpi.profitMonth || 0) >= 0 ? "#059669" : "#dc2626"} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Profit This Month</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: Number(kpi.profitMonth || 0) >= 0 ? "#059669" : "#dc2626" }}>₹{formatMoney(kpi.profitMonth)}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#f8fafc" }}>
                  <svg width="22" height="22" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Customers</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>{kpi.customersCount || 0}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#f8fafc" }}>
                  <svg width="22" height="22" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Vendors</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#1e293b" }}>{kpi.vendorsCount || 0}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#fffbeb" }}>
                  <svg width="22" height="22" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Low Stock Items</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#d97706" }}>{kpi.lowStockCount || 0}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, backgroundColor: "#fef2f2" }}>
                  <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <div className="text-secondary small mb-1">Out of Stock</div>
                  <div className="h5 mb-0 fw-semibold" style={{ color: "#dc2626" }}>{kpi.outOfStockCount || 0}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={12}>
          <Card className="border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between" style={{ borderColor: "#e2e8f0" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 40, height: 40, backgroundColor: "#eff6ff" }}>
                  <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
                </div>
                <div>
                  <div className="fw-semibold" style={{ color: "#1e293b" }}>Sales vs Purchases Trend</div>
                  <div className="text-secondary small">{trendLabel}</div>
                </div>
              </div>
              {loading && <div className="text-secondary small">Loading...</div>}
            </Card.Header>
            <Card.Body className="py-4">
              <TrendChart data={trend} loading={loading} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center gap-3" style={{ borderColor: "#e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36, backgroundColor: "#f0fdf4" }}>
                <svg width="18" height="18" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </div>
              <div className="fw-semibold" style={{ color: "#1e293b" }}>Recent Sales</div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th style={{ width: 70, color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-secondary py-4">No data</td></tr>
                  ) : recentSales.map(r => (
                    <tr key={r.id} style={{ borderColor: "#f1f5f9" }}>
                      <td className="fw-medium" style={{ color: "#1e293b" }}>#{r.id}</td>
                      <td><Badge bg="light" text="dark" className="border" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>{r.invoice_number}</Badge></td>
                      <td style={{ color: "#475569" }}>{r.customer?.name || "-"}</td>
                      <td className="text-end fw-medium" style={{ color: "#059669" }}>₹{formatMoney(r.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center gap-3" style={{ borderColor: "#e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36, backgroundColor: "#fff7ed" }}>
                <svg width="18" height="18" fill="none" stroke="#ea580c" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <div className="fw-semibold" style={{ color: "#1e293b" }}>Recent Purchases</div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th style={{ width: 70, color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bill</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Vendor</th>
                    <th className="text-end" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-secondary py-4">No data</td></tr>
                  ) : recentPurchases.map(r => (
                    <tr key={r.id} style={{ borderColor: "#f1f5f9" }}>
                      <td className="fw-medium" style={{ color: "#1e293b" }}>#{r.id}</td>
                      <td><Badge bg="light" text="dark" className="border" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>{r.bill_number}</Badge></td>
                      <td style={{ color: "#475569" }}>{r.vendor?.name || "-"}</td>
                      <td className="text-end fw-medium" style={{ color: "#ea580c" }}>₹{formatMoney(r.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center gap-3" style={{ borderColor: "#e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36, backgroundColor: "#eff6ff" }}>
                <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </div>
              <div className="fw-semibold" style={{ color: "#1e293b" }}>Monthly Sales (Last 6 Months)</div>
            </Card.Header>
            <Card.Body className="py-3">
              <MonthlySalesChart data={monthlySales} />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center gap-3" style={{ borderColor: "#e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36, backgroundColor: "#ecfdf5" }}>
                <svg width="18" height="18" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div className="fw-semibold" style={{ color: "#1e293b" }}>Top 5 Customers by Sales</div>
            </Card.Header>
            <Card.Body className="py-3">
              <TopCustomersChart data={topCustomers} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={12}>
          <Card className="h-100 border" style={{ borderColor: "#e2e8f0" }}>
            <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center gap-3" style={{ borderColor: "#e2e8f0" }}>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 36, height: 36, backgroundColor: "#fffbeb" }}>
                <svg width="18" height="18" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              <div className="fw-semibold" style={{ color: "#1e293b" }}>Low Stock Items</div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th style={{ width: 70, color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>SKU</th>
                    <th style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                    <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Stock</th>
                    <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Min Stock</th>
                    <th className="text-center" style={{ color: "#64748b", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-secondary py-4">No low stock items</td></tr>
                  ) : lowStockItems.map(item => (
                    <tr key={item.id} style={{ borderColor: "#f1f5f9" }}>
                      <td className="fw-medium" style={{ color: "#1e293b" }}>#{item.id}</td>
                      <td style={{ color: "#475569" }}><Badge bg="light" text="dark" className="border" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>{item.sku}</Badge></td>
                      <td style={{ color: "#1e293b" }}>{item.name}</td>
                      <td className="text-center fw-medium" style={{ color: "#d97706" }}>{item.current_stock}</td>
                      <td className="text-center" style={{ color: "#64748b" }}>{item.min_stock}</td>
                      <td className="text-center">
                        <Badge bg="warning" text="dark" style={{ fontSize: "0.75rem" }}>Low Stock</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
