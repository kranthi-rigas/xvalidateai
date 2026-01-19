import { fetchDashboardAnalytics } from "@/apiIntegration/dashboards";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GaugeChart from "@/components/Charts/GaugeChart";
import Modal from "@/components/commonComponents/ModalPopUp";
import SingleScore from "@/components/commonComponents/SingleScore";
import BarChart from "@/components/Charts/BarChart.jsx";
import ListTable from "@/components/common/ListTable.jsx";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";

export default function AIDashboard() {
  const evaluationColumns = [
    { key: "project_name", label: "Tool", sortable: false },
    {
      key: "instructional_impact",
      label: "Instructional Impact",
      sortable: false,
    },
    {
      key: "usability_integration",
      label: "Usability & Integration",
      sortable: false,
    },
    { key: "privacy_safety", label: "Privacy & Safety", sortable: false },
    {
      key: "data_reporting_quality",
      label: "Data & Reporting",
      sortable: false,
    },
    { key: "overall_score", label: "Overall Score", sortable: false },
  ];

  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageLoading = usePageLoader([dashboardAnalytics]);
  const columns = React.useMemo(
    () => [
      {
        key: "project_name",
        label: "Tool",
        sortable: true,
        width: 180,
      },
      {
        key: "developer",
        label: "Developer",
        sortable: true,
        width: 220,
      },
      {
        key: "approval_status",
        label: "Status",
        sortable: true,
        width: 160,
      },
      {
        key: "high_risk_reason",
        label: "Reason",
        sortable: false,
        width: 180,
      },
      {
        key: "high_risk",
        label: "High Risk",
        sortable: true,
        width: 100,
      },
    ],
    [selectedPillar]
  );

  const renderCell = (row, key) => {
    switch (key) {
      case "project_name":
        return <span style={{ fontWeight: 500 }}>{row.project_name}</span>;

      case "developer":
        return row.developer || "—";

      case "approval_status":
        return row.approval_status.replace(/_/g, " ");

      case "high_risk":
        return <span style={{ color: "#dc2626", fontWeight: 600 }}>Yes</span>;

      case "high_risk_reason":
        return (
          <span style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>
            {row.high_risk_reason}
          </span>
        );

      default:
        return "—";
    }
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const allToolsList = React.useMemo(() => {
    return dashboardAnalytics?.high_risk_tools || [];
  }, [dashboardAnalytics]);

  const renderEvaluationCell = (row, key) => {
    switch (key) {
      case "project_name":
        return <strong>{row.project_name}</strong>;

      case "overall_score":
        return <strong>{row.overall_score?.toFixed(1)}</strong>;

      default:
        return row[key] ?? 0;
    }
  };

  useEffect(() => {
    fetchDashboardAnalytics()
      .then((response) => {
        setDashboardAnalytics(response);
      })
      .catch((err) => {
        console.error("Dashboard analytics error:", err);
        setDashboardAnalytics(null);
      });
  }, []);

  const getGaugeColor = (value) => {
    if (value >= 75) return "#22c55e";
    if (value >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const evaluationList = React.useMemo(() => {
    return dashboardAnalytics?.tool_metrics || [];
  }, [dashboardAnalytics]);

  const pillarAverages = React.useMemo(() => {
    console.log("Fetched dashboard analytics", dashboardAnalytics);
    if (!dashboardAnalytics?.tool_metrics?.length) return null;

    const tools = dashboardAnalytics.tool_metrics;
    const count = tools.length;

    const sum = (key) => tools.reduce((acc, t) => acc + (t[key] || 0), 0);

    return {
      privacy: Math.round(sum("privacy_safety") / count),
      instructional: Math.round(sum("instructional_impact") / count),
      usability: Math.round(sum("usability_integration") / count),
      dataQuality: Math.round(sum("data_reporting_quality") / count),
    };
  }, [dashboardAnalytics]);

  const filteredTools = React.useMemo(() => {
    if (!selectedPillar) return [];

    return dashboardAnalytics.tool_metrics.filter(
      (tool) => (tool[selectedPillar] ?? 0) > 0
    );
  }, [selectedPillar, dashboardAnalytics]);

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="dashboard__content">
      <div className="normal-container-styles">
        <div className="ai-cards-container">
          <SingleScore
            title="Average Score"
            value={dashboardAnalytics.overview.average_score ?? 0}
          />
          <SingleScore
            title="Completion Rate"
            value={dashboardAnalytics.overview.completion_rate ?? 0}
          />
          <SingleScore
            title="Total Projects"
            value={dashboardAnalytics.overview.total_projects ?? 0}
          />
          <SingleScore
            title="Compliance Rate"
            value={dashboardAnalytics.overview.compliance_rate ?? 0}
          />
        </div>

        <div className="row y-gap-10">
          <div className="col-md-3 col-sm-6">
            <GaugeChart
              value={pillarAverages?.privacy ?? 0}
              label="Privacy & Safety"
              color={getGaugeColor(pillarAverages?.privacy ?? 0)}
              onClick={() => {
                setSelectedPillar("privacy_safety");
                setIsModalOpen(true);
              }}
            />
          </div>

          <div className="col-md-3 col-sm-6">
            <GaugeChart
              value={pillarAverages?.usability ?? 0}
              label="Usability & Integration"
              color={getGaugeColor(pillarAverages?.usability ?? 0)}
              onClick={() => {
                setSelectedPillar("usability_integration");
                setIsModalOpen(true);
              }}
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <GaugeChart
              value={pillarAverages?.instructional ?? 0}
              label="Instructional Impact"
              color={getGaugeColor(pillarAverages?.instructional ?? 0)}
              onClick={() => {
                setSelectedPillar("instructional_impact");
                setIsModalOpen(true);
              }}
            />
          </div>

          <div className="col-md-3 col-sm-6">
            <GaugeChart
              value={pillarAverages?.dataQuality ?? 0}
              label="Data & Reporting Quality"
              color={getGaugeColor(pillarAverages?.dataQuality ?? 0)}
              onClick={() => {
                setSelectedPillar("data_reporting_quality");
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {isModalOpen && selectedPillar && (
        <Modal
          title={`Tools contributing to ${selectedPillar.replace("_", " ")}`}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPillar(null);
          }}
        >
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Score</th>
                <th>Approval Status</th>
                <th>High Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool) => (
                <tr key={tool.project_id}>
                  <td>{tool.project_name}</td>
                  <td>{tool[selectedPillar]}</td>
                  <td>{tool.approval_status}</td>
                  <td>
                    {tool.high_risk ? (
                      <span className="text-danger">Yes</span>
                    ) : (
                      <span className="text-success">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      <div className="d-flex normal-container-styles">
        <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
          <BarChart
            title="Scan Status"
            data={dashboardAnalytics.distributions.assessment}
          />
        </div>

        <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
          <BarChart
            title="Compliance Followed"
            data={dashboardAnalytics.distributions.compliance}
          />
        </div>

        <div className="col-lg-4 col-md-12 col-sm-12 mb-3">
          <BarChart
            title="Tool Status"
            data={dashboardAnalytics.distributions.status}
          />
        </div>
      </div>
      <div className="normal-container-styles">
        <h4 className="d-flex mb-20 justify-center">High Risk Tools</h4>
        <ListTable
          columns={columns}
          data={allToolsList}
          rowKey="project_id"
          renderCell={renderCell}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>
      <div className="normal-container-styles">
        <h4 className="d-flex mb-20 justify-center">
          Instructional Effectiveness and Data Quality
        </h4>
        <ListTable
          columns={evaluationColumns}
          data={evaluationList}
          rowKey="project_id"
          renderCell={renderEvaluationCell}
          sortConfig={null}
          onSort={null}
        />
      </div>
    </div>
  );
}
