import React from "react";
import COLORS from "@/styles/colors";

const RATING_LABELS = {
  1: "Not at all true",
  2: "Somewhat true",
  3: "Mostly true",
  4: "Fully true",
};

export default function Questionnaire({ questions, answers, onAnswer, onSubmit }) {
  let currentPillar = null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {questions.map((q, index) => {
        const showPillarHeader = q.pillar !== currentPillar;
        if (showPillarHeader) currentPillar = q.pillar;

        return (
          <React.Fragment key={index}>
            {showPillarHeader && (
              <div
                style={{
                  marginTop: index === 0 ? 0 : 16,
                  marginBottom: 4,
                  padding: "10px 16px",
                  background: COLORS.primaryLighter,
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 16,
                  color: COLORS.primary,
                  letterSpacing: 0.5,
                }}
              >
                {q.pillar}
              </div>
            )}

            <div
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: 12,
                padding: 20,
                background: COLORS.bgPrimary,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 14,
                  color: COLORS.textPrimary,
                  lineHeight: 1.5,
                }}
              >
                {index + 1}. {q.question}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[1, 2, 3, 4].map((value) => (
                  <label
                    key={value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: `1px solid ${
                        answers[index] === value
                          ? COLORS.primary
                          : COLORS.borderLight
                      }`,
                      background:
                        answers[index] === value
                          ? COLORS.primaryLighter
                          : COLORS.bgPrimary,
                      transition: "all 0.15s ease",
                      flex: "1 1 180px",
                      minWidth: 160,
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={value}
                      checked={answers[index] === value}
                      onChange={() => onAnswer(index, value)}
                      style={{ accentColor: COLORS.primary }}
                    />
                    <span style={{ fontSize: 14, color: COLORS.textSecondary }}>
                      {value} – {RATING_LABELS[value]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <button
          type="submit"
          style={{
            padding: "12px 40px",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            background: COLORS.primary,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.background = COLORS.primaryDark)}
          onMouseOut={(e) => (e.target.style.background = COLORS.primary)}
        >
          Submit Assessment
        </button>
      </div>
    </form>
  );
}
