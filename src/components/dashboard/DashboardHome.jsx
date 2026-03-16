import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardAnalytics } from "@/apiIntegration/dashboards";
import PageLoader from "@/components/common/PageLoader";
import { COLORS } from "@/styles/colors";
import { useContextElement } from "@/context/Context";

export default function DashboardHome() {
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userCredits } = useContextElement();

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardAnalytics()
      .then((data) => {
        setDashboardAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Load Plotly and initialize charts when data is available
    if (!loading && dashboardAnalytics) {
      if (!window.Plotly) {
        const script = document.createElement('script');
        script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
        script.async = true;
        script.onload = () => initializeCharts();
        document.body.appendChild(script);
      } else {
        initializeCharts();
      }
    }
  }, [loading, dashboardAnalytics]);

  // Calculate pillar averages
  const pillarAverages = useMemo(() => {
    if (!dashboardAnalytics?.tool_kpis?.length) return null;
    const tools = dashboardAnalytics.tool_kpis;
    const count = tools.length;
    const sum = (key) => tools.reduce((acc, t) => acc + (t[key] || 0), 0);
    return {
      privacy: Math.round(sum("privacy_safety_score") / count),
      instructional: Math.round(sum("instructional_impact_score") / count),
      usability: Math.round(sum("usability_score") / count),
      dataQuality: Math.round(sum("data_quality_score") / count),
    };
  }, [dashboardAnalytics]);

  const initializeCharts = () => {
    if (!dashboardAnalytics) return;

    // Chart: Recommendation Distribution
    const recDistribution = dashboardAnalytics.distributions?.recommendation || [];
    const recColors = {
      'Approved': '#10b981',
      'Approved with limitations': '#3b82f6',
      'Restricted': '#f59e0b',
      'Do not use': '#ef4444',
      'Not Recommended': '#ef4444',
      'Rejected': '#ef4444',
      'Not Assessed': '#95a5a6'
    };
    
    const recommendationPlotData = [{
      values: recDistribution.map(d => d.value),
      labels: recDistribution.map(d => d.name),
      type: 'pie',
      hole: .6,
      marker: {
        colors: recDistribution.map(d => recColors[d.name] || '#95a5a6')
      },
      textinfo: 'none'
    }];

    const recommendationLayout = {
      title: { text: 'Recommendation Distribution', font: { size: 16, family: 'Inter', color: '#0F3053', weight: 700 }, x: 0.05 },
      showlegend: true,
      legend: { orientation: 'h', y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: 'rgba(0,0,0,0)',
    };

    window.Plotly.newPlot('chart-recommendation', recommendationPlotData, recommendationLayout, {displayModeBar: false, responsive: true});

    // Chart: Intended Users
    const usersDistribution = dashboardAnalytics.distributions?.intended_users || [];
    const usersPlotData = [{
      values: usersDistribution.map(d => d.value),
      labels: usersDistribution.map(d => d.name),
      type: 'pie',
      hole: .6,
      marker: {
        colors: ['#3b82f6', '#58BFCE', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444']
      },
      textinfo: 'none'
    }];

    const usersLayout = {
      title: { text: 'Intended Users Distribution', font: { size: 16, family: 'Inter', color: '#0F3053', weight: 700 }, x: 0.05 },
      showlegend: true,
      legend: { orientation: 'h', y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: 'rgba(0,0,0,0)',
    };

    window.Plotly.newPlot('chart-users', usersPlotData, usersLayout, {displayModeBar: false, responsive: true});

    // Chart: Compliance Distribution (Horizontal Bar)
    const complianceRaw = dashboardAnalytics.distributions?.compliance || [];
    
    const normalizeStatus = (name) => {
      const n = name.toLowerCase();
      if (n.includes("partial")) return "partial";
      if (n.includes("claimed")) return "claimed";
      if (n.includes("not")) return "notVerified";
      return "full";
    };

    const normalizeStandard = (name) =>
      name
        .replace(/- partial.*/i, "")
        .replace(/- not.*/i, "")
        .replace(/- claimed.*/i, "")
        .trim();

    const grouped = {};
    complianceRaw.forEach(({ name, value }) => {
      const standard = normalizeStandard(name);
      const status = normalizeStatus(name);

      if (!grouped[standard]) {
        grouped[standard] = { full: 0, partial: 0, claimed: 0, notVerified: 0 };
      }
      grouped[standard][status] += value;
    });

    const standards = Object.keys(grouped);
    const compliancePlotData = [{
      type: 'bar',
      x: standards.map(s => grouped[s].full + grouped[s].partial + grouped[s].claimed + grouped[s].notVerified),
      y: standards,
      orientation: 'h',
      marker: {
        color: standards.map(s => {
          const total = grouped[s].full + grouped[s].partial + grouped[s].claimed + grouped[s].notVerified;
          const fullPercent = (grouped[s].full / total) * 100;
          return fullPercent >= 80 ? '#10b981' : fullPercent >= 50 ? '#3b82f6' : '#f59e0b';
        })
      }
    }];

    const complianceLayout = {
      title: { text: 'Compliance Standard Distribution', font: { size: 18, family: 'Inter', color: '#0F3053', weight: 700 } },
      xaxis: { title: 'Number of Tools', gridcolor: '#f1f5f9' },
      yaxis: { autorange: 'reversed' },
      margin: { t: 50, b: 40, l: 200, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 450
    };

    window.Plotly.newPlot('chart-compliance', compliancePlotData, complianceLayout, {displayModeBar: false, responsive: true});
  };

  if (loading || !dashboardAnalytics) {
    return <PageLoader loading={true} />;
  }

  const overview = dashboardAnalytics.overview || {};
  const highRiskTools = dashboardAnalytics.high_risk_tools || [];
  const allTools = dashboardAnalytics.tool_kpis || [];

  return (
    <div className="space-y-8 min-h-full">
      {/* Stats Cards Row */}
      <section id="stats-section" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {/* Credits Card */}
        <div className="dashboard-card p-6 flex flex-col justify-between border-l-4" style={{ borderLeftColor: COLORS.secondary }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
              <h3 className="text-4xl font-bold mt-1" style={{ color: COLORS.secondary }}>
                {userCredits?.remaining || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.secondary}15`, color: COLORS.secondary }}>
              <i className="fa-solid fa-coins"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            of {userCredits?.total || 0} total credits
          </div>
        </div>

        {/* Total Scanned Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Scanned Tools</p>
              <h3 className="text-4xl font-bold text-foreground mt-1">{overview.total_projects || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <i className="fa-solid fa-database"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-emerald-600 font-medium"><i className="fa-solid fa-arrow-up mr-1"></i>12%</span> from last month
          </div>
        </div>

        {/* High Risk Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between border-l-4 border-l-destructive">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Risk Tools</p>
              <h3 className="text-4xl font-bold text-destructive mt-1">{overview.high_risk_count || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Requires immediate attention</div>
        </div>

        {/* Approved Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved Tools</p>
              <h3 className="text-4xl font-bold text-emerald-600 mt-1">{overview.approved_count || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-check-circle"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Ready for enterprise usage</div>
        </div>

        {/* Rejected Tools */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected Tools</p>
              <h3 className="text-4xl font-bold text-orange-500 mt-1">{overview.rejected_count || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
              <i className="fa-regular fa-clock"></i>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Tools not recommended</div>
        </div>
      </section>

      {/* High Risk & Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:h-[400px]">
        {/* High Risk Alert Box */}
        <div className="col-span-1 lg:col-span-8 dashboard-card flex flex-col overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-amber-800">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              <h3 className="font-bold text-lg">High-Risk Tools Requiring Immediate Attention</h3>
            </div>
            <button className="text-xs font-medium text-amber-700 hover:text-amber-900 underline">View all risks</button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full custom-table">
              <thead>
                <tr>
                  <th className="w-1/4">Tool</th>
                  <th className="w-1/4">Vendor</th>
                  <th className="text-center w-24">Overall</th>
                  <th className="text-center w-24">Privacy</th>
                  <th>Risk Reasons</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {highRiskTools.slice(0, 3).map((tool, idx) => (
                  <tr key={idx} className={idx === 0 ? "bg-red-50/30" : ""}>
                    <td>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center mr-3 font-bold text-xs">
                          {tool.project_name?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                          <div className="font-semibold text-destructive">{tool.project_name}</div>
                          <div className="text-xs text-muted-foreground">AI Tool</div>
                        </div>
                      </div>
                    </td>
                    <td>{tool.developer || "Unknown"}</td>
                    <td className="text-center"><span className="font-bold text-destructive">{tool.overall_score?.toFixed(0) || 0}</span></td>
                    <td className="text-center"><span className="font-bold text-amber-600">{tool.privacy_safety || 0}</span></td>
                    <td className="text-xs text-muted-foreground">{tool.high_risk_reason || "High risk detected"}</td>
                    <td className="text-right">
                      <span className="status-badge status-danger">{tool.recommendation || "Block"}</span>
                    </td>
                  </tr>
                ))}
                {highRiskTools.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted-foreground py-8">No high-risk tools found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Gauges */}
        <div className="col-span-1 lg:col-span-4 dashboard-card p-6 flex flex-col">
          <h3 className="font-bold text-foreground mb-6">Overall Compliance Health</h3>
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="grid grid-cols-2 gap-8 w-full">
              <div className="flex flex-col items-center">
                <div className="score-circle" style={{ "--score": pillarAverages?.privacy || 0, "--primary": "#3b82f6" }}>
                  <span className="score-value text-blue-500">{pillarAverages?.privacy || 0}%</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground text-center">Privacy & Safety</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="score-circle" style={{ "--score": pillarAverages?.instructional || 0, "--primary": "#10b981" }}>
                  <span className="score-value text-emerald-500">{pillarAverages?.instructional || 0}%</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground text-center">Instructional Impact</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="score-circle" style={{ "--score": pillarAverages?.usability || 0, "--primary": "#10b981" }}>
                  <span className="score-value text-emerald-500">{pillarAverages?.usability || 0}%</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground text-center">Usability</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="score-circle" style={{ "--score": pillarAverages?.dataQuality || 0, "--primary": "#10b981" }}>
                  <span className="score-value text-emerald-500">{pillarAverages?.dataQuality || 0}%</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground text-center">Data Quality</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts & Table Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Charts Column */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          {/* Recommendation Distribution */}
          <div className="dashboard-card p-4 h-[320px]">
            <div id="chart-recommendation" className="w-full h-full"></div>
          </div>

          {/* Intended Users */}
          <div className="dashboard-card p-4 h-[320px]">
            <div id="chart-users" className="w-full h-full"></div>
          </div>
        </div>

        {/* Main Table Column */}
        <div className="col-span-1 lg:col-span-8 dashboard-card flex flex-col overflow-hidden lg:h-[664px]">
          <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-white">
            <h3 className="font-bold text-lg text-primary">Complete Tool Information</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted transition-colors">
                <i className="fa-solid fa-filter mr-1"></i> Filter
              </button>
              <button className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted transition-colors">
                <i className="fa-solid fa-download mr-1"></i> Export
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full custom-table">
              <thead className="sticky top-0 bg-muted z-10 shadow-sm">
                <tr>
                  <th>Tool Name</th>
                  <th>Category</th>
                  <th>Overall</th>
                  <th>Recommendation</th>
                  <th>Allowed Usage</th>
                  <th>Grade Level</th>
                </tr>
              </thead>
              <tbody>
                {allTools.slice(0, 10).map((tool, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-semibold text-primary">{tool.tool_name}</div>
                      <div className="text-xs text-muted-foreground">{tool.developer}</div>
                    </td>
                    <td><span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">AI Tool</span></td>
                    <td><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">{tool.overall_score?.toFixed(0) || 0}</span></td>
                    <td><span className={`status-badge ${tool.recommendation?.toLowerCase().includes('approved') ? 'status-approved' : 'status-warning'}`}>{tool.recommendation}</span></td>
                    <td className="text-xs max-w-[200px] truncate" title={tool.allowed_usage}>{tool.allowed_usage || "Not specified"}</td>
                    <td className="text-xs">{tool.grade_level || "Not Specified"}</td>
                  </tr>
                ))}
                {allTools.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted-foreground py-8">No tools found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compliance Bar Chart Section */}
      <section className="dashboard-card p-6 h-[500px]">
        <div id="chart-compliance" className="w-full h-full"></div>
      </section>
    </div>
  );
}

// Made with Bob
