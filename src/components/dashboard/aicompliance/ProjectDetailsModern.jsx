import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { COLORS } from "@/styles/colors";
import { updateComplianceProject } from "../../../apiIntegration/compliance";
import ApproveRejectModal from "./ApproveRejectModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useContextElement } from "@/context/Context";

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
  const summaryRef = useRef(null);
  const usageTableRef = useRef(null);
  const tableRefs = useRef([]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfRendering, setIsPdfRendering] = useState(false);

  const { userPlan } = useContextElement();
  const isFreePlan = userPlan === "free";

  const handleDownloadPDF = async () => {
    if (isDownloading || !isFreePlan) return;

    try {
      setIsDownloading(true);
      setIsPdfRendering(true);

      await new Promise((r) => setTimeout(r, 0));

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const usableWidth = pageWidth - marginX * 2;

      const HEADER_HEIGHT = 24;
      const FOOTER_HEIGHT = 14;

      const CONTENT_TOP = HEADER_HEIGHT + 6;
      const CONTENT_BOTTOM = pageHeight - FOOTER_HEIGHT - 6;
      const CONTENT_HEIGHT = CONTENT_BOTTOM - CONTENT_TOP;

      // Get organization from localStorage
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const organizationName = userInfo?.organization?.name || "XVALIDATEAI";

      /* ---------------- WATERMARK FUNCTION ---------------- */
      const drawWatermark = () => {
        const watermarkText =
          (organizationName && organizationName.toUpperCase()) || "XVALIDATEAI";

        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity: 0.15 }));

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(180, 180, 180);

        // Scale text to 65% of page width
        const maxWidth = pageWidth * 0.65;
        let fontSize = 140;
        pdf.setFontSize(fontSize);

        while (pdf.getTextWidth(watermarkText) > maxWidth && fontSize > 20) {
          fontSize -= 2;
          pdf.setFontSize(fontSize);
        }

        // 🔥 FIX: compensate for rotated height
        const textWidth = pdf.getTextWidth(watermarkText);
        const textHeight = fontSize;

        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;

        pdf.text(watermarkText, centerX, centerY, {
          align: "center",
          baseline: "middle",
          angle: 45,
        });

        pdf.restoreGraphicsState();
      };
      /* ---------------- HEADER ---------------- */
      const logoImg = new Image();
      logoImg.src = "/assets/img/general/app_logo.png"; // use PNG for reliability

      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      const drawHeader = () => {
        // Logo
        const logoHeight = 10;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;

        pdf.addImage(
          logoImg,
          "PNG",
          15,
          (HEADER_HEIGHT - logoHeight) / 2,
          logoWidth,
          logoHeight,
        );

        // Center Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(15, 23, 42);

        pdf.text("Assessment Report", pageWidth / 2, 15, { align: "center" });

        // Divider
        pdf.setDrawColor(226, 232, 240);
        pdf.line(15, HEADER_HEIGHT, pageWidth - 15, HEADER_HEIGHT);
      };

      /* ---------------- FOOTER ---------------- */
      const drawFooter = () => {
        const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
        const totalPages = pdf.getNumberOfPages();

        pdf.setDrawColor(226, 232, 240);
        pdf.line(
          15,
          pageHeight - FOOTER_HEIGHT,
          pageWidth - 15,
          pageHeight - FOOTER_HEIGHT,
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);

        // Center footer text
        pdf.text(
          "XVALIDATEAI © 2026. All rights reserved.",
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );

        // Page number on right
        pdf.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - 15,
          pageHeight - 8,
          { align: "right" },
        );
      };

      /* ---------------- HTML CAPTURE ---------------- */
      const capture = async (el) => {
        if (!el || !el.offsetWidth || !el.offsetHeight) {
          console.warn("Skipping capture: element invalid or zero size");
          return null;
        }

        /* ---------------- HIDE PLOTLY IN REAL DOM ---------------- */
        const plotlyElements = el.querySelectorAll(".js-plotly-plot");
        plotlyElements.forEach((node) => {
          node.style.visibility = "hidden";
        });

        const clone = el.cloneNode(true);

        clone.style.position = "fixed";
        clone.style.top = "-10000px";
        clone.style.left = "0";
        clone.style.width = el.offsetWidth + "px";
        clone.style.background = "#ffffff";
        clone.style.boxShadow = "none";

        document.body.appendChild(clone);

        /* ---------------- REMOVE UI-ONLY SECTIONS ---------------- */
        clone.querySelectorAll(".section-summary-box").forEach((node) => {
          node.remove();
        });

        /* ==========================================================
     PROFESSIONAL PDF STYLING (Corporate Layout Mode)
     ========================================================== */

        clone.querySelectorAll("*").forEach((node) => {
          node.style.setProperty("color", "#111111", "important");
          node.style.setProperty("opacity", "1", "important");
          node.style.setProperty("text-shadow", "none", "important");
          node.style.setProperty("box-shadow", "none", "important");
          node.style.setProperty("filter", "none", "important");
        });

        /* Remove colorful badges */
        /* Remove ALL colored boxes completely */
        /* Remove ALL colored icons and backgrounds */
        clone.querySelectorAll("i").forEach((icon) => {
          icon.style.setProperty("color", "#111111", "important");
        });

        clone
          .querySelectorAll(
            ".badge, .recommendation-badge, .recommendation-box, .summary-card, .status-pill, .score-badge, .status-badge",
          )
          .forEach((node) => {
            node.style.setProperty("background", "#ffffff", "important");
            node.style.setProperty("border", "1px solid #111111", "important");
            node.style.setProperty("color", "#111111", "important");
          });

        /* REMOVE colored score classes completely */
        clone
          .querySelectorAll(".score-excellent, .score-warning, .score-poor")
          .forEach((node) => {
            node.classList.remove("score-excellent");
            node.classList.remove("score-warning");
            node.classList.remove("score-poor");
          });

        /* Professional Average Score Box for PDF */
        clone.querySelectorAll(".section-score-badge").forEach((node) => {
          node.style.setProperty("display", "inline-flex", "important");
          node.style.setProperty("align-items", "center", "important");
          node.style.setProperty("gap", "8px", "important");
          node.style.setProperty("padding", "6px 14px", "important");
          node.style.setProperty("border", "2px solid #111111", "important");
          node.style.setProperty("border-radius", "6px", "important");
          node.style.setProperty("background", "#f8fafc", "important");
          node.style.setProperty("font-weight", "600", "important");
        });

        /* Align label and value properly */
        clone.querySelectorAll(".score-label").forEach((node) => {
          node.style.setProperty("font-size", "11px", "important");
          node.style.setProperty("letter-spacing", "0.5px", "important");
          node.style.setProperty("text-transform", "uppercase", "important");
        });

        clone.querySelectorAll(".score-value").forEach((node) => {
          node.style.setProperty("font-size", "14px", "important");
          node.style.setProperty("font-weight", "700", "important");
        });

        /* Professional Average Score Box for PDF */
        clone.querySelectorAll(".section-score-badge").forEach((node) => {
          node.style.setProperty("display", "inline-flex", "important");
          node.style.setProperty("align-items", "center", "important");
          node.style.setProperty("justify-content", "center", "important");
          node.style.setProperty("gap", "10px", "important");
          node.style.setProperty("padding", "6px 18px", "important");
          node.style.setProperty("border", "2px solid #111111", "important");
          node.style.setProperty("border-radius", "8px", "important");
          node.style.setProperty("background", "#ffffff", "important");
          node.style.setProperty("font-weight", "600", "important");
        });
        clone.querySelectorAll(".score-value").forEach((node) => {
          node.style.setProperty("color", "#000000", "important");
          node.style.setProperty("font-weight", "700", "important");
        });

        // Remove admin approve/reject links in PDF
        clone.querySelectorAll(".admin-actions").forEach((node) => {
          node.remove();
        });

        // Remove org icon background color in PDF
        clone.querySelectorAll(".tool-icon").forEach((node) => {
          node.style.setProperty("background", "#ffffff", "important");
          node.style.setProperty("border", "1px solid #111111", "important");
        });

        clone.querySelectorAll(".section-icon").forEach((node) => {
          node.style.setProperty("background", "#ffffff", "important");
          node.style.setProperty("border", "1px solid #111111", "important");
        });

        /* Professional table styling */
        clone.querySelectorAll("table").forEach((table) => {
          table.style.borderCollapse = "collapse";
          table.style.width = "100%";
          table.style.fontSize = "10px";
        });

        clone.querySelectorAll("th").forEach((th) => {
          th.style.background = "#f3f4f6";
          th.style.color = "#111111";
          th.style.fontWeight = "600";
          th.style.border = "1px solid #d1d5db";
          th.style.padding = "8px";
          th.style.textAlign = "left";
        });

        clone.querySelectorAll("td").forEach((td) => {
          td.style.border = "1px solid #e5e7eb";
          td.style.padding = "8px";
          td.style.verticalAlign = "top";
        });

        /* Remove gradient / colored text */
        clone.querySelectorAll(".gradient-text").forEach((node) => {
          node.style.background = "none";
          node.style.color = "#111111";
        });

        await new Promise((r) => requestAnimationFrame(r));

        /* ---------------- CONVERT PLOTLY TO IMAGE ---------------- */
        const originalCharts = el.querySelectorAll(".js-plotly-plot");
        const cloneCharts = clone.querySelectorAll(".js-plotly-plot");

        for (let i = 0; i < originalCharts.length; i++) {
          try {
            const originalChart = originalCharts[i];
            const cloneChart = cloneCharts[i];

            const imageData = await window.Plotly.toImage(originalChart, {
              format: "png",
              width: originalChart.offsetWidth,
              height: originalChart.offsetHeight,
            });

            const img = document.createElement("img");
            img.src = imageData;
            img.style.width = originalChart.offsetWidth + "px";
            img.style.height = originalChart.offsetHeight + "px";

            cloneChart.parentNode.replaceChild(img, cloneChart);
          } catch (e) {
            console.warn("Plotly export failed", e);
          }
        }

        const canvas = await html2canvas(clone, {
          scale: 2,
          backgroundColor: null,
          useCORS: true,
        });

        document.body.removeChild(clone);

        /* ---------------- RESTORE REAL DOM ---------------- */
        plotlyElements.forEach((node) => {
          node.style.visibility = "visible";
        });

        return canvas;
      };

      /* ---------------- ADD IMAGE WITH PAGING ---------------- */
      let isVeryFirstPage = true;

      const addCanvasPaged = (canvas) => {
        if (!canvas || !canvas.width || !canvas.height) return;

        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;

        const ratio = usableWidth / imgWidthPx;
        const pageHeightPx = CONTENT_HEIGHT / ratio;

        let position = 0;
        let pageIndex = 0;

        while (position < imgHeightPx) {
          // Only add new page if not the very first page of the document
          if (!isVeryFirstPage && pageIndex === 0) {
            pdf.addPage();
          } else if (pageIndex > 0) {
            pdf.addPage();
          }

          isVeryFirstPage = false;

          // Draw white background for the entire page first
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");

          drawHeader();

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidthPx;
          pageCanvas.height = Math.min(pageHeightPx, imgHeightPx - position);

          const ctx = pageCanvas.getContext("2d");

          ctx.drawImage(
            canvas,
            0,
            position,
            imgWidthPx,
            pageCanvas.height,
            0,
            0,
            imgWidthPx,
            pageCanvas.height,
          );

          pdf.addImage(
            pageCanvas.toDataURL("image/png"),
            "PNG",
            marginX,
            CONTENT_TOP,
            usableWidth,
            pageCanvas.height * ratio,
          );

          // Draw watermark on top of white background
          drawWatermark();

          drawFooter();

          position += pageHeightPx;
          pageIndex++;
        }
      };
      /* ---------------- PAGE 1 ---------------- */
      const summaryCanvas = await capture(summaryRef.current, {
        hideUiHeader: true,
      });
      addCanvasPaged(summaryCanvas);

      /* ---------------- PAGE 2 ---------------- */
      if (usageTableRef.current) {
        const usageCanvas = await capture(usageTableRef.current);
        addCanvasPaged(usageCanvas);
      }

      /* ---------------- EVALUATION SECTIONS ---------------- */
      for (let i = 0; i < tableRefs.current.length; i++) {
        const el = tableRefs.current[i];
        if (!el) continue;

        const sectionCanvas = await capture(el);
        addCanvasPaged(sectionCanvas);
      }

      pdf.save(`${project.name}-Assessment-Report.pdf`);
    } finally {
      setIsPdfRendering(false);
      setIsDownloading(false);
    }
  };
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
  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, []);

  const categoryScores = getCategoryScores();

  const getSectionIcon = (title) => {
    const t = title?.toLowerCase() || "";
    const baseStyle = {
      width: 22,
      height: 22,
    };

    // 📊 Data & Reporting Quality (Bar Chart)
    if (t.includes("data")) {
      return (
        <svg style={baseStyle} viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="10"
            width="3"
            height="8"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="10"
            y="6"
            width="3"
            height="12"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="16"
            y="3"
            width="3"
            height="15"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
    }

    // 🧩 Usability & Integration (Connected Nodes)
    if (t.includes("usability")) {
      return (
        <svg style={baseStyle} viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
          <line
            x1="8"
            y1="12"
            x2="16"
            y2="6"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="8"
            y1="12"
            x2="16"
            y2="18"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
    }

    // 📘 Instructional & Learning Impact (Open Book)
    if (t.includes("instructional")) {
      return (
        <svg style={baseStyle} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 6C3 4.9 3.9 4 5 4h6v16H5c-1.1 0-2-.9-2-2V6z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M21 6c0-1.1-.9-2-2-2h-6v16h6c1.1 0 2-.9 2-2V6z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
    }

    // ⚖ Governance & Compliance Review (Shield + Check)
    if (t.includes("governance") || t.includes("compliance")) {
      return (
        <svg style={baseStyle} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    return null;
  };

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
            <button
              className="action-btn export-button"
              onClick={handleDownloadPDF}
            >
              <i className="fa-solid fa-file-pdf"></i> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Header Card */}
      <div ref={summaryRef}>
        <div className="glass-card report-header animate-fade-in">
          <div className="grid grid-cols-3 items-center">
            {/* Left Spacer */}
            <div></div>

            {/* True Center Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary tracking-wide">
                Assessment Report
              </h1>

              <p className="mt-2 text-sm text-textSecondary">
                Comprehensive compliance and quality evaluation
              </p>
            </div>
            {/* Right Section */}
            <div className="pt-9 text-right space-y-2">
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
                    {project.scan_approved_by
                      ? formatUser(project.scan_approved_by)
                      : "-"}
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
                    <span className="detail-value">
                      {project.justification}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Overall Score */}
            {hasValidScore && (
              <div className="score-container glass-card">
                <p className="score-label">Overall Compliance Score</p>
                <div className="flex justify-center">
                  <Plot
                    data={[
                      {
                        type: "indicator",
                        mode: "gauge+number",
                        value: score,
                        number: {
                          suffix: "%",
                          font: {
                            size: 42,
                            color: COLORS.primary,
                          },
                        },
                        gauge: {
                          shape: "angular",
                          axis: {
                            range: [0, 100],
                            tickwidth: 0,
                            showticklabels: false,
                          },
                          bar: {
                            color: COLORS.primary,
                            thickness: 0.18,
                          },
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
                      width: 300,
                      height: 200,
                      margin: { t: 20, b: 20, l: 20, r: 20 },
                      paper_bgcolor: "#ffffff",
                      plot_bgcolor: "#ffffff",
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
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

                {/* 🔹 Admin Link Actions */}
                {isAdmin && showAdminActions && (
                  <div className="admin-actions mt-4 w-full flex justify-center items-center gap-4 text-sm font-medium">
                    {showScanActions && (
                      <>
                        <span
                          className="cursor-pointer transition"
                          style={{ color: "#0043ce" }}
                          onMouseEnter={(e) =>
                            (e.target.style.color = "#001d6c")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = "#0043ce")
                          }
                          onClick={() => {
                            setActionType("scan_approve");
                            setShowModal(true);
                          }}
                        >
                          Approve for Scan
                        </span>

                        <span style={{ color: "#8d8d8d" }}>|</span>

                        <span
                          className="cursor-pointer transition"
                          style={{ color: "#0043ce" }}
                          onMouseEnter={(e) =>
                            (e.target.style.color = "#001d6c")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = "#0043ce")
                          }
                          onClick={() => {
                            setActionType("scan_reject");
                            setShowModal(true);
                          }}
                        >
                          Reject for Scan
                        </span>
                      </>
                    )}

                    {showUsageActions && (
                      <>
                        <span
                          className="cursor-pointer transition"
                          style={{ color: "#0043ce" }}
                          onMouseEnter={(e) =>
                            (e.target.style.color = "#001d6c")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = "#0043ce")
                          }
                          onClick={() => {
                            setActionType("approve");
                            setShowModal(true);
                          }}
                        >
                          Approve for Usage
                        </span>

                        <span style={{ color: "#8d8d8d" }}>|</span>

                        <span
                          className="cursor-pointer transition"
                          style={{ color: "#0043ce" }}
                          onMouseEnter={(e) =>
                            (e.target.style.color = "#001d6c")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = "#0043ce")
                          }
                          onClick={() => {
                            setActionType("reject");
                            setShowModal(true);
                          }}
                        >
                          Reject for Usage
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Executive Summary - 2x2 Grid */}
      <div ref={usageTableRef}>
        <div
          className="glass-card executive-summary animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="section-header-simple">
            <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>
              Executive Summary
            </h3>
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
              <p className="summary-text">
                {project.privacy || "Not specified"}
              </p>
            </div>

            <div className="summary-card glass-card">
              <h4 className="summary-title primary">
                <i className="fa-solid fa-shield-halved"></i> Safety Measures
              </h4>
              <p className="summary-text">
                {project.safety || "Not specified"}
              </p>
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
              {!isFreePlan ? (
                <>
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
                        <p>
                          {project.assessment.summary.implementation_guidelines}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="recommendation-box info">
                    <i className="fa-solid fa-clock"></i>
                    <div>
                      <h4>Ongoing Monitoring Required</h4>
                      <p>
                        Schedule quarterly reviews of tool performance, privacy
                        practices, and student outcomes. Reassess annually or
                        upon major platform updates.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="recommendation-locked">
                  <div className="recommendation-box locked">
                    <i className="fa-solid fa-lock"></i>
                    <div>
                      <h4>Recommendations Locked</h4>
                      <p>
                        Upgrade your plan to view detailed recommendations and
                        next steps.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Evaluation Tables */}
      <div className="relative">
        {/* ===== Blurred Content Layer ===== */}
        <div
          className={
            isFreePlan ? "blurred-section pointer-events-none select-none" : ""
          }
        >
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
                  ref={(el) => (tableRefs.current[idx] = el)}
                  className="glass-card detailed-section animate-fade-in"
                  style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                >
                  <div className="detailed-header">
                    <div className="header-left flex items-center gap-3">
                      <div className="header-icon">
                        {getSectionIcon(section.title)}
                      </div>
                      <h3 className="detailed-title">{section.title}</h3>
                    </div>

                    <div className="section-score-badge">
                      <span className="score-label">AVERAGE SCORE</span>
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
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "25%" }}>Criteria</th>
                          <th style={{ width: "10%" }}>Score</th>
                          <th style={{ width: "12%" }}>Status</th>
                          <th style={{ width: "48%" }}>Detailed Observation</th>
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
        </div>

        {/* ===== Lock Overlay (Only Free Plan) ===== */}
        {isFreePlan && (
          <div className="locked-overlay">
            <div className="locked-content">
              <i className="fa-solid fa-lock lock-icon"></i>

              <h3>Detailed Evaluation Locked</h3>

              <p>
                Upgrade your plan to view detailed evaluation scores,
                observations, and full assessment insights.
              </p>

              <button
                className="upgrade-btn"
                onClick={() => {
                  // route to upgrade page or open modal
                  window.location.href = "/dashboard/pricing";
                }}
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
      </div>

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
