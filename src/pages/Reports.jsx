import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Iconify } from "../components/iconify";
import { DataTable } from "../components/data-table";

const COLORS = {
  won: "#118d57",
  lost: "#ff5630",
  open: "#062849",
  new: "#637381",
  primary: ["#062849", "#22c55e", "#ff5630", "#ffab00", "#00b8d9", "#6528e8", "#e83e8c", "#fd7e14"]
};

const cardSx = {
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

const headCellSx = {
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  px: 2,
  py: 1.5,
};

const chartTooltipSx = {
  backgroundColor: '#fff',
  border: '1px solid rgba(145,158,171,.24)',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(28,37,46,.12)',
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

function StatCard({ label, value, color }) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: .5 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ color: color || 'text.primary', fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, action, children, contentSx }) {
  return (
    <Card sx={cardSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 2.5, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Divider />
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}

function ReportTable({ columns, rows, minWidth = 640, emptyMessage = "No data found" }) {
  return (
    <DataTable
      columns={columns}
      rows={rows || []}
      emptyMessage={emptyMessage}
      emptyHint="Try adjusting the filters or date range"
      minWidth={minWidth}
      defaultPageSize={10}
      rowsPerPageOptions={[10, 25, 50, 100]}
    />
  );
}

const initialFrom = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return thirtyDaysAgo.toISOString().split("T")[0];
};

const initialTo = () => new Date().toISOString().split("T")[0];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [dateFrom, setDateFrom] = useState(initialFrom);
  const [dateTo, setDateTo] = useState(initialTo);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterSource, setFilterSource] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [sources, setSources] = useState([]);
  const [users, setUsers] = useState([]);
  const [stagesList, setStagesList] = useState([]);
  const [tags, setTags] = useState([]);

  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [stages, setStages] = useState([]);
  const [wonStages, setWonStages] = useState([]);
  const [lostStages, setLostStages] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);

  // Data states
  const [pipelineData, setPipelineData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [agingData, setAgingData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [followupReportData, setFollowupReportData] = useState(null);

  // Build query params with filters
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (filterSource) params.append("source", filterSource);
    if (filterUser) params.append("assigned_to", filterUser);
    if (filterStage) params.append("stage", filterStage);
    if (filterTag) params.append("tag", filterTag);
    return params;
  }, [dateFrom, dateTo, filterSource, filterUser, filterStage, filterTag]);

  // Export to CSV (client-side)
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.warning("No data to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download PDF from backend
  const downloadPDF = useCallback(async (reportType) => {
    try {
      const params = new URLSearchParams(buildParams());
      const res = await api.get(`/reports/leads/${reportType}/pdf?${params}`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `leads-${reportType}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Failed to download PDF");
    }
  }, [buildParams]);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/pipeline?${buildParams()}`);
      setPipelineData(res.data.data);
    } catch {
      toast.error("Failed to load pipeline report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchStages = useCallback(async () => {
    try {
      const res = await api.get("/lead-stages");
      setStages(toArray(res.data));
    } catch {
      // ignore
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/settings/report-stages");

      setWonStages(toArray(res.data?.data?.won_stages));
      setLostStages(toArray(res.data?.data?.lost_stages));
    } catch (e) {
      // Silently ignore if settings endpoint doesn't exist or fails
      // This prevents page load issues when settings table doesn't exist
      console.warn("Settings endpoint not available:", e.response?.status === 404 ? "Not found" : e.message);
      // Set default values
      setWonStages([]);
      setLostStages([]);
    }
  }, []);

  const fetchTeamPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/team-performance?${buildParams()}`);
      setTeamData(res.data.data);
    } catch {
      toast.error("Failed to load team performance report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchSourceAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/source-analysis?${buildParams()}`);
      setSourceData(res.data.data);
    } catch {
      toast.error("Failed to load source analysis report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchProductAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/product-analysis?${buildParams()}`);
      setProductData(res.data.data);
    } catch {
      toast.error("Failed to load product analysis report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchActivitySummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/activity-summary?${buildParams()}`);
      setActivityData(res.data.data);
    } catch {
      toast.error("Failed to load activity summary report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchFunnelData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/funnel?${buildParams()}`);
      setFunnelData(res.data.data);
    } catch {
      toast.error("Failed to load conversion funnel");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchFollowupReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/followups?${buildParams()}`);
      setFollowupReportData(res.data.data);
    } catch {
      toast.error("Failed to load follow-up report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchAgingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/aging?${buildParams()}`);
      setAgingData(res.data.data);
    } catch {
      toast.error("Failed to load aging report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchTrendsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/trends?${buildParams()}`);
      setTrendsData(res.data.data);
    } catch {
      toast.error("Failed to load trends report");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [sourcesRes, usersRes, stagesRes, tagsRes] = await Promise.all([
        api.get("/lead-sources"),
        api.get("/users"),
        api.get("/lead-stages"),
        api.get("/lead-tags"),
      ]);
      setSources(toArray(sourcesRes.data));
      setUsers(toArray(usersRes.data));
      setStagesList(toArray(stagesRes.data));
      setTags(toArray(tagsRes.data));
    } catch {
      // ignore
    }
  }, []);

  const refreshAllReports = useCallback(() => {
    if (activeTab === "pipeline") fetchPipeline();
    if (activeTab === "team") fetchTeamPerformance();
    if (activeTab === "source") fetchSourceAnalysis();
    if (activeTab === "product") fetchProductAnalysis();
    if (activeTab === "activity") fetchActivitySummary();
    if (activeTab === "funnel") fetchFunnelData();
    if (activeTab === "aging") fetchAgingData();
    if (activeTab === "trends") fetchTrendsData();
    if (activeTab === "followups") fetchFollowupReport();
  }, [
    activeTab,
    fetchPipeline,
    fetchTeamPerformance,
    fetchSourceAnalysis,
    fetchProductAnalysis,
    fetchActivitySummary,
    fetchFunnelData,
    fetchAgingData,
    fetchTrendsData,
    fetchFollowupReport,
  ]);

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await api.post("/settings/report-stages", {
        won_stages: wonStages,
        lost_stages: lostStages,
      });
      toast.success("Report stage settings saved");
      setShowSettings(false);
      refreshAllReports();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleStage = (stageName, type) => {
    if (type === "won") {
      setWonStages((prev) =>
        prev.includes(stageName) ? prev.filter((s) => s !== stageName) : [...prev, stageName]
      );
    } else {
      setLostStages((prev) =>
        prev.includes(stageName) ? prev.filter((s) => s !== stageName) : [...prev, stageName]
      );
    }
  };

  useEffect(() => {
    fetchStages();
    fetchSettings();
    fetchFilterOptions();
  }, [fetchStages, fetchSettings, fetchFilterOptions]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      refreshAllReports();
    }
  }, [dateFrom, dateTo, refreshAllReports]);

  // Chart data preparation
  const outcomeChartData = useMemo(() => {
    if (!pipelineData?.summary) return [];
    return [
      { name: "Won", value: pipelineData.summary.won || 0, color: COLORS.won },
      { name: "Lost", value: pipelineData.summary.lost || 0, color: COLORS.lost },
      { name: "Open", value: pipelineData.summary.open || 0, color: COLORS.open },
    ].filter(d => d.value > 0);
  }, [pipelineData]);

  const stageChartData = useMemo(() => {
    if (!pipelineData?.by_stage) return [];
    return pipelineData.by_stage.map((item, index) => ({
      name: item.stage || "No Stage",
      count: item.count,
      fill: COLORS.primary[index % COLORS.primary.length]
    }));
  }, [pipelineData]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: .5 }}>
            Lead Reports
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Pipeline, team, source and activity insights
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setShowSettings(true)}
          startIcon={<Iconify icon="fa6-solid:gear" width={16} />}
        >
          Stage Settings
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ ...cardSx, height: 'auto', mb: 2.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2 }}>
            <TextField
              type="date"
              size="small"
              label="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              type="date"
              size="small"
              label="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Source</InputLabel>
              <Select label="Source" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                <MenuItem value=""><em>All Sources</em></MenuItem>
                {sources.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Assigned To</InputLabel>
              <Select label="Assigned To" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                <MenuItem value=""><em>All Users</em></MenuItem>
                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select label="Stage" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
                <MenuItem value=""><em>All Stages</em></MenuItem>
                {stagesList.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Tag</InputLabel>
              <Select label="Tag" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <MenuItem value=""><em>All Tags</em></MenuItem>
                {tags.map(t => <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Showing data from {dateFrom || "-"} to {dateTo || "-"}
              {filterSource && ` • Source: ${filterSource}`}
              {filterUser && ` • User: ${users.find(u => u.id == filterUser)?.name}`}
              {filterStage && ` • Stage: ${filterStage}`}
              {filterTag && ` • Tag: ${filterTag}`}
            </Typography>
            <Button
              variant="outlined"
              color="success"
              size="small"
              onClick={() => {
                setFilterSource(""); setFilterUser(""); setFilterStage(""); setFilterTag("");
              }}
              startIcon={<Iconify icon="fa6-solid:arrow-rotate-left" width={16} />}
            >
              Reset Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ ...cardSx, height: 'auto' }}>
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 700, minHeight: 48 },
          }}
        >
          <Tab value="pipeline" label="Pipeline" />
          <Tab value="team" label="Team Performance" />
          <Tab value="source" label="Source Analysis" />
          <Tab value="product" label="Product Analysis" />
          <Tab value="activity" label="Activity Summary" />
          <Tab value="trends" label="Trends" />
          <Tab value="funnel" label="Conversion Funnel" />
          <Tab value="followups" label="Follow-ups" />
          <Tab value="aging" label="Lead Aging" />
        </Tabs>
        {loading && <LinearProgress />}

        {/* Pipeline Report */}
        {activeTab === "pipeline" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && pipelineData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <StatCard label="Total Leads" value={pipelineData.summary.total_leads} />
                  <StatCard label="Won" value={pipelineData.summary.won} color="#118d57" />
                  <StatCard label="Lost" value={pipelineData.summary.lost} color="#b71d18" />
                  <StatCard label="Open" value={pipelineData.summary.open} color="#062849" />
                  <StatCard label="New This Month" value={pipelineData.summary.new_this_month} />
                  <StatCard label="Conversion %" value={`${pipelineData.summary.conversion_rate}%`} />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <SectionCard title="Outcome Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={outcomeChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {outcomeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipSx} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <SectionCard title="Stage Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stageChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,158,171,.22)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltipSx} />
                        <Bar dataKey="count" fill="#062849" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </Box>

                <SectionCard
                  title="By Stage"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" onClick={() => exportToCSV(pipelineData.by_stage, "pipeline_by_stage")} startIcon={<Iconify icon="fa6-solid:download" width={16} />}>
                        CSV
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => downloadPDF("pipeline")} startIcon={<Iconify icon="fa6-solid:file-pdf" width={16} />}>
                        PDF
                      </Button>
                    </Stack>
                  }
                >
                  <ReportTable
                    columns={[
                      { key: 'stage', label: 'Stage', render: (item) => item.stage || "-" },
                      { key: 'count', label: 'Count', align: 'right' },
                      {
                        key: 'percent', label: '%', align: 'right',
                        render: (item) => `${pipelineData.summary.total_leads > 0
                          ? Math.round((item.count / pipelineData.summary.total_leads) * 100)
                          : 0}%`,
                      },
                      {
                        key: 'status', label: 'Status',
                        render: (item) => {
                          const stageName = item.stage || "-";
                          const isWon = wonStages.includes(stageName);
                          const isLost = lostStages.includes(stageName);
                          if (isWon) return <Chip label="Won" size="small" color="success" sx={{ fontWeight: 700 }} />;
                          if (isLost) return <Chip label="Lost" size="small" color="error" sx={{ fontWeight: 700 }} />;
                          return <Chip label="Open" size="small" color="primary" sx={{ fontWeight: 700 }} />;
                        },
                      },
                    ]}
                    rows={pipelineData.by_stage}
                  />
                </SectionCard>
              </>
            )}
          </Box>
        )}

        {/* Team Performance */}
        {activeTab === "team" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && teamData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <StatCard label="Team Total Leads" value={teamData.totals.total_leads} />
                  <StatCard label="Team Won" value={teamData.totals.total_won} color="#118d57" />
                  <StatCard label="Team Open" value={teamData.totals.total_open} color="#062849" />
                  <StatCard label="Avg Conversion" value={`${Math.round(teamData.totals.avg_conversion_rate)}%`} />
                </Box>

                <SectionCard
                  title="Performance by Team Member"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" onClick={() => exportToCSV(teamData.users, "team_performance")} startIcon={<Iconify icon="fa6-solid:download" width={16} />}>
                        CSV
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => downloadPDF("team-performance")} startIcon={<Iconify icon="fa6-solid:file-pdf" width={16} />}>
                        PDF
                      </Button>
                    </Stack>
                  }
                >
                  <ReportTable
                    columns={[
                      { key: 'name', label: 'Name' },
                      { key: 'total_leads', label: 'Total', align: 'right' },
                      { key: 'won_leads', label: 'Won', align: 'right', render: (user) => <Box component="span" sx={{ color: 'success.main' }}>{user.won_leads}</Box> },
                      { key: 'lost_leads', label: 'Lost', align: 'right', render: (user) => <Box component="span" sx={{ color: 'error.main' }}>{user.lost_leads}</Box> },
                      { key: 'open_leads', label: 'Open', align: 'right', render: (user) => <Box component="span" sx={{ color: 'primary.main' }}>{user.open_leads}</Box> },
                      { key: 'conversion_rate', label: 'Conversion %', align: 'right', render: (user) => `${user.conversion_rate}%` },
                    ]}
                    rows={teamData.users}
                  />
                </SectionCard>
              </>
            )}
          </Box>
        )}

        {/* Source Analysis */}
        {activeTab === "source" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && sourceData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <SectionCard title="Source Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sourceData.sources?.map(s => ({ name: s.source, count: s.total })) || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,158,171,.22)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltipSx} />
                        <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <Card sx={cardSx}>
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Sources</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{sourceData.total_sources}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Top Source</Typography>
                      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 1.5 }}>{sourceData.sources?.[0]?.source || "-"}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Top Source Leads</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{sourceData.sources?.[0]?.total || 0}</Typography>
                    </CardContent>
                  </Card>
                </Box>

                <SectionCard
                  title="Leads by Source"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" onClick={() => exportToCSV(sourceData.sources, "source_analysis")} startIcon={<Iconify icon="fa6-solid:download" width={16} />}>
                        CSV
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => downloadPDF("source-analysis")} startIcon={<Iconify icon="fa6-solid:file-pdf" width={16} />}>
                        PDF
                      </Button>
                    </Stack>
                  }
                >
                  <ReportTable
                    columns={[
                      { key: 'source', label: 'Source' },
                      { key: 'total', label: 'Total', align: 'right' },
                      { key: 'won', label: 'Won', align: 'right', render: (item) => <Box component="span" sx={{ color: 'success.main' }}>{item.won}</Box> },
                      { key: 'lost', label: 'Lost', align: 'right', render: (item) => <Box component="span" sx={{ color: 'error.main' }}>{item.lost}</Box> },
                      { key: 'open', label: 'Open', align: 'right', render: (item) => <Box component="span" sx={{ color: 'primary.main' }}>{item.open}</Box> },
                      { key: 'conversion_rate', label: 'Conversion %', align: 'right', render: (item) => `${item.conversion_rate}%` },
                    ]}
                    rows={sourceData.sources}
                  />
                </SectionCard>
              </>
            )}
          </Box>
        )}

        {/* Product Analysis */}
        {activeTab === "product" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && productData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <StatCard label="Total Sources" value={productData.total_sources} />
                  <StatCard label="Total Products" value={productData.total_products} />
                  <Card sx={cardSx}>
                    <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: .5 }}>Top Product</Typography>
                      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {productData.sources?.[0]?.products?.[0]?.product || "-"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {productData.sources?.[0]?.products?.[0]?.total || 0} leads
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Stack spacing={2.5}>
                  {productData.sources?.map((sourceGroup) => (
                    <SectionCard
                      key={sourceGroup.source_type}
                      title={`${sourceGroup.source_label} — ${sourceGroup.total_leads} leads`}
                      contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                      action={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            exportToCSV(
                              sourceGroup.products.map((p) => ({
                                Product: p.product,
                                Total: p.total,
                                Won: p.won,
                                Lost: p.lost,
                                Open: p.open,
                                "Conversion %": p.conversion_rate,
                              })),
                              `product_analysis_${sourceGroup.source_type}`
                            )
                          }
                          startIcon={<Iconify icon="fa6-solid:download" width={16} />}
                        >
                          CSV
                        </Button>
                      }
                    >
                      <ReportTable
                        columns={[
                          { key: 'product', label: 'Product' },
                          { key: 'total', label: 'Total', align: 'right' },
                          { key: 'won', label: 'Won', align: 'right', render: (item) => <Box component="span" sx={{ color: 'success.main' }}>{item.won}</Box> },
                          { key: 'lost', label: 'Lost', align: 'right', render: (item) => <Box component="span" sx={{ color: 'error.main' }}>{item.lost}</Box> },
                          { key: 'open', label: 'Open', align: 'right', render: (item) => <Box component="span" sx={{ color: 'primary.main' }}>{item.open}</Box> },
                          { key: 'conversion_rate', label: 'Conversion %', align: 'right', render: (item) => `${item.conversion_rate}%` },
                        ]}
                        rows={sourceGroup.products}
                        emptyMessage="No product data found."
                      />
                    </SectionCard>
                  ))}
                </Stack>
              </>
            )}
          </Box>
        )}

        {/* Activity Summary */}
        {activeTab === "activity" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && activityData && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 2.5 }}>
                <SectionCard
                  title="Activities by Type"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Button variant="outlined" size="small" onClick={() => exportToCSV(activityData.by_type, "activities_by_type")} startIcon={<Iconify icon="fa6-solid:download" width={16} />} />
                  }
                >
                  <ReportTable
                    columns={[
                      {
                        key: 'type', label: 'Type',
                        render: (item) => <Box component="span" sx={{ textTransform: 'capitalize' }}>{item.type.replace("_", " ")}</Box>,
                      },
                      { key: 'count', label: 'Count', align: 'right' },
                    ]}
                    rows={activityData.by_type}
                  />
                </SectionCard>
                <SectionCard
                  title="Activities by User"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Button variant="outlined" size="small" onClick={() => exportToCSV(activityData.by_user, "activities_by_user")} startIcon={<Iconify icon="fa6-solid:download" width={16} />} />
                  }
                >
                  <ReportTable
                    columns={[
                      { key: 'name', label: 'User' },
                      { key: 'total_activities', label: 'Total', align: 'right' },
                      { key: 'calls', label: 'Calls', align: 'right', render: (user) => user.calls || 0 },
                      { key: 'meetings', label: 'Meetings', align: 'right', render: (user) => user.meetings || 0 },
                      { key: 'follow_ups', label: 'Follow-ups', align: 'right', render: (user) => user.follow_ups || 0 },
                    ]}
                    rows={activityData.by_user}
                  />
                </SectionCard>
              </Box>
            )}
          </Box>
        )}

        {/* Trends Report */}
        {activeTab === "trends" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && trendsData && (
              <SectionCard title="Leads Over Time">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendsData.daily || []}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#062849" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#062849" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#637381' }} axisLine={false} tickLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,158,171,.22)" vertical={false} />
                    <Tooltip contentStyle={chartTooltipSx} />
                    <Legend />
                    <Area type="monotone" dataKey="count" stroke="#062849" fillOpacity={1} fill="url(#colorLeads)" name="New Leads" />
                  </AreaChart>
                </ResponsiveContainer>
              </SectionCard>
            )}
          </Box>
        )}

        {/* Conversion Funnel */}
        {activeTab === "funnel" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && funnelData && (
              <SectionCard
                title="Stage Conversion Funnel"
                action={
                  <Button variant="outlined" size="small" onClick={() => exportToCSV(funnelData.stages, "conversion_funnel")} startIcon={<Iconify icon="fa6-solid:download" width={16} />}>
                    Export CSV
                  </Button>
                }
              >
                <Box>
                  {funnelData.stages?.map((stage, index) => (
                    <Box key={stage.name} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{stage.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stage.count} leads</Typography>
                      </Box>
                      <Box sx={{ height: 30, borderRadius: 1.5, bgcolor: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${stage.conversion_rate || 0}%`,
                            bgcolor: COLORS.primary[index % COLORS.primary.length],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            minWidth: stage.conversion_rate > 0 ? 'auto' : 0,
                          }}
                        >
                          {stage.conversion_rate > 0 && `${stage.conversion_rate.toFixed(1)}%`}
                        </Box>
                      </Box>
                      {index < funnelData.stages.length - 1 && (
                        <Box sx={{ textAlign: 'center', my: 1 }}>
                          <Iconify icon="fa6-solid:arrow-down" width={12} />
                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                            {stage.drop_off_count || 0} dropped off ({stage.drop_off_rate?.toFixed(1) || 0}%)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </SectionCard>
            )}
          </Box>
        )}

        {/* Follow-ups Report */}
        {activeTab === "followups" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && followupReportData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <StatCard label="Today" value={followupReportData.summary?.today ?? 0} color="#062849" />
                  <StatCard label="Overdue" value={followupReportData.summary?.overdue ?? 0} color="#b71d18" />
                  <StatCard label="Upcoming" value={followupReportData.summary?.upcoming ?? 0} color="#118d57" />
                  <StatCard label="Not Scheduled" value={followupReportData.summary?.not_scheduled ?? 0} color="#637381" />
                </Box>

                <SectionCard
                  title="Follow-up by Assignee"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => exportToCSV(
                        followupReportData.by_assignee?.map(r => ({
                          Assignee: r.assignee,
                          Today: r.today,
                          Overdue: r.overdue,
                          Upcoming: r.upcoming,
                          'Not Scheduled': r.not_scheduled,
                          Total: r.total,
                        })),
                        "followup_report"
                      )}
                      startIcon={<Iconify icon="fa6-solid:download" width={16} />}
                    >
                      Export CSV
                    </Button>
                  }
                >
                  <ReportTable
                    columns={[
                      { key: 'assignee', label: 'Assignee' },
                      { key: 'today', label: 'Today', align: 'right' },
                      { key: 'overdue', label: 'Overdue', align: 'right', render: (row) => <Box component="span" sx={{ color: 'error.main' }}>{row.overdue}</Box> },
                      { key: 'upcoming', label: 'Upcoming', align: 'right', render: (row) => <Box component="span" sx={{ color: 'success.main' }}>{row.upcoming}</Box> },
                      { key: 'not_scheduled', label: 'Not Scheduled', align: 'right', render: (row) => <Box component="span" sx={{ color: 'text.secondary' }}>{row.not_scheduled}</Box> },
                      { key: 'total', label: 'Total', align: 'right', render: (row) => <Box component="span" sx={{ fontWeight: 700 }}>{row.total}</Box> },
                    ]}
                    rows={followupReportData.by_assignee}
                  />
                </SectionCard>
              </>
            )}
          </Box>
        )}

        {/* Lead Aging */}
        {activeTab === "aging" && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 4, color: 'text.secondary' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loading && agingData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 2.5 }}>
                  <StatCard label="Avg Days in Stage" value={agingData.avg_days?.toFixed(1) || 0} />
                  <StatCard label="Leads > 30 Days" value={agingData.stale_count || 0} color="#b71d18" />
                  <StatCard label="Leads > 60 Days" value={agingData.very_stale_count || 0} color="#b76e00" />
                  <StatCard label="Avg Time to Close" value={`${agingData.avg_days_to_close?.toFixed(1) || 0} days`} />
                </Box>

                <SectionCard
                  title="Aging by Stage"
                  contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" onClick={() => exportToCSV(agingData.by_stage, "lead_aging")} startIcon={<Iconify icon="fa6-solid:download" width={16} />}>
                        Export CSV
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => downloadPDF("aging")} startIcon={<Iconify icon="fa6-solid:file-pdf" width={16} />}>
                        Download PDF
                      </Button>
                    </Stack>
                  }
                >
                  <ReportTable
                    columns={[
                      { key: 'stage', label: 'Stage' },
                      { key: 'count', label: 'Total Leads', align: 'right' },
                      { key: 'avg_days', label: 'Avg Days', align: 'right', render: (item) => item.avg_days?.toFixed(1) || 0 },
                      { key: 'min_days', label: 'Min Days', align: 'right', render: (item) => item.min_days || 0 },
                      { key: 'max_days', label: 'Max Days', align: 'right', render: (item) => item.max_days || 0 },
                      { key: 'stale_count', label: '>30 Days', align: 'right', render: (item) => <Box component="span" sx={{ color: 'warning.main' }}>{item.stale_count || 0}</Box> },
                      { key: 'very_stale_count', label: '>60 Days', align: 'right', render: (item) => <Box component="span" sx={{ color: 'error.main' }}>{item.very_stale_count || 0}</Box> },
                    ]}
                    rows={agingData.by_stage}
                  />
                </SectionCard>
              </>
            )}
          </Box>
        )}
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Report Stage Settings</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Select which lead stages should be treated as <strong>Won</strong> or <strong>Lost</strong> for reporting.
            Stages not selected will be counted as <strong>Open</strong>.
          </Typography>

          {stages.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              No lead stages found. Please create stages first.
            </Box>
          )}

          {stages.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                    <TableCell sx={headCellSx}>Stage Name</TableCell>
                    <TableCell align="center" sx={headCellSx}>Won</TableCell>
                    <TableCell align="center" sx={headCellSx}>Lost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stages.map((stage) => (
                    <TableRow key={stage.id} hover>
                      <TableCell sx={{ px: 2 }}>{stage.name}</TableCell>
                      <TableCell align="center" sx={{ px: 2 }}>
                        <Checkbox
                          checked={wonStages.includes(stage.name)}
                          onChange={() => toggleStage(stage.name, "won")}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 2 }}>
                        <Checkbox
                          checked={lostStages.includes(stage.name)}
                          onChange={() => toggleStage(stage.name, "lost")}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setShowSettings(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
