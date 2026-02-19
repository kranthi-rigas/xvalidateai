import React, { useEffect, useState } from "react";
import { fetchDashboardAnalytics } from "@/apiIntegration/dashboards";
import PageLoader from "@/components/common/PageLoader";
import { SingleScore } from "../commonComponents";
import ListTable from "@/components/common/ListTable";
import ToolsHeatmap from "@/components/common/HeatMap";
import ToolsCombinedChart from "@/components/common/ColumnandLineChart";
import RadarQualityChart from "@/components/Charts/RadarQualityChart";
import { useNavigate } from "react-router-dom";
import { useContextElement } from "@/context/Context";

const HIGH_RISK_COLUMNS = [
  { key: "tool", label: "Tool", resizable: true },
  { key: "vendor", label: "Vendor", resizable: true },
  { key: "overall", label: "Overall", resizable: true },
  { key: "privacy", label: "Privacy", resizable: true },
  { key: "reason", label: "Risk Reasons", resizable: true },
  { key: "action", label: "Action", truncate: false, resizable: true },
];

const TOOL_COLUMNS = [
  { key: "name", label: "Tool Name", resizable: true },
  { key: "overall", label: "Overall", resizable: true },
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
          className="flex items-center cursor-pointer"
          onClick={() => navigate(`/dashboard/aicompliance/${tool.project_id}`)}
        >
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center mr-3 font-bold text-xs">
            {tool.project_name?.substring(0, 2).toUpperCase() || "??"}
          </div>

          <div>
            <div className="font-semibold text-destructive hover:underline">
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

  const NORMALIZATION_RULES = {
    Students: ["student", "k-12", "school", "learner"],
    Educators: [
      "teacher",
      "educator",
      "faculty",
      "professor",
      "instructor",
      "educational institution",
    ],
    Parents: ["parent", "guardian"],
    "General Public": [
      "general public",
      "public",
      "content creator",
      "advertiser",
    ],
    "Enterprise / Business": [
      "enterprise",
      "business",
      "organization",
      "company",
    ],
    "Developers / IT": [
      "developer",
      "data scientist",
      "it",
      "engineer",
      "administrator",
    ],
    Government: ["government", "agency", "public sector"],
    Researchers: ["researcher", "research"],
  };

  const normalizeAudience = (text = "") => {
    const lower = text.toLowerCase();
    const matched = new Set();

    Object.entries(NORMALIZATION_RULES).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        if (lower.includes(keyword)) {
          matched.add(category);
        }
      });
    });

    if (matched.size === 0) {
      matched.add("Others");
    }

    return Array.from(matched);
  };

  const normalizedAudienceCounts = React.useMemo(() => {
    if (!dashboardAnalytics?.tool_kpis) return {};

    const counts = {};

    dashboardAnalytics.tool_kpis.forEach((tool) => {
      const categories = normalizeAudience(tool.intended_users);

      categories.forEach((category) => {
        counts[category] = (counts[category] || 0) + 1;
      });
    });

    return counts;
  }, [dashboardAnalytics]);
  const COMPLIANCE_RULES = {
    GDPR: ["gdpr"],
    "CCPA / CPRA": ["ccpa", "cpra", "california consumer privacy act"],
    COPPA: ["coppa", "children's online privacy protection act"],
    "SOC 2": ["soc 2"],
    "SOC 3": ["soc 3"],
    "ISO 27001": ["iso 27001", "iso/iec 27001"],
    "ISO 27017": ["iso/iec 27017"],
    "ISO 27018": ["iso/iec 27018"],
    "Digital Services Act": ["digital services act", "dsa"],
    "Privacy Shield": ["privacy shield"],
    "Standard Contractual Clauses": ["standard contractual clauses", "scc"],
    "PCI DSS": ["pci dss"],
    FERPA: ["ferpa"],
    HIPAA: ["hipaa"],
    FedRAMP: ["fedramp"],
    "ePrivacy Directive": ["eprivacy directive"],
    "WCAG 2.1": ["wcag 2.1"],
    "Section 508": ["section 508"],
    "Data Protection Act (UK)": ["data protection act"],
    "EU-US Data Privacy Framework": ["data privacy framework"],
    "NIST Cybersecurity Framework": ["nist"],
  };

  const normalizeCompliance = (name = "") => {
    const lower = name.toLowerCase();

    for (const [standard, keywords] of Object.entries(COMPLIANCE_RULES)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return standard;
      }
    }

    return "Other / Misc";
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

        // ✅ Filter only scan_completed tools
        const filteredToolKpis = (data.tool_kpis || []).filter(
          (tool) => tool.recommendation != "Not Assessed",
        );

        setDashboardAnalytics({
          ...data,
          tool_kpis: filteredToolKpis,
        });

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
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.2 },
      margin: { t: 40, b: 20, l: 20, r: 20 },
      height: 300,
      paper_bgcolor: "rgba(0,0,0,0)",
      responsive: true,
    };

    window.Plotly.newPlot(
      "chart-recommendation",
      recommendationPlotData,
      recommendationLayout,
      { displayModeBar: false, responsive: true },
    );

    // Force resize to ensure full space is used
    setTimeout(() => {
      window.Plotly.Plots.resize("chart-recommendation");
    }, 100);

    // Chart: Intended Users
    const usersDistribution = Object.entries(normalizedAudienceCounts).map(
      ([name, value]) => ({ name, value }),
    );

    // Sanitize legend labels for display using regex but keep original names
    // available in hover via `customdata`.
    const sanitizeLegendLabel = (name) => {
      if (!name) return "Unknown";
      // Remove parenthetical content and anything after a dash, trim whitespace
      return name.trim();
    };

    const usersPlotData = [
      {
        values: usersDistribution.map((d) => d.value),
        labels: usersDistribution.map((d) => sanitizeLegendLabel(d.name)),
        customdata: usersDistribution.map((d) => d.name),
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
        hovertemplate:
          "<b>%{customdata}</b><br>Tools count: %{value}<extra></extra>",
      },
    ];

    const usersLayout = {
      title: {
        text: "Intended Users Distribution",
        font: { size: 16, family: "Inter", color: "#0F3053", weight: 700 },
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

    // Force resize to ensure full space is used
    setTimeout(() => {
      window.Plotly.Plots.resize("chart-users");
    }, 100);

    // Chart: Compliance Distribution (Horizontal Bar)
    const complianceRaw = dashboardAnalytics.distributions?.compliance || [];

    const sortedCompliance = Object.entries(normalizedComplianceCounts).sort(
      (a, b) => b[1] - a[1],
    );

    const compliancePlotData = [
      {
        type: "bar",
        x: sortedCompliance.map(([, value]) => value),
        y: sortedCompliance.map(([name]) => name),
        orientation: "h",
        hovertemplate: "<b>%{y}</b><br>Tools count: %{x}<extra></extra>",
        marker: {
          color: "#3b82f6",
        },
      },
    ];

    const complianceLayout = {
      title: {
        text: "Compliance Standard Distribution",
        font: {
          size: 18,
          family: "Inter",
          color: "#0F3053",
        },
      },
      xaxis: {
        title: "Number of Tools",
        gridcolor: "#f1f5f9",
      },
      yaxis: {
        autorange: "reversed",
      },
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

    // Force resize to ensure full space is used
    setTimeout(() => {
      window.Plotly.Plots.resize("chart-compliance");
    }, 100);
  }, [dashboardAnalytics]);

  useEffect(() => {
    if (selectedRadarToolIds.length === 5) {
      setDropdownOpen(false);
    }
  }, [selectedRadarToolIds]);
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
      <section id="stats-section" className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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

      <section>
        {/* Radar Chart */}
        <div className="dashboard-card p-4 mb-4 h-[420px] flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 mb-2">
            <h3 className="font-bold text-lg shrink-0">Quality Comparison</h3>
            <div className="flex items-center gap-2 w-full md:max-w-[600px]">
              <label className="text-sm font-medium whitespace-nowrap">
                Select Tools (Max 5):
              </label>
              <div className="relative flex-1" data-dropdown-container>
                {/* Multi-Select Input with Pills */}
                <div
                  className="w-full border border-gray-300 rounded px-3 py-2 cursor-pointer bg-white flex items-center flex-wrap gap-2 min-h-[38px]"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedRadarToolIds.length === 0 ? (
                    <span className="text-gray-400 text-sm">
                      Select tools...
                    </span>
                  ) : (
                    selectedRadarToolIds.map((toolId) => {
                      const tool = allTools.find(
                        (t) => t.project_id === toolId,
                      );

                      return (
                        <div
                          key={toolId}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                        >
                          <span>{tool?.tool_name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRadarTool(toolId);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown List with Checkboxes */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 bg-white rounded shadow-lg z-10 max-h-64 overflow-y-auto">
                    {allTools.map((tool) => {
                      const isSelected = selectedRadarToolIds.includes(
                        tool.project_id,
                      );
                      const isDisabled =
                        selectedRadarToolIds.length >= 5 && !isSelected;

                      return (
                        <label
                          key={tool.project_id}
                          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                            isDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleRadarTool(tool.project_id)}
                            className="mr-3"
                          />
                          <span className="text-sm">{tool.tool_name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <RadarQualityChart
              key={selectedRadarToolIds.join(",")}
              tools={visibleRadarTools}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <div className="dashboard-card p-6">
          <ToolsCombinedChart tools={dashboardAnalytics?.tool_kpis || []} />
        </div>

        <div className="dashboard-card p-6">
          <ToolsHeatmap tools={dashboardAnalytics?.tool_kpis || []} />
        </div>
      </div>

      {/* Recommendation & Intended Users Row */}
      <section className="grid grid-cols-8 gap-6">
        {/* Recommendation Distribution */}
        <div className="col-span-4 dashboard-card p-2 h-[450px]">
          <div id="chart-recommendation" className="w-full h-full"></div>
        </div>

        {/* Intended Users */}
        <div className="col-span-4 dashboard-card p-2 h-[450px]">
          <div id="chart-users" className="w-full h-full"></div>
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
              hideEmptyMessage
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
              hideEmptyMessage
              enableExport={true}
              isDisableExport={isFreePlan}
              exportFileName="complete-tool-info"
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
