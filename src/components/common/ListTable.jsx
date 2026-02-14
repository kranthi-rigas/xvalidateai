import { createPortal } from "react-dom";
import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  columns = [],
  data = [],
  rowKey,
  renderCell,

  /* sorting */
  sortConfig,
  onSort,

  /* resizing */
  pagination,
  loading = false,
  hideEmptyMessage = false,
  selectedCount = 0,
  selectionCounterLabel = null,

  enableExport = false,
  exportFileName = "table-export",

  columnWidths,
  startResize,
}) {
  const sortedData = applySorting(data, sortConfig, columns);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  const handleExport = () => {
    if (!data?.length) return;

    const exportData = data.map((row) => {
      const obj = {};

      columns.forEach((col) => {
        if (col.key === "checkbox") return;

        const value = safeRenderCell(renderCell, row, col.key);

        const extractText = (node) => {
          if (typeof node === "string" || typeof node === "number") {
            return node;
          }
          if (React.isValidElement(node) && node.props?.children) {
            return React.Children.toArray(node.props.children)
              .map(extractText)
              .join(" ");
          }
          return "";
        };

        obj[col.label] = extractText(value);
      });

      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, `${exportFileName}-${Date.now()}.xlsx`);
  };

  const TruncatedCell = ({ children }) => {
    const ref = React.useRef(null);
    const [isOverflowing, setIsOverflowing] = React.useState(false);
    const [position, setPosition] = React.useState(null);

    const getTextContent = (node) => {
      if (typeof node === "string" || typeof node === "number") {
        return String(node);
      }
      if (React.isValidElement(node) && node.props?.children) {
        return React.Children.toArray(node.props.children)
          .map(getTextContent)
          .join(" ");
      }
      return "";
    };

    const textContent = getTextContent(children);

    React.useEffect(() => {
      const el = ref.current;
      if (el) {
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      }
    }, [children]);

    const handleMouseEnter = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();

      setPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleMouseLeave = () => {
      setPosition(null);
    };

    return (
      <>
        <div
          ref={ref}
          className="truncate w-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>

        {isOverflowing &&
          position &&
          createPortal(
            <div
              style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                minWidth: position.width,
                maxWidth: 500,
              }}
              className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-2xl whitespace-normal break-words z-[99999]"
            >
              {textContent}
            </div>,
            document.body,
          )}
      </>
    );
  };

  const isWidthControlled = !!columnWidths;

  const [internalWidths, setInternalWidths] = React.useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = col.key === "checkbox" ? 60 : col.width || 260;
    });
    return initial;
  });

  const resizingRef = React.useRef(null);

  const startInternalResize = (key, e) => {
    e.preventDefault();
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: internalWidths[key],
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopResize);
  };

  const onMouseMove = (e) => {
    if (!resizingRef.current) return;

    const { key, startX, startWidth } = resizingRef.current;
    const newWidth = Math.max(80, startWidth + (e.clientX - startX));

    setInternalWidths((prev) => ({
      ...prev,
      [key]: newWidth,
    }));
  };

  const stopResize = () => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopResize);
  };

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

      {enableExport && (
        <div className="flex justify-end px-6 py-3 border-b bg-white">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <i className="fa-solid fa-file-excel mr-2" />
            Export to Excel
          </button>
        </div>
      )}

      {/* ✅ SCROLLABLE AREA */}
      <div
        className="
          flex-1
          overflow-y-auto
          overflow-x-auto
          scrollbar-thin
          scrollbar-thumb-muted
          scrollbar-track-transparent
        "
        style={{
          scrollbarWidth: "thin",
        }}
      >
        <table className="w-full table-fixed border-collapse">
          {/* STICKY HEADER */}
          <thead className="sticky top-0 z-40 bg-white border-b border-border">
            <tr>
              {columns.map((col) => {
                const width = isWidthControlled
                  ? columnWidths?.[col.key]
                  : internalWidths?.[col.key];

                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort(col.key)}
                    className={`p-4 text-xs font-semibold uppercase tracking-wider
            text-muted-foreground group relative select-none
            ${col.sortable ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    style={{ width }}
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
                        onMouseDown={(e) =>
                          isWidthControlled
                            ? startResize?.(col.key, e)
                            : startInternalResize(col.key, e)
                        }
                        className="absolute right-0 top-0 bottom-0 w-1 bg-border hover:bg-primary cursor-col-resize"
                      />
                    )}
                  </th>
                );
              })}
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
                  {columns.map((col) => {
                    const width = isWidthControlled
                      ? columnWidths?.[col.key]
                      : internalWidths?.[col.key];

                    return (
                      <td
                        key={`${row[rowKey] ?? rowIndex}-${col.key}`}
                        className={`p-4 ${
                          col.key === "checkbox"
                            ? "pl-6 pr-2"
                            : col.truncate === false
                              ? "break-words whitespace-normal"
                              : "truncate"
                        }`}
                        style={{
                          width,
                          minWidth: width,
                        }}
                      >
                        {col.truncate === false ? (
                          safeRenderCell(renderCell, row, col.key)
                        ) : (
                          <TruncatedCell>
                            {safeRenderCell(renderCell, row, col.key)}
                          </TruncatedCell>
                        )}
                      </td>
                    );
                  })}
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
