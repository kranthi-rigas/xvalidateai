import React, { useEffect, useState, useRef } from "react";
import ListTable from "@/components/common/ListTable";
import PageLoader from "@/components/common/PageLoader";
import { getAuditTrail } from "@/apiIntegration/audittrail";
import AwsButton from "@/components/common/AwsButton";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 50;

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

      setLogs(data?.audit_trail || []);
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

  /* ---------------- EXPORT CSV ---------------- */

  const exportExcel = () => {
    if (!filtered.length) return;

    const rows = filtered.map((row) => ({
      audit_id: row.audit_id,
      // user_id: row.user_id,
      user: row.performed_by
        ? `${row.performed_by.first_name} ${row.performed_by.last_name} <${row.performed_by.email}>`
        : "",
      event_type: row.event_type,
      result: row.result,
      resource_type: row.resource_type,
      timestamp: row.timestamp,
      user_agent: row.user_agent,
      details: JSON.stringify(row.details),
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) => Object.values(r).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
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

        const pairs = flattenDetails(row.details);

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
        return val
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
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

          <div className="relative w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-muted-foreground text-sm"></i>

            <input
              placeholder="Search audit logs..."
              className="pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* EXPORT */}

          <AwsButton
            onClick={exportExcel}
            className="flex items-center px-4 py-2 text-sm rounded-lg
             bg-[#1D4ED8] text-white
             hover:bg-[#1e40af] transition-colors"
          >
            <i className="fa-solid fa-file-excel text-green-300 mr-2"></i>
            Export
          </AwsButton>
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
