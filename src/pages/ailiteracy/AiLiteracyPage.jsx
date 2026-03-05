import React, { useState, useEffect, useRef } from "react";
import COLORS from "@/styles/colors";
import useToast from "@/hooks/useToast";
import { questions } from "./data/questions";
import Questionnaire from "./Questionnaire";
import Results from "./Results";
import IncidentPlaybook from "./IncidentPlaybook";

export default function AiLiteracyPage() {
  const [view, setView] = useState("landing"); // "landing" | "questionnaire" | "results"
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const showToast = useToast();
  const topRef = useRef(null);
  const playbookRef = useRef(null);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAnswer = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      const unanswered = questions.length - Object.keys(answers).length;
      showToast(
        `Please answer all questions before submitting. ${unanswered} question${unanswered > 1 ? "s" : ""} remaining.`,
        { type: "error" }
      );
      return;
    }
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    setResult(totalScore);
    setView("results");
  };

  useEffect(() => {
    scrollToTop();
  }, [view]);

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setShowPlaybook(false);
    setView("landing");
  };

  const handleViewPlaybook = () => {
    setShowPlaybook(true);
    setTimeout(() => {
      if (playbookRef.current) {
        playbookRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  return (
    <div ref={topRef} className="spicy-y">
      <div className="dashboard-body">
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h2 style={{ fontWeight: 700, color: COLORS.textPrimary }}>
            AI Literacy
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 6 }}>
            Understand your organisation's AI readiness across knowledge, use, impact, and agency.
          </p>
        </div>

        {/* LANDING */}
        {view === "landing" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            {/* Take Assessment Card */}
            <div
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: 14,
                padding: 32,
                background: COLORS.bgPrimary,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: COLORS.primaryLighter,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="fa-solid fa-graduation-cap"
                  style={{ fontSize: 22, color: COLORS.primary }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary, marginBottom: 8 }}>
                  AI Literacy Assessment
                </div>
                <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
                  Rate 16 statements across four pillars to receive a score and your organisation's AI literacy level.
                </p>
              </div>
              <button
                onClick={() => setView("questionnaire")}
                style={{
                  marginTop: 4,
                  padding: "11px 32px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: COLORS.primary,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  width: "100%",
                }}
                onMouseOver={(e) => (e.target.style.background = COLORS.primaryDark)}
                onMouseOut={(e) => (e.target.style.background = COLORS.primary)}
              >
                Take Assessment
              </button>
            </div>

            {/* Incident Playbook Card */}
            <div
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: 14,
                padding: 32,
                background: COLORS.bgPrimary,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#e8f5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="fa-solid fa-book-open"
                  style={{ fontSize: 22, color: COLORS.success }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary, marginBottom: 8 }}>
                  Incident Response Playbook
                </div>
                <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
                  A step-by-step guide for detecting, containing, and resolving AI-related incidents in your organisation.
                </p>
              </div>
              <button
                onClick={() => { setShowPlaybook(true); setView("results"); setResult(null); }}
                style={{
                  marginTop: 4,
                  padding: "11px 32px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.success,
                  background: "#e8f5e9",
                  border: `1px solid ${COLORS.success}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = COLORS.success;
                  e.target.style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "#e8f5e9";
                  e.target.style.color = COLORS.success;
                }}
              >
                View Playbook
              </button>
            </div>
          </div>
        )}

        {/* QUESTIONNAIRE */}
        {view === "questionnaire" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setView("landing")}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.primary,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="fa-solid fa-arrow-left" /> Back
              </button>
            </div>
            <Questionnaire
              questions={questions}
              answers={answers}
              onAnswer={handleAnswer}
              onSubmit={handleSubmit}
            />
          </>
        )}

        {/* RESULTS */}
        {view === "results" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {result !== null && (
              <Results score={result} onRetake={handleRetake} onViewPlaybook={handleViewPlaybook} />
            )}

            {result === null && (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => { setShowPlaybook(false); setView("landing"); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.primary,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <i className="fa-solid fa-arrow-left" /> Back
                </button>
              </div>
            )}

            {showPlaybook && (
              <div ref={playbookRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8, fontSize: 19 }}>
                    AI Incident Response Playbook
                  </h3>
                  <p style={{ color: COLORS.textMuted, fontSize: 14 }}>
                    Reference guide for managing AI-related incidents in your organisation.
                  </p>
                </div>
                <IncidentPlaybook />

                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <button
                    onClick={handleRetake}
                    style={{
                      padding: "11px 36px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.primary,
                      background: COLORS.primaryLighter,
                      border: `1px solid ${COLORS.primary}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = COLORS.primary;
                      e.target.style.color = "#fff";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = COLORS.primaryLighter;
                      e.target.style.color = COLORS.primary;
                    }}
                  >
                    Retake Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
