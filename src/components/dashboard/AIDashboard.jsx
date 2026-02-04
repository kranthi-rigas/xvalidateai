import React, { useEffect, useState, useMemo } from "react";
import { fetchDashboardAnalytics } from "@/apiIntegration/dashboards";
import PageLoader from "@/components/common/PageLoader";
import { SingleScore } from "../commonComponents";
import GaugeChart from "@/components/Charts/GaugeChart";
import ListTable from "@/components/common/ListTable";

const HIGH_RISK_COLUMNS = [
  { key: "tool", label: "Tool" },
  { key: "vendor", label: "Vendor" },
  { key: "overall", label: "Overall" },
  { key: "privacy", label: "Privacy" },
  { key: "reason", label: "Risk Reasons" },
  { key: "action", label: "Action", truncate: false },
];

const TOOL_COLUMNS = [
  { key: "name", label: "Tool Name" },
  { key: "category", label: "Category" },
  { key: "overall", label: "Overall" },
  { key: "recommendation", label: "Recommendation", truncate: false },
  { key: "usage", label: "Allowed Usage" },
  { key: "grade", label: "Grade Level" },
];

const renderHighRiskCell = (tool, key) => {
  switch (key) {
    case "tool":
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center mr-3 font-bold text-xs">
            {tool.project_name?.substring(0, 2).toUpperCase() || "??"}
          </div>
          <div>
            <div className="font-semibold text-destructive">
              {tool.project_name}
            </div>
            <div className="text-xs text-muted-foreground">AI Tool</div>
          </div>
        </div>
      );

    case "vendor":
      return tool.developer || "Unknown";

    case "overall":
      return (
        <span className="font-bold text-destructive">
          {tool.overall_score?.toFixed(0) || 0}
        </span>
      );

    case "privacy":
      return (
        <span className="font-bold text-amber-600">
          {tool.privacy_safety || 0}
        </span>
      );

    case "reason":
      return (
        <span className="text-xs text-muted-foreground">
          {tool.high_risk_reason || "High risk detected"}
        </span>
      );

    case "action":
      return (
        <span className="status-badge status-danger">
          {tool.recommendation || "Block"}
        </span>
      );

    default:
      return "";
  }
};

const renderToolCell = (tool, key) => {
  switch (key) {
    case "name":
      return (
        <>
          <div className="font-semibold text-primary">{tool.tool_name}</div>
          <div className="text-xs text-muted-foreground">{tool.developer}</div>
        </>
      );

    case "category":
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
          AI Tool
        </span>
      );

    case "overall":
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
          {tool.overall_score?.toFixed(0) || 0}
        </span>
      );

    case "recommendation":
      return (
        <span
          className={`status-badge ${
            tool.recommendation?.toLowerCase().includes("approved")
              ? "status-approved"
              : "status-warning"
          }`}
        >
          {tool.recommendation}
        </span>
      );

    case "usage":
      return (
        <span
          className="text-xs max-w-[200px] truncate"
          title={tool.allowed_usage}
        >
          {tool.allowed_usage || "Not specified"}
        </span>
      );

    case "grade":
      return (
        <span className="text-xs">{tool.grade_level || "Not Specified"}</span>
      );

    default:
      return "";
  }
};

export default function AIDashboard() {
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const script = document.createElement("script");
        script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
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
    const recDistribution =
      dashboardAnalytics.distributions?.recommendation || [];
    const recColors = {
      Approved: "#10b981",
      "Approved with limitations": "#3b82f6",
      Restricted: "#f59e0b",
      "Do not use": "#ef4444",
      "Not Recommended": "#ef4444",
      Rejected: "#ef4444",
      "Not Assessed": "#95a5a6",
    };

    const recommendationPlotData = [
      {
        values: recDistribution.map((d) => d.value),
        labels: recDistribution.map((d) => d.name),
        type: "pie",
        hole: 0.6,
        marker: {
          colors: recDistribution.map((d) => recColors[d.name] || "#95a5a6"),
        },
        textinfo: "none",
      },
    ];

    const recommendationLayout = {
      title: {
        text: "Recommendation Distribution",
        font: { size: 16, family: "Inter", color: "#0F3053", weight: 700 },
        x: 0.05,
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    window.Plotly.newPlot(
      "chart-recommendation",
      recommendationPlotData,
      recommendationLayout,
      { displayModeBar: false, responsive: true },
    );

    // Chart: Intended Users
    const usersDistribution =
      dashboardAnalytics.distributions?.intended_users || [];
    const usersPlotData = [
      {
        values: usersDistribution.map((d) => d.value),
        labels: usersDistribution.map((d) => d.name),
        type: "pie",
        hole: 0.6,
        marker: {
          colors: [
            "#3b82f6",
            "#58BFCE",
            "#f59e0b",
            "#8b5cf6",
            "#10b981",
            "#ef4444",
          ],
        },
        textinfo: "none",
      },
    ];

    const usersLayout = {
      title: {
        text: "Intended Users Distribution",
        font: { size: 16, family: "Inter", color: "#0F3053", weight: 700 },
        x: 0.05,
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    window.Plotly.newPlot("chart-users", usersPlotData, usersLayout, {
      displayModeBar: false,
      responsive: true,
    });

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

    // Abbreviate labels for display, keep full names for hover
    const abbreviateLabel = (label) => {
      return label.length > 40 ? label.substring(0, 17) + "..." : label;
    };

    const compliancePlotData = [
      {
        type: "bar",
        x: standards.map(
          (s) =>
            grouped[s].full +
            grouped[s].partial +
            grouped[s].claimed +
            grouped[s].notVerified,
        ),
        y: standards.map((s) => abbreviateLabel(s)),
        customdata: standards.map((s) => s),
        orientation: "h",
        hovertemplate: "<b>%{customdata}</b><br>Count: %{x}<extra></extra>",
        marker: {
          color: standards.map((s) => {
            const total =
              grouped[s].full +
              grouped[s].partial +
              grouped[s].claimed +
              grouped[s].notVerified;
            const fullPercent = (grouped[s].full / total) * 100;
            return fullPercent >= 80
              ? "#10b981"
              : fullPercent >= 50
                ? "#3b82f6"
                : "#f59e0b";
          }),
        },
      },
    ];

    const complianceLayout = {
      title: {
        text: "Compliance Standard Distribution",
        font: { size: 18, family: "Inter", color: "#0F3053", weight: 700 },
      },
      xaxis: { title: "Number of Tools", gridcolor: "#f1f5f9" },
      yaxis: { autorange: "reversed" },
      margin: { t: 50, b: 40, l: 250, r: 20 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      height: 450,
    };

    window.Plotly.newPlot(
      "chart-compliance",
      compliancePlotData,
      complianceLayout,
      { displayModeBar: false, responsive: true },
    );
  };

  if (loading || !dashboardAnalytics) {
    return <PageLoader loading={true} />;
  }

  const overview = dashboardAnalytics.overview || {};
  const highRiskTools = dashboardAnalytics.high_risk_tools || [];
  const allTools = dashboardAnalytics.tool_kpis || [];

  return (
    <div className="space-y-8">
      {/* Stats Cards Row */}
      <section id="stats-section" className="grid grid-cols-4 gap-6">
        {/* Total Scanned Tools */}
        <SingleScore
          title="Total Scanned Tools"
          value={overview.total_projects || 0}
          icon="fa-solid fa-database"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          trendText="From last month"
          highlightValue="true"
        />
        {/* High Risk Tools */}
        <SingleScore
          title="High Risk Tools"
          value={overview.high_risk_count || 0}
          icon="fa-solid fa-triangle-exclamation"
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          trendText="Requires immediate attention"
          highlightValue="true"
        />
        {/* Approved Tools */}
        <SingleScore
          title="Approved Tools"
          value={overview.approved_count || 0}
          icon="fa-solid fa-check-circle"
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          trendText="Ready for enterprise usage"
          highlightValue="true"
        />
        {/* Rejected Tools */}
        <SingleScore
          title="Rejected Tools"
          value={overview.rejected_count || 0}
          icon="fa-regular fa-clock"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          trendText="Tools not recommended"
          highlightValue="true"
        />
      </section>

      {/* High Risk & Charts Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* High Risk Alert Box */}
        <div className="col-span-8 dashboard-card flex flex-col overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-amber-800">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              <h3 className="font-bold text-lg">
                High-Risk Tools Requiring Immediate Attention
              </h3>
            </div>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <ListTable
              data={highRiskTools.slice(0, 3)}
              columns={HIGH_RISK_COLUMNS}
              renderCell={renderHighRiskCell}
              tableClassName="custom-table"
              getRowClassName={(row, idx) => (idx === 0 ? "bg-red-50/30" : "")}
              hideEmptyMessage
            />
          </div>
        </div>

        {/* Score Gauges */}
        <div className="col-span-4 dashboard-card p-6 flex flex-col">
          <h3 className="font-bold text-foreground mb-6">
            Overall Compliance Health
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="grid grid-cols-2 w-full">
              <GaugeChart
                value={pillarAverages?.privacy ?? 0}
                label="Privacy & Safety"
              />
              <GaugeChart
                value={pillarAverages?.instructional ?? 0}
                label="Instructional Impact"
              />
              <GaugeChart
                value={pillarAverages?.usability ?? 0}
                label="Usability"
              />
              <GaugeChart
                value={pillarAverages?.dataQuality ?? 0}
                label="Data Quality"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Charts & Table Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Charts Column */}
        <div className="col-span-4 space-y-6">
          {/* Recommendation Distribution */}
          <div className="dashboard-card p-2">
            <div id="chart-recommendation" className="w-full h-full"></div>
          </div>

          {/* Intended Users */}
          <div className="dashboard-card p-2">
            <div id="chart-users" className="w-full h-full"></div>
          </div>
        </div>

        {/* Main Table Column */}
        <div className="col-span-8 dashboard-card flex flex-col overflow-hidden h-[664px]">
          <div className="px-6 py-5 border-b flex justify-between items-center bg-white">
            <h5>Complete Tool Information</h5>
          </div>
          <div className="flex-1 overflow-auto">
            <ListTable
              data={allTools.slice(0, 10)}
              columns={TOOL_COLUMNS}
              renderCell={renderToolCell}
              tableClassName="custom-table"
              hideEmptyMessage
            />
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
