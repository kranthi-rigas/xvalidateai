import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { COLORS } from "@/styles/colors";
import AwsButton from "../../common/AwsButton";
import { updateComplianceProject } from "../../../apiIntegration/compliance";
import ApproveRejectModal from "./ApproveRejectModal";
import CreditInfoNote from "./CreditInfoNote";

function formatStatus(value) {
  if (!value || typeof value !== "string") return "-";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatUser(user) {
  if (!user) return "-";
  if (typeof user === "string") return user;
  return (
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.email ||
    "-"
  );
}

const formatToLocalDateTime = (utcString) => {
  if (!utcString) return "-";

  const date = new Date(utcString);

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function ProjectDetailsModern({ project, onBack }) {
  const showScoreStatuses = [
    "scan_completed",
    "approved_for_usage",
    "rejected_for_usage",
  ];

  const hasValidScore =
    showScoreStatuses.includes(project.status) &&
    project.assessment_status === "completed" &&
    project.score !== null &&
    project.score !== undefined;

  const score = hasValidScore
    ? Math.max(0, Math.min(100, Number(project.score)))
    : 0;

  // ✅ NEW (modal state only)
  const isRequested = project.status === "requested";
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // approve | reject

  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];
  const isAdmin = roles.includes("ADMIN");

  const dateString = formatToLocalDateTime(
    project.created_at || project.last_scanned_time,
  );

  const handleApproveReject = async (comment) => {
    let payload = {};

    switch (actionType) {
      case "scan_approve":
        payload = { action: "scan_approve", status: "approved_for_scan" };
        break;
      case "scan_reject":
        payload = { action: "scan_reject", status: "rejected_for_scan" };
        break;
      case "approve":
        payload = { action: "approve", status: "approved_for_usage" };
        break;
      case "reject":
        payload = { action: "reject", status: "rejected_for_usage" };
        break;
      default:
        return;
    }

    await updateComplianceProject(project.project_id, {
      ...payload,
      comment,
    });

    setShowModal(false);
    onBack?.(true);
  };
  const showScanActions =
    project.status === "requested" || project.status === "requested_for_scan";

  const showUsageActions =
    project.status === "scan_completed" &&
    project.assessment_status === "completed";

  const showAdminActions = showScanActions || showUsageActions;

  // Get recommendation badge
  const getRecommendationBadge = () => {
    const allowedStatuses = [
      "scan_completed",
      "approved_for_usage",
      "rejected_for_usage",
    ];

    if (
      !allowedStatuses.includes(project.status) ||
      project.assessment_status !== "completed" ||
      !project.recommendation
    ) {
      return null;
    }
    const rec = project.recommendation.toLowerCase();

    if (rec.includes("approved") && !rec.includes("limitation")) {
      return {
        icon: "fa-check-circle",
        text: "Approved",
        class: "badge-success",
      };
    } else if (rec.includes("limitation")) {
      return {
        icon: "fa-circle-exclamation",
        text: "Approved with Limitations",
        class: "badge-warning",
      };
    } else if (rec.includes("restricted")) {
      return {
        icon: "fa-triangle-exclamation",
        text: "Restricted",
        class: "badge-warning",
      };
    } else {
      return {
        icon: "fa-circle-xmark",
        text: "Not Recommended",
        class: "badge-error",
      };
    }
  };
  const badge = getRecommendationBadge();

  // Calculate category scores from evaluation
  const getCategoryScores = () => {
    const evaluation = project.assessment?.evaluation || [];
    const categories = {
      governance: { total: 0, count: 0 },
      instructional: { total: 0, count: 0 },
      usability: { total: 0, count: 0 },
      data: { total: 0, count: 0 },
    };

    evaluation.forEach((section) => {
      const sectionName = section.section_name?.toLowerCase() || "";
      section.criteria?.forEach((criterion) => {
        const score = parseFloat(criterion.score) || 0;
        if (
          sectionName.includes("governance") ||
          sectionName.includes("compliance")
        ) {
          categories.governance.total += score;
          categories.governance.count++;
        } else if (
          sectionName.includes("instructional") ||
          sectionName.includes("learning")
        ) {
          categories.instructional.total += score;
          categories.instructional.count++;
        } else if (
          sectionName.includes("usability") ||
          sectionName.includes("integration")
        ) {
          categories.usability.total += score;
          categories.usability.count++;
        } else if (
          sectionName.includes("data") ||
          sectionName.includes("reporting")
        ) {
          categories.data.total += score;
          categories.data.count++;
        }
      });
    });

    return {
      governance:
        categories.governance.count > 0
          ? (categories.governance.total / categories.governance.count).toFixed(
              1,
            )
          : 0,
      instructional:
        categories.instructional.count > 0
          ? (
              categories.instructional.total / categories.instructional.count
            ).toFixed(1)
          : 0,
      usability:
        categories.usability.count > 0
          ? (categories.usability.total / categories.usability.count).toFixed(1)
          : 0,
      data:
        categories.data.count > 0
          ? (categories.data.total / categories.data.count).toFixed(1)
          : 0,
    };
  };

  const categoryScores = getCategoryScores();

  return (
    <div className="space-y">
      {/* Top Actions */}
      <div className="glass-card report-footer">
        <div className="top-actions">
          <button
            onClick={() => onBack?.(false)}
            className="back-button glass-card"
          >
            <i className="fa-solid fa-arrow-left"></i> Back to AI Compliance
          </button>
          <div className="action-buttons">
            <button className="action-btn export-button">
              <i className="fa-solid fa-file-pdf"></i> Export PDF
            </button>

            <button className="action-btn share-button glass-card">
              <i className="fa-solid fa-share-nodes"></i> Share
            </button>
          </div>
        </div>
      </div>

      {/* Report Header Card */}
      <div className="glass-card report-header animate-fade-in">
        <div className="header-top">
          <div>
            <h1 className="gradient-text">AI Tool Assessment Report</h1>
            <p className="subtitle">
              Comprehensive compliance and quality evaluation
            </p>
          </div>
          <div className="header-badges">
            {badge && (
              <div className={`badge ${badge.class}`}>
                <i className={`fa-solid ${badge.icon}`}></i> {badge.text}
              </div>
            )}
            <p className="date-text">Generated: {dateString}</p>
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="header-content">
          {/* Left: Tool Information */}
          <div className="tool-info">
            <div className="tool-header">
              <div className="tool-icon">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div>
                <h3 className="tool-name">{project.name}</h3>
                <p className="tool-vendor">
                  by {project.developer || "Unknown"}
                </p>
              </div>
            </div>

            <div className="tool-details">
              <div className="detail-row">
                <span className="detail-label">Intended Users:</span>
                <span className="detail-value">
                  {project.intended_users || "-"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Grade Level:</span>
                <span className="detail-value">
                  {project.grade_level || "-"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assessment Date:</span>
                <span className="detail-value">
                  {formatToLocalDateTime(project.last_scanned_time)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-pill ${project.status}`}>
                    {formatStatus(project.status) || "-"}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Requested By:</span>
                <span className="detail-value secondary">
                  {formatUser(project.requested_by)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Approved By:</span>
                <span className="detail-value secondary">
                  {project.approved_by ? formatUser(project.approved_by) : "-"}
                </span>
              </div>
              {project.url && (
                <div className="detail-row">
                  <span className="detail-label">Tool Website:</span>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    {project.url}
                  </a>
                </div>
              )}
              {project.justification && (
                <div className="detail-row">
                  <span className="detail-label">Justification:</span>
                  <span className="detail-value">{project.justification}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Overall Score */}
          {hasValidScore && (
            <div className="score-container glass-card">
              <p className="score-label">Overall Compliance Score</p>
              <Plot
                data={[
                  {
                    type: "indicator",
                    mode: "gauge+number",
                    value: score,
                    number: {
                      suffix: "%",
                      font: { size: 42, color: COLORS.primary, weight: 800 },
                    },
                    gauge: {
                      axis: {
                        range: [null, 100],
                        tickwidth: 0,
                        showticklabels: false,
                      },
                      bar: { color: COLORS.primary, thickness: 0.12 },
                      bgcolor: "white",
                      borderwidth: 0,
                      steps: [
                        { range: [0, 40], color: "#FCA5A5" },
                        { range: [40, 70], color: "#FCD34D" },
                        { range: [70, 100], color: "#86EFAC" },
                      ],
                    },
                  },
                ]}
                layout={{
                  width: 220,
                  height: 140,
                  margin: { t: 10, b: 0, l: 20, r: 20 },
                  paper_bgcolor: "transparent",
                  plot_bgcolor: "transparent",
                }}
                config={{ responsive: true, displayModeBar: false }}
              />
              <div className={`recommendation-badge ${badge.class}`}>
                <i className={`fa-solid ${badge.icon}`}></i>
                <span>{badge.text}</span>
              </div>
            </div>
          )}
        </div>

        <div className="section-divider"></div>

        {/* Compliance Certifications */}
        {project.compliance_followed &&
          project.compliance_followed.length > 0 && (
            <div className="certifications">
              <h4 className="certifications-title">
                Compliance Certifications
              </h4>
              <div className="certification-badges">
                {project.compliance_followed.map((cert, idx) => (
                  <span key={idx} className="badge badge-success">
                    <i className="fa-solid fa-shield-check"></i> {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Executive Summary - 2x2 Grid */}
      <div
        className="glass-card executive-summary animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="section-header-simple">
          <h3>Executive Summary</h3>
        </div>

        <div className="summary-grid-2x2">
          <div className="summary-card glass-card">
            <h4 className="summary-title success">
              <i className="fa-solid fa-circle-check"></i> Allowed Usage
            </h4>
            <p className="summary-text">
              {project.allowed_usage || "Not specified"}
            </p>
          </div>

          <div className="summary-card glass-card">
            <h4 className="summary-title error">
              <i className="fa-solid fa-circle-xmark"></i> Restricted Usage
            </h4>
            <p className="summary-text">
              {project.restricted_usage || "Not specified"}
            </p>
          </div>

          <div className="summary-card glass-card">
            <h4 className="summary-title primary">
              <i className="fa-solid fa-lock"></i> Privacy & Data Handling
            </h4>
            <p className="summary-text">{project.privacy || "Not specified"}</p>
          </div>

          <div className="summary-card glass-card">
            <h4 className="summary-title primary">
              <i className="fa-solid fa-shield-halved"></i> Safety Measures
            </h4>
            <p className="summary-text">{project.safety || "Not specified"}</p>
          </div>
        </div>
      </div>
      {/* Recommendations */}
      {project.recommendation && (
        <div
          className="glass-card recommendations animate-fade-in"
          style={{ animationDelay: "0.8s" }}
        >
          <div className="section-header">
            <div className="section-icon warning">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <h3>Recommendations & Next Steps</h3>
          </div>

          <div className="recommendation-content">
            <div className="recommendation-box success">
              <i className="fa-solid fa-circle-check"></i>
              <div>
                <h4>Final Recommendation</h4>
                <p>{project.recommendation}</p>
              </div>
            </div>

            {project.assessment?.summary?.implementation_guidelines && (
              <div className="recommendation-box warning">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div>
                  <h4>Implementation Guidelines</h4>
                  <p>{project.assessment.summary.implementation_guidelines}</p>
                </div>
              </div>
            )}

            <div className="recommendation-box info">
              <i className="fa-solid fa-clock"></i>
              <div>
                <h4>Ongoing Monitoring Required</h4>
                <p>
                  Schedule quarterly reviews of tool performance, privacy
                  practices, and student outcomes. Reassess annually or upon
                  major platform updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Evaluation Tables */}
      {project.assessment?.evaluation &&
        project.assessment.evaluation.map((section, idx) => {
          const sectionScore = parseFloat(section.average_score) || 0;
          const sectionScoreClass =
            sectionScore >= 4.0
              ? "score-excellent"
              : sectionScore >= 3.5
                ? "score-warning"
                : "score-poor";

          return (
            <div
              key={idx}
              className="glass-card detailed-section animate-fade-in"
              style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
            >
              <div className="detailed-header">
                <h3 className="detailed-title">
                  <i className="fa-solid fa-gavel"></i>
                  {section.title}
                </h3>
                <div className="section-score-badge">
                  <span className="score-label">Average Score</span>
                  <span className={`score-value ${sectionScoreClass}`}>
                    {section.average_score}/5.0
                  </span>
                </div>
              </div>

              {section.description && (
                <div className="section-summary-box">
                  <i className="fa-solid fa-info-circle"></i>
                  <p>{section.description}</p>
                </div>
              )}

              <div className="detailed-table">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>
                        <i className="fa-solid fa-hashtag"></i>
                      </th>
                      <th style={{ width: "25%" }}>
                        <i className="fa-solid fa-list-check"></i> Criteria
                      </th>
                      <th className="score-col" style={{ width: "10%" }}>
                        <i className="fa-solid fa-star"></i> Score
                      </th>
                      <th style={{ width: "12%" }}>
                        <i className="fa-solid fa-circle-check"></i> Status
                      </th>
                      <th style={{ width: "48%" }}>
                        <i className="fa-solid fa-file-lines"></i> Detailed
                        Observation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.evaluation?.map((item, cidx) => {
                      const criterionScore = parseFloat(item.score) || 0;
                      const scoreClass =
                        criterionScore >= 4.0
                          ? "score-excellent"
                          : criterionScore >= 3.5
                            ? "score-warning"
                            : "score-poor";
                      const statusIcon =
                        criterionScore >= 4.0
                          ? "fa-circle-check"
                          : criterionScore >= 3.5
                            ? "fa-circle-exclamation"
                            : "fa-circle-xmark";
                      const statusText =
                        criterionScore >= 4.0
                          ? "Excellent"
                          : criterionScore >= 3.5
                            ? "Good"
                            : "Needs Improvement";

                      return (
                        <tr key={cidx}>
                          <td className="index-cell">{cidx + 1}</td>
                          <td className="criterion-name-cell">
                            <strong>{item.criteria}</strong>
                          </td>
                          <td className="score-cell">
                            <span className={`score-badge ${scoreClass}`}>
                              {item.score}/5.0
                            </span>
                          </td>
                          <td className="status-cell">
                            <span className={`status-badge ${scoreClass}`}>
                              <i className={`fa-solid ${statusIcon}`}></i>
                              {statusText}
                            </span>
                          </td>
                          <td className="observation-cell">
                            {item.observation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

      {/* ================= ADMIN ACTIONS ================= */}
      {isAdmin && showAdminActions && (
        <div className="glass-card mt-6 p-6">
          <div className="flex justify-center">
            {showScanActions && (
              <div className="flex flex-wrap justify-center gap-3">
                {/* Approve for Scan */}
                <AwsButton
                  variant="primary"
                  onClick={() => {
                    setActionType("scan_approve");
                    setShowModal(true);
                  }}
                >
                  Approve for Scan
                </AwsButton>

                {/* Reject for Scan */}
                <AwsButton
                  variant="outlineDanger"
                  onClick={() => {
                    setActionType("scan_reject");
                    setShowModal(true);
                  }}
                >
                  Reject for Scan
                </AwsButton>
              </div>
            )}

            {showUsageActions && (
              <div className="flex flex-wrap justify-center gap-3">
                {/* Approve for Usage */}
                <AwsButton
                  variant="success"
                  onClick={() => {
                    setActionType("approve");
                    setShowModal(true);
                  }}
                >
                  Approve for Usage
                </AwsButton>

                {/* Reject for Usage */}
                <AwsButton
                  variant="danger"
                  onClick={() => {
                    setActionType("reject");
                    setShowModal(true);
                  }}
                >
                  Reject for Usage
                </AwsButton>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Report Footer */}
      <div className="glass-card report-footer">
        <p className="footer-text">
          This report was generated by XVALIDATEAI Compliance Assessment System
        </p>
        <p className="footer-subtext">
          For questions or concerns, contact compliance@xvalidateai.com
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <ApproveRejectModal
          title={
            actionType === "scan_approve"
              ? "Approve Tool for Scan"
              : actionType === "scan_reject"
                ? "Reject Tool for Scan"
                : actionType === "approve"
                  ? "Approve Tool for Usage"
                  : actionType === "reject"
                    ? "Reject Tool for Usage"
                    : ""
          }
          actionLabel={
            actionType === "scan_approve"
              ? "Approve for Scan"
              : actionType === "scan_reject"
                ? "Reject for Scan"
                : actionType === "approve"
                  ? "Approve for Usage"
                  : actionType === "reject"
                    ? "Reject for Usage"
                    : ""
          }
          showCreditsNote={actionType === "scan_approve"}
          onClose={() => setShowModal(false)}
          onConfirm={handleApproveReject}
        />
      )}
    </div>
  );
}

// Made with Bob
