import React, { useState, useEffect, useRef } from "react";
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import useToast from "../../../hooks/useToast";

import ActionsMenu from "../../common/ActionsMenu";
import AwsSettingsIconButton from "../../common/AwsSettingsIconButton";
import TablePreferencesModal from "../../common/TablePreferencesModal";

import EditProjectModal from "./EditProjectModal";
import DeleteConfirmModal from "../../common/DeleteConfirmModal";
import ApproveRejectModal from "./ApproveRejectModal";
import ListTable from "../../common/ListTable";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";
import { HiPlus } from "react-icons/hi";
import ReactDOM from "react-dom";

import {
  updateComplianceProject,
  getComplianceProjectDetails,
  deleteComplianceProject,
} from "../../../apiIntegration/compliance";
import AwsButton from "@/components/common/AwsButton";
import { recommendationLabel } from "@/utils/recommendationLabel";
import { fetchUserProfile } from "@/apiIntegration/auth";
import { useContextElement } from "@/context/Context";

/* Columns whose displayed field differs from the field they sort on. */
const SORT_FIELD_BY_COLUMN = { createdtime: "created_time" };

/* Fields holding timestamps rather than plain text. */
const DATE_SORT_FIELDS = new Set(["last_scanned_time", "created_time"]);

/** Parse an API timestamp, tolerating the "+00:00Z" suffix the backend sends. */
const parseTimestamp = (value) => {
  if (!value) return null;
  const ms = Date.parse(String(value).replace("+00:00Z", "Z"));
  return Number.isNaN(ms) ? null : ms;
};

export default function AIListViewModern({
  projects,
  setShowCreateModal,
  setOpenedProject,
  refreshProjects,
  onLiveProjectsChange,
}) {
  const pageLoading = usePageLoader([projects]);
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsDisabled = selected.length === 0;
  const actionsRef = useRef(null);
  const [page, setPage] = useState(1);
  const scoreCacheRef = useRef({});
  const { setUserCredits } = useContextElement();

  const actionsBtnRef = useRef(null);
  const [showActionsTooltip, setShowActionsTooltip] = useState(false);
  const [actionsTooltipPos, setActionsTooltipPos] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    function handleOutside(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    }

    if (showActions) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showActions]);

  /* ---------------- SORTING ---------------- */
  // The list is a scan log, so it opens on the most recent scan rather than
  // whatever order the API happened to return.
  const [sortConfig, setSortConfig] = useState({
    key: "last_scanned_time",
    direction: "desc",
  });

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* ---------------- COLUMN RESIZE ---------------- */
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 60,
    name: 220,
    status: 180,
    assessment_status: 160,
    score: 220,
    recommendation: 210,
    description: 260,
    last_scanned_time: 180,
    requested_by: 220,
    approved_by: 240,
    rejected_by: 240,
    createdtime: 180,
  });

  const resizingCol = useRef(null);

  const startResize = (key, e) => {
    e.preventDefault();
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: columnWidths[key],
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!resizingCol.current) return;
      const { key, startX, startWidth } = resizingCol.current;
      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(120, startWidth + (e.clientX - startX)),
      }));
    };

    const onUp = () => (resizingCol.current = null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* ---------------- TABLE PREFERENCES ---------------- */
  const [pageSize, setPageSize] = useState(50);
  const [wrapLines, setWrapLines] = useState(false);
  const [stripedRows, setStripedRows] = useState(false);

  /* Visible columns */
  const [visibleColumns, setVisibleColumns] = useState(
    Object.keys(columnWidths),
  );

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  /* ---------------- MODALS ---------------- */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [deleteError, setDeleteError] = useState("");

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [approvalError, setApprovalError] = useState(false);

  const [showPreferences, setShowPreferences] = useState(false);

  /* ---------------- ROLE ---------------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = (userInfo?.roles || []).map((r) => r.toUpperCase());
  const isAdmin = roles.includes("ADMIN");
  const hasAdminRole = roles.includes("ADMIN");
  const hasAuditorRole = roles.includes("MANAGER");
  const hasAnalystRole = roles.includes("USER");

  const isAuditor = hasAuditorRole;
  // ✅ Analyst-only = NO higher privilege
  const isAnalystOnly = hasAnalystRole && !hasAdminRole && !hasAuditorRole;

  /* ---------------- DATA ---------------- */
  useEffect(() => {
    if (!projects?.length) return;

    setLiveProjects((prev) => {
      const map = new Map(prev.map((p) => [p.project_id, p]));

      return projects.map((p) => {
        const old = map.get(p.project_id);

        // 🔄 SCAN RESTARTED → CLEAR CACHED SCORE
        if (
          old &&
          old.assessment_status === "completed" &&
          (p.assessment_status === "queued" ||
            p.assessment_status === "in_progress")
        ) {
          delete scoreCacheRef.current[p.project_id];
        }

        // 🔒 preserve completed scan rows only if still completed
        if (
          old &&
          old.assessment_status === "completed" &&
          p.assessment_status === "completed"
        ) {
          return { ...old, ...p, score: old.score };
        }

        return old ? { ...old, ...p } : p;
      });
    });
  }, [projects]);

  /* ---------------- POLLING ---------------- */
  useEffect(() => {
    // only poll running scans
    const pollable = liveProjects.filter(
      (p) =>
        p &&
        (p.status === "approved_for_scan" ||
          p.status === "scan_in_progress" ||
          p.assessment_status === "queued" ||
          p.assessment_status === "in_progress"),
    );

    if (!pollable.length) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(
        pollable.map((p) =>
          getComplianceProjectDetails(p.project_id).catch(() => null),
        ),
      );

      setLiveProjects((prev) =>
        prev.map((p) => {
          const updated = updates.find(
            (u) => u && u.project_id === p.project_id,
          );

          // 🔒 NEVER touch completed rows again
          if (p.assessment_status === "completed" && !updated) {
            return p;
          }

          return updated
            ? {
                ...p,
                // 🔄 only dynamic fields
                status: updated.status,
                assessment_status: updated.assessment_status,
                last_scanned_time: updated.last_scanned_time,
                score: updated.score,
                recommendation: updated.recommendation,

                // 🔒 keep immutable values

                scan_approved_by: p.__scan_approved_by,
                scan_rejected_by: p.__scan_rejected_by ?? p.scan_rejected_by,
              }
            : p;
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [liveProjects]);

  useEffect(() => {
    if (onLiveProjectsChange) {
      onLiveProjectsChange(liveProjects);
    }
  }, [liveProjects, onLiveProjectsChange]);

  useEffect(() => {
    setShowActions(false);
  }, [selected]);

  // ✅ DEFINE THIS FIRST
  // AFTER
  const getScoreDisplay = (project) => {
    const { project_id, score, assessment_status, recommendation } = project;

    const getStyleFromRecommendationAndScore = (s, rec) => {
      const recLower = (rec || "").toLowerCase().trim();

      if (recLower === "approved with limitations") {
        return {
          icon: "fa-circle-exclamation",
          color: "text-amber-600",
          value: s,
        };
      }
      if (
        recLower === "not recommended" ||
        recLower === "do not use" ||
        recLower === "rejected" ||
        s < 40
      ) {
        return { icon: "fa-circle-xmark", color: "text-red-600", value: s };
      }
      if (s >= 60) {
        return { icon: "fa-circle-check", color: "text-emerald-600", value: s };
      }
      // 40–59 fallback
      return { icon: "warning", color: "text-amber-700", value: s };
    };

    if (scoreCacheRef.current[project_id] != null) {
      const s = scoreCacheRef.current[project_id];
      return getStyleFromRecommendationAndScore(s, recommendation);
    }

    if (assessment_status === "queued" || assessment_status === "in_progress") {
      return {
        icon: "fa-spinner",
        spinning: true,
        color: "text-muted-foreground",
        value: "",
      };
    }

    if (assessment_status === "completed" && score != null) {
      scoreCacheRef.current[project_id] = Number(score);
      return getScoreDisplay(project);
    }

    return {
      icon: "fa-circle-minus",
      color: "text-muted-foreground",
      value: "",
    };
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  /* ---------------- SEARCH + SORT ---------------- */
  const filtered = liveProjects
    .filter((p) => {
      if (!search.trim()) return true;
      return buildSearchText(p).includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      const field = SORT_FIELD_BY_COLUMN[sortConfig.key] || sortConfig.key;

      // Dates have to compare as instants: as plain strings the "+00:00Z"
      // suffix the API sometimes sends orders them against their real time.
      if (DATE_SORT_FIELDS.has(field)) {
        const ta = parseTimestamp(a[field]);
        const tb = parseTimestamp(b[field]);
        // Never-scanned rows sit at the bottom either way round.
        if (ta === null || tb === null) {
          if (ta === null && tb === null) return 0;
          return ta === null ? 1 : -1;
        }
        return (ta - tb) * dir;
      }

      // sort the recommendation column by the label the row actually shows,
      // otherwise "Recommended" rows order as though they still read "Approved"
      const sortValue = (row) =>
        sortConfig.key === "recommendation"
          ? recommendationLabel(row.recommendation)
          : row[field];

      const va = sortValue(a);
      const vb = sortValue(b);
      const aEmpty = va == null || va === "";
      const bEmpty = vb == null || vb === "";
      if (aEmpty || bEmpty) {
        if (aEmpty && bEmpty) return 0;
        return aEmpty ? 1 : -1;
      }
      if (typeof va === "number" && typeof vb === "number")
        return (va - vb) * dir;
      return (
        String(va).localeCompare(String(vb), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * dir
      );
    });

  /* ---------------- PAGINATION DATA ---------------- */
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedData = filtered.slice(startIndex, endIndex);

  /* ---------------- SELECTION ---------------- */
  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleSelectAll = (checked) =>
    setSelected(checked ? filtered.map((x) => x.project_id) : []);

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusMap = {
      scan_completed: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Scan Completed",
        icon: "fa-clipboard-check",
      },

      approved_for_usage: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        label: "Approved For Usage",
        icon: "fa-circle-check",
      },

      rejected_for_usage: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        label: "Rejected For Usage",
        icon: "fa-circle-xmark",
      },

      scan_in_progress: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Scan In Progress",
        icon: "fa-spinner",
        spinning: true,
      },

      requested: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        label: "Requested for Scan",
        icon: "fa-clock",
      },

      approved_for_scan: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        label: "Approved For Scan",
        icon: "fa-shield-check",
      },

      rejected_for_scan: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        label: "Rejected For Scan",
        icon: "fa-ban",
      },
    };

    return (
      statusMap[status] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        label: formatStatus(status),
        icon: "fa-circle-question",
      }
    );
  };

  // Get recommendation badge styling
  const getRecommendationBadge = (recommendation, status) => {
    const recMap = {
      approved: {
        bg: "bg-green-50",
        icon: "fa-check-circle",
        class: "badge-success",
        text: "text-green-700",
        border: "border-green-200",
        label: "Recommended",
      },
      "approved with limitations": {
        bg: "bg-yellow-50",
        icon: "fa-circle-exclamation",
        class: "badge-warning",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Recommended with limitations",
      },
      "not recommended": {
        bg: "bg-red-50",
        icon: "fa-circle-xmark",
        class: "badge-error",
        text: "text-red-700",
        border: "border-red-200",
        label: "Not Recommended",
      },
      error: {
        bg: "bg-red-50",
        icon: "fa-triangle-exclamation",
        class: "badge-warning",
        text: "text-red-700",
        border: "border-red-200",
        label: "Error",
      },
    };

    const rec = (recommendation || "").toLowerCase().trim();
    if (recMap[rec]) return recMap[rec];

    // A rejected scan never produces a recommendation, so the empty value used
    // to fall through to "Pending Review" — which reads as though the tool is
    // still in the queue. Say what actually happened.
    if ((status || "").toLowerCase().trim() === "rejected_for_scan") {
      return {
        bg: "bg-red-50",
        icon: "fa-ban",
        class: "badge-error",
        text: "text-red-700",
        border: "border-red-200",
        label: "Scan Rejected",
      };
    }

    return {
      bg: "bg-gray-50",
      icon: "fa-clock", // ✅ default icon added
      class: "badge-default",
      text: "text-gray-600",
      border: "border-gray-200",
      label: "Pending Review",
    };
  };

  //search helper
  function buildSearchText(project) {
    const scoreDisplay = getScoreDisplay(project);

    return [
      project.project_id,
      project.name,
      formatStatus(project.status),
      formatStatus(project.assessment_status),
      scoreDisplay?.value !== "" ? scoreDisplay.value : null,
      // both the raw API value and the relabelled one, so "approved" and
      // "recommended" each match the rows the user expects
      project.recommendation,
      recommendationLabel(project.recommendation),
      project.requested_by?.first_name,
      project.requested_by?.last_name,
      project.requested_by?.email,
      project.approved_by?.first_name,
      project.approved_by?.last_name,
      project.approved_by?.email,
      project.scan_rejected_by?.first_name,
      project.scan_rejected_by?.last_name,
      project.scan_rejected_by?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "--";

    // Fix invalid ISO format like +00:00Z
    const cleaned = dateString.replace("+00:00Z", "Z");

    const date = new Date(cleaned);

    if (isNaN(date)) return "--";

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const columns = [
    {
      key: "checkbox",
      label: "",
      width: 48,
      resizable: false,
      allSelected: filtered.length > 0 && selected.length === filtered.length,
      onToggleAll: toggleSelectAll,
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.includes(row.project_id)}
          onChange={() => toggleSelect(row.project_id)}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
      ),
    },
    {
      key: "name",
      label: "Tool Name",
      sortable: true,
      resizable: true,
    },
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
    {
      key: "score",
      label: "AGRI Score",
      header: (
        <span className="flex items-center gap-1">
          AGRI Score
          <span className="relative group cursor-help text-gray-500">
            <i className="fa-solid fa-circle-info text-xs"></i>

            <span
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2
          hidden group-hover:block bg-black text-white text-xs
          px-2 py-1 rounded whitespace-nowrap z-50"
            >
              AI Governance Readiness Index Score
            </span>
          </span>
        </span>
      ),
      sortable: true,
      resizable: true,
    },
    {
      key: "recommendation",
      label: "Recommendation",
      sortable: true,
      resizable: true,
    },
    {
      key: "description",
      label: "Description",
      resizable: true,
    },
    {
      key: "last_scanned_time",
      label: "Last Scan",
      sortable: true,
      resizable: true,
    },
    {
      key: "createdtime",
      label: "Created On",
      sortable: true,
      sortKey: "created_time",
      resizable: true,
    },
    {
      key: "requested_by",
      label: "Requested By",
      resizable: true,
    },
    {
      key: "approved_by",
      label: "Scan Approved By",
      resizable: true,
    },
    {
      key: "rejected_by",
      label: "Scan Rejected By",
      resizable: true,
    },
  ];

  const renderCell = (project, key) => {
    switch (key) {
      case "checkbox":
        return columns[0].render(project);

      case "name":
        return (
          <span
            className="font-medium text-primary hover:underline cursor-pointer"
            onClick={() => setOpenedProject(project)}
          >
            {project.name || "Unnamed Tool"}
          </span>
        );

      case "status": {
        const badge = getStatusBadge(project.status);

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}
          >
            <i
              className={`fa-solid ${badge.icon} text-[11px] ${
                badge.spinning ? "fa-spin" : ""
              }`}
            ></i>
            {badge.label}
          </span>
        );
      }
      case "assessment_status":
        return (
          <span className="text-muted-foreground">
            {formatStatus(project.assessment_status) || "Pending"}
          </span>
        );

      case "score": {
        const s = getScoreDisplay(project);

        return (
          <div
            className={`flex items-center justify-center w-full gap-2 font-semibold ${s.color}`}
          >
            {s.icon === "warning" ? (
              <span
                key={`${project.project_id}-warning`}
                className="relative inline-flex items-center justify-center w-5 h-5"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-30 animate-ping" />
                <span className="relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  !
                </span>
              </span>
            ) : (
              <i
                key={`${project.project_id}-${s.icon}`}
                className={`fa-solid ${s.icon} ${s.spinning ? "fa-spin" : ""}`}
              />
            )}
            {s.value}
          </div>
        );
      }

      case "recommendation": {
        const badge = getRecommendationBadge(
          project.recommendation,
          project.status,
        );

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}
          >
            <i className={`fa-solid ${badge.icon} text-[11px]`}></i>
            {badge.label}
          </span>
        );
      }

      case "description":
        return (
          <span
            className="truncate text-muted-foreground"
            title={project.description}
          >
            {project.description || "--"}
          </span>
        );

      case "last_scanned_time":
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {formatDate(project.last_scanned_time)}
          </span>
        );

      case "createdtime":
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {project.created_time ? formatDate(project.created_time) : "-"}
          </span>
        );

      case "requested_by": {
        const r = project.requested_by;
        if (!r) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col gap-0.5 truncate">
            <span className="text-sm font-medium text-foreground truncate">
              {`${r.first_name || ""} ${r.last_name || ""}`.trim()}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {r.email}
            </span>
          </div>
        );
      }

      case "approved_by": {
        const a = project.scan_approved_by;
        if (!a)
          return (
            <span className="text-sm italic text-muted-foreground">N/A</span>
          );
        return (
          <div className="flex flex-col gap-0.5 truncate">
            <span className="text-sm font-medium text-foreground truncate">
              {`${a.first_name || ""} ${a.last_name || ""}`.trim()}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {a.email}
            </span>
          </div>
        );
      }

      case "rejected_by": {
        const r = project.scan_rejected_by;
        if (!r)
          return (
            <span className="text-sm italic text-muted-foreground">N/A</span>
          );
        return (
          <div className="flex flex-col gap-0.5 truncate">
            <span className="text-sm font-medium text-foreground truncate">
              {`${r.first_name || ""} ${r.last_name || ""}`.trim()}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {r.email}
            </span>
          </div>
        );
      }

      default:
        return project[key] ?? "";
    }
  };

  const visibleTableColumns = columns.filter(
    (col) => col.key === "checkbox" || visibleColumns.includes(col.key),
  );

  // A scan is running while the tool is queued for one or the assessment itself
  // is under way. Both fields matter: `status` tracks the request, while
  // `assessment_status` tracks the scan (queued / in_progress / completed) —
  // "scan_in_progress" never appears in the latter, so checking it there alone
  // left Edit and Delete live for the whole scan.
  const isScanRunning = (project) =>
    project?.status === "approved_for_scan" ||
    project?.status === "scan_in_progress" ||
    project?.assessment_status === "queued" ||
    project?.assessment_status === "in_progress";

  const SCAN_RUNNING_TOOLTIP = "Not available while a scan is in progress";

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

      const anyScanInProgress = selected.some((id) =>
        isScanRunning(liveProjects.find((x) => x.project_id === id)),
      );

      return [
        {
          key: "delete",
          label: "Delete",
          danger: true,
          disabled: anyScanInProgress,
          tooltip: anyScanInProgress ? SCAN_RUNNING_TOOLTIP : undefined,
        },
      ];
    }

    // Editing a tool mid-scan would change what the running scan is reporting
    // on, so both Edit and Delete stand down until it finishes.
    const scanRunning = isScanRunning(project);

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
        {
          key: "edit",
          label: "Edit",
          disabled: scanRunning,
          tooltip: scanRunning ? SCAN_RUNNING_TOOLTIP : undefined,
        },
        {
          key: "delete",
          label: "Delete",
          danger: true,
          disabled: scanRunning,
          tooltip: scanRunning ? SCAN_RUNNING_TOOLTIP : undefined,
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

      actions.push({
        key: "edit",
        label: "Edit",
        disabled: scanRunning,
        tooltip: scanRunning ? SCAN_RUNNING_TOOLTIP : undefined,
      });

      return actions;
    }

    return [];
  })();

  if (pageLoading) return <PageLoader loading />;

  return (
    <div className="space-y">
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search + mobile refresh */}
          <div className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-muted-foreground text-sm" />
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-11 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none"
                placeholder="Find tool by name, ID or requester..."
              />
            </div>

            {/* Refresh – mobile only */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await refreshProjects();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            {/* Preferences – mobile only */}
            <button
              onClick={() => setShowPreferences(true)}
              title="Table Preferences"
              className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Refresh – desktop only */}
            <button
              onClick={async () => {
                setTableLoading(true);
                setSelected([]);
                await refreshProjects();
                setTimeout(() => setTableLoading(false), 300);
              }}
              title="Refresh"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>

            {/* Actions dropdown */}
            {/* Add these refs/state near your other tooltip state at the top of the component */}
            {/* const actionsBtnRef = useRef(null);                                            */}
            {/* const [showActionsTooltip, setShowActionsTooltip] = useState(false);           */}
            {/* const [actionsTooltipPos, setActionsTooltipPos] = useState({ top:0, left:0 }); */}

            <div ref={actionsRef} className="relative">
              <div
                ref={actionsBtnRef}
                onMouseEnter={() => {
                  if (!isAnalystOnly || selected.length === 0) return;
                  const rect = actionsBtnRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setActionsTooltipPos({
                    top: rect.top - 8,
                    left: rect.left + rect.width / 2,
                  });
                  setShowActionsTooltip(true);
                }}
                onMouseLeave={() => setShowActionsTooltip(false)}
              >
                <ActionsMenu
                  disabled={selected.length === 0 || isAnalystOnly}
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
                      if (isScanRunning(project)) return;
                      setEditProjectData(project);
                      setShowEditModal(true);
                    }

                    if (key === "delete") {
                      const anyRunning = selected.some((id) =>
                        isScanRunning(
                          liveProjects.find((p) => p.project_id === id),
                        ),
                      );
                      if (anyRunning) return;
                      setPendingDeleteIds(selected);
                      setShowDeleteModal(true);
                    }
                  }}
                />
              </div>
            </div>

            {/* Portal Tooltip — outside overflow-hidden, always visible */}
            {showActionsTooltip &&
              isAnalystOnly &&
              selected.length > 0 &&
              typeof document !== "undefined" &&
              ReactDOM.createPortal(
                <div
                  className="fixed z-[9999] pointer-events-none"
                  style={{
                    top: actionsTooltipPos.top,
                    left: actionsTooltipPos.left,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                    You have view-only access
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>,
                document.body,
              )}

            {/* Preferences button – desktop only */}
            <button
              onClick={() => setShowPreferences(true)}
              title="Table Preferences"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <AwsSettingsIconButton
                title="Preferences"
                onClick={() => setShowPreferences(true)}
              />
            </button>

            {/* Tool Assessment */}
            <OrgRequiredWrapper
              disabled={isAnalystOnly}
              message="You have view-only access"
            >
              <AwsButton
                onClick={() => setShowCreateModal(true)}
                disabled={isAnalystOnly}
                className="flex items-center px-5 py-2.5 shadow-md transition-all transform hover:scale-[1.02]"
              >
                <HiPlus size={18} className="mr-2" />
                Tool Assessment
              </AwsButton>
            </OrgRequiredWrapper>
          </div>
        </div>

        {/* TABLE */}
        <div className="relative flex-1 overflow-hidden">
          {tableLoading && (
            <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center"></div>
          )}
          <ListTable
            columns={visibleTableColumns}
            data={paginatedData}
            rowKey="project_id"
            renderCell={renderCell}
            sortConfig={sortConfig}
            onSort={requestSort}
            columnWidths={columnWidths}
            startResize={startResize}
            loading={tableLoading}
            selectedCount={selected.length}
            selectionCounterLabel="tool"
            pagination={{
              page,
              pageSize,
              total: filtered.length,
              onPageChange: setPage,
            }}
          />
        </div>
      </section>

      {/* MODALS */}
      {showEditModal && (
        <EditProjectModal
          project={editProjectData}
          setShowEditModal={setShowEditModal}
          refreshProjects={refreshProjects}
        />
      )}
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

              // 🔥 Immediately remove from UI
              setLiveProjects((prev) =>
                prev.filter((p) => !pendingDeleteIds.includes(p.project_id)),
              );

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
          showCreditsNote={isAdmin && approvalAction === "scan_approve"}
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

              // ✅ Optimistic UI update (existing code)
              setLiveProjects((prev) =>
                prev.map((p) =>
                  p.project_id === activeProject.project_id
                    ? {
                        ...p,
                        ...payload,
                        scan_approved_by:
                          approvalAction === "scan_approve"
                            ? userInfo
                            : p.scan_approved_by,
                        __scan_approved_by:
                          approvalAction === "scan_approve"
                            ? userInfo
                            : p.__scan_approved_by,
                        scan_rejected_by:
                          approvalAction === "scan_reject"
                            ? userInfo
                            : p.scan_rejected_by,
                        __scan_rejected_by:
                          approvalAction === "scan_reject"
                            ? userInfo
                            : p.__scan_rejected_by,
                      }
                    : p,
                ),
              );

              // ✅ ADD THIS — refresh credits immediately after scan approval
              // AFTER
              if (approvalAction === "scan_approve") {
                try {
                  const token = localStorage.getItem("access_token");
                  if (token) {
                    const userData = await fetchUserProfile(token);
                    if (userData?.plan?.credits_remaining !== undefined) {
                      setUserCredits?.(userData.plan.credits_remaining);
                    }
                    // ✅ Persist fresh plan data so SubscriptionTab picks it up
                    const existing = JSON.parse(
                      localStorage.getItem("user_info") || "{}",
                    );
                    localStorage.setItem(
                      "user_info",
                      JSON.stringify({ ...existing, ...userData }),
                    );
                    // ✅ Dispatch storage event so SubscriptionTab reacts immediately
                    window.dispatchEvent(new Event("credits-updated"));
                  }
                } catch (creditsErr) {
                  console.error("Failed to refresh credits:", creditsErr);
                }
              }

              setApprovalError(false);
              setShowApprovalModal(false);
              setSelected([]);
            } catch (err) {
              const rawMessage =
                err?.response?.data?.message || err?.message || "";

              const isInsufficientCredits =
                rawMessage.toLowerCase().includes("insufficient") ||
                rawMessage.toLowerCase().includes("credit");

              let message = "Something went wrong. Please try again.";

              // ✅ ONLY override message for Approve-for-Scan
              if (approvalAction === "scan_approve" && isInsufficientCredits) {
                message = "Insufficient credits to run this scan.";
              } else if (rawMessage) {
                message = rawMessage;
              }

              toast(message, { type: "error", duration: 10000 });

              // ❗ show red modal state ONLY for credit error on scan approval
              const showCreditError =
                approvalAction === "scan_approve" && isInsufficientCredits;

              setApprovalError(showCreditError);

              // ⏳ auto-close only for credit error
              if (showCreditError) {
                setTimeout(() => {
                  setApprovalError(false);
                  setShowApprovalModal(false);
                }, 5000);
              }
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
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          columns={columns}
        />
      )}
    </div>
  );
}
