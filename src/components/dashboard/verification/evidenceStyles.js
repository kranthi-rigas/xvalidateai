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
    // Wider than before: these views carry four-column tables, and at 760 the
    // summary column wrapped after three or four words.
    width: "100%", maxWidth: 880, maxHeight: "88vh",
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

  // Sections were running into each other; a rule plus real space makes the
  // boundary readable without adding colour.
  section: { marginBottom: 28, paddingBottom: 4 },
  sectionDivider: {
    borderTop: `1px solid ${COLORS.borderLight}`,
    marginTop: 24, paddingTop: 24,
  },
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
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  cardLine: { fontSize: 13, marginBottom: 4, lineHeight: 1.5 },
  // The number that actually conveys scale should not sit inside a sentence
  // at the same weight as everything else.
  cardMetric: { fontSize: 13, fontWeight: 700 },
  sourceLink: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, fontWeight: 600, marginTop: 6, textDecoration: "none",
  },

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
    padding: "12px 16px 12px 0", verticalAlign: "top", lineHeight: 1.5,
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  tdNoWrap: {
    padding: "12px 16px 12px 0", verticalAlign: "top", whiteSpace: "nowrap",
    lineHeight: 1.5, borderBottom: `1px solid ${COLORS.borderLight}`,
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

// A severity rendered as plain text in a table cell carries no weight at all,
// which defeats the purpose of having one. Shape and emphasis are set here;
// colour still comes from the stylesheet's existing badge classes.
export const severityPill = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  letterSpacing: "0.04em", whiteSpace: "nowrap",
};

export const severityClass = (severity) => {
  if (severity === "CRITICAL" || severity === "HIGH") return "badge-error";
  if (severity === "MEDIUM") return "badge-warning";
  return "badge-success";
};
