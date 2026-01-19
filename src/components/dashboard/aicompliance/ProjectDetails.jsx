import React, { useEffect, useState, useRef } from "react";
import { TiTick } from "react-icons/ti";
import { RiErrorWarningLine } from "react-icons/ri";
import { ImCross } from "react-icons/im";
import AwsButton from "../../common/AwsButton";
import ApproveRejectModal from "./ApproveRejectModal";
import { updateComplianceProject } from "../../../apiIntegration/compliance";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TbDownload } from "react-icons/tb";
import { getUserPlan } from "../../../utils/planAccess";

function capitalizeFirstLetter(string) {
  if (string.length === 0) {
    return "";
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function ProjectDetails({ project, onBack }) {
  const score = Math.max(0, Math.min(100, Number(project.score) || 0));
  const [displayScore, setDisplayScore] = useState(0);
  const [progress, setProgress] = useState(0);

  //report download helper
  const summaryRef = useRef(null); // Page 1
  const evaluationBlockRef = useRef(null); // Page 2 (title + first table)
  const usageTableRef = useRef(null);
  const tableRefs = useRef([]); // Page 3+

  const [isDownloading, setIsDownloading] = useState(false);

  // Check user plan
  const userPlan = getUserPlan();
  const isFreePlan = userPlan === "free";

  const handleDownloadPDF = async () => {
    if (isDownloading || isFreePlan) return;

    try {
      setIsDownloading(true);

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const usableWidth = pageWidth - marginX * 2;

      /* ===============================
       HEADER (USED FROM PAGE 2+)
    =============================== */
      const drawHeader = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.text(project.name, pageWidth / 2, 18, { align: "center" });

        pdf.setDrawColor(200);
        pdf.setLineWidth(0.5);
        pdf.line(15, 22, pageWidth - 15, 22);
      };

      const headerHeight = 28;
      const contentStartY = headerHeight + 12;

      /* ---------- helper ---------- */
      const capture = async (el) => {
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });

        return {
          img: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        };
      };

      /* ===============================
   PAGE 1 — SUMMARY (NO HEADER)
================================ */
      const summary = await capture(summaryRef.current);
      const summaryHeight = (summary.height * usableWidth) / summary.width;

      // ✅ FIX: do NOT center vertically
      const summaryY = 22;

      pdf.addImage(
        summary.img,
        "PNG",
        marginX,
        summaryY,
        usableWidth,
        summaryHeight,
      );

      /* ===============================
   PAGE 3 — Usage / Privacy / Safety
================================ */
      if (usageTableRef.current) {
        pdf.addPage();
        drawHeader();

        const usageBlock = await capture(usageTableRef.current);
        const usageHeight =
          (usageBlock.height * usableWidth) / usageBlock.width;

        pdf.addImage(
          usageBlock.img,
          "PNG",
          marginX,
          contentStartY,
          usableWidth,
          usageHeight,
        );
      }

      /* ===============================
       PAGE 2 — Evaluation Summary
    =============================== */
      pdf.addPage();
      drawHeader();

      let cursorY = contentStartY;

      const evalBlock = await capture(evaluationBlockRef.current);
      const evalHeight = (evalBlock.height * usableWidth) / evalBlock.width;

      pdf.addImage(
        evalBlock.img,
        "PNG",
        marginX,
        cursorY,
        usableWidth,
        evalHeight,
      );

      /* ===============================
       PAGE 3+ — Remaining Tables
    =============================== */
      for (let i = 1; i < tableRefs.current.length; i++) {
        const el = tableRefs.current[i];
        if (!el) continue;

        pdf.addPage();
        drawHeader();

        cursorY = contentStartY;

        const table = await capture(el);
        const tableHeight = (table.height * usableWidth) / table.width;

        pdf.addImage(
          table.img,
          "PNG",
          marginX,
          cursorY,
          usableWidth,
          tableHeight,
        );
      }

      /* ===============================
       PAGE NUMBERS
    =============================== */
      const addPageNumbers = () => {
        const pageCount = pdf.getNumberOfPages();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" },
          );
        }
      };

      addPageNumbers();

      pdf.save(`${project.name}-AI-Compliance-Report.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  //api helper for approve/reject modals

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
    onBack?.(true); // refresh parent
  };

  // ✅ NEW (modal state only)
  const isRequested = project.status === "requested";
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // approve | reject

  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];
  const isAdmin = roles.includes("ADMIN");

  //Requested By/Approved By columns helper
  const formatUser = (user) => {
    if (!user) return "-";
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return user.email ? `${name} (${user.email})` : name || "-";
  };

  /* Score Animation */
  useEffect(() => {
    let start = null;
    const duration = 700;
    function step(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(ease * score));
      setProgress(ease * (score / 100));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);

  const dateString = new Date(
    project.updated_time || project.created_time,
  ).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // optional (24-hour format)
  });

  /* RECOMMENDATION UI HELPER */
  const getRecommendationUI = (status) => {
    if (!status) return null;

    const normalized = status.toLowerCase();

    if (normalized === "approved") {
      return { icon: TiTick, iconColor: "#16A34A", textColor: "#16A34A" };
    }

    if (normalized === "approved with limitations") {
      return {
        icon: RiErrorWarningLine,
        iconColor: "#EA580C",
        textColor: "#EA580C",
      };
    }

    if (normalized === "not recommended") {
      return { icon: ImCross, iconColor: "#DC2626", textColor: "#DC2626" };
    }

    return null;
  };

  return (
    <div className="dashboard__content">
      <div
        style={{
          padding: "30px 30px 40px 30px",
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #D1D5DB",
          width: "100%",
        }}
      >
        {/* TOP ACTION BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Back button (LEFT) */}
          <button
            onClick={onBack}
            style={{
              padding: "6px 14px",
              background: "#EEF2FF",
              color: "#4F46E5",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ← Back
          </button>

          {/* Download icon + tooltip (RIGHT) */}
          <div
            className="download-wrapper"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <button
              onClick={handleDownloadPDF}
              className={`download-btn ${isDownloading ? "downloading" : ""} ${isFreePlan ? "disabled" : ""}`}
              disabled={isDownloading || isFreePlan}
              aria-label="Download PDF"
              style={{
                opacity: isFreePlan ? 0.5 : 1,
                cursor: isFreePlan ? "not-allowed" : "pointer",
              }}
            >
              <TbDownload size={26} />
            </button>
            {isFreePlan && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#1F2937",
                  color: "#FFFFFF",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  zIndex: 1000,
                }}
                className="download-tooltip"
              >
                Upgrade to Premium to download reports
              </div>
            )}
          </div>
        </div>

        {/* HEADER */}
        <div ref={summaryRef}>
          <h1
            style={{
              textAlign: "center",
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 16,
              color: "#0F172A",
            }}
          >
            {project.name}
          </h1>

          <div
            style={{
              height: 1,
              background: "#D1D5DB",
              marginBottom: 25,
              width: "100%",
            }}
          />

          {/* CONTENT LAYOUT */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 40,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* LEFT DETAILS */}
            <div style={{ width: "75%", minWidth: "280px", flex: 1 }}>
              <Detail label="Tool Name" value={project.name} />
              <Detail
                label="Developer / Vendor"
                value={project.developer || "-"}
              />
              <Detail
                label="Intended Users"
                value={project.intended_users || "-"}
              />
              <Detail label="Grade Level" value={project.grade_level || "-"} />
              <Detail label="Date" value={dateString} />
              <Detail
                label="Status"
                value={capitalizeFirstLetter(project.status) || "-"}
              />
              <Detail
                label="Requested By"
                value={formatUser(project.requested_by)}
              />
              <Detail
                label="Approved By"
                value={
                  project.approved_by ? formatUser(project.approved_by) : "-"
                }
              />

              {project.url && (
                <Detail
                  label="URL"
                  value={
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563EB",
                        textDecoration: "underline",
                      }}
                    >
                      {project.url}
                    </a>
                  }
                />
              )}

              {/* ✅ NEW — Justification (row-level, SAME style) */}
              {project.justification && (
                <Detail label="Justification" value={project.justification} />
              )}
              <Detail
                label="Compliance Followed"
                value={project.compliance_followed?.join(", ") || "-"}
              />
            </div>

            {/* RIGHT SCORE */}
            {!isRequested && (
              <div
                style={{
                  width: 320,
                  maxWidth: "100%",
                  margin: "0 auto",
                  overflow: "visible",
                }}
              >
                <ScoreGauge score={displayScore} />
              </div>
            )}
          </div>
          {/* ✅ NEW — Approve / Reject buttons */}
          {isRequested && isAdmin && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: 24,
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              <AwsButton
                label="Approve for Scan"
                onClick={() => {
                  setActionType("scan_approve");
                  setShowModal(true);
                }}
              />

              <AwsButton
                label="Reject for Scan"
                onClick={() => {
                  setActionType("scan_reject");
                  setShowModal(true);
                }}
              />

              <AwsButton
                label="Approve for Usage"
                onClick={() => {
                  setActionType("approve");
                  setShowModal(true);
                }}
              />

              <AwsButton
                label="Reject for Usage"
                onClick={() => {
                  setActionType("reject");
                  setShowModal(true);
                }}
              />
            </div>
          )}

          {isRequested && !isAdmin && (
            <div
              style={{
                marginTop: 20,
                padding: "10px 14px",
                background: "#EFF6FF",
                color: "#1E40AF",
                borderRadius: 8,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              This tool is awaiting admin approval. You can view the report, but
              cannot take action.
            </div>
          )}

          {/* Recommendation */}
          <div
            style={{
              height: 1,
              background: "#D1D5DB",
              margin: "22px 0",
              width: "100%",
            }}
          />

          {(() => {
            const ui = getRecommendationUI(project.recommendation);
            if (!ui) return null;
            const IconComponent = ui.icon;

            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 700, color: "#111827" }}>
                  Recommendation:
                </span>
                <span style={{ width: 10 }} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    marginTop: -15,
                  }}
                >
                  {IconComponent && (
                    <IconComponent size={22} color={ui.iconColor} />
                  )}
                  <span style={{ fontSize: 18, color: ui.textColor }}>
                    {project.recommendation}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bottom separator */}
        <div
          style={{
            height: 1,
            background: "#D1D5DB",
            marginTop: 25,
            width: "100%",
          }}
        />

        {/* ✅ CAPTURE BUFFER */}
        <div style={{ height: 40 }} />
        {/* ✅ Usage / Privacy / Safety table (no headers) */}
        <div ref={usageTableRef}>
          <UsageSummaryTable project={project} />
        </div>
      </div>

      {/* ✅ ADD THIS */}

      {/* EVALUATION REPORT SECTION (UNCHANGED) */}
      {project.assessment?.evaluation?.length > 0 && (
        <EvaluationReport
          sections={project.assessment.evaluation}
          evaluationBlockRef={evaluationBlockRef}
          tableRefs={tableRefs}
        />
      )}

      {/* ✅ NEW — MODAL (must be inside return) */}
      {showModal && (
        <ApproveRejectModal
          title={
            actionType === "scan_approve"
              ? "Approve Tool for Scan"
              : actionType === "scan_reject"
                ? "Reject Tool for Scan"
                : actionType === "approve"
                  ? "Approve Tool for Usage"
                  : "Reject Tool for Usage"
          }
          actionLabel={
            actionType === "scan_approve"
              ? "Approve for Scan"
              : actionType === "scan_reject"
                ? "Reject for Scan"
                : actionType === "approve"
                  ? "Approve for Usage"
                  : "Reject for Usage"
          }
          onClose={() => setShowModal(false)}
          onConfirm={handleApproveReject}
        />
      )}
    </div>
  );
}

/* DETAIL ROW (UNCHANGED) */
function Detail({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        marginBottom: 14,
        fontSize: 17,
        lineHeight: "22px",
      }}
    >
      <span style={{ fontWeight: 700, color: "#111827" }}>{label}:</span>
      <span style={{ marginLeft: 10, color: "#374151" }}>{value}</span>
    </div>
  );
}

/* SCORE GAUGE */
/* ----------- FIVE COLOR ARC SPEEDOMETER ----------- */
function ScoreGauge({ score }) {
  const size = 260;
  const center = size / 2;
  const radius = 110;
  const stroke = 28;
  const innerRadius = radius - stroke + 4;

  const polar = (cx, cy, r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arc = (startDeg, endDeg, color) => {
    const start = polar(center, center, radius, startDeg);
    const end = polar(center, center, radius, endDeg);

    return (
      <path
        d={`M ${start.x} ${start.y}
           A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  // needle angle
  const needleAngle = (score / 100) * 180 - 90;

  // needle end (arrow point)
  const tip = polar(center, center, radius - 5, needleAngle);

  // two small wing points for the arrow head
  const leftWing = polar(center, center, 25, needleAngle - 7);
  const rightWing = polar(center, center, 25, needleAngle + 7);

  return (
    <div
      style={{
        width: size,
        height: 200,
        position: "relative",
        maxWidth: "100%",
      }}
    >
      <svg
        width={size}
        height={170}
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          {/* MULTICOLOR ARC */}
          {arc(-90, -54, "#EF4444")}
          {arc(-54, -18, "#F97316")}
          {arc(-18, 18, "#FACC15")}
          {arc(18, 54, "#86EFAC")}
          {arc(54, 90, "#16A34A")}

          {/* INNER CUT */}
          <path
            d={`
            M ${polar(center, center, innerRadius, 180).x}
              ${polar(center, center, innerRadius, 180).y}
            A ${innerRadius} ${innerRadius} 0 0 1
              ${polar(center, center, innerRadius, 0).x}
              ${polar(center, center, innerRadius, 0).y}
            L ${center} ${center} Z`}
            fill="white"
          />

          {/* NEEDLE (ARROW) */}
          <line
            x1={center}
            y1={center}
            x2={tip.x}
            y2={tip.y}
            stroke="black"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* ARROW HEAD TRIANGLE */}
          <polygon
            points={`${tip.x},${tip.y} ${leftWing.x},${leftWing.y} ${rightWing.x},${rightWing.y}`}
            fill="black"
          />

          {/* CENTER CIRCLE */}
          <circle
            cx={center}
            cy={center}
            r={7}
            fill="white"
            stroke="black"
            strokeWidth="3"
          />
        </g>
      </svg>

      {/* SCORE – moved upwards */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 65, // 🔥 moved UP from 0 → 35px
          transform: "translateX(-50%)",
          fontSize: 30,
          fontWeight: 800,
          color: "#0F172A",
        }}
      >
        {score}%
      </div>
    </div>
  );
}

function ScoreGaugeSmall({ score }) {
  const num = Number(score) || 0;
  const maxScore = 5;
  const [showTooltip, setShowTooltip] = useState(false);

  const normalized = (num / maxScore) * 180 - 90;

  const size = 120;
  const center = size / 2;
  const radius = 45;

  const polar = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const arc = (start, end, color) => {
    const s = polar(start);
    const e = polar(end);
    return (
      <path
        d={`M ${s.x} ${s.y} A ${radius} ${radius} 0 0 1 ${e.x} ${e.y}`}
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  const tip = polar(normalized);
  const leftWing = polar(normalized - 6);
  const rightWing = polar(normalized + 6);

  const tooltipColor =
    num < 1
      ? "#EF4444"
      : num < 2
        ? "#F97316"
        : num < 3
          ? "#FACC15"
          : num < 4
            ? "#4ADE80"
            : "#16A34A";

  return (
    <div
      style={{
        width: size,
        height: 90,
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <div
        style={{
          position: "absolute",
          top: -38,
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          border: "1px solid #CBD5E1",
          borderRadius: 6,
          padding: "5px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: tooltipColor,
          whiteSpace: "nowrap",
          opacity: showTooltip ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: "none",
        }}
      >
        Avg Score: {num.toFixed(2)}
      </div>

      {/* GAUGE */}
      <svg
        width={size}
        height={80}
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          {arc(-90, -54, "#EF4444")}
          {arc(-54, -18, "#F97316")}
          {arc(-18, 18, "#FACC15")}
          {arc(18, 54, "#4ADE80")}
          {arc(54, 90, "#16A34A")}

          <line
            x1={center}
            y1={center}
            x2={tip.x}
            y2={tip.y}
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <polygon
            points={`${tip.x},${tip.y} ${leftWing.x},${leftWing.y} ${rightWing.x},${rightWing.y}`}
            fill="black"
          />

          <circle
            cx={center}
            cy={center}
            r={4}
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* Score Text */}
      <div
        style={{
          position: "absolute",
          bottom: 5,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {num.toFixed(2)}
      </div>
    </div>
  );
}

function UsageSummaryTable({ project }) {
  const rows = [
    { label: "Use Case", value: project.use_case },
    { label: "Allowed Usage", value: project.allowed_usage },
    { label: "Restricted Usage", value: project.restricted_usage },
    { label: "Privacy", value: project.privacy },
    { label: "Safety", value: project.safety },
  ];

  return (
    <div
      style={{
        marginTop: 30,
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              style={{
                borderBottom:
                  index !== rows.length - 1 ? "1px solid #E5E7EB" : "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F8FAFC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#FFFFFF")
              }
            >
              {/* LEFT LABEL */}
              <td
                style={{
                  width: 220,
                  padding: "14px 16px",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#0F172A",
                  background: "#F9FAFB",
                  verticalAlign: "top",
                }}
              >
                {row.label}
              </td>

              {/* RIGHT VALUE */}
              <td
                style={{
                  padding: "14px 16px",
                  fontSize: 15,
                  color: "#334155",
                  lineHeight: "24px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {row.value || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------
   EVALUATION REPORT COMPONENTS
------------------------------------------------------ */

/* ------------------------------------------------------
   EVALUATION REPORT (IMPROVED UX + CLEAN TABLES)
------------------------------------------------------ */

const sectionTitleStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#0F172A",
  marginBottom: 18,
};

function EvaluationReport({ sections, evaluationBlockRef, tableRefs }) {
  return (
    <div style={{ marginTop: 45 }}>
      {/* PAGE 2 (title + first table) */}
      <div ref={evaluationBlockRef}>
        <h2 style={sectionTitleStyle}>Evaluation Summary</h2>
        <EvaluationTable data={sections[0]} />
      </div>

      {/* PAGE 3+ (title + table again) */}
      {sections.slice(1).map((section, index) => (
        <div
          key={index}
          ref={(el) => (tableRefs.current[index + 1] = el)}
          style={{ marginTop: 40 }}
        >
          <h2 style={sectionTitleStyle}>Evaluation Summary</h2>
          <EvaluationTable data={section} />
        </div>
      ))}
    </div>
  );
}

/* CLEANER TABLE CARD WITH DESCRIPTION + AVG SCORE + GAUGE */
function EvaluationTable({ data }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        padding: 20,
        marginBottom: 35,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 25,
          gap: 30,
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: TITLE + DESCRIPTION */}
        <div style={{ flex: 1, minWidth: "250px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            {data.title}
          </h3>

          {/* If description exists */}
          {data.description && (
            <div
              style={{
                marginTop: 8,
                fontSize: 15,
                color: "#475569",
                lineHeight: "25px",
                maxWidth: "95%",
              }}
            >
              {data.description}
            </div>
          )}
        </div>

        {/* RIGHT: Divider + Avg Score + Gauge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            flexShrink: 0,
          }}
        >
          {/* Vertical Divider */}
          <div
            style={{
              width: 1,
              background: "#E2E8F0",
              height: "80px",
            }}
          />

          {/* Avg Score + Gauge */}
          <div>
            <ScoreGaugeSmall score={data.average_score} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F1F5F9" }}>
              <th style={thStyle}>Criteria</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Observation</th>
            </tr>
          </thead>

          <tbody>
            {data.evaluation.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid #E5E7EB",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#F8FAFC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#FFFFFF")
                }
              >
                <td style={tdStyle}>{item.criteria}</td>

                <td
                  style={{
                    ...tdStyle,
                    color: "#16A34A",
                    fontWeight: 700,
                    width: 100,
                  }}
                >
                  {item.score}
                </td>

                <td style={tdStyle}>{item.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Styles */
const thStyle = {
  textAlign: "left",
  padding: "12px",
  fontSize: 15,
  fontWeight: 700,
  color: "#0F172A",
  borderBottom: "1px solid #CBD5E1",
};

const tdStyle = {
  padding: "12px",
  fontSize: 15,
  color: "#334155",
  verticalAlign: "top",
  lineHeight: "22px",
};
