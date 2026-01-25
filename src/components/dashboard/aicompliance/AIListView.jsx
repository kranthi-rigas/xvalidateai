import React, { useState, useEffect, useRef } from "react";
import EditProjectModal from "./EditProjectModal";
import DeleteConfirmModal from "../../common/DeleteConfirmModal";
import ActionsMenu from "../../common/ActionsMenu";
import ListTable, { Td, LinkStyle } from "../../common/ListTable";
import RefreshButton from "../../common/RefreshButton";
import AwsButton from "../../common/AwsButton";
import ApproveRejectModal from "./ApproveRejectModal";
import {
  updateComplianceProject,
  getComplianceProjectDetails,
  deleteComplianceProject,
} from "../../../apiIntegration/compliance";
import { RiErrorWarningLine } from "react-icons/ri";
import { PiWarningCircleBold } from "react-icons/pi";
import { RxCrossCircled } from "react-icons/rx";
import { GrStatusGood } from "react-icons/gr";
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import useToast from "../../../hooks/useToast";
import TablePreferencesModal from "../../common/TablePreferencesModal";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";
import CreditInfoNote from "./CreditInfoNote";

const STATUS_BADGE_MAP = {
  pending_assessment: {
    bg: "#FEF3C7",
    color: "#92400E",
    border: "#FDE68A",
  },
  requested: {
    bg: "#E0F2FE",
    color: "#075985",
    border: "#7DD3FC",
  },
  requested_for_scan: {
    bg: "#E0F2FE",
    color: "#075985",
    border: "#7DD3FC",
  },
  approved_for_scan: {
    bg: "#DCFCE7",
    color: "#166534",
    border: "#86EFAC",
  },
  rejected_for_scan: {
    bg: "#FEE2E2",
    color: "#991B1B",
    border: "#FCA5A5",
  },
  scan_in_progress: {
    bg: "#E0E7FF",
    color: "#3730A3",
    border: "#A5B4FC",
  },
  completed: {
    bg: "#ECFDF5",
    color: "#065F46",
    border: "#6EE7B7",
  },
  approved_for_usage: {
    bg: "#DCFCE7",
    color: "#14532D",
    border: "#86EFAC",
  },
  rejected_for_usage: {
    bg: "#FEE2E2",
    color: "#7F1D1D",
    border: "#FCA5A5",
  },
};

export default function AIListView({
  projects,
  setShowCreateModal,
  setOpenedProject,
  refreshProjects,
}) {
  const [hover, setHover] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const pageLoading = usePageLoader([projects]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const rolesRaw = userInfo?.roles ?? [];
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.map((r) => String(r).toUpperCase())
    : String(rolesRaw).toUpperCase().split(",");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [deleteError, setDeleteError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // approve | reject
  const [activeProject, setActiveProject] = useState(null);

  const show = useToast();
  const [approvalError, setApprovalError] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const isRequested = (row) => row.status === "requested";

  const hasAdminRole = roles.includes("ADMIN");
  const hasAuditorRole = roles.includes("AUDITOR");
  const hasAnalystRole = roles.includes("ANALYST");

  const isAdmin = hasAdminRole;
  const isAuditor = hasAuditorRole;
  // ✅ Analyst-only = NO higher privilege
  const isAnalystOnly = hasAnalystRole && !hasAdminRole && !hasAuditorRole;

  /* ---------- Add columnWidths state ---------- */
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    name: 190,
    description: 180,
    status: 200,
    assessment_status: 120,
    score: 100,
    recommendation: 190,
    lastScanDate: 180,
    requested_by: 220,
    approved_by: 220,
  });

  const resizingCol = useRef(null);

  const startResize = (key, e) => {
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    };
  };

  const handleResize = (e) => {
    if (!resizingCol.current) return;
    const { key, startX, startWidth } = resizingCol.current;
    const newWidth = Math.max(80, startWidth + (e.clientX - startX));
    setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
  };

  useEffect(() => {
    setLiveProjects(projects || []);
  }, [projects]);

  useEffect(() => {
    const POLLABLE_STATUSES = [
      "approved_for_scan",
      "scan_in_progress",
      "queued",
    ];

    const pollableProjects = liveProjects.filter(
      (p) =>
        POLLABLE_STATUSES.includes(p.status) ||
        ["queued", "in_progress"].includes(p.assessment_status),
    );

    if (pollableProjects.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const results = await Promise.all(
          pollableProjects.map(async (p) => {
            try {
              return await getComplianceProjectDetails(p.project_id);
            } catch {
              return null;
            }
          }),
        );

        const updates = results.filter(Boolean);
        if (!updates.length) return;

        setLiveProjects((prev) =>
          prev.map((p) => {
            const updated = updates.find((u) => u.project_id === p.project_id);
            return updated ? { ...p, ...updated } : p;
          }),
        );
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [liveProjects]);

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", () => (resizingCol.current = null));
    return () => window.removeEventListener("mousemove", handleResize);
  }, []);

  // 🔤 Convert snake_case / lowercase to Title Case
  const toTitleCase = (value = "") =>
    value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  //STATUS LABEL MAPPER
  const getAssessmentStatusLabel = (row) => {
    if (row.status === "requested") return "Requested For Scan";
    return row.status ? toTitleCase(row.status) : "-";
  };

  /* ---------- Search ---------- */
  const filtered = (liveProjects || [])
    .filter((p) => (p.name || "").toLowerCase().includes(search.toLowerCase()))
    .map((p) => ({ ...p, __isSelected: selected.includes(p.project_id) }));

  /* ---------- Sorting ---------- */
  const requestSort = (key) => {
    let dir = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") dir = "desc";
    setSortConfig({ key, direction: dir });
  };

  /* ---------- Selection ---------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (checked) =>
    setSelected(checked ? filtered.map((x) => x.project_id) : []);

  //status helper
  const isPendingAssessment = (row) => row.status === "pending_assessment";
  const formatStatusLabel = (status = "") => status.replace(/_/g, " ");

  function WhiteTooltip({ text, children }) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const ref = useRef(null);

    const handleEnter = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();

      setPos({
        top: rect.top + rect.height / 2, // vertically centered
        left: rect.right + 10, // 🔥 RIGHT SIDE + gap
      });

      setShow(true);
    };

    return (
      <>
        <span
          ref={ref}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setShow(false)}
          style={{ display: "inline-block" }}
        >
          {children}
        </span>

        {show && text && (
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateY(-50%)",
              background: "#FFFFFF",
              color: "#111827",
              border: "1px solid #D1D5DB",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
              zIndex: 10000,
              pointerEvents: "none",
            }}
          >
            {text}
          </div>
        )}
      </>
    );
  }

  /* ---------- Columns ---------- */
  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 60,
      sortable: false,
      resizable: false,

      // ⭐ Select-all only active if there are rows
      allSelected: filtered.length > 0 && selected.length === filtered.length,

      // ⭐ Toggle all
      onToggleAll: (checked) =>
        setSelected(checked ? filtered.map((p) => p.project_id) : []),
    },

    { key: "name", label: "Tool Name", sortable: true, resizable: true },

    {
      key: "status",
      label: "Tool Status",
      sortable: true,
      resizable: true,
    },
    {
      key: "assessment_status",
      label: "Scan Status",
      sortable: true,
      resizable: true,
    },

    { key: "score", label: "Score", sortable: true, resizable: true },
    {
      key: "recommendation",
      label: "Recommendation",
      sortable: true,
      resizable: true,
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      resizable: true,
    },
    {
      key: "lastScanDate",
      label: "Last Scan",
      sortable: true,
      resizable: true,
      sortKey: "last_scanned_time",
    },
    {
      key: "requested_by",
      label: "Requested By",
      sortable: false,
      resizable: true,
    },
    {
      key: "approved_by",
      label: "Scan Approved By",
      sortable: false,
      resizable: true,
    },
  ];

  //Settings icon helper
  const [pageSize, setPageSize] = useState(50);
  const [wrapLines, setWrapLines] = useState(false);
  const [stripedRows, setStripedRows] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((c) => c.key),
  );

  const toggleColumn = (key) =>
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));

  //score icon helper
  // ⭐ SCORE ICON HELPER (Enterprise / AWS style)
  const getScoreIconUI = (score) => {
    const s = Number(score) || 0;

    if (s < 20)
      return {
        Icon: RxCrossCircled,
        color: "#DC2626", // red
        label: "Critical Risk",
      };

    if (s < 40)
      return {
        Icon: RiErrorWarningLine,
        color: "#EA580C", // orange
        label: "High Risk",
      };

    if (s < 60)
      return {
        Icon: PiWarningCircleBold,
        color: "#EAB308", // yellow
        label: "Medium Risk",
      };

    if (s < 80)
      return {
        Icon: GrStatusGood,
        color: "#22C55E", // light green
        label: "Low Risk",
      };

    return {
      Icon: GrStatusGood,
      color: "#16A34A", // dark green
      label: "Excellent",
    };
  };

  //Recommendation helper
  const getRecommendationUI = (row) => {
    const rec = (row.recommendation || "").toLowerCase();
    const assessment = (row.assessment_status || "").toLowerCase();

    // 🔴 Error case
    if (assessment === "error" || assessment === "failed") {
      return {
        label: "Error",
        bg: "#FEE2E2",
        color: "#991B1B",
        border: "#FCA5A5",
      };
    }

    // ⏳ Pending (scan not started)
    if (
      !assessment ||
      assessment === "not_applicable" ||
      assessment === "queued"
    ) {
      return {
        label: "Pending",
        bg: "#F3F4F6",
        color: "#374151",
        border: "#E5E7EB",
      };
    }

    // ❌ Not Recommended
    if (rec === "not recommended") {
      return {
        label: "Not Recommended",
        bg: "#FEE2E2",
        color: "#991B1B",
        border: "#FCA5A5",
      };
    }

    // ⚠️ Approved with limitations
    if (rec === "approved with limitations") {
      return {
        label: "Approved with limitations",
        bg: "#FEF3C7",
        color: "#92400E",
        border: "#FDE68A",
      };
    }

    // ✅ Approved
    if (rec === "approved") {
      return {
        label: "Approved",
        bg: "#DCFCE7",
        color: "#166534",
        border: "#86EFAC",
      };
    }

    // 🔹 Default fallback
    return {
      label: "-",
      bg: "#F3F4F6",
      color: "#374151",
      border: "#E5E7EB",
    };
  };

  /* ---------- Cell renderer ---------- */
  // Measure text width exactly like the browser does
  const measureTextWidth = (text, font = "14px Amazon Ember") => {
    const canvas =
      measureTextWidth.canvas ||
      (measureTextWidth.canvas = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  // Should show tooltip only if truncated in actual pixels
  const shouldShowTooltip = (value, key) => {
    if (!value) return false;

    const max = columnWidths[key] - 24; // padding + ellipsis space
    const textWidth = measureTextWidth(value);

    return textWidth > max;
  };

  const renderCell = (row, key) => {
    if (key === "checkbox")
      return (
        <input
          type="checkbox"
          checked={selected.includes(row.project_id)}
          onChange={() => toggleSelect(row.project_id)}
        />
      );

    /* ------------------- NAME ------------------- */
    if (key === "name") {
      const text = row.name || "";
      const isBlocked = row.status === "pending_assessment";

      const tooltipText = isBlocked
        ? "Assessment is currently in progress."
        : "";

      const content = (
        <span
          style={{
            ...LinkStyle,
            cursor: isBlocked ? "default" : "pointer",
            pointerEvents: isBlocked ? "none" : "auto",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: columnWidths.name - 20,
            display: "inline-block",
          }}
        >
          {text}
        </span>
      );

      return isBlocked ? (
        <WhiteTooltip text={tooltipText}>{content}</WhiteTooltip>
      ) : (
        <span onClick={() => setOpenedProject(row)}>{content}</span>
      );
    }

    /* ------------------- DESCRIPTION ------------------- */
    if (key === "description") {
      const text = row.description || "";
      const showTip = shouldShowTooltip(text, "description");

      return (
        <span
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: columnWidths.description - 20,
            cursor: showTip ? "pointer" : "default",
          }}
          title={showTip ? text : ""}
        >
          {text}
        </span>
      );
    }

    if (key === "status") {
      const label = getAssessmentStatusLabel(row);
      const style =
        STATUS_BADGE_MAP[row.status] || STATUS_BADGE_MAP.pending_assessment;

      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            background: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
            whiteSpace: "nowrap",
            maxWidth: columnWidths.status - 20,
          }}
          title={label}
        >
          {label}
        </span>
      );
    }

    if (key === "assessment_status") {
      const text = row.assessment_status
        ? toTitleCase(row.assessment_status)
        : "-";

      return (
        <span
          style={{
            display: "inline-block",
            maxWidth: columnWidths.assessment_status - 20,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "default",
            color: "#374151",
          }}
          title={text}
        >
          {text}
        </span>
      );
    }

    if (key === "score") {
      if (row.score == null) return "-";

      const { Icon, color, label } = getScoreIconUI(row.score);

      return (
        <div
          title={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon size={18} color={color} />
          <span style={{ color }}>{row.score}</span>
        </div>
      );
    }

    if (key === "recommendation") {
      const ui = getRecommendationUI(row);

      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            background: ui.bg,
            color: ui.color,
            border: `1px solid ${ui.border}`,
            whiteSpace: "nowrap",
            maxWidth: columnWidths.recommendation - 20,
          }}
          title={ui.label}
        >
          {ui.label}
        </span>
      );
    }

    if (key === "lastScanDate")
      return (
        <span style={{ cursor: "default" }}>
          {row.last_scanned_time
            ? new Date(row.last_scanned_time).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })
            : "Pending"}
        </span>
      );

    /* ------------------- REQUESTED BY ------------------- */
    if (key === "requested_by") {
      const r = row.requested_by;
      if (!r) return "-";

      const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
      const email = r.email || "";
      const country = r.country || "";

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: columnWidths.requested_by - 20,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          title={`${fullName}\n${email}\n${country}`}
        >
          {/* Name */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fullName || "—"}
          </span>

          {/* Email */}
          <span
            style={{
              fontSize: 12,
              color: "#6B7280",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {email}
          </span>
        </div>
      );
    }
    /* ------------------- APPROVED BY ------------------- */
    if (key === "approved_by") {
      const a = row.scan_approved_by; // 🔥 UPDATED KEY
      const requester = row.requested_by;

      // ✅ Admin created → show "-"
      if (!a && requester?.roles?.includes("ADMIN")) {
        return <span>-</span>;
      }

      // ✅ Not approved yet
      if (!a) {
        return (
          <span
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              fontStyle: "italic",
            }}
          >
            N/A
          </span>
        );
      }

      // ✅ Scan approved by someone
      const fullName = `${a.first_name || ""} ${a.last_name || ""}`.trim();
      const email = a.email || "";

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: columnWidths.approved_by - 20,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fullName || "—"}
          </span>

          <span
            style={{
              fontSize: 12,
              color: "#6B7280",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {email}
          </span>
        </div>
      );
    }

    if (key === "recommendation") return null;
    return row[key] ?? "";
  };

  // helper for delete disabled (ADMIN only usage)
  const isDeleteDisabledForProject = (project) =>
    project.assessment_status === "scan_in_progress";

  const actionItems = (() => {
    if (selected.length === 0) return [];

    const project = liveProjects.find((p) => p.project_id === selected[0]);
    if (!project) return [];

    // 🚫 ANALYST-ONLY — view only
    if (isAnalystOnly) {
      return [];
    }

    // ================= MULTI SELECT =================
    if (selected.length > 1) {
      if (!isAdmin) return [];

      const anyScanInProgress = selected.some((id) => {
        const p = liveProjects.find((x) => x.project_id === id);
        return p?.assessment_status === "scan_in_progress";
      });

      return [
        {
          key: "delete",
          label: "Delete",
          danger: true,
          disabled: anyScanInProgress,
        },
      ];
    }

    const deleteDisabled = project.assessment_status === "scan_in_progress";

    // ================= ADMIN =================
    if (isAdmin) {
      const actions = [];

      // 🟦 Scan request stage
      if (
        project.status === "requested" ||
        project.status === "requested_for_scan"
      ) {
        actions.push(
          { key: "scan_approve", label: "Approve for Scan" },
          { key: "scan_reject", label: "Reject for Scan" },
        );
      }

      // 🟩 Scan completed → usage approval stage ONLY
      if (
        project.status === "scan_completed" &&
        project.assessment_status === "completed"
      ) {
        actions.push(
          { key: "approve", label: "Approve for Usage" },
          { key: "reject", label: "Reject for Usage" },
        );
      }

      // ⚙️ Always available
      actions.push(
        { key: "edit", label: "Edit" },
        {
          key: "delete",
          label: "Delete",
          danger: true,
          disabled: deleteDisabled,
        },
      );

      return actions;
    }

    // ================= AUDITOR =================
    if (isAuditor) {
      const actions = [];

      if (project.status === "pending_assessment") {
        actions.push({
          key: "request_scan",
          label: "Request Scan",
        });
      }

      actions.push({ key: "edit", label: "Edit" });

      return actions;
    }

    return [];
  })();

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }
  return (
    <div>
      {/* TOP BAR */}

      <div
        className="d-flex flex-wrap justify-between items-center y-gap-10"
        style={{
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div className="flex-grow-1" style={{ minWidth: 200, maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Find tool by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-100"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #D1D5DB",
              background: "#F9FAFB",
              fontSize: 14,
              height: 40,
              fontFamily: "Amazon Ember, sans-serif",
            }}
          />
        </div>

        <div className="d-flex flex-wrap items-center" style={{ gap: 8 }}>
          <RefreshButton
            onRefresh={async () => {
              setSelected([]); // 🔥 clear checkbox state
              setTableLoading(true);
              await refreshProjects(); // 🔥 backend API call
              setTableLoading(false);
            }}
            setTableLoading={setTableLoading}
          />

          <ActionsMenu
            selected={selected}
            items={actionItems}
            onSelect={(key) => {
              const project = liveProjects.find(
                (p) => p.project_id === selected[0],
              );
              if (!project) return;

              setActiveProject(project);

              if (
                key === "scan_approve" ||
                key === "scan_reject" ||
                key === "approve" ||
                key === "reject"
              ) {
                setApprovalAction(key);
                setShowApprovalModal(true);
                return;
              }

              if (key === "request_scan") {
                setApprovalAction("request_scan");
                setShowApprovalModal(true);
                return;
              }

              if (key === "cancel_request") {
                setApprovalAction("cancel_request");
                setShowApprovalModal(true);
                return;
              }

              if (key === "edit") {
                setEditProjectData(project);
                setShowEditModal(true);
              }

              if (key === "delete") {
                // 🔒 FINAL GUARD
                if (project.assessment_status === "scan_in_progress") {
                  return;
                }

                setPendingDeleteIds(selected);
                setShowDeleteModal(true);
              }
            }}
          />

          <OrgRequiredWrapper
            disabled={isAnalystOnly}
            message="You have view-only access"
          >
            <AwsButton
              label="+ Tool Assessment"
              onClick={() => {
                if (isAnalystOnly) return;
                setShowCreateModal(true);
              }}
            />
          </OrgRequiredWrapper>

          <AwsSettingsIconButton
            onClick={() => setShowPreferences(true)}
            title="Preferences"
          />
        </div>
      </div>

      {/* ---------- Table ---------- */}
      <div
        style={{
          position: "relative",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <ListTable
          columns={visibleCols}
          data={filtered.slice(0, pageSize)}
          rowKey="project_id"
          renderCell={renderCell}
          sortConfig={sortConfig}
          onSort={requestSort}
          columnWidths={columnWidths}
          startResize={startResize}
          tableBodyStyle={{
            opacity: tableLoading ? 0 : 1,
            pointerEvents: tableLoading ? "none" : "auto",
            filter: tableLoading ? "blur(3px)" : "none",
            transition: "opacity 0.2s ease",
          }}
        />
        {tableLoading && (
          <div className="table-refresh-overlay">
            <div className="table-spinner"></div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <EditProjectModal
          project={editProjectData}
          setShowEditModal={setShowEditModal}
          refreshProjects={refreshProjects}
        />
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteError("");
          }}
          error={deleteError}
          onConfirm={async () => {
            try {
              for (let id of pendingDeleteIds) {
                await deleteComplianceProject(id);
              }
              setShowDeleteModal(false);
              setSelected([]);
              refreshProjects();
            } catch (err) {
              setDeleteError(err.message || "Delete failed");
            }
          }}
          title="Delete Tool"
          message="Are you sure you want to delete the selected tool(s)?"
        />
      )}
      {showApprovalModal && activeProject && (
        <ApproveRejectModal
          hasError={approvalError}
          title={
            approvalAction === "scan_approve"
              ? "Approve Tool for Scan"
              : approvalAction === "scan_reject"
                ? "Reject Tool for Scan"
                : approvalAction === "approve"
                  ? "Approve Tool for Usage"
                  : approvalAction === "reject"
                    ? "Reject Tool for Usage"
                    : approvalAction === "request_scan"
                      ? "Request Tool Assessment"
                      : "Cancel Assessment Request"
          }
          actionLabel={
            approvalAction === "scan_approve"
              ? "Approve for Scan"
              : approvalAction === "scan_reject"
                ? "Reject for Scan"
                : approvalAction === "approve"
                  ? "Approve for Usage"
                  : approvalAction === "reject"
                    ? "Reject for Usage"
                    : approvalAction === "request_scan"
                      ? "Request Scan"
                      : "Cancel Request"
          }
          /* 🔐 AUDITOR UX FIXES */
          hideCredits={!["scan_approve"].includes(approvalAction)}
          hideComment={approvalAction === "cancel_request"}
          onClose={() => {
            setShowApprovalModal(false);
            setApprovalError(false);
          }}
          onConfirm={async (comment) => {
            let payload = {};

            switch (approvalAction) {
              // ===== AUDITOR =====
              case "request_scan":
                payload = {
                  action: "request_scan",
                  status: "requested",
                };
                break;

              case "cancel_request":
                payload = {
                  action: "cancel_request",
                  status: "pending_assessment",
                };
                break;

              // ===== ADMIN =====
              case "scan_approve":
                payload = {
                  action: "scan_approve",
                  status: "approved_for_scan",
                };
                break;

              case "scan_reject":
                payload = {
                  action: "scan_reject",
                  status: "rejected_for_scan",
                };
                break;

              case "approve":
                payload = {
                  action: "approve",
                  status: "approved_for_usage",
                };
                break;

              case "reject":
                payload = {
                  action: "reject",
                  status: "rejected_for_usage",
                };
                break;

              default:
                return;
            }

            try {
              await updateComplianceProject(activeProject.project_id, {
                ...payload,
                comment,
              });

              // ✅ Optimistic UI update
              setLiveProjects((prev) =>
                prev.map((p) =>
                  p.project_id === activeProject.project_id
                    ? { ...p, ...payload }
                    : p,
                ),
              );

              setApprovalError(false);
              setShowApprovalModal(false);
              setSelected([]);
            } catch (err) {
              const message =
                err?.response?.data?.message ||
                "Insufficient credits to run this scan.";

              show(message, { type: "error", duration: 10000 });

              setApprovalError(true);

              setTimeout(() => {
                setApprovalError(false);
                setShowApprovalModal(false);
              }, 5000);
            }
          }}
        />
      )}

      {showPreferences && (
        <TablePreferencesModal
          open={showPreferences}
          onClose={() => setShowPreferences(false)}
          pageSize={pageSize}
          setPageSize={setPageSize}
          wrapLines={wrapLines}
          setWrapLines={setWrapLines}
          stripedRows={stripedRows}
          setStripedRows={setStripedRows}
          columns={columns}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
        />
      )}

      {/* ---------- Pagination (Static) ---------- */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <button style={pgBtn}>{"<"}</button>
        <span style={pageTag}>1</span>
        <button style={pgBtn}>{">"}</button>
      </div>
    </div>
  );
}

const pgBtn = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#F3F4F6",
  border: "1px solid #D1D5DB",
  cursor: "pointer",
};

const pageTag = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#EEF2FF",
};
