import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { COLORS } from "@/styles/colors";
import { updateComplianceProject } from "../../../apiIntegration/compliance";
import { trackUIEvent } from "../../../apiIntegration/audittrail";
import ApproveRejectModal from "./ApproveRejectModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useContextElement } from "@/context/Context";
import { recommendationLabel } from "@/utils/recommendationLabel";
import { getFindings, getObservations, getObservationArtifact } from "@/apiIntegration/verification";
import FindingDetail from "@/components/dashboard/verification/FindingDetail";

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

  const cleaned = utcString.replace("+00:00Z", "Z").replace(/\.\d{6}/, ""); // remove microseconds if present

  const date = new Date(cleaned);

  if (isNaN(date)) return "-";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
const CHECK_LABELS = {
  SECURITY_INCIDENT: "Breaches and published vulnerabilities",
  PRIVACY_POLICY: "Privacy policy",
  TERMS_OF_SERVICE: "Terms of service",
  DPA: "Data processing addendum",
  SUBPROCESSOR_LIST: "Subprocessor list",
  SECURITY_PAGE: "Security page",
  STUDENT_DATA_ADDENDUM: "Student data addendum",
};

// A one-line result per check, so the trail reads as evidence rather than as
// a list of timestamps. A check that could not reach a source says so - a
// partial check is not a clean result.
function describeObservation(o) {
  const s = o.summary || {};
  if (s.partial) {
    const failed = Object.keys(s.source_errors || {}).join(", ");
    return `Incomplete${failed ? ` - ${failed} unavailable` : ""}`;
  }
  if (o.check_type === "SECURITY_INCIDENT") {
    const b = (s.breaches || []).length;
    const v = (s.vulnerabilities || []).length;
    return b || v
      ? `${b} breach${b === 1 ? "" : "es"}, ${v} vulnerabilit${v === 1 ? "y" : "ies"}`
      : "Nothing reported";
  }
  if (s.text_sha256) return "Document captured";
  return "Recorded";
}

export default function ProjectDetailsModern({ project, onBack }) {
  const summaryRef = useRef(null);
  const usageTableRef = useRef(null);
  const tableRefs = useRef([]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfRendering, setIsPdfRendering] = useState(false);

  const { userPlan } = useContextElement();
  const isFreePlan = userPlan === "free";

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setIsPdfRendering(true);

      // Track UI event: Export PDF button clicked
      const auditResponse = await trackUIEvent({
        event_type: "EXPORT_PDF_BUTTON_CLICKED",
        resource_type: "REPORT_EXPORT",
        resource_id: "export_pdf_button",
      });

      await new Promise((r) => setTimeout(r, 100)); // wait for React state + Plotly to settle

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const usableWidth = pageWidth - marginX * 2;

      const HEADER_HEIGHT = 24;
      const FOOTER_HEIGHT = 20;

      const CONTENT_TOP = HEADER_HEIGHT + 6;
      const CONTENT_BOTTOM = pageHeight - FOOTER_HEIGHT - 6;
      const CONTENT_HEIGHT = CONTENT_BOTTOM - CONTENT_TOP;

      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const organizationName = userInfo?.organization?.name || "XVALIDATEAI";

      /* ── WATERMARK ─────────────────────────────────────────────────────── */
      const drawWatermark = () => {
        const watermarkText = organizationName.toUpperCase();
        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity: 0.15 }));
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(180, 180, 180);
        const maxWidth = pageWidth * 0.65;
        let fontSize = 140;
        pdf.setFontSize(fontSize);
        while (pdf.getTextWidth(watermarkText) > maxWidth && fontSize > 20) {
          fontSize -= 2;
          pdf.setFontSize(fontSize);
        }
        pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
          align: "center",
          baseline: "middle",
          angle: 45,
        });
        pdf.restoreGraphicsState();
      };

      /* ── LOGO LOAD ─────────────────────────────────────────────────────── */
      const logoImg = new Image();
      logoImg.src = "/assets/img/general/app_logo.png";
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      /* ── HEADER ────────────────────────────────────────────────────────── */
      const drawHeader = () => {
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
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(15, 23, 42);
        pdf.text(
          "AI Governance Readiness Index (AGRI) Report",
          pageWidth / 2,
          19,
          { align: "center" },
        );
        pdf.setDrawColor(226, 232, 240);
        pdf.line(15, HEADER_HEIGHT, pageWidth - 15, HEADER_HEIGHT);
      };

      /* ── FOOTER ────────────────────────────────────────────────────────── */
      // ✅ FIX: footer is NOT drawn during page building.
      // We draw all footers in a second pass AFTER pdf.getNumberOfPages()
      // returns the final count, so "Page X of Y" is always correct.
      const drawFooterOnPage = (pageNumber, totalPages) => {
        pdf.setPage(pageNumber);
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

        // Only show disclaimer on the last page
        if (pageNumber === totalPages) {
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text(
            "Disclaimer: Scores are based solely on information each company publicly discloses. XValidate AI is not liable for the accuracy of these scores.",
            pageWidth / 2,
            pageHeight - 14,
            { align: "center", maxWidth: pageWidth - 30 },
          );
        }

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          "XVALIDATEAI © 2026. All rights reserved.",
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );
        pdf.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - 15,
          pageHeight - 8,
          { align: "right" },
        );
      };
      /* ── HTML CAPTURE ──────────────────────────────────────────────────── */
      const capture = async (el) => {
        if (!el || !el.offsetWidth || !el.offsetHeight) {
          console.warn("Skipping capture: element invalid or zero size");
          return null;
        }

        // ✅ Step 1: Pre-capture all Plotly chart images from real DOM
        // WITHOUT touching real DOM visibility at all — zero flicker
        const originalChartEls = Array.from(
          el.querySelectorAll(".js-plotly-plot"),
        );
        const plotlyImageMap = new Map();
        for (const chart of originalChartEls) {
          try {
            const imgData = await window.Plotly.toImage(chart, {
              format: "jpeg",
              quality: 0.82,
              width: chart.offsetWidth,
              height: chart.offsetHeight,
            });
            plotlyImageMap.set(chart, {
              imgData,
              w: chart.offsetWidth,
              h: chart.offsetHeight,
            });
          } catch (e) {
            console.warn("Pre-convert Plotly failed", e);
          }
        }

        // ✅ Step 2: Clone AFTER image capture — real DOM is NEVER hidden or modified
        const clone = el.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.top = "-10000px";
        clone.style.left = "0";
        clone.style.width = el.offsetWidth + "px";
        clone.style.background = "#ffffff";
        clone.style.boxShadow = "none";
        document.body.appendChild(clone);

        clone
          .querySelectorAll(".section-summary-box")
          .forEach((n) => n.remove());
        clone.querySelectorAll(".admin-actions").forEach((n) => n.remove());

        clone.querySelectorAll("*").forEach((node) => {
          node.style.setProperty("color", "#111111", "important");
          node.style.setProperty("opacity", "1", "important");
          node.style.setProperty("text-shadow", "none", "important");
          node.style.setProperty("box-shadow", "none", "important");
          node.style.setProperty("filter", "none", "important");
        });
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
        clone
          .querySelectorAll(".score-excellent, .score-warning, .score-poor")
          .forEach((node) => {
            node.classList.remove(
              "score-excellent",
              "score-warning",
              "score-poor",
            );
          });
        // Rebuild the score badge completely so label + value are stacked and centered
        clone.querySelectorAll(".section-score-badge").forEach((node) => {
          const label = node.querySelector(".score-label");
          const value = node.querySelector(".score-value");

          const labelText = label ? label.textContent.trim() : "PILLAR SCORE";
          const valueText = value ? value.textContent.trim() : "";

          // Replace inner HTML with a clean two-line layout
          node.innerHTML = `
            <div style="
              display:flex; flex-direction:column; align-items:center;
              justify-content:center; gap:3px;
            ">
              <span style="
                font-size:9px; font-weight:600; letter-spacing:0.8px;
                text-transform:uppercase; color:#444444;
                white-space:nowrap; line-height:1;
              ">${labelText}</span>
              <span style="
                font-size:20px; font-weight:700; color:#000000;
                line-height:1; white-space:nowrap;
              ">${valueText}</span>
            </div>
          `;

          node.style.setProperty("display", "inline-flex", "important");
          node.style.setProperty("align-items", "center", "important");
          node.style.setProperty("justify-content", "center", "important");
          node.style.setProperty("padding", "8px 16px", "important");
          node.style.setProperty("border", "2px solid #111111", "important");
          node.style.setProperty("border-radius", "8px", "important");
          node.style.setProperty("background", "#ffffff", "important");
          node.style.setProperty("min-width", "110px", "important");
          node.style.setProperty("height", "auto", "important");
          node.style.setProperty("overflow", "visible", "important");
        });
        clone.querySelectorAll(".tool-icon, .section-icon").forEach((node) => {
          node.style.setProperty("background", "#ffffff", "important");
          node.style.setProperty("border", "1px solid #111111", "important");
        });
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
        clone.querySelectorAll(".gradient-text").forEach((node) => {
          node.style.background = "none";
          node.style.color = "#111111";
        });

        await new Promise((r) => requestAnimationFrame(r));

        // Use pre-converted images (already captured above) — no re-render needed
        const cloneCharts = Array.from(
          clone.querySelectorAll(".js-plotly-plot"),
        );
        for (let i = 0; i < originalChartEls.length; i++) {
          const cached = plotlyImageMap.get(originalChartEls[i]);
          if (!cached) continue;
          const img = document.createElement("img");
          img.src = cached.imgData;
          img.style.width = cached.w + "px";
          img.style.height = cached.h + "px";
          if (cloneCharts[i])
            cloneCharts[i].parentNode.replaceChild(img, cloneCharts[i]);
        }

        const canvas = await html2canvas(clone, {
          scale: 1.5,
          backgroundColor: "#ffffff",
          useCORS: true,
          imageTimeout: 0,
        });

        document.body.removeChild(clone);
        // ✅ No restore needed — real DOM was never touched

        return canvas;
      };

      /* ── ADD CANVAS WITH PAGING ────────────────────────────────────────── */
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
          if (!isVeryFirstPage && pageIndex === 0) {
            pdf.addPage();
          } else if (pageIndex > 0) {
            pdf.addPage();
          }
          isVeryFirstPage = false;

          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");

          drawHeader();

          // ← footer is intentionally NOT drawn here

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = imgWidthPx;
          sliceCanvas.height = Math.min(pageHeightPx, imgHeightPx - position);

          const ctx = sliceCanvas.getContext("2d");
          ctx.drawImage(
            canvas,
            0,
            position,
            imgWidthPx,
            sliceCanvas.height,
            0,
            0,
            imgWidthPx,
            sliceCanvas.height,
          );

          pdf.addImage(
            sliceCanvas.toDataURL("image/jpeg", 0.82),
            "JPEG",
            marginX,
            CONTENT_TOP,
            usableWidth,
            sliceCanvas.height * ratio,
          );

          drawWatermark();

          position += pageHeightPx;
          pageIndex++;
        }
      };

      /* ── CAPTURE & BUILD ALL PAGES ─────────────────────────────────────── */
      const summaryCanvas = await capture(summaryRef.current);
      addCanvasPaged(summaryCanvas);

      if (usageTableRef.current) {
        const usageCanvas = await capture(usageTableRef.current);
        addCanvasPaged(usageCanvas);
      }

      for (let i = 0; i < tableRefs.current.length; i++) {
        const el = tableRefs.current[i];
        if (!el) continue;
        const sectionCanvas = await capture(el);
        addCanvasPaged(sectionCanvas);
      }

      /* ── SECOND PASS: draw footers with final totalPages ───────────────── */
      const totalPages = pdf.getNumberOfPages(); // ← now accurate
      for (let p = 1; p <= totalPages; p++) {
        drawFooterOnPage(p, totalPages);
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

  /* ---------- CONTINUOUS MONITORING ----------
     What has happened to this tool since it was assessed. The assessment is a
     point in time; this is the part that makes the report a current statement
     rather than a historical one. */
  const [monitoring, setMonitoring] = useState([]);
  const [monitoringState, setMonitoringState] = useState("loading");

  const monitoredDomain = React.useMemo(() => {
    const raw = (project?.url || "").trim();
    if (!raw) return "";
    try {
      const withScheme = raw.includes("://") ? raw : `https://${raw}`;
      const host = new URL(withScheme).hostname.toLowerCase();
      return host.startsWith("www.") ? host.slice(4) : host;
    } catch {
      return "";
    }
  }, [project?.url]);

  const [selectedFinding, setSelectedFinding] = useState(null);
  const [evidence, setEvidence] = useState([]);

  const openArtifact = async (observationId) => {
    try {
      const data = await getObservationArtifact(observationId);
      // Presigned and short-lived, so fetched on click rather than rendered.
      window.open(data.artifact_url, "_blank", "noopener");
    } catch (err) {
      console.warn("Could not open evidence artifact:", err);
    }
  };

  const loadMonitoring = React.useCallback(async () => {
    if (!monitoredDomain) {
      setMonitoringState("unavailable");
      return;
    }
    setMonitoringState("loading");
    try {
      // The evidence trail is fetched alongside the findings, not instead of
      // them. Most vendors have no findings, and "we checked and found
      // nothing" is only worth anything if the reader can see that we checked.
      getObservations({
        subject_type: "VENDOR",
        subject_id: monitoredDomain,
        limit: 10,
      })
        .then((obs) => setEvidence(obs?.observations || []))
        .catch((err) => {
          console.warn("Evidence trail unavailable:", err);
          setEvidence([]);
        });

      const data = await getFindings({
        subject_type: "VENDOR",
        subject_id: monitoredDomain,
        limit: 100,
      });
      // Findings judged to be our own detection error are excluded. A report
      // handed to a customer should not carry items we already decided were
      // wrong.
      setMonitoring(
        (data?.findings || []).filter((f) => f.status !== "FALSE_POSITIVE"),
      );
      setMonitoringState("ready");
    } catch (err) {
      console.warn("Monitoring findings unavailable:", err);
      setMonitoringState("error");
    }
  }, [monitoredDomain]);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

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
        text: "Recommended",
        class: "badge-success",
      };
    } else if (rec.includes("limitation")) {
      return {
        icon: "fa-circle-exclamation",
        text: "Recommended with Limitations",
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
      <div className="mt-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={() => onBack?.(false)}
            className="inline-flex items-center gap-2 px-4 py-2.5
             text-sm font-medium text-[#001d6c]
             bg-gray-50 border border-gray-300
             rounded-xl transition
             hover:bg-gray-100 hover:shadow-sm"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to AI Compliance</span>
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center justify-end">
            <button
              disabled={isDownloading || isFreePlan}
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-5 py-2.5
               text-sm font-semibold text-white
               bg-[#0F3357] rounded-xl
               transition
               hover:bg-[#0c2a47] hover:shadow-md
               disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>{isDownloading ? "Exporting..." : "Export PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Header Card */}
      <div ref={summaryRef}>
        <div className="glass-card report-header animate-fade-in">
          <div className="grid grid-cols-[1fr_3fr_1fr] items-center">
            {/* Left Spacer */}
            <div></div>

            {/* Center Title */}
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold text-primary tracking-wide whitespace-nowrap">
                AI Governance Readiness Index (AGRI) Report
              </h1>
            </div>

            {/* Right Section */}

            <div className="pt-14 text-right space-y-2">
              {badge && (
                <>
                  <div className={`badge ${badge.class}`}>
                    <i className={`fa-solid ${badge.icon}`}></i> {badge.text}
                  </div>

                  <p className="date-text whitespace-nowrap">
                    Generated: {dateString}
                  </p>
                </>
              )}
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
                <p className="score-label">
                  AI Governance Readiness Index (AGRI) Score
                </p>
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
                      <p>{recommendationLabel(project.recommendation)}</p>
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

        {/* Continuous Monitoring */}
        <div
          className="glass-card animate-fade-in"
          style={{ animationDelay: "0.9s" }}
        >
          <div className="section-header">
            <div className="section-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3>Since This Assessment</h3>
          </div>

          <div className="recommendation-content">
            {monitoringState === "loading" && (
              <p className="summary-text">Checking monitoring history…</p>
            )}

            {monitoringState === "unavailable" && (
              <p className="summary-text">
                No tool URL is recorded, so this tool is not being monitored.
              </p>
            )}

            {/* An error must not read as "nothing found" - that is the same
                false all-clear the checks themselves guard against. */}
            {monitoringState === "error" && (
              <p className="summary-text">
                Monitoring history could not be loaded. This is not a statement
                that nothing has been found.
              </p>
            )}

            {monitoringState === "ready" && monitoring.length === 0 && (
              <div className="recommendation-box success">
                <i className="fa-solid fa-circle-check"></i>
                <div>
                  <h4>No incidents or policy changes detected</h4>
                  <p>
                    {monitoredDomain} is checked daily against known breach
                    records and published vulnerabilities, and its policy
                    documents are compared against the last captured version.
                  </p>
                </div>
              </div>
            )}

            {monitoringState === "ready" &&
              monitoring.map((f) => (
                <div
                  key={f.finding_id}
                  className={`recommendation-box ${
                    f.severity === "CRITICAL" || f.severity === "HIGH"
                      ? "warning"
                      : "success"
                  }`}
                >
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div style={{ width: "100%" }}>
                    <h4>
                      {f.severity} — {f.title}
                    </h4>
                    <p style={{ whiteSpace: "pre-wrap" }}>{f.detail}</p>
                    <p className="text-14 text-light-1">
                      First seen{" "}
                      {f.first_seen_at
                        ? new Date(f.first_seen_at).toLocaleDateString()
                        : "--"}
                      {f.occurrence_count > 1
                        ? ` · confirmed on ${f.occurrence_count} checks`
                        : " · observed once"}
                      {f.status && f.status !== "OPEN" ? ` · ${f.status}` : ""}
                    </p>
                    {/* admin-actions is stripped from the PDF export, so the
                        printed report carries the finding without the controls. */}
                    <div className="admin-actions">
                      <button
                        type="button"
                        onClick={() => setSelectedFinding(f)}
                        className="text-14"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          color: COLORS.primary,
                          fontWeight: 600,
                        }}
                      >
                        Review evidence and triage →
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {monitoringState === "ready" && evidence.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 8 }}>Checks performed</h4>
                <p className="text-14 text-light-1" style={{ marginBottom: 12 }}>
                  Every check is recorded with the raw response it was based on,
                  so any statement above can be traced back to what was actually
                  seen.
                </p>
                <table className="w-full text-14">
                  <thead>
                    <tr className="text-left text-light-1">
                      <th style={{ padding: "6px 12px 6px 0" }}>Date</th>
                      <th style={{ padding: "6px 12px 6px 0" }}>Check</th>
                      <th style={{ padding: "6px 12px 6px 0" }}>Result</th>
                      <th className="admin-actions" style={{ padding: "6px 0" }}>
                        Evidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.map((o) => (
                      <tr key={o.observation_id}>
                        <td style={{ padding: "6px 12px 6px 0" }}>
                          {o.captured_at
                            ? new Date(o.captured_at).toLocaleDateString()
                            : "--"}
                        </td>
                        <td style={{ padding: "6px 12px 6px 0" }}>
                          {CHECK_LABELS[o.check_type] || o.check_type}
                        </td>
                        <td style={{ padding: "6px 12px 6px 0" }}>
                          {describeObservation(o)}
                        </td>
                        {/* Stripped from the PDF: the dates and results are the
                            evidence, the link is only useful on screen. */}
                        <td className="admin-actions" style={{ padding: "6px 0" }}>
                          <button
                            type="button"
                            onClick={() => openArtifact(o.observation_id)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              color: COLORS.primary,
                            }}
                          >
                            Open raw capture
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <FindingDetail
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onChanged={loadMonitoring}
      />

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
                      <span className="score-label">PILLAR SCORE</span>
                      <span className={`score-value ${sectionScoreClass}`}>
                        {Number(section.average_score).toFixed(1)}
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
                                  {item.score}/5
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
        <p
          className="footer-subtext"
          style={{ marginTop: "8px", fontStyle: "italic" }}
        >
          <strong>Disclaimer:</strong> Scores are based solely on information each company publicly discloses. XValidate AI is not liable for the accuracy of these scores.
        </p>
        <p
          className="footer-subtext"
          style={{ marginTop: "8px", fontStyle: "italic" }}
        >
          For questions or concerns, contact support@xvalidateai.com
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
