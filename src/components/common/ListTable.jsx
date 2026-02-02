import React from "react";

/* ---------- SAFE HELPERS ---------- */
const safeRenderCell = (renderCell, row, key) => {
  try {
    const value = renderCell?.(row, key);
    if (React.isValidElement(value)) return value;
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "boolean") return String(value);
    return "";
  } catch (err) {
    console.error("ListTable renderCell error:", err);
    return "";
  }
};

/* ---------- SORT HELPERS ---------- */
function getSortableValue(row, key) {
  const v = row[key];
  if (v == null) return "";
  if (!isNaN(Date.parse(v))) return new Date(v).getTime();
  if (!isNaN(v)) return Number(v);
  return String(v).toLowerCase();
}

function applySorting(data, sortConfig, columns) {
  if (!sortConfig?.key) return data;

  const col = columns.find((c) => c.key === sortConfig.key);
  const sortKey = col?.sortKey || col?.key;

  return [...data].sort((a, b) => {
    const x = getSortableValue(a, sortKey);
    const y = getSortableValue(b, sortKey);
    if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
    if (x > y) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}

/* ---------- TABLE ---------- */
export default function ListTable({
  columns,
  data,
  rowKey,
  renderCell,
  sortConfig,
  onSort,
  columnWidths = {},
  startResize,
  pagination,
  loading = false,
  hideEmptyMessage = false,
  selectedCount = 0,
  selectionCounterLabel = null, // ✅ NEW: Custom label (e.g., "tool", "project", "item")
}) {
  const sortedData = applySorting(data, sortConfig, columns);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  // ✅ Generate dynamic text based on count and label
  const getSelectionText = () => {
    if (!selectedCount) return "";

    // If custom label provided, use it (e.g., "tool", "project")
    if (selectionCounterLabel) {
      const plural = selectedCount !== 1 ? "s" : "";
      return `${selectedCount} ${selectionCounterLabel}${plural} selected`;
    }

    // Default fallback
    return `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected`;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white border border-border rounded-2xl overflow-hidden">
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-primary" />
        </div>
      )}

      {/* ✅ SELECTION COUNTER BANNER */}
      {selectedCount > 0 && (
        <div className="shrink-0 bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-check-circle text-blue-600 text-lg" />
            <span className="text-sm font-medium text-blue-900">
              {getSelectionText()}
            </span>
          </div>
        </div>
      )}

      {/* ✅ SCROLLABLE AREA */}
      <div
        className="
          flex-1
          overflow-y-scroll
          overflow-x-auto
          scrollbar-thin
          scrollbar-thumb-muted
          scrollbar-track-transparent
        "
        style={{
          scrollbarGutter: "stable",
          scrollbarWidth: "thin",
        }}
      >
        <table className="w-full table-fixed border-collapse">
          {/* STICKY HEADER */}
          <thead className="sticky top-0 z-40 bg-white border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort(col.key)}
                  className={`p-4 text-xs font-semibold uppercase tracking-wider
                    text-muted-foreground group relative select-none
                    ${col.sortable ? "cursor-pointer hover:bg-muted/50" : ""}`}
                  style={{ width: columnWidths[col.key] || col.width || 160 }}
                >
                  <div className="flex items-center justify-between">
                    {col.key === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={col.allSelected || false}
                        onChange={(e) => col.onToggleAll?.(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary"
                      />
                    ) : (
                      <>
                        <span>{col.label}</span>
                        {col.sortable && (
                          <i className="fa-solid fa-sort ml-1 opacity-30 group-hover:opacity-100" />
                        )}
                      </>
                    )}
                  </div>

                  {col.resizable && (
                    <div
                      onMouseDown={(e) => startResize(col.key, e)}
                      className="absolute right-0 top-0 bottom-0 w-1 bg-border hover:bg-primary cursor-col-resize"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-border text-sm">
            {sortedData.length === 0 && !hideEmptyMessage ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  No records found
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr key={row[rowKey] ?? rowIndex} className="hover:bg-muted/20">
                  {columns.map((col) => (
                    <td
                      key={`${row[rowKey] ?? rowIndex}-${col.key}`}
                      className={`p-4 ${
                        col.key === "checkbox" ? "pl-6 pr-2" : "truncate"
                      }`}
                      style={{
                        width: columnWidths[col.key] || col.width || 160,
                      }}
                    >
                      {safeRenderCell(renderCell, row, col.key)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ STICKY PAGINATION */}
      {pagination && totalPages > 0 && (
        <div className="shrink-0 sticky bottom-0 z-40 bg-white border-t border-border p-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total,
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {pagination.total}
            </span>{" "}
            items
          </div>

          <div className="flex items-center space-x-3">
            <button
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="w-9 h-9 rounded-lg border border-border disabled:opacity-50"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>

            <button className="w-9 h-9 rounded-lg bg-secondary text-white font-medium">
              {pagination.page}
            </button>

            <button
              disabled={pagination.page === totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="w-9 h-9 rounded-lg border border-border disabled:opacity-50"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
