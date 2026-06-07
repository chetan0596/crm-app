import { useEffect, useState, useMemo } from "react";
import { Card, Form, Table, Tabs, Tab, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, AreaChart, Area
} from "recharts";

const COLORS = {
  won: "#28a745",
  lost: "#dc3545",
  open: "#007bff",
  new: "#6c757d",
  primary: ["#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8", "#6f42c1", "#e83e8c", "#fd7e14"]
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  // Settings modal
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
  const buildParams = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (filterSource) params.append("source", filterSource);
    if (filterUser) params.append("assigned_to", filterUser);
    if (filterStage) params.append("stage", filterStage);
    if (filterTag) params.append("tag", filterTag);
    return params;
  };

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
  const downloadPDF = async (reportType) => {
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
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/pipeline?${buildParams()}`);
      setPipelineData(res.data.data);
    } catch (e) {
      toast.error("Failed to load pipeline report");
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await api.get("/lead-stages");
      setStages(res.data.data || []);
    } catch (e) {
      // ignore
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings/report-stages");

      setWonStages(res.data.data.won_stages || []);
      setLostStages(res.data.data.lost_stages || []);
    } catch (e) {
      // Silently ignore if settings endpoint doesn't exist or fails
      // This prevents page load issues when settings table doesn't exist
      console.warn("Settings endpoint not available:", e.response?.status === 404 ? "Not found" : e.message);
      // Set default values
      setWonStages([]);
      setLostStages([]);
    }
  };

  const refreshAllReports = () => {
    if (activeTab === "pipeline") fetchPipeline();
    if (activeTab === "team") fetchTeamPerformance();
    if (activeTab === "source") fetchSourceAnalysis();
    if (activeTab === "product") fetchProductAnalysis();
    if (activeTab === "activity") fetchActivitySummary();
    if (activeTab === "funnel") fetchFunnelData();
    if (activeTab === "aging") fetchAgingData();
    if (activeTab === "trends") fetchTrendsData();
    if (activeTab === "followups") fetchFollowupReport();
  };

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
    } catch (e) {
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

  const fetchTeamPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/team-performance?${buildParams()}`);
      setTeamData(res.data.data);
    } catch (e) {
      toast.error("Failed to load team performance report");
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/source-analysis?${buildParams()}`);
      setSourceData(res.data.data);
    } catch (e) {
      toast.error("Failed to load source analysis report");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/product-analysis?${buildParams()}`);
      setProductData(res.data.data);
    } catch (e) {
      toast.error("Failed to load product analysis report");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/activity-summary?${buildParams()}`);
      setActivityData(res.data.data);
    } catch (e) {
      toast.error("Failed to load activity summary report");
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/funnel?${buildParams()}`);
      setFunnelData(res.data.data);
    } catch (e) {
      toast.error("Failed to load conversion funnel");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowupReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/followups?${buildParams()}`);
      setFollowupReportData(res.data.data);
    } catch (e) {
      toast.error("Failed to load follow-up report");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgingData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/aging?${buildParams()}`);
      setAgingData(res.data.data);
    } catch (e) {
      toast.error("Failed to load aging report");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/leads/trends?${buildParams()}`);
      setTrendsData(res.data.data);
    } catch (e) {
      toast.error("Failed to load trends report");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [sourcesRes, usersRes, stagesRes, tagsRes] = await Promise.all([
        api.get("/lead-sources"),
        api.get("/users"),
        api.get("/lead-stages"),
        api.get("/lead-tags"),
      ]);
      setSources(sourcesRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setStagesList(stagesRes.data.data || []);
      setTags(tagsRes.data.data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateTo(today.toISOString().split("T")[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0]);
    // Load stages and settings
    fetchStages();
    fetchSettings();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      refreshAllReports();
    }
  }, [activeTab, dateFrom, dateTo, filterSource, filterUser, filterStage, filterTag]);

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
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0">Lead Reports</h4>
        <Button variant="outline-secondary" size="sm" onClick={() => setShowSettings(true)}>
          <i className="fas fa-cog me-1"></i> Stage Settings
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-secondary">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-secondary">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-secondary">Source</Form.Label>
                <Form.Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} size="sm">
                  <option value="">All Sources</option>
                  {sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-secondary">Assigned To</Form.Label>
                <Form.Select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} size="sm">
                  <option value="">All Users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-secondary">Stage</Form.Label>
                <Form.Select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} size="sm">
                  <option value="">All Stages</option>
                  {stagesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-secondary">Tag</Form.Label>
                <Form.Select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} size="sm">
                  <option value="">All Tags</option>
                  {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3 d-flex justify-content-between align-items-center">
            <div className="small text-secondary">
              Showing data from {dateFrom || "-"} to {dateTo || "-"}
              {filterSource && ` • Source: ${filterSource}`}
              {filterUser && ` • User: ${users.find(u => u.id == filterUser)?.name}`}
              {filterStage && ` • Stage: ${filterStage}`}
              {filterTag && ` • Tag: ${filterTag}`}
            </div>
            <div>
              <Button variant="outline-success" size="sm" className="me-2" onClick={() => {
                setFilterSource(""); setFilterUser(""); setFilterStage(""); setFilterTag("");
              }}>
                <i className="fas fa-undo me-1"></i> Reset Filters
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        {/* Pipeline Report */}
        <Tab eventKey="pipeline" title="Pipeline">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && pipelineData && (
            <>
              {/* Summary Cards */}
              <Row className="g-3 mb-4">
                <Col md={2}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Total Leads</div>
                      <div className="h4 mb-0">{pipelineData.summary.total_leads}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Won</div>
                      <div className="h4 mb-0 text-success">{pipelineData.summary.won}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Lost</div>
                      <div className="h4 mb-0 text-danger">{pipelineData.summary.lost}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Open</div>
                      <div className="h4 mb-0 text-primary">{pipelineData.summary.open}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">New This Month</div>
                      <div className="h4 mb-0">{pipelineData.summary.new_this_month}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Conversion %</div>
                      <div className="h4 mb-0">{pipelineData.summary.conversion_rate}%</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Charts Row */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Header className="bg-light d-flex justify-content-between">
                      <strong>Outcome Distribution</strong>
                    </Card.Header>
                    <Card.Body>
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
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header className="bg-light">
                      <strong>Stage Distribution</strong>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stageChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#007bff" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                      <strong>By Stage</strong>
                      <div>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => exportToCSV(pipelineData.by_stage, "pipeline_by_stage")}>
                          <i className="fas fa-download me-1"></i> CSV
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => downloadPDF("pipeline")}>
                          <i className="fas fa-file-pdf me-1"></i> PDF
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Stage</th>
                            <th className="text-end">Count</th>
                            <th className="text-end">%</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pipelineData.by_stage.map((item) => {
                            const stageName = item.stage || "-";
                            const isWon = wonStages.includes(stageName);
                            const isLost = lostStages.includes(stageName);
                            return (
                              <tr key={item.stage}>
                                <td>{stageName}</td>
                                <td className="text-end">{item.count}</td>
                                <td className="text-end">
                                  {pipelineData.summary.total_leads > 0
                                    ? Math.round((item.count / pipelineData.summary.total_leads) * 100)
                                    : 0}%
                                </td>
                                <td>
                                  {isWon && <Badge bg="success">Won</Badge>}
                                  {isLost && <Badge bg="danger">Lost</Badge>}
                                  {!isWon && !isLost && <Badge bg="primary">Open</Badge>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Tab>

        {/* Team Performance */}
        <Tab eventKey="team" title="Team Performance">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && teamData && (
            <>
              {/* Team Totals */}
              <Row className="g-3 mb-4">
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Team Total Leads</div>
                      <div className="h4 mb-0">{teamData.totals.total_leads}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Team Won</div>
                      <div className="h4 mb-0 text-success">{teamData.totals.total_won}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Team Open</div>
                      <div className="h4 mb-0 text-primary">{teamData.totals.total_open}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Avg Conversion</div>
                      <div className="h4 mb-0">{Math.round(teamData.totals.avg_conversion_rate)}%</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card>
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <strong>Performance by Team Member</strong>
                  <div>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => exportToCSV(teamData.users, "team_performance")}>
                      <i className="fas fa-download me-1"></i> CSV
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => downloadPDF("team-performance")}>
                      <i className="fas fa-file-pdf me-1"></i> PDF
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th className="text-end">Total</th>
                        <th className="text-end">Won</th>
                        <th className="text-end">Lost</th>
                        <th className="text-end">Open</th>
                        <th className="text-end">Conversion %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamData.users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td className="text-end">{user.total_leads}</td>
                          <td className="text-end text-success">{user.won_leads}</td>
                          <td className="text-end text-danger">{user.lost_leads}</td>
                          <td className="text-end text-primary">{user.open_leads}</td>
                          <td className="text-end">{user.conversion_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Tab>

        {/* Source Analysis */}
        <Tab eventKey="source" title="Source Analysis">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && sourceData && (
            <>
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Header className="bg-light">
                      <strong>Source Distribution</strong>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={sourceData.sources?.map(s => ({ name: s.source, count: s.total })) || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#28a745" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="text-center h-100">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="text-secondary small">Total Sources</div>
                      <div className="h1 mb-3">{sourceData.total_sources}</div>
                      <div className="text-secondary small">Top Source</div>
                      <div className="h4 text-primary">{sourceData.sources?.[0]?.source || "-"}</div>
                      <div className="text-secondary small">Top Source Leads</div>
                      <div className="h5">{sourceData.sources?.[0]?.total || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card>
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <strong>Leads by Source</strong>
                  <div>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => exportToCSV(sourceData.sources, "source_analysis")}>
                      <i className="fas fa-download me-1"></i> CSV
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => downloadPDF("source-analysis")}>
                      <i className="fas fa-file-pdf me-1"></i> PDF
                    </Button>
                  </div>
                </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Source</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Won</th>
                      <th className="text-end">Lost</th>
                      <th className="text-end">Open</th>
                      <th className="text-end">Conversion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceData.sources.map((item) => (
                      <tr key={item.source}>
                        <td>{item.source}</td>
                        <td className="text-end">{item.total}</td>
                        <td className="text-end text-success">{item.won}</td>
                        <td className="text-end text-danger">{item.lost}</td>
                        <td className="text-end text-primary">{item.open}</td>
                        <td className="text-end">{item.conversion_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
          )}
        </Tab>

        {/* Product Analysis */}
        <Tab eventKey="product" title="Product Analysis">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && productData && (
            <>
              <Row className="g-3 mb-4">
                <Col md={4}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Total Sources</div>
                      <div className="h4 mb-0">{productData.total_sources}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Total Products</div>
                      <div className="h4 mb-0">{productData.total_products}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Top Product</div>
                      <div className="h4 mb-0 text-primary">
                        {productData.sources?.[0]?.products?.[0]?.product || "-"}
                      </div>
                      <div className="text-secondary small">
                        {productData.sources?.[0]?.products?.[0]?.total || 0} leads
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {productData.sources?.map((sourceGroup) => (
                <Card key={sourceGroup.source_type} className="mb-4">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <strong>{sourceGroup.source_label} — {sourceGroup.total_leads} leads</strong>
                    <Button
                      variant="outline-primary"
                      size="sm"
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
                    >
                      <i className="fas fa-download me-1"></i> CSV
                    </Button>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th className="text-end">Total</th>
                          <th className="text-end">Won</th>
                          <th className="text-end">Lost</th>
                          <th className="text-end">Open</th>
                          <th className="text-end">Conversion %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sourceGroup.products.map((item) => (
                          <tr key={item.product}>
                            <td>{item.product}</td>
                            <td className="text-end">{item.total}</td>
                            <td className="text-end text-success">{item.won}</td>
                            <td className="text-end text-danger">{item.lost}</td>
                            <td className="text-end text-primary">{item.open}</td>
                            <td className="text-end">{item.conversion_rate}%</td>
                          </tr>
                        ))}
                        {sourceGroup.products.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-muted text-center">
                              No product data found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              ))}
            </>
          )}
        </Tab>

        {/* Activity Summary */}
        <Tab eventKey="activity" title="Activity Summary">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && activityData && (
            <>
              <Row className="g-4">
                <Col md={4}>
                  <Card>
                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                      <strong>Activities by Type</strong>
                      <Button variant="outline-primary" size="sm" onClick={() => exportToCSV(activityData.by_type, "activities_by_type")}>
                        <i className="fas fa-download"></i>
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th className="text-end">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityData.by_type.map((item) => (
                            <tr key={item.type}>
                              <td className="text-capitalize">{item.type.replace("_", " ")}</td>
                              <td className="text-end">{item.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={8}>
                  <Card>
                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                      <strong>Activities by User</strong>
                      <Button variant="outline-primary" size="sm" onClick={() => exportToCSV(activityData.by_user, "activities_by_user")}>
                        <i className="fas fa-download"></i>
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>User</th>
                            <th className="text-end">Total</th>
                            <th className="text-end">Calls</th>
                            <th className="text-end">Meetings</th>
                            <th className="text-end">Follow-ups</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityData.by_user.map((user) => (
                            <tr key={user.id}>
                              <td>{user.name}</td>
                              <td className="text-end">{user.total_activities}</td>
                              <td className="text-end">{user.calls || 0}</td>
                              <td className="text-end">{user.meetings || 0}</td>
                              <td className="text-end">{user.follow_ups || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Tab>

        {/* Trends Report */}
        <Tab eventKey="trends" title="Trends">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && trendsData && (
            <Card>
              <Card.Header className="bg-light">
                <strong>Leads Over Time</strong>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendsData.daily || []}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007bff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#007bff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="count" stroke="#007bff" fillOpacity={1} fill="url(#colorLeads)" name="New Leads" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}
        </Tab>

        {/* Conversion Funnel */}
        <Tab eventKey="funnel" title="Conversion Funnel">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && funnelData && (
            <Card>
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <strong>Stage Conversion Funnel</strong>
                <Button variant="outline-primary" size="sm" onClick={() => exportToCSV(funnelData.stages, "conversion_funnel")}>
                  <i className="fas fa-download me-1"></i> Export CSV
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="funnel-container">
                  {funnelData.stages?.map((stage, index) => (
                    <div key={stage.name} className="funnel-stage mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold">{stage.name}</span>
                        <span className="text-muted">{stage.count} leads</span>
                      </div>
                      <div className="progress" style={{ height: "30px" }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${stage.conversion_rate || 0}%`,
                            backgroundColor: COLORS.primary[index % COLORS.primary.length]
                          }}
                        >
                          {stage.conversion_rate > 0 && `${stage.conversion_rate.toFixed(1)}%`}
                        </div>
                      </div>
                      {index < funnelData.stages.length - 1 && (
                        <div className="text-center my-2">
                          <i className="fas fa-arrow-down text-muted"></i>
                          <span className="text-muted small ms-2">
                            {stage.drop_off_count || 0} dropped off ({stage.drop_off_rate?.toFixed(1) || 0}%)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab>

        {/* Follow-ups Report */}
        <Tab eventKey="followups" title="Follow-ups">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && followupReportData && (
            <>
              <Row className="g-3 mb-4">
                {[
                  { label: "Today", value: followupReportData.summary?.today ?? 0, color: "#007bff" },
                  { label: "Overdue", value: followupReportData.summary?.overdue ?? 0, color: "#dc3545" },
                  { label: "Upcoming", value: followupReportData.summary?.upcoming ?? 0, color: "#28a745" },
                  { label: "Not Scheduled", value: followupReportData.summary?.not_scheduled ?? 0, color: "#6c757d" },
                ].map((c) => (
                  <Col md={3} key={c.label}>
                    <Card className="text-center h-100">
                      <Card.Body>
                        <div className="text-secondary small">{c.label}</div>
                        <div className="h4 mb-0" style={{ color: c.color }}>{c.value}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Card>
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <strong>Follow-up by Assignee</strong>
                  <Button variant="outline-primary" size="sm"
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
                    )}>
                    <i className="fas fa-download me-1"></i> Export CSV
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Assignee</th>
                        <th className="text-end">Today</th>
                        <th className="text-end text-danger">Overdue</th>
                        <th className="text-end text-success">Upcoming</th>
                        <th className="text-end text-secondary">Not Scheduled</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followupReportData.by_assignee?.map((row, i) => (
                        <tr key={i}>
                          <td>{row.assignee}</td>
                          <td className="text-end">{row.today}</td>
                          <td className="text-end text-danger">{row.overdue}</td>
                          <td className="text-end text-success">{row.upcoming}</td>
                          <td className="text-end text-secondary">{row.not_scheduled}</td>
                          <td className="text-end fw-semibold">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Tab>

        {/* Lead Aging */}
        <Tab eventKey="aging" title="Lead Aging">
          {loading && <div className="text-center py-4">Loading...</div>}
          {!loading && agingData && (
            <>
              <Row className="g-3 mb-4">
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Avg Days in Stage</div>
                      <div className="h4 mb-0">{agingData.avg_days?.toFixed(1) || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Leads &gt; 30 Days</div>
                      <div className="h4 mb-0 text-danger">{agingData.stale_count || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Leads &gt; 60 Days</div>
                      <div className="h4 mb-0 text-warning">{agingData.very_stale_count || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <div className="text-secondary small">Avg Time to Close</div>
                      <div className="h4 mb-0">{agingData.avg_days_to_close?.toFixed(1) || 0} days</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card>
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <strong>Aging by Stage</strong>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => exportToCSV(agingData.by_stage, "lead_aging")}>
                      <i className="fas fa-download me-1"></i> Export CSV
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => downloadPDF("aging")}>
                      <i className="fas fa-file-pdf me-1"></i> Download PDF
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Stage</th>
                        <th className="text-end">Total Leads</th>
                        <th className="text-end">Avg Days</th>
                        <th className="text-end">Min Days</th>
                        <th className="text-end">Max Days</th>
                        <th className="text-end">&gt;30 Days</th>
                        <th className="text-end">&gt;60 Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agingData.by_stage?.map((item) => (
                        <tr key={item.stage}>
                          <td>{item.stage}</td>
                          <td className="text-end">{item.count}</td>
                          <td className="text-end">{item.avg_days?.toFixed(1) || 0}</td>
                          <td className="text-end">{item.min_days || 0}</td>
                          <td className="text-end">{item.max_days || 0}</td>
                          <td className="text-end text-warning">{item.stale_count || 0}</td>
                          <td className="text-end text-danger">{item.very_stale_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Tab>
      </Tabs>

      {/* Settings Modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Report Stage Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            Select which lead stages should be treated as <strong>Won</strong> or <strong>Lost</strong> for reporting.
            Stages not selected will be counted as <strong>Open</strong>.
          </p>

          {stages.length === 0 && (
            <div className="text-center py-3 text-muted">No lead stages found. Please create stages first.</div>
          )}

          {stages.length > 0 && (
            <Table responsive bordered hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Stage Name</th>
                  <th className="text-center">Won</th>
                  <th className="text-center">Lost</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => (
                  <tr key={stage.id}>
                    <td>{stage.name}</td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={wonStages.includes(stage.name)}
                        onChange={() => toggleStage(stage.name, "won")}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={lostStages.includes(stage.name)}
                        onChange={() => toggleStage(stage.name, "lost")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
