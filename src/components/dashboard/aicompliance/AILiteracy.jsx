import React, { useState, useEffect } from "react";
import useToast from "../../../hooks/useToast";
import AwsButton from "../../common/AwsButton";
import PageLoader from "@/components/common/PageLoader";

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What is the primary goal of AI compliance?",
    options: [
      "Improve AI performance",
      "Reduce development cost",
      "Ensure lawful, ethical, and safe AI use",
      "Increase automation speed",
    ],
    correctIndex: 2,
  },
  {
    id: 2,
    question: "Which regulation governs children’s data privacy in the U.S.?",
    options: ["GDPR", "FERPA", "COPPA", "HIPAA"],
    correctIndex: 2,
  },
  {
    id: 3,
    question:
      "An AI system that disadvantages a specific group is an example of:",
    options: ["Optimization", "Bias", "Overfitting", "Automation"],
    correctIndex: 1,
  },
  {
    id: 4,
    question:
      "Which regulation focuses on AI risk classification in the European Union?",
    options: ["GDPR", "EU AI Act", "ISO 27001", "SOC 2"],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "What does 'human-in-the-loop' ensure in AI systems?",
    options: [
      "Faster AI decisions",
      "Complete automation",
      "Human oversight and accountability",
      "Lower infrastructure cost",
    ],
    correctIndex: 2,
  },
];

export default function AILiteracy() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const showToast = useToast();
  const [pageLoading, setPageLoading] = useState(true);

  const handleSelect = (qId, index) => {
    setAnswers((prev) => ({ ...prev, [qId]: index }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 300); // same smooth delay

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (Object.keys(answers).length !== QUIZ_QUESTIONS.length) {
      showToast("Please answer all questions before submitting.", {
        type: "warning",
      });
      return;
    }
    setSubmitted(true);
  };

  const score = QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (answers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        {/* ---------- HEADER ---------- */}
        <div
          style={{
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontWeight: 700, color: "#111827" }}>
            AI Literacy – Compliance Awareness
          </h2>
          <p style={{ color: "#6B7280", marginTop: 6 }}>
            Test your understanding of AI regulations, privacy, risk, and
            responsible AI practices.
          </p>
        </div>

        {/* ---------- QUIZ ---------- */}
        {!submitted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {QUIZ_QUESTIONS.map((q, index) => (
              <div
                key={q.id}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: 20,
                  background: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#111827",
                  }}
                >
                  {index + 1}. {q.question}
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {q.options.map((opt, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #E5E7EB",
                        background: answers[q.id] === i ? "#EEF2FF" : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={answers[q.id] === i}
                        onChange={() => handleSelect(q.id, i)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <AwsButton label="Submit Quiz" onClick={handleSubmit} />
            </div>
          </div>
        ) : (
          /* ---------- RESULTS ---------- */
          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 32,
              background: "#FFFFFF",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
              Quiz Completed 🎉
            </h3>

            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              Score: {score} / {QUIZ_QUESTIONS.length}
            </div>

            <div style={{ color: "#6B7280", marginBottom: 20 }}>
              {score >= 4
                ? "Great job! You have a strong understanding of AI compliance."
                : "Good effort! Review AI compliance fundamentals to improve."}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <AwsButton
                label="Retake Quiz"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                variant="secondary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
