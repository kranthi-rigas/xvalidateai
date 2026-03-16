import React, { useState } from "react";
import AwsButton from "./AwsButton";
import { FiSearch } from "react-icons/fi";
import COLORS from "@/styles/colors";

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
                  style={{ accentColor: COLORS.primary }}
                />
                <span>{n} rows</span>
              </label>
            ))}

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={wrapLines}
                onChange={(e) => setWrapLines(e.target.checked)}
                style={{ accentColor: COLORS.primary }}
              />
              <span>Wrap text</span>
            </label>

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={stripedRows}
                onChange={(e) => setStripedRows(e.target.checked)}
                style={{ accentColor: COLORS.primary }}
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
                style={{ searchInput, accentColor: COLORS.primary }}
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
                          background: enabled ? COLORS.primary : COLORS.border,
                        }}
                      />

                      <span
                        style={{
                          color: enabled
                            ? COLORS.textPrimary
                            : COLORS.textLight,
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
                        style={{ display: "none", accentColor: COLORS.primary }}
                      />
                      <span
                        style={{
                          ...toggleTrack,
                          background: enabled
                            ? COLORS.primary
                            : COLORS.borderLight,
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
  background: COLORS.bgOverlay,
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
  background: COLORS.bgPrimary,
  borderRadius: 16,
  boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
  overflow: "hidden",
};

const header = {
  padding: "20px 24px",
  borderBottom: `1px solid ${COLORS.borderLight}`,
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

const divider = { width: 1, background: COLORS.borderLight, margin: "0 28px" };

const sectionTitle = { fontSize: 15, fontWeight: 700, marginBottom: 6 };
const subText = { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 };

const radioRow = { display: "flex", gap: 10, marginBottom: 10 };
const checkRow = { display: "flex", gap: 10, marginTop: 14 };

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  border: `1px solid ${COLORS.borderLight}`,
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
  borderBottom: `1px solid ${COLORS.bgTertiary}`,
};

const columnLeft = { display: "flex", alignItems: "center", gap: 10 };
const dragDots = { color: COLORS.textLight };

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
  background: COLORS.bgPrimary,
  transition: "transform 0.2s",
};

const footer = {
  padding: "16px 24px",
  borderTop: `1px solid ${COLORS.borderLight}`,
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};
