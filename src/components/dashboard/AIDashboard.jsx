import React, { useEffect, useState, useMemo } from "react";
import { fetchDashboardAnalytics } from "@/apiIntegration/dashboards";
import PageLoader from "@/components/common/PageLoader";
import { SingleScore } from "../commonComponents";
import ListTable from "@/components/common/ListTable";
import ToolsCombinedChart from "@/components/common/ColumnandLineChart";
import { useNavigate } from "react-router-dom";
import { useContextElement } from "@/context/Context";
import ComplianceToolsModal from "@/components/common/ComplianceToolsModal";
import ToolUserHeatmap from "@/components/Charts/ToolUserHeatmap";

const HIGH_RISK_COLUMNS = [
  { key: "tool", label: "Tool Name", resizable: true },
  { key: "url", label: "URL", resizable: true },
  { key: "score", label: "Score", resizable: true },
  { key: "reason", label: "Risk Reasons", resizable: true },
];

const TOOL_COLUMNS = [
  { key: "name", label: "Tool Name", resizable: true },
  { key: "url", label: "URL", resizable: true },
  { key: "overall", label: "Score", resizable: true },
  {
    key: "recommendation",
    label: "Recommendation",
    truncate: false,
    resizable: true,
  },
  { key: "usage", label: "Allowed Usage", resizable: true },
  { key: "restricted_usage", label: "Restricted Usage", resizable: true },
  { key: "intended_users", label: "Intended Users", resizable: true },
];

const renderHighRiskCell = (navigate) => (tool, key) => {
  switch (key) {
    case "tool":
      return (
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/dashboard/aicompliance/${tool.project_id}`)}
        >
          <div className="font-semibold text-primary hover:underline">
            {tool.tool_name}
          </div>
          <div className="text-xs text-muted-foreground">{tool.developer}</div>
        </div>
      );

    case "vendor":
      return tool.developer || "Unknown";

    case "url":
      return tool.url ? (
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {tool.url}
        </a>
      ) : (
        "N/A"
      );

    case "score":
      return (
        <span className="font-bold text-destructive">
          {tool.overall_score?.toFixed(0) || 0}
        </span>
      );

    case "reason":
      return (
        <span className="text-xs text-muted-foreground">
          {tool.high_risk_reason || "High risk detected"}
        </span>
      );

    default:
      return "";
  }
};

const renderToolCell = (navigate) => (tool, key) => {
  switch (key) {
    case "name":
      return (
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/dashboard/aicompliance/${tool.project_id}`)}
        >
          <div className="font-semibold text-primary hover:underline">
            {tool.tool_name}
          </div>
          <div className="text-xs text-muted-foreground">{tool.developer}</div>
        </div>
      );

    case "restricted_usage":
      return (
        <span className="text-xs max-w-[200px]">
          {tool.restricted_usage || "Not specified"}
        </span>
      );

    case "overall":
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
          {tool.overall_score || 0}
        </span>
      );

    case "url":
      return tool.url ? (
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {tool.url}
        </a>
      ) : (
        "N/A"
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
        <span className="text-xs max-w-[200px]">
          {tool.allowed_usage || "Not specified"}
        </span>
      );

    case "intended_users":
      return (
        <span className="text-xs">
          {tool.intended_users || "Not Specified"}
        </span>
      );

    default:
      return "";
  }
};

export default function AIDashboard() {
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRadarToolIds, setSelectedRadarToolIds] = useState([]);
  const navigate = useNavigate();

  const { userPlan } = useContextElement();
  const isFreePlan = userPlan === "free";

  const extractAndNormalizeAudienceItems = (text = "") => {
    if (!text) return [];

    const stopWords = ["seeking", "who", "for", "with", "aged"];

    return text
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/age\s*\d+/g, "")
      .replace(/ and /g, ",")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const words = item.split(" ");

        // remove descriptive tail after stop words
        const stopIndex = words.findIndex((w) => stopWords.includes(w));
        const cleaned =
          stopIndex > -1 ? words.slice(0, stopIndex).join(" ") : item;

        // basic plural normalization (students → student)
        return cleaned.endsWith("s") ? cleaned.slice(0, -1) : cleaned;
      })
      .filter(Boolean);
  };

  const normalizedAudienceCounts = useMemo(() => {
    if (!dashboardAnalytics?.tool_kpis) return {};

    const counts = {};

    dashboardAnalytics.tool_kpis.forEach((tool) => {
      const items = extractAndNormalizeAudienceItems(tool.intended_users);

      items.forEach((item) => {
        counts[item] = (counts[item] || 0) + 1;
      });
    });

    return counts;
  }, [dashboardAnalytics]);

  const normalizeCompliance = (name = "") => {
    return name
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .trim();
  };

  const normalizedComplianceCounts = React.useMemo(() => {
    if (!dashboardAnalytics?.distributions?.compliance) return {};

    const counts = {};

    dashboardAnalytics.distributions.compliance.forEach(({ name, value }) => {
      const normalized = normalizeCompliance(name);
      counts[normalized] = (counts[normalized] || 0) + value;
    });

    return counts;
  }, [dashboardAnalytics]);

  useEffect(() => {
    fetchDashboardAnalytics()
      .then((data) => {
        if (!data) {
          setLoading(false);
          return;
        }

        // Keep only scan completed tools
        const scanCompletedTools = (data.tool_kpis || []).filter(
          (tool) =>
            tool.status === "scan_completed" ||
            tool.status === "approved_for_usage" ||
            tool.status === "rejected_for_usage",
        );

        const highRiskTools = scanCompletedTools.filter(
          (tool) => tool.high_risk,
        );

        const approvedTools = scanCompletedTools.filter((tool) =>
          tool.recommendation?.toLowerCase().includes("approved"),
        );

        const rejectedTools = scanCompletedTools.filter(
          (tool) => tool.status === "rejected_for_usage",
        );

        setDashboardAnalytics({
          ...data,
          tool_kpis: scanCompletedTools,
          high_risk_tools: highRiskTools,
          overview: {
            ...data.overview,
            total_projects: scanCompletedTools.length,
            high_risk_count: highRiskTools.length,
            approved_count: data.overview?.approved_count || 0,
            rejected_count: rejectedTools.length,
          },
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest("[data-dropdown-container]")) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (
      dashboardAnalytics?.tool_kpis?.length &&
      selectedRadarToolIds.length === 0
    ) {
      setSelectedRadarToolIds(
        dashboardAnalytics.tool_kpis.slice(0, 5).map((t) => t.project_id),
      );
    }
  }, [dashboardAnalytics, selectedRadarToolIds.length]);

  const initializeCharts = React.useCallback(() => {
    if (!dashboardAnalytics) return;

    // Chart: Recommendation Distribution
    const recDistribution =
      dashboardAnalytics.distributions?.recommendation || [];
    const recColors = {
      Approved: "#10b981",
      "Approved with limitations": "#fce99a",
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
        hole: 0.55,
        marker: {
          colors: recDistribution.map((d) => recColors[d.name] || "#95a5a6"),
        },
        textinfo: "none",
        domain: { x: [0.15, 0.85], y: [0.15, 0.85] }, // makes donut bigger
      },
    ];

    const recommendationLayout = {
      title: {
        text: "Recommendation Distribution",
        font: { size: 20, family: "Inter", color: "#0F3053" },
      },
      showlegend: true,
      legend: {
        orientation: "h",
        x: 0.5, // center horizontally
        xanchor: "center",
        y: -0.15, // position below chart
      },
      margin: { t: 80, b: 80, l: 40, r: 40 },
      height: 450,
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    window.Plotly.newPlot(
      "chart-recommendation",
      recommendationPlotData,
      recommendationLayout,
      { displayModeBar: false, responsive: true },
    );
  }, [dashboardAnalytics]);

  useEffect(() => {
    if (selectedRadarToolIds.length === 5) {
      setDropdownOpen(false);
    }
  }, [selectedRadarToolIds]);

  useEffect(() => {
    if (!dashboardAnalytics || !window.Plotly) return;

    const handleResize = () => {
      initializeCharts();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dashboardAnalytics, initializeCharts]);
  const visibleRadarTools = React.useMemo(() => {
    if (!dashboardAnalytics?.tool_kpis) return [];

    return dashboardAnalytics.tool_kpis.filter((tool) =>
      selectedRadarToolIds.includes(tool.project_id),
    );
  }, [dashboardAnalytics, selectedRadarToolIds]);

  if (loading || !dashboardAnalytics) {
    return <PageLoader loading={true} />;
  }

  const overview = dashboardAnalytics.overview || {};
  const highRiskTools = dashboardAnalytics.high_risk_tools || [];
  const allTools = dashboardAnalytics.tool_kpis || [];

  const toggleRadarTool = (toolId) => {
    setSelectedRadarToolIds((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      }
      if (prev.length < 5) {
        return [...prev, toolId];
      }
      return prev;
    });
  };
  const removeRadarTool = (toolId) => {
    setSelectedRadarToolIds((prev) => prev.filter((id) => id !== toolId));
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards Row */}
      <section
        id="stats-section"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        {/* Total Scanned Tools */}
        <SingleScore
          title="Total Scanned Tools"
          value={overview.total_projects || 0}
          icon="fa-solid fa-database"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          highlightValue="true"
        />
        {/* High Risk Tools */}
        <SingleScore
          title="High Risk Tools"
          value={overview.high_risk_count || 0}
          icon="fa-solid fa-triangle-exclamation"
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          highlightValue="true"
        />
        {/* Approved Tools */}
        <SingleScore
          title="Approved Tools"
          value={overview.approved_count || 0}
          icon="fa-solid fa-check-circle"
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          highlightValue="true"
        />
        {/* Rejected Tools */}
        <SingleScore
          title="Rejected Tools"
          value={overview.rejected_count || 0}
          icon="fa-solid fa-times-circle"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          highlightValue="true"
        />
      </section>

      <div className="grid grid-cols-1 gap-6">
        <div className="dashboard-card p-6">
          <ToolsCombinedChart tools={dashboardAnalytics?.tool_kpis || []} />
        </div>

        {/*<div className="dashboard-card p-6">
          <ToolsHeatmap tools={dashboardAnalytics?.tool_kpis || []} />
        </div>*/}
      </div>

      {/* Recommendation & Intended Users Row */}
      <section className="grid grid-cols-1 gap-6">
        {/* Recommendation Distribution */}
        <div className="dashboard-card p-6 min-h-[220px] flex flex-col">
          <div id="chart-recommendation" className="w-full flex-1"></div>
        </div>

        {/* Intended Users Heatmap */}
        <div className="dashboard-card p-6 min-h-[220px] flex flex-col">
          <h3 className="font-bold text-center text-lg mb-4">
            Intended Users Distribution
          </h3>

          <div className="flex-1">
            <ToolUserHeatmap apiData={dashboardAnalytics} />
          </div>
        </div>
      </section>

      {/* High Risk Alert Box */}
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 dashboard-card flex flex-col overflow-hidden h-[664px]">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-center">
            <div className="flex items-center text-amber-800">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              <h3 className="font-bold text-lg">
                High-Risk Tools Requiring Immediate Attention
              </h3>
            </div>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <ListTable
              data={highRiskTools}
              columns={HIGH_RISK_COLUMNS}
              renderCell={renderHighRiskCell(navigate)}
              enableExport={true}
              isDisableExport={isFreePlan}
              exportFileName="high-risk-tools-info"
            />
          </div>
        </div>
      </section>

      {/* Complete Tool Information Table */}
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 dashboard-card flex flex-col overflow-hidden h-[664px]">
          <div className="px-6 py-5 border-b flex justify-center items-center bg-white">
            <h3 className="font-bold text-lg">Complete Tool Information</h3>
          </div>
          <div className="flex-1 overflow-x-auto relative">
            <ListTable
              data={allTools}
              columns={TOOL_COLUMNS}
              renderCell={renderToolCell(navigate)}
              tableClassName="custom-table"
              enableExport={true}
              isDisableExport={isFreePlan}
              exportFileName="complete-tool-info"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
