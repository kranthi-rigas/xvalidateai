import React, { useEffect, useState, useRef } from "react";
import ListTable from "@/components/common/ListTable";
import PageLoader from "@/components/common/PageLoader";
import { getAuditTrail } from "@/apiIntegration/audittrail";
import AwsButton from "@/components/common/AwsButton";
import ReactDOM from "react-dom";
import SearchInput from "@/components/common/SearchInput";

/**
 * Credit figures are internal accounting, so they stay out of the audit trail.
 * Every key mentioning credits is dropped, at any depth — that covers both
 * `credits_granted` and the nested `plan.credits`.
 */
const isCreditKey = (key) => /credit/i.test(key);

/**
 * Credit deductions are internal accounting, not user or system activity the
 * audit trail is meant to report, so those entries are dropped entirely —
 * they never reach the table, the search, the count or the export.
 */
const isCreditEntry = (log) =>
  /credit/i.test(log?.resource_type || "") ||
  /credit/i.test(log?.event_type || "");

const withoutCreditDetails = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([k]) => !isCreditKey(k))
      .map(([k, v]) => [k, withoutCreditDetails(v)]),
  );
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const exportBtnRef = useRef(null);
  const [showExportTooltip, setShowExportTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleExportMouseEnter = () => {
    if (canExport) return;
    const rect = exportBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      top: rect.top - 8, // 8px gap above button
      left: rect.left + rect.width / 2,
    });
    setShowExportTooltip(true);
  };

  /* ---------------- ROLE CHECK ---------------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = Array.isArray(userInfo.roles)
    ? userInfo.roles
    : String(userInfo.roles || "").split(",");
  const upperRoles = roles.map((r) => r.toUpperCase());
  const isUserOnly =
    upperRoles.includes("USER") && upperRoles.every((r) => r === "USER");
  const canExport = !isUserOnly;

  /* ---------------- COLUMN WIDTHS ---------------- */

  const [columnWidths, setColumnWidths] = useState({
    audit_id: 260,
    // user_id: 260,
    user: 240,
    event_type: 180,
    result: 140,
    resource_type: 200,
    timestamp: 220,
    user_agent: 420,
    details: 400,
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

  /* ---------------- AUTO FIT COLUMN (DOUBLE CLICK) ---------------- */

  const autoFitColumn = (key) => {
    const maxLength = Math.max(
      ...logs.map((row) => String(row[key] || "").length),
    );

    const newWidth = Math.min(Math.max(maxLength * 8 + 80, 160), 600);

    setColumnWidths((prev) => ({
      ...prev,
      [key]: newWidth,
    }));
  };

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      const data = await getAuditTrail({
        limit: 100,
        days: 30,
      });

      const entries = data?.audit_trail || [];
      setLogs(entries.filter((log) => !isCreditEntry(log)));
    } catch (err) {
      console.error("Audit fetch error:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SEARCH ---------------- */

  const filtered = logs.filter((log) => {
    if (!search) return true;

    const s = search.toLowerCase();

    return (
      log?.user_id?.toLowerCase().includes(s) ||
      log?.event_type?.toLowerCase().includes(s) ||
      log?.resource_type?.toLowerCase().includes(s) ||
      log?.result?.toLowerCase().includes(s) ||
      log?.performed_by?.first_name?.toLowerCase().includes(s) ||
      log?.performed_by?.last_name?.toLowerCase().includes(s) ||
      log?.performed_by?.email?.toLowerCase().includes(s)
    );
  });

  /* ---------------- PAGINATION ---------------- */

  const startIndex = (page - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  /* ---------------- EXPORT XLSX ---------------- */

  const exportExcel = () => {
    if (!filtered.length) return;

    const rows = filtered.map((row) => ({
      "Audit ID": row.audit_id,
      User: row.performed_by
        ? `${row.performed_by.first_name} ${row.performed_by.last_name} <${row.performed_by.email}>`
        : "",
      "Event Type": row.event_type,
      Result: row.result,
      "Resource Type": row.resource_type,
      Timestamp: row.timestamp ? new Date(row.timestamp).toLocaleString() : "",
      "User Agent": row.user_agent,
      Details: JSON.stringify(withoutCreditDetails(row.details)),
    }));

    // Dynamically import SheetJS
    import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs").then(
      (XLSX) => {
        const ws = XLSX.utils.json_to_sheet(rows);

        // Set column widths
        ws["!cols"] = [
          { wch: 36 }, // Audit ID
          { wch: 40 }, // User
          { wch: 20 }, // Event Type
          { wch: 12 }, // Result
          { wch: 20 }, // Resource Type
          { wch: 22 }, // Timestamp
          { wch: 50 }, // User Agent
          { wch: 50 }, // Details
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
        XLSX.writeFile(wb, "audit_logs.xlsx");
      },
    );
  };
  /* ---------------- TABLE COLUMNS ---------------- */

  const columns = [
    { key: "audit_id", label: "Audit ID", resizable: true },
    // { key: "user_id", label: "User ID", resizable: true },
    { key: "user", label: "User", resizable: true },
    { key: "event_type", label: "Event Type", resizable: true },
    { key: "result", label: "Result", resizable: true },
    { key: "resource_type", label: "Resource Type", resizable: true },
    { key: "timestamp", label: "Timestamp", resizable: true },
    { key: "user_agent", label: "User Agent", resizable: true },
    { key: "details", label: "Details", resizable: true, align: "center" },
  ];

  /* ---------------- HELPERS ---------------- */

  /**
   * Flatten a (possibly nested) details object into a flat list of
   * { label, value } pairs so every entry can be rendered inline.
   *
   * Nested keys are joined with a dot: e.g. "changes.name"
   */
  const flattenDetails = (obj, prefix = "") => {
    const pairs = [];

    for (const [k, v] of Object.entries(obj)) {
      const label = prefix ? `${prefix}.${k}` : k;

      if (v && typeof v === "object" && !Array.isArray(v)) {
        pairs.push(...flattenDetails(v, label));
      } else {
        pairs.push({ label, value: String(v ?? "") });
      }
    }

    return pairs;
  };

  /* ---------------- CELL RENDER ---------------- */

  const renderCell = (row, key) => {
    switch (key) {
      case "timestamp":
        return row.timestamp ? new Date(row.timestamp).toLocaleString() : "-";

      case "user": {
        const p = row.performed_by;
        if (!p) return "-";
        return (
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-sm">
              {p.first_name} {p.last_name}
            </span>
            <span className="text-xs text-muted-foreground">{p.email}</span>
          </div>
        );
      }

      case "details": {
        if (!row.details || !Object.keys(row.details).length) return "-";

        const pairs = flattenDetails(withoutCreditDetails(row.details));
        // A row whose only details were credits has nothing left to show.
        if (!pairs.length) return "-";

        // Strip "changes." prefix for cleaner display labels
        const cleanLabel = (lbl) => lbl.replace(/^changes\./, "");

        return (
          <div className="flex items-center justify-center w-full h-full py-1">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {pairs.map(({ label, value }, idx) => {
                const isUrl =
                  value.startsWith("http://") || value.startsWith("https://");
                const shortLabel = cleanLabel(label);

                return (
                  <span key={idx} className="flex items-center gap-1">
                    {/* Pill: key + value together */}
                    <span
                      className="inline-flex items-center rounded-full text-xs overflow-hidden"
                      style={{
                        border: "1px solid #e0e7ff",
                        background: "#f5f3ff",
                      }}
                    >
                      {/* Key segment */}
                      <span
                        className="px-2 py-0.5 font-semibold capitalize"
                        style={{
                          color: "#4338ca",
                          background: "#ede9fe",
                          borderRight: "1px solid #ddd6fe",
                          fontSize: "0.68rem",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {shortLabel}
                      </span>

                      {/* Value segment */}
                      {isUrl ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          title={value}
                          className="px-2 py-0.5 hover:underline"
                          style={{
                            color: "#2563eb",
                            fontSize: "0.72rem",
                            maxWidth: "160px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                        >
                          {value}
                        </a>
                      ) : (
                        <span
                          className="px-2 py-0.5"
                          title={value}
                          style={{
                            color: "#374151",
                            fontSize: "0.72rem",
                            maxWidth: "140px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                        >
                          {value || "—"}
                        </span>
                      )}
                    </span>

                    {/* Divider between pills */}
                    {idx < pairs.length - 1 && (
                      <span
                        style={{
                          width: "1px",
                          height: "14px",
                          background: "#c7d2fe",
                          display: "inline-block",
                          borderRadius: "1px",
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      case "event_type":
      case "resource_type": {
        const val = row[key];
        if (!val) return "-";
        return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      case "result":
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              row.result === "SUCCESS"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {row.result}
          </span>
        );

      default:
        return row[key] || "-";
    }
  };

  return (
    <div className="space-y">
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-160px)] min-h-[600px] overflow-hidden">
        {/* ===== TOOLBAR ===== */}

        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          {/* SEARCH */}

          <SearchInput
            className="w-80"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search audit logs..."
          />

          {/* EXPORT */}

          {/* Export Button */}
          <div
            ref={exportBtnRef}
            onMouseEnter={handleExportMouseEnter}
            onMouseLeave={() => setShowExportTooltip(false)}
            className="inline-block"
          >
            <AwsButton
              onClick={canExport ? exportExcel : undefined}
              disabled={!canExport}
              className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                canExport
                  ? "bg-[#1D4ED8] text-white hover:bg-[#1e40af]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
            >
              <i className="fa-solid fa-file-excel mr-2"></i>
              Export
            </AwsButton>
          </div>

          {/* Portal Tooltip — renders at document.body level, never clipped */}
          {showExportTooltip &&
            !canExport &&
            typeof document !== "undefined" &&
            ReactDOM.createPortal(
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                  top: tooltipPos.top,
                  left: tooltipPos.left,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                  You have view-only access
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2
                        border-4 border-transparent border-t-gray-900"
                  />
                </div>
              </div>,
              document.body,
            )}
        </div>

        {/* ===== TABLE ===== */}

        <div className="relative flex-1 overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <PageLoader loading />
            </div>
          ) : (
            <ListTable
              columns={columns}
              data={paginatedData}
              rowKey="audit_id"
              renderCell={renderCell}
              columnWidths={columnWidths}
              startResize={startResize}
              autoFitColumn={autoFitColumn}
              pagination={{
                page,
                pageSize,
                total: filtered.length,
                onPageChange: setPage,
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
