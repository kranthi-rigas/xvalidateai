import React from "react";
import COLORS from "@/styles/colors";
import { useNavigate } from "react-router-dom";

export default function ComplianceToolsModal({
  open,
  onClose,
  complianceData,
}) {
  const navigate = useNavigate();

  // ✅ SAFETY GUARD
  if (!open || !complianceData || !Array.isArray(complianceData.tools)) {
    return null;
  }

  const tools = complianceData.tools || [];

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={header}>
          <h2 style={title}>{complianceData.name}</h2>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={body}>
          <div style={countText}>
            {tools.length} Tool{tools.length !== 1 ? "s" : ""}
          </div>

          {tools.length === 0 ? (
            <div style={{ color: COLORS.textMuted }}>
              No tools found for this compliance.
            </div>
          ) : (
            tools.map((tool) => (
              <div key={tool.project_id} style={toolCard}>
                <div
                  style={toolName}
                  onClick={() =>
                    navigate(`/dashboard/aicompliance/${tool.project_id}`)
                  }
                >
                  {tool.name}
                </div>

                <div style={metaRow}>
                  <span>Score: {tool.score ?? 0}</span>
                  <span>{tool.recommendation ?? "-"}</span>
                </div>
              </div>
            ))
          )}
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
  zIndex: 4000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modal = {
  width: 600,
  maxWidth: "90vw",
  maxHeight: "80vh",
  background: COLORS.bgPrimary,
  borderRadius: 16,
  boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const header = {
  padding: "20px 24px",
  borderBottom: `1px solid ${COLORS.borderLight}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title = {
  fontSize: 20,
  fontWeight: 700,
};

const closeBtn = {
  background: "transparent",
  border: "none",
  fontSize: 22,
  cursor: "pointer",
};

const body = {
  padding: 24,
  overflowY: "auto",
};

const countText = {
  marginBottom: 16,
  fontWeight: 600,
  color: COLORS.textMuted,
};

const toolCard = {
  padding: 16,
  borderRadius: 12,
  border: `1px solid ${COLORS.borderLight}`,
  marginBottom: 12,
};

const toolName = {
  fontWeight: 700,
  cursor: "pointer",
  color: COLORS.primary,
  marginBottom: 6,
};

const metaRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: COLORS.textMuted,
};
