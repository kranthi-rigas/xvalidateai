import { COLORS } from "@/styles/colors";

/**
 * Layout only - spacing, alignment, flex and table geometry.
 *
 * This project has no Tailwind (no config, no dependency), so utility classes
 * like space-y-2, gap-2, flex-wrap and text-xs resolve to nothing and the
 * markup collapses into unaligned text. These are the layout rules those
 * classes were meant to provide, written inline the way ProjectDetailsModern
 * already does it.
 *
 * Colour is left to the existing stylesheet - badge-success / badge-warning /
 * badge-error and the page's own classes - so nothing here changes the
 * palette. COLORS is used only for borders and dividers, matching what the
 * surrounding cards already draw.
 */
export const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000, display: "flex",
    alignItems: "center", justifyContent: "center", padding: 16,
    background: "rgba(0,0,0,0.45)",
  },
  modal: {
    width: "100%", maxWidth: 760, maxHeight: "88vh",
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    gap: 16, padding: "20px 24px",
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  headerText: { minWidth: 0 },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  subtitle: { marginTop: 6, fontSize: 13 },
  body: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  close: {
    background: "none", border: "none", cursor: "pointer",
    padding: 4, lineHeight: 1, flexShrink: 0,
  },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase", marginBottom: 10,
  },

  // Stacked items need explicit gaps; space-y-* was doing nothing.
  stack: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    border: `1px solid ${COLORS.borderLight}`, borderRadius: 10,
    padding: "12px 14px",
  },
  cardTitle: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  cardLine: { fontSize: 13, marginBottom: 2 },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    display: "inline-flex", alignItems: "center", padding: "4px 10px",
    borderRadius: 999, fontSize: 12, whiteSpace: "nowrap",
    border: `1px solid ${COLORS.borderLight}`,
  },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.05em",
    padding: "8px 14px 8px 0", whiteSpace: "nowrap",
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  td: {
    padding: "10px 14px 10px 0", verticalAlign: "top",
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  tdNoWrap: {
    padding: "10px 14px 10px 0", verticalAlign: "top", whiteSpace: "nowrap",
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },

  notice: {
    borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13,
    border: `1px solid ${COLORS.borderLight}`,
  },

  footer: {
    borderTop: `1px solid ${COLORS.borderLight}`, padding: "16px 24px",
    marginTop: 8,
  },
  linkButton: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    fontWeight: 600, fontSize: 14,
  },
  list: { margin: 0, paddingLeft: 18, display: "flex",
          flexDirection: "column", gap: 6, fontSize: 14 },
};

// Colour comes from the stylesheet's existing badge classes, not from here.
export const severityClass = (severity) => {
  if (severity === "CRITICAL" || severity === "HIGH") return "badge-error";
  if (severity === "MEDIUM") return "badge-warning";
  return "badge-success";
};
