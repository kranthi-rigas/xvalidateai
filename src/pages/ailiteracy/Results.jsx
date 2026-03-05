import React from "react";
import COLORS from "@/styles/colors";

function getLiteracyLevel(score) {
  if (score >= 61) return { level: "Advanced", color: COLORS.success };
  if (score >= 46) return { level: "Proficient", color: COLORS.info };
  if (score >= 31) return { level: "Developing", color: COLORS.warning };
  return { level: "Emerging", color: COLORS.error };
}

function getLevelDescription(level) {
  switch (level) {
    case "Advanced":
      return "Excellent! Your organisation demonstrates a comprehensive understanding of AI concepts, responsible usage, impact awareness, and strong professional agency.";
    case "Proficient":
      return "Well done! Your organisation has a solid foundation in AI literacy across all pillars, with minor areas for continued growth.";
    case "Developing":
      return "Good progress! Your organisation is building AI literacy but would benefit from targeted training in specific areas to strengthen understanding and practice.";
    case "Emerging":
      return "Your organisation is in the early stages of AI literacy. Consider implementing a structured AI training programme to build knowledge, responsible use, and confidence.";
    default:
      return "";
  }
}

export default function Results({ score, onRetake, onViewPlaybook }) {
  const maxScore = 64;
  const { level, color } = getLiteracyLevel(score);
  const description = getLevelDescription(level);
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div
      style={{
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 12,
        padding: 32,
        background: COLORS.bgPrimary,
        textAlign: "center",
      }}
    >
      <h3
        style={{
          fontWeight: 700,
          marginBottom: 20,
          color: COLORS.textPrimary,
          fontSize: 22,
        }}
      >
        AI Literacy Assessment Complete
      </h3>

      {/* Score Display */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: `4px solid ${color}`,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color }}>
            {score}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            / {maxScore}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 6,
          color,
        }}
      >
        Literacy Level: {level}
      </div>

      <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 8 }}>
        {percentage}% overall score
      </div>

      <div
        style={{
          maxWidth: 540,
          margin: "0 auto 24px",
          color: COLORS.textSecondary,
          lineHeight: 1.6,
          fontSize: 15,
        }}
      >
        {description}
      </div>

      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={onRetake}
          style={{
            padding: "10px 28px",
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.primary,
            background: "transparent",
            border: `1px solid ${COLORS.primary}`,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = COLORS.primaryLighter; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <i className="fa-solid fa-arrow-left" /> Back
        </button>
        <button
          onClick={onViewPlaybook}
          style={{
            padding: "10px 28px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: COLORS.primary,
            border: `1px solid ${COLORS.primary}`,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.background = COLORS.primaryDark)}
          onMouseOut={(e) => (e.target.style.background = COLORS.primary)}
        >
          View Incident Playbook
        </button>
      </div>
    </div>
  );
}
