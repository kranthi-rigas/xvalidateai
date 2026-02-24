import React, { useState, useEffect } from "react";
import ListTable from "@/components/common/ListTable";
import { COLORS } from "@/styles/colors";
import PageLoader from "@/components/common/PageLoader";
import AwsButton from "@/components/common/AwsButton";
import { getAuditTrail } from "../../../apiIntegration/audittrail";

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    start_time: "",
    end_time: "",
    limit: 100,
  });

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchAudit({ days: 30, limit: 100 });
  }, []);

  const fetchAudit = async (customFilters = {}) => {
    try {
      setLoading(true);
      const data = await getAuditTrail(customFilters);
      setAuditLogs(data?.audit_trail || []);
      setPage(1);
    } catch (err) {
      console.error("Audit fetch failed:", err);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- APPLY FILTERS ---------------- */
  const handleApplyFilters = () => {
    fetchAudit(filters);
  };

  /* ---------------- SEARCH (CLIENT SIDE) ---------------- */
  const filtered = (auditLogs || []).filter((log) => {
    if (!search.trim()) return true;

    return (
      log?.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log?.resource_type?.toLowerCase().includes(search.toLowerCase()) ||
      log?.action?.toLowerCase().includes(search.toLowerCase())
    );
  });

  /* ---------------- PAGINATION ---------------- */
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  /* ---------------- ACTION BADGE ---------------- */
  const getActionBadge = (action) => {
    switch (action) {
      case "CREATE":
        return "bg-green-50 text-green-700 border-green-200";
      case "UPDATE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    { key: "user_email", label: "User", sortable: true },
    { key: "resource_type", label: "Resource", sortable: true },
    { key: "resource_id", label: "Resource ID" },
    { key: "action", label: "Action", sortable: true },
    { key: "description", label: "Description", truncate: false },
    { key: "ip_address", label: "IP Address" },
    { key: "created_at", label: "Timestamp", sortable: true },
  ];

  /* ---------------- RENDER CELL ---------------- */
  const renderCell = (row, key) => {
    switch (key) {
      case "action":
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionBadge(
              row.action,
            )}`}
          >
            {row.action}
          </span>
        );

      case "created_at":
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
          </span>
        );

      default:
        return row[key] || "-";
    }
  };

  return (
    <div className="space-y">
      <section className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
        {/* ===== STICKY TOOLBAR ===== */}
        <div className="p-6 border-b border-border shrink-0 bg-white">
          <div className="flex items-center justify-between gap-6">
            {/* LEFT SIDE – Filters (NO WRAP) */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Search */}
              <input
                placeholder="Search user, resource, action..."
                className="h-10 border border-border rounded-lg px-4 text-sm w-64 flex-shrink-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* Resource Type */}
              <select
                className="h-10 border border-border rounded-lg px-3 text-sm w-40 bg-white flex-shrink-0"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    resource_type: e.target.value,
                  })
                }
              >
                <option value="">All Resources</option>
                <option value="USER">User</option>
                <option value="ORGANIZATION">Organization</option>
                <option value="COMPLIANCE_PROJECT">Compliance Project</option>
              </select>

              {/* From Date */}
              <input
                type="date"
                className="h-10 border border-border rounded-lg px-3 text-sm flex-shrink-0"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    start_time: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />

              {/* To Date */}
              <input
                type="date"
                className="h-10 border border-border rounded-lg px-3 text-sm flex-shrink-0"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    end_time: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />

              {/* Limit */}
              <input
                type="number"
                placeholder="Limit"
                className="h-10 border border-border rounded-lg px-3 text-sm w-24 flex-shrink-0"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    limit: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* RIGHT SIDE – Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Apply */}
              <AwsButton
                onClick={handleApplyFilters}
                className="h-10 px-6 text-sm font-medium text-white rounded-lg"
                style={{ backgroundColor: COLORS.primary }}
              >
                Apply
              </AwsButton>

              {/* Export Icon Only */}
              <button
                onClick={() => {}}
                title="Export to Excel"
                className="h-10 w-10 flex items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                <i className="fa-solid fa-file-excel" />
              </button>
            </div>
          </div>
        </div>
        {/* ===== TABLE AREA (SCROLLABLE) ===== */}
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
