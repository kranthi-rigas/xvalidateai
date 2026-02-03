import React, { useState } from "react";
import AwsButton from "./AwsButton";
import { FiSearch } from "react-icons/fi";

const PAGE_SIZES = [10, 25, 50, 100];

export default function TablePreferencesModal({
  open,
  onClose,
  pageSize,
  setPageSize,
  wrapLines,
  setWrapLines,
  stripedRows,
  setStripedRows,
  visibleColumns,
  toggleColumn,
  columns,
}) {
  const [filter, setFilter] = useState("");

  if (!open) return null;

  const preferenceColumns = columns.filter(
    (c) => c.key !== "checkbox" && c.label,
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={header}>
          <h2 style={title}>Preferences</h2>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={body}>
          {/* LEFT */}
          <div style={left}>
            <h4 style={sectionTitle}>Page size</h4>

            {PAGE_SIZES.map((n) => (
              <label key={n} style={radioRow}>
                <input
                  type="radio"
                  checked={pageSize === n}
                  onChange={() => setPageSize(n)}
                />
                <span>{n} rows</span>
              </label>
            ))}

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={wrapLines}
                onChange={(e) => setWrapLines(e.target.checked)}
              />
              <span>Wrap text</span>
            </label>

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={stripedRows}
                onChange={(e) => setStripedRows(e.target.checked)}
              />
              <span>Striped rows</span>
            </label>
          </div>

          <div style={divider} />

          {/* RIGHT */}
          <div style={right}>
            <h4 style={sectionTitle}>Columns</h4>
            <p style={subText}>Show or hide table columns</p>

            <div style={searchBox}>
              <FiSearch size={16} />
              <input
                placeholder="Filter columns"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={searchInput}
              />
            </div>

            {preferenceColumns
              .filter((c) =>
                c.label.toLowerCase().includes(filter.toLowerCase()),
              )
              .map((col) => {
                const enabled = visibleColumns.includes(col.key);

                return (
                  <div key={col.key} style={columnRow}>
                    <div style={columnLeft}>
                      <span style={dragDots}>⋮⋮</span>

                      <span
                        style={{
                          ...statusDot,
                          background: enabled ? "#2563EB" : "#CBD5E1",
                        }}
                      />

                      <span
                        style={{
                          color: enabled ? "#111827" : "#9CA3AF",
                        }}
                      >
                        {col.label}
                      </span>
                    </div>

                    <label style={toggleWrap}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleColumn(col.key)}
                        style={{ display: "none" }}
                      />
                      <span
                        style={{
                          ...toggleTrack,
                          background: enabled ? "#2563EB" : "#D1D5DB",
                        }}
                      >
                        <span
                          style={{
                            ...toggleThumb,
                            transform: enabled
                              ? "translateX(16px)"
                              : "translateX(0)",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                );
              })}
          </div>
        </div>

        {/* FOOTER */}
        <div style={footer}>
          <AwsButton label="Cancel" variant="secondary" onClick={onClose} />
          <AwsButton label="Apply" variant="primary" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
/* ================= STYLES ================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 3000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modal = {
  width: 720,
  maxWidth: "90vw",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
  overflow: "hidden",
};

const header = {
  padding: "20px 24px",
  borderBottom: "1px solid #E5E7EB",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title = { fontSize: 22, fontWeight: 700 };
const closeBtn = { background: "transparent", border: "none", fontSize: 22 };

const body = {
  display: "flex",
  padding: 24,
  overflowY: "auto",
  flex: 1,
};

const left = { flex: 1 };
const right = { flex: 1 };

const divider = { width: 1, background: "#E5E7EB", margin: "0 28px" };

const sectionTitle = { fontSize: 15, fontWeight: 700, marginBottom: 6 };
const subText = { fontSize: 13, color: "#6B7280", marginBottom: 12 };

const radioRow = { display: "flex", gap: 10, marginBottom: 10 };
const checkRow = { display: "flex", gap: 10, marginTop: 14 };

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #D1D5DB",
  borderRadius: 10,
  padding: "8px 12px",
  marginBottom: 12,
};

const searchInput = { border: "none", outline: "none", flex: 1 };

const columnRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #F1F5F9",
};

const columnLeft = { display: "flex", alignItems: "center", gap: 10 };
const dragDots = { color: "#9CA3AF" };

const statusDot = { width: 8, height: 8, borderRadius: "50%" };

const toggleWrap = {
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
};

const toggleTrack = {
  width: 36,
  height: 20,
  borderRadius: 999,
  position: "relative",
};

const toggleThumb = {
  position: "absolute",
  top: 3,
  left: 3,
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "#FFFFFF",
  transition: "transform 0.2s",
};

const footer = {
  padding: "16px 24px",
  borderTop: "1px solid #E5E7EB",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};
