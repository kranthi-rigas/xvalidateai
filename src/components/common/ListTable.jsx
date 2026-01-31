import { right } from "@popperjs/core";
import React from "react";

/* ---------- STYLES ---------- */
export const Th = {
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#414D5C",
  background: "#F2F3F3",
  borderBottom: "1px solid #D5DBE0",
  fontFamily: "Amazon Ember, sans-serif",
  textAlign: "left",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

export const LinkStyle = {
  color: "#0972D3",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  padding: "2px 0",
  borderRadius: 4,
  display: "inline-block",
};

export const Td = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#1A1A1A",
  fontFamily: "Amazon Ember, sans-serif",
  fontWeight: 400,
  lineHeight: "20px",
};

/* ---------- HELPERS ---------- */
const safeStyle = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

const safeRenderCell = (renderCell, row, key) => {
  try {
    const value = renderCell?.(row, key);

    if (React.isValidElement(value)) return value;

    if (typeof value === "string") {
      if (value.includes("http")) {
        return (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        );
      }
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

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
  columnWidths = {},
  startResize,

  /* layout controls */
  hideHeader = false,
  hideEmptyMessage = false,

  /* customization */
  containerStyle = {},
  containerClassName = "",
  tableClassName = "",
  getRowStyle,
  getRowClassName,
}) {
  const sortedData = applySorting(data, sortConfig, columns);

  const arrow = (key) => {
    if (sortConfig?.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  return (
    <div
      className={containerClassName}
      style={{
        width: "100%",
        overflow: "auto",
        position: "relative",
        ...safeStyle(containerStyle),
      }}
    >
      <table
        className={tableClassName}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          background: "white",
        }}
      >
        {/* ---------- HEADER ---------- */}
        {!hideHeader && (
          <thead className="sticky top-0 bg-muted z-10 shadow-sm">
            <tr>
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={{
                    ...Th,
                    width: columnWidths[col.key] || col.width || 160,
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none",
                    padding: col.key === "checkbox" ? "0 6px" : "0 16px",
                  }}
                >
                  {colIndex !== 0 && col.key !== "checkbox" && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "25%",
                        bottom: "25%",
                        width: 1,
                        background: "#D1D5DB",
                      }}
                    />
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 40,
                    }}
                  >
                    {col.key === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={col.allSelected || false}
                        onChange={(e) => col.onToggleAll?.(e.target.checked)}
                      />
                    ) : (
                      <>
                        <span>{col.label}</span>
                        {col.sortable && <span>{arrow(col.key)}</span>}
                      </>
                    )}
                  </div>

                  {col.resizable && (
                    <div
                      onMouseDown={(e) => startResize?.(col.key, e)}
                      style={{
                        position: "absolute",
                        right: -4,
                        top: 0,
                        width: 8,
                        height: "100%",
                        cursor: "col-resize",
                      }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
        )}

        {/* ---------- BODY ---------- */}
        <tbody>
          {sortedData.length === 0 && !hideEmptyMessage ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 40, textAlign: "center" }}
              >
                No records found.
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={row[rowKey] ?? rowIndex}
                className={getRowClassName?.(row, rowIndex)}
                style={{
                  borderBottom: "1px solid #E5E7EB",
                  height: 42,
                  ...safeStyle(getRowStyle?.(row, rowIndex)),
                }}
              >
                {columns.map((col) => (
                  <td
                    key={`${row[rowKey] ?? rowIndex}-${col.key}`}
                    style={{
                      ...Td,
                      padding: col.key === "checkbox" ? "0 6px" : "0 16px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
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
  );
}
