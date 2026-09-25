import React, { useEffect, useMemo, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { COLORS } from "@/styles/colors";
import { updateComplianceProject } from "../../../apiIntegration/compliance";
import { trackUIEvent } from "../../../apiIntegration/audittrail";
import ApproveRejectModal from "./ApproveRejectModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useContextElement } from "@/context/Context";
import { recommendationLabel } from "@/utils/recommendationLabel";
import { getFindings, getObservations } from "@/apiIntegration/verification";
import FindingDetail from "@/components/dashboard/verification/FindingDetail";
import EvidenceDetail from "@/components/dashboard/verification/EvidenceDetail";
import { S as ES } from "@/components/dashboard/verification/evidenceStyles";

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
// Findings carry their source appended to the detail text as "Source: <url>".
// Rendered inline that dumps a raw URL mid-paragraph; it belongs as a link.
function splitSource(detail) {
  if (!detail) return { body: "", sourceUrl: null };
  const m = detail.match(/\s*Source:\s*(https?:\/\/\S+)\s*$/);
  if (!m) return { body: detail.trim(), sourceUrl: null };
  return { body: detail.slice(0, m.index).trim(), sourceUrl: m[1] };
}

// occurred_at was added after these findings were created and is backfilled on
// the next sweep. Until then the real date is only inside the detail text, and
// showing "Detected today" alone makes a 2019 breach look new.
function occurredDate(f) {
  if (f.occurred_at) return new Date(f.occurred_at).toLocaleDateString();
  const m = (f.detail || "").match(/breach dated (\d{4}-\d{2}-\d{2})/);
  return m ? new Date(m[1]).toLocaleDateString() : null;
}

const CHECK_LABELS = {
  SECURITY_INCIDENT: "Breaches and published vulnerabilities",
  PRIVACY_POLICY: "Privacy policy",
  TERMS_OF_SERVICE: "Terms of service",
  DPA: "Data processing addendum",
  SUBPROCESSOR_LIST: "Subprocessor list",
  SECURITY_PAGE: "Security page",
  STUDENT_DATA_ADDENDUM: "Student data addendum",
};

// Every severity below CRITICAL used to fall through to the same amber
// "warning" box, so a LOW certificate notice looked exactly as urgent as a
// HIGH breach report. Each level now gets its own tone, taken from the design
// system's existing ramp rather than new colours: red -> deep orange -> amber
// -> blue -> grey, descending.
const SEVERITY_TONE = {
  CRITICAL: { accent: "#da1e28", label: "#da1e28" }, // error
  HIGH: { accent: "#e66a0f", label: "#e66a0f" }, // warning-dark
  MEDIUM: { accent: "#ff832b", label: "#b45309" }, // warning
  LOW: { accent: "#4780aa", label: "#33617f" }, // info
  INFO: { accent: "#8d8d8d", label: "#6b7280" }, // neutral
};

// 14 and 33 are the alpha suffixes already used for the critical tint, kept so
// every card sits at the same weight as the surrounding boxes.
function severityTone(severity) {
  const tone = SEVERITY_TONE[severity] || SEVERITY_TONE.INFO;
  return {
    ...tone,
    background: `${tone.accent}14`,
    border: `1px solid ${tone.accent}33`,
  };
}

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

  // Findings collapse to a one-line summary so a tool with many of them does
  // not bury the rest of the report. Severity and title stay visible while
  // collapsed - shortening the section must not hide what was found.
  const [monitoringOpen, setMonitoringOpen] = useState(true);
  const [openFindings, setOpenFindings] = useState(() => new Set());

  const toggleFinding = (id) =>
    setOpenFindings((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const { userPlan } = useContextElement();
  const isFreePlan = userPlan === "free";

  // A view-only account cannot take the compliance report away: the PDF is for
  // the roles that own the record, the same rule the dashboard exports follow.
  const isUserOnly = useMemo(() => {
    const info = JSON.parse(localStorage.getItem("user_info") || "{}");
    const list = Array.isArray(info.roles)
      ? info.roles
      : String(info.roles || "").split(",");
    const upper = list.map((r) => r.toUpperCase().trim()).filter(Boolean);
    return upper.length > 0 && upper.every((r) => r === "USER");
  }, []);

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
        // html2canvas lays flex items out on their text baseline and drops
        // white-on-colour labels, so the severity chip is rebuilt for print:
        // plain inline text in the severity colour, outlined rather than
        // filled, on the same line box as the title it labels.
        clone.querySelectorAll(".severity-pill").forEach((node) => {
          const accent =
            node.style.backgroundColor || node.style.background || "#111111";
          node.style.cssText = "";
          node.style.setProperty("display", "inline", "important");
          node.style.setProperty("background", "#ffffff", "important");
          node.style.setProperty("border", `1px solid ${accent}`, "important");
          node.style.setProperty("border-radius", "10px", "important");
          node.style.setProperty("color", accent, "important");
          node.style.setProperty("padding", "1px 7px", "important");
          node.style.setProperty("margin-right", "8px", "important");
          node.style.setProperty("font-size", "10px", "important");
          node.style.setProperty("font-weight", "700", "important");
          node.style.setProperty("letter-spacing", "0.04em", "important");
          node.style.setProperty("white-space", "nowrap", "important");
        });
        clone.querySelectorAll(".finding-heading").forEach((node) => {
          node.style.setProperty("display", "block", "important");
          node.style.setProperty("line-height", "18px", "important");
        });
        clone.querySelectorAll(".finding-title").forEach((node) => {
          node.style.setProperty("display", "inline", "important");
          node.style.setProperty("margin", "0", "important");
          node.style.setProperty("font-size", "13px", "important");
          node.style.setProperty("line-height", "18px", "important");
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

        const CAPTURE_SCALE = 1.5;

        // Where each self-contained block sits in the rendered image. The page
        // slicer uses these so a page break lands between findings rather than
        // through the middle of one.
        const cloneTop = clone.getBoundingClientRect().top;
        const atomicBlocks = Array.from(
          clone.querySelectorAll(
            ".recommendation-box, .summary-card, .section-score-badge, tr",
          ),
        )
          .map((node) => {
            const r = node.getBoundingClientRect();
            return {
              top: (r.top - cloneTop) * CAPTURE_SCALE,
              bottom: (r.bottom - cloneTop) * CAPTURE_SCALE,
            };
          })
          .filter((b) => b.bottom > b.top)
          .sort((a, b) => a.top - b.top);

        const canvas = await html2canvas(clone, {
          scale: CAPTURE_SCALE,
          backgroundColor: "#ffffff",
          useCORS: true,
          imageTimeout: 0,
        });

        document.body.removeChild(clone);
        // ✅ No restore needed — real DOM was never touched

        return { canvas, blocks: atomicBlocks };
      };

      /* ── SAFE PAGE BREAKS ──────────────────────────────────────────────—
         Move a page break up to the top of whatever block it would otherwise
         cut through. A block taller than a page is left alone — it has to be
         split somewhere — and a break is never pulled so far up that it leaves
         a nearly empty page. */
      const findSafeCut = (blocks, position, maxCut, pageHeightPx) => {
        const minSlice = pageHeightPx * 0.3;
        const gap = 8;
        let cut = maxCut;

        // Moving the break up can expose an earlier block, so repeat until the
        // break is clear of every block.
        for (let i = 0; i < 12; i++) {
          const straddler = blocks.find(
            (b) =>
              b.top < cut &&
              b.bottom > cut &&
              b.bottom - b.top <= pageHeightPx * 0.95 &&
              b.top - gap > position + minSlice,
          );
          if (!straddler) break;
          cut = straddler.top - gap;
        }

        return cut > position + minSlice ? cut : maxCut;
      };

      /* ── ADD CANVAS WITH PAGING ────────────────────────────────────────── */
      let isVeryFirstPage = true;

      const addCanvasPaged = (captured) => {
        const canvas = captured?.canvas || captured;
        const blocks = captured?.blocks || [];
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

          const remaining = imgHeightPx - position;
          const hardCut = position + pageHeightPx;
          // Only the breaks before the end of the image can be moved; the last
          // slice ends at the image itself.
          const cut =
            hardCut < imgHeightPx
              ? findSafeCut(blocks, position, hardCut, pageHeightPx)
              : imgHeightPx;

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = imgWidthPx;
          sliceCanvas.height = Math.min(cut - position, remaining);

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

          position += sliceCanvas.height;
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

  // A single finding, or a clean result, is already short enough to read in
  // place - collapsing it would add a control that saves nothing. Declared
  // after the state it reads: const is not hoisted like var, so referencing it
  // above these lines throws at render.
  const monitoringCollapsible =
    monitoringState === "ready" && monitoring.length > 1;

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
  const [selectedObservation, setSelectedObservation] = useState(null);

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
      {/* Top Actions - sticky so Back and Export stay reachable on a long report.
          The wrapper paints the page background, and the upward shadow covers
          the scroll container's top inset so the report can't show above the bar. */}
      <div
        className="sticky top-0 z-30"
        style={{ background: "#FAFAFA", boxShadow: "0 -48px 0 0 #FAFAFA" }}
      >
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
                disabled={isDownloading || isFreePlan || isUserOnly}
                onClick={handleDownloadPDF}
                title={
                  isUserOnly
                    ? "You have view-only access"
                    : isFreePlan
                      ? "Upgrade plan to export"
                      : ""
                }
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
                  {/* The variant was hardcoded to success with a tick, so
                      "Not Recommended" was presented as a pass. The box has to
                      follow the verdict it is displaying. */}
                  {(() => {
                    const rec = (project.recommendation || "").toLowerCase();
                    const negative =
                      rec.includes("not recommended") ||
                      rec.includes("do not use") ||
                      rec.includes("rejected");
                    const qualified =
                      rec.includes("limitation") || rec.includes("restricted");
                    return (
                      <div
                        className={`recommendation-box ${negative || qualified ? "warning" : "success"}`}
                        style={
                          negative
                            ? {
                                background: `${COLORS.error}14`,
                                border: `1px solid ${COLORS.error}33`,
                              }
                            : undefined
                        }
                      >
                        <i
                          className={
                            negative
                              ? "fa-solid fa-circle-xmark"
                              : qualified
                                ? "fa-solid fa-circle-exclamation"
                                : "fa-solid fa-circle-check"
                          }
                          style={{ color: negative ? COLORS.error : undefined }}
                        ></i>
                        <div>
                          <h4>Final Recommendation</h4>
                          <p>{recommendationLabel(project.recommendation)}</p>
                        </div>
                      </div>
                    );
                  })()}

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

        {/* Continuous Monitoring - shares the Recommendations layout, so it
            carries the same .recommendations padding rather than sitting
            flush against the card edges. The icon stays neutral: this
            section's state varies from all-clear to critical, so a fixed
            amber "warning" tint would contradict a green result. */}
        <div
          className="glass-card recommendations animate-fade-in"
          style={{ animationDelay: "0.9s" }}
        >
          {/* Collapsing only earns its place once there are several findings.
              With none or one the section is already short, so the chevron
              would be a control that saves nothing. Everything is forced open
              while the PDF renders - this section is inside usageTableRef, so
              a collapsed card would export as a blank one. */}
          <div
            className="section-header"
            onClick={
              monitoringCollapsible
                ? () => setMonitoringOpen((v) => !v)
                : undefined
            }
            role={monitoringCollapsible ? "button" : undefined}
            tabIndex={monitoringCollapsible ? 0 : undefined}
            aria-expanded={monitoringCollapsible ? monitoringOpen : undefined}
            onKeyDown={
              monitoringCollapsible
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMonitoringOpen((v) => !v);
                    }
                  }
                : undefined
            }
            style={
              monitoringCollapsible
                ? { cursor: "pointer", userSelect: "none" }
                : undefined
            }
          >
            <div className="section-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3>Since This Assessment</h3>

            {!isFreePlan &&
              monitoringState === "ready" &&
              monitoring.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    background: COLORS.bgSecondary,
                    borderRadius: 999,
                    padding: "3px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {monitoring.length} finding
                  {monitoring.length === 1 ? "" : "s"}
                </span>
              )}

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {!isFreePlan && monitoringOpen && monitoringCollapsible && (
                <button
                  type="button"
                  className="admin-actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFindings((prev) =>
                      prev.size === monitoring.length
                        ? new Set()
                        : new Set(monitoring.map((f) => f.finding_id)),
                    );
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.info,
                  }}
                >
                  {openFindings.size === monitoring.length
                    ? "Collapse all"
                    : "Expand all"}
                </button>
              )}
              {monitoringCollapsible && (
                <i
                  className={`fa-solid ${monitoringOpen ? "fa-chevron-up" : "fa-chevron-down"}`}
                  style={{ color: COLORS.textMuted, fontSize: 14 }}
                />
              )}
            </div>
          </div>

          <div
            className="recommendation-content"
            style={{
              display:
                !monitoringCollapsible || monitoringOpen || isPdfRendering
                  ? undefined
                  : "none",
            }}
          >
            {/* Findings are a paid feature, like the recommendations above. */}
            {isFreePlan && (
              <div className="recommendation-locked">
                <div className="recommendation-box locked">
                  <i className="fa-solid fa-lock"></i>
                  <div>
                    <h4>Findings Locked</h4>
                    <p>
                      Upgrade your plan to see what has been found about this
                      tool since the assessment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isFreePlan && monitoringState === "loading" && (
              <p className="summary-text">Checking monitoring history…</p>
            )}

            {!isFreePlan && monitoringState === "unavailable" && (
              <p className="summary-text">
                No tool URL is recorded, so this tool is not being monitored.
              </p>
            )}

            {/* An error must not read as "nothing found" - that is the same
                false all-clear the checks themselves guard against. */}
            {!isFreePlan && monitoringState === "error" && (
              <p className="summary-text">
                Monitoring history could not be loaded. This is not a statement
                that nothing has been found.
              </p>
            )}

            {!isFreePlan &&
              monitoringState === "ready" &&
              monitoring.length === 0 && (
                <div className="recommendation-box success">
                  <i className="fa-solid fa-circle-check"></i>
                  <div>
                    <h4>Nothing found in the sources we check</h4>
                    <p>
                      {monitoredDomain} is checked daily against Have I Been
                      Pwned for known breaches, the National Vulnerability
                      Database for published CVEs, and its own policy documents
                      and TLS certificate.
                    </p>
                    {/* Stating the limit rather than implying completeness.
                      HIBP is curated, not exhaustive - it holds around a
                      thousand breaches and only single figures for some
                      regions - so a clean result here is not the same as a
                      vendor never having been breached. */}
                    <p
                      className="text-light-1"
                      style={{ fontSize: 13, marginTop: 8 }}
                    >
                      These sources are not exhaustive. Breach databases only
                      contain incidents that have been reported to and curated
                      by them, and regional coverage varies widely. This is not
                      a statement that no breach has occurred.
                    </p>
                  </div>
                </div>
              )}

            {!isFreePlan &&
              monitoringState === "ready" &&
              monitoring.map((f) => {
                const tone = severityTone(f.severity);
                // Forced open for the PDF so the exported report carries the
                // full finding regardless of what is collapsed on screen.
                const open =
                  isPdfRendering ||
                  !monitoringCollapsible ||
                  openFindings.has(f.finding_id);
                return (
                  <div
                    key={f.finding_id}
                    className="recommendation-box"
                    style={{ background: tone.background, border: tone.border }}
                  >
                    <i
                      className="fa-solid fa-triangle-exclamation"
                      style={{ color: tone.accent }}
                    ></i>
                    <div
                      style={{
                        width: "100%",
                        minWidth: 0,
                        // The box class no longer carries a colour, so body text
                        // takes the page's own text colour at every severity.
                        color: COLORS.textPrimary,
                      }}
                    >
                      <div
                        onClick={
                          monitoringCollapsible
                            ? () => toggleFinding(f.finding_id)
                            : undefined
                        }
                        role={monitoringCollapsible ? "button" : undefined}
                        tabIndex={monitoringCollapsible ? 0 : undefined}
                        aria-expanded={monitoringCollapsible ? open : undefined}
                        onKeyDown={
                          monitoringCollapsible
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleFinding(f.finding_id);
                                }
                              }
                            : undefined
                        }
                        className="finding-heading"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                          marginBottom: open ? 8 : 0,
                          ...(monitoringCollapsible
                            ? { cursor: "pointer", userSelect: "none" }
                            : null),
                        }}
                      >
                        <span
                          className="severity-pill"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                            color: "#fff",
                            background: tone.accent,
                          }}
                        >
                          {f.severity}
                        </span>
                        <h4
                          className="finding-title"
                          style={{ margin: 0, color: tone.label }}
                        >
                          {f.title}
                        </h4>
                        {monitoringCollapsible && (
                          <i
                            className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}`}
                            style={{
                              marginLeft: "auto",
                              color: COLORS.textMuted,
                              fontSize: 12,
                            }}
                          />
                        )}
                      </div>
                      {open &&
                        (() => {
                          const { body, sourceUrl } = splitSource(f.detail);
                          const occurred = occurredDate(f);
                          return (
                            <>
                              <p
                                style={{
                                  whiteSpace: "pre-wrap",
                                  margin: "0 0 8px",
                                }}
                              >
                                {body}
                              </p>
                              <p
                                className="text-light-1"
                                style={{ fontSize: 13, margin: 0 }}
                              >
                                {occurred ? `Occurred ${occurred} · ` : ""}
                                Detected{" "}
                                {f.first_seen_at
                                  ? new Date(
                                      f.first_seen_at,
                                    ).toLocaleDateString()
                                  : "--"}
                                {f.occurrence_count > 1
                                  ? ` · confirmed on ${f.occurrence_count} checks`
                                  : " · observed once"}
                                {f.status && f.status !== "OPEN"
                                  ? ` · ${f.status}`
                                  : ""}
                              </p>
                              {/* admin-actions is stripped from the PDF export, so
                              the printed report carries the finding without
                              the controls. */}
                              <div
                                className="admin-actions"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 16,
                                  flexWrap: "wrap",
                                  marginTop: 12,
                                }}
                              >
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
                                {sourceUrl && (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-14"
                                    style={{
                                      color: COLORS.primary,
                                      fontWeight: 600,
                                    }}
                                  >
                                    View the source record{" "}
                                    <i
                                      className="fa-solid fa-arrow-up-right-from-square"
                                      style={{ fontSize: 10 }}
                                    />
                                  </a>
                                )}
                              </div>
                            </>
                          );
                        })()}
                    </div>
                  </div>
                );
              })}

            {monitoringState === "ready" && evidence.length > 0 && (
              <div style={{ marginTop: 28 }}>
                {/* Styled explicitly rather than relying on the global h1-h6
                    rule. Tailwind's Play CDN (loaded in index.html) ships
                    Preflight, which resets heading size and weight to inherit.
                    Its <style> is injected at runtime, so it lands after the
                    bundled stylesheet in a production build but before Vite's
                    runtime-injected CSS in dev - the same markup rendered
                    styled locally and unstyled on the server. */}
                <h4
                  style={{
                    marginBottom: 6,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: COLORS.textPrimary,
                  }}
                >
                  Checks performed
                </h4>
                <p
                  className="text-light-1"
                  style={{ marginBottom: 14, fontSize: 13 }}
                >
                  Every check is recorded with the raw response it was based on,
                  so any statement above can be traced back to what was actually
                  seen.
                </p>
                <table style={ES.table}>
                  <thead>
                    <tr className="text-light-1">
                      <th style={ES.th}>Date</th>
                      <th style={ES.th}>Check</th>
                      <th style={ES.th}>Result</th>
                      <th className="admin-actions" style={ES.th}>
                        Evidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.map((o) => (
                      <tr key={o.observation_id}>
                        <td style={ES.td}>
                          {o.captured_at
                            ? new Date(o.captured_at).toLocaleString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "--"}
                        </td>
                        <td style={ES.td}>
                          {CHECK_LABELS[o.check_type] || o.check_type}
                        </td>
                        <td style={ES.td}>{describeObservation(o)}</td>
                        {/* Stripped from the PDF: the dates and results are the
                            evidence, the link is only useful on screen. */}
                        <td className="admin-actions" style={ES.td}>
                          <button
                            type="button"
                            onClick={() => setSelectedObservation(o)}
                            style={{ ...ES.linkButton, color: COLORS.primary }}
                          >
                            View details
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

      <EvidenceDetail
        observation={selectedObservation}
        onClose={() => setSelectedObservation(null)}
      />

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
          <strong>Disclaimer:</strong> Scores are based solely on information
          each company publicly discloses. XValidate AI is not liable for the
          accuracy of these scores.
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
