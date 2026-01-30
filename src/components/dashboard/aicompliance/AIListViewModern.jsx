import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";

export default function AIListViewModern({
  projects,
  setShowCreateModal,
  setOpenedProject,
  refreshProjects,
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  const pageLoading = usePageLoader([projects]);

  useEffect(() => {
    setLiveProjects(projects || []);
  }, [projects]);

  // Filter projects based on search
  const filtered = (liveProjects || []).filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusMap = {
      completed: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Scan Completed",
      },
      approved_for_usage: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        label: "Approved For Usage",
      },
      rejected_for_usage: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        label: "Rejected For Usage",
      },
      scan_in_progress: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Scan In Progress",
      },
      requested: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        label: "Requested",
      },
    };

    const config = statusMap[status] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      label: formatStatus(status),
    };

    return config;
  };

  // Get recommendation badge styling
  const getRecommendationBadge = (recommendation) => {
    const recMap = {
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        label: "Fully Approved",
      },
      "approved with limitations": {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Approved with limitations",
      },
      "not recommended": {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        label: "Not Recommended",
      },
    };

    const rec = (recommendation || "").toLowerCase();
    const config = recMap[rec] || {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
      label: "Pending Review",
    };

    return config;
  };

  // Get score icon and color
  const getScoreDisplay = (score, assessmentStatus) => {
    if (assessmentStatus === "in_progress" || assessmentStatus === "queued") {
      return {
        icon: "fa-spinner fa-spin",
        color: "text-muted-foreground",
        value: "--",
      };
    }

    const s = Number(score) || 0;
    if (s >= 80) {
      return { icon: "fa-circle-check", color: "text-emerald-600", value: s };
    }
    if (s >= 60) {
      return { icon: "fa-circle-check", color: "text-emerald-600", value: s };
    }
    if (s >= 40) {
      return {
        icon: "fa-triangle-exclamation",
        color: "text-amber-500",
        value: s,
      };
    }
    return { icon: "fa-circle-xmark", color: "text-red-600", value: s };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Toggle selection
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    setSelected(checked ? filtered.map((x) => x.project_id) : []);
  };

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="space-y-8">
      {/* Main Table Card */}
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-muted-foreground"></i>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Find tool by name, ID or requester..."
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={refreshProjects}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors"
              title="Refresh Data"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            <div className="relative group">
              <button className="flex items-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-background transition-all shadow-sm">
                Actions
                <i className="fa-solid fa-caret-down ml-2 text-xs"></i>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all transform hover:scale-[1.02]"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Tool Assessment
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="p-4 pl-6 w-12 border-b border-border">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 && selected.length === filtered.length
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group">
                  Tool Name
                  <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100"></i>
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group">
                  Tool Status
                  <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100"></i>
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group">
                  Scan Status
                  <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100"></i>
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group">
                  Score
                  <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100"></i>
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group">
                  Recommendation
                  <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100"></i>
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-64">
                  Description
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group">
                  Last Scan
                  <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100"></i>
                </th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Requested By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="p-8 text-center text-muted-foreground"
                  >
                    No tools found
                  </td>
                </tr>
              ) : (
                filtered.map((project) => {
                  const statusBadge = getStatusBadge(project.status);
                  const recBadge = getRecommendationBadge(
                    project.recommendation
                  );
                  const scoreDisplay = getScoreDisplay(
                    project.score,
                    project.assessment_status
                  );
                  const isHighRisk =
                    project.recommendation?.toLowerCase() === "not recommended";

                  return (
                    <tr
                      key={project.project_id}
                      className={`hover:bg-muted/20 transition-colors group ${
                        isHighRisk ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="p-4 pl-6">
                        <input
                          type="checkbox"
                          checked={selected.includes(project.project_id)}
                          onChange={() => toggleSelect(project.project_id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td
                        className="p-4 font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => setOpenedProject(project)}
                      >
                        {project.name || "Unnamed Tool"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatStatus(project.assessment_status) || "Pending"}
                      </td>
                      <td className="p-4">
                        <div
                          className={`flex items-center ${scoreDisplay.color} font-semibold`}
                        >
                          <i
                            className={`fa-regular ${scoreDisplay.icon} mr-2`}
                          ></i>{" "}
                          {scoreDisplay.value}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${recBadge.bg} ${recBadge.text} border ${recBadge.border}`}
                        >
                          {recBadge.label}
                        </span>
                      </td>
                      <td
                        className="p-4 text-muted-foreground truncate max-w-xs"
                        title={project.description || project.name}
                      >
                        {project.description || project.name || "--"}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">
                        {formatDate(project.last_scanned_time)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-xs">
                            {project.requested_by_name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {project.requested_by_email || ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-border bg-white rounded-b-2xl flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              1-{Math.min(filtered.length, 50)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            items
          </div>
          <div className="flex items-center space-x-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary text-primary font-medium text-sm border border-secondary">
              1
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium text-sm">
              2
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium text-sm">
              3
            </button>
            <span className="text-muted-foreground px-1">...</span>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Made with Bob
