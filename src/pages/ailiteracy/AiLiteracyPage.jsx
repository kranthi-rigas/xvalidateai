import React, { useState, useEffect, useRef } from "react";
import COLORS from "@/styles/colors";
import useToast from "@/hooks/useToast";
import { questions } from "./data/questions";
import Questionnaire from "./Questionnaire";
import Results from "./Results";
import IncidentPlaybook, { incidentFlowchart } from "./IncidentPlaybook";
import IncidentResponseExercise from "./IncidentResponseExercise";
import MermaidDiagram from "./MermaidDiagram";
import { useLocation } from "react-router-dom";
import PageTransition from "@/components/common/PageTransition";
import { downloadPdfWithWatermark } from "@/utils/docxWatermark";

export default function AiLiteracyPage() {
  const location = useLocation();
  const [view, setView] = useState("landing"); // "landing" | "questionnaire" | "results"
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const showToast = useToast();
  const topRef = useRef(null);
  const playbookRef = useRef(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAnswer = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    const answeredCount = Object.values(answers).filter(
      (value) => Number.isInteger(value) && value >= 1 && value <= 4,
    ).length;
    if (answeredCount < questions.length) {
      setShowIncompleteModal(true);
      return;
    }
    submitAndScore();
  };

  const submitAndScore = () => {
    const totalScore = questions.reduce(
      (sum, _, idx) => sum + (answers[idx] || 0),
      0,
    );
    setResult(totalScore);
    setView("results");
  };

  useEffect(() => {
    scrollToTop();
  }, [view]);

  useEffect(() => {
    setView("landing");
    setAnswers({});
    setResult(null);
    setShowPlaybook(false);
  }, [location.key]);

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
        playbookRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  const PD_DOCS = [
    {
      id: "ai_resilient",
      file: "ai_resilient_assessments_PD.pdf",
      title: "AI-Resilient Assessments",
      description:
        "Strategies and frameworks for designing assessments that remain meaningful and valid in an AI-enabled environment.",
      icon: "fa-solid fa-shield-halved",
      color: "#0F3357",
      bg: "#e8f0f8",
    },
    {
      id: "ai_tools_landscape",
      file: "ai_tools_landscape_PD.pdf",
      title: "AI Tools Landscape",
      description:
        "A curated overview of current AI tools relevant to education — capabilities, risks, and guidance for responsible use.",
      icon: "fa-solid fa-layer-group",
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      id: "how_ai_works",
      file: "how_ai_works_primer_PD.pdf",
      title: "How AI Works: A Primer",
      description:
        "An accessible introduction to how modern AI systems work, written for educators without a technical background.",
      icon: "fa-solid fa-microchip",
      color: "#0891b2",
      bg: "#e0f2fe",
    },
    {
      id: "prompt_literacy",
      file: "prompt_literacy_PD.pdf",
      title: "Prompt Literacy",
      description:
        "Developing the skills to communicate effectively with AI systems — crafting prompts that produce useful, reliable outputs.",
      icon: "fa-solid fa-keyboard",
      color: "#ea580c",
      bg: "#fff7ed",
    },
    {
      id: "teaching_ai_responsible",
      file: "teaching_ai_responsible_PD.pdf",
      title: "Teaching AI Responsibly",
      description:
        "Practical guidance on embedding responsible AI principles into classroom practice and school-wide policy.",
      icon: "fa-solid fa-chalkboard-user",
      color: "#198038",
      bg: "#e8f5e9",
    },
  ];

  const handleDownloadDoc = async (doc) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const organizationName = userInfo?.organization?.name || "XVALIDATEAI";
      await downloadPdfWithWatermark(
        `/documents/${doc.file}`,
        doc.file,
        organizationName
      );
    } catch (err) {
      showToast("Failed to download document. Please try again.", "error");
    }
  };

  const headings = {
    landing: {
      title: "AI Literacy",
      subtitle:
        "Understand your organisation's AI readiness across knowledge, use, impact, and agency.",
    },
    questionnaire: {
      title: "AI Literacy Assessment",
      subtitle:
        "Rate 16 statements across four pillars to measure your organisation's AI literacy level.",
    },
    results: {
      title:
        result !== null
          ? "Your Assessment Results"
          : "AI Incident Response Playbook",
      subtitle:
        result !== null
          ? "Here's how your organisation scored across the AI literacy pillars."
          : "A step-by-step guide for detecting, containing, and resolving AI-related incidents.",
    },
    exercise: {
      title: "Incident Response Exercise",
      subtitle:
        "Complete the interactive playbook template to design your school's AI incident response process.",
    },
    flowchart: {
      title: "Incident Response Flowchart",
      subtitle:
        "A visual overview of the end-to-end AI incident response process.",
    },
  };

  const currentHeading = headings[view] ?? headings.landing;

  return (
    <div ref={topRef} className="spicy-y">
      <div className="dashboard-body">
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {currentHeading.title}
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 6 }}>
            {currentHeading.subtitle}
          </p>
        </div>

        {/* LANDING */}
        {view === "landing" && (
          <PageTransition>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
                maxWidth: 1000,
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
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    AI Literacy Assessment
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Rate 16 statements across four pillars to receive a score
                    and your organisation's AI literacy level.
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
                  onMouseOver={(e) =>
                    (e.target.style.background = COLORS.primaryDark)
                  }
                  onMouseOut={(e) =>
                    (e.target.style.background = COLORS.primary)
                  }
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
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Incident Response Playbook
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    A step-by-step guide for detecting, containing, and
                    resolving AI-related incidents in your organisation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPlaybook(true);
                    setView("results");
                    setResult(null);
                  }}
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

              {/* Incident Response Flowchart Card */}
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
                    background: "#fff7ed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-diagram-project"
                    style={{ fontSize: 22, color: "#ea580c" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Incident Response Flowchart
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Visualise the full end-to-end AI incident response process
                    from detection through to resolution.
                  </p>
                </div>
                <button
                  onClick={() => setView("flowchart")}
                  style={{
                    marginTop: 4,
                    padding: "11px 32px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#ea580c",
                    background: "#fff7ed",
                    border: "1px solid #ea580c",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#ea580c";
                    e.target.style.color = "#fff";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#fff7ed";
                    e.target.style.color = "#ea580c";
                  }}
                >
                  View Flowchart
                </button>
              </div>

              {/* Incident Response Exercise Card */}
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
                    background: "#ede9fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-pen-to-square"
                    style={{ fontSize: 22, color: "#7c3aed" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Incident Response Exercise
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Complete the interactive playbook template to design your
                    school's AI incident response process.
                  </p>
                </div>
                <button
                  onClick={() => setView("exercise")}
                  style={{
                    marginTop: 4,
                    padding: "11px 32px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#7c3aed",
                    background: "#ede9fe",
                    border: "1px solid #7c3aed",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#7c3aed";
                    e.target.style.color = "#fff";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#ede9fe";
                    e.target.style.color = "#7c3aed";
                  }}
                >
                  Start Exercise
                </button>
              </div>
            </div>

            {/* ── Professional Development Resources ─────────────────────── */}
            <div style={{ maxWidth: 1000, margin: "40px auto 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 22,
                    background: COLORS.primary,
                    borderRadius: 2,
                  }}
                />
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    margin: 0,
                  }}
                >
                  Professional Development Resources
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                {PD_DOCS.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: 12,
                      padding: "20px 22px",
                      background: COLORS.bgPrimary,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: doc.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className={doc.icon}
                          style={{ fontSize: 17, color: doc.color }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: COLORS.textPrimary,
                            marginBottom: 4,
                            lineHeight: 1.3,
                          }}
                        >
                          {doc.title}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: COLORS.textMuted,
                            margin: 0,
                            lineHeight: 1.55,
                          }}
                        >
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadDoc(doc)}
                      style={{
                        marginTop: "auto",
                        padding: "9px 0",
                        fontSize: 13,
                        fontWeight: 600,
                        color: doc.color,
                        background: doc.bg,
                        border: `1px solid ${doc.color}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        transition: "all 0.2s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = doc.color;
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = doc.bg;
                        e.currentTarget.style.color = doc.color;
                      }}
                    >
                      <i className="fa-solid fa-download" style={{ fontSize: 13 }} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </PageTransition>
        )}

        {/* QUESTIONNAIRE */}
        {view === "questionnaire" && (
          <PageTransition>
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
          </PageTransition>
        )}

        {/* EXERCISE */}
        {view === "exercise" && (
          <PageTransition>
            <IncidentResponseExercise onBack={() => setView("landing")} />
          </PageTransition>
        )}

        {/* FLOWCHART */}
        {view === "flowchart" && (
          <PageTransition>
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
            <div
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: 12,
                padding: "28px 32px",
                background: COLORS.bgPrimary,
              }}
            >
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 10,
                  padding: "24px 16px",
                  background: COLORS.bgSecondary,
                  overflowX: "auto",
                }}
              >
                <MermaidDiagram chart={incidentFlowchart} />
              </div>
            </div>
          </PageTransition>
        )}

        {/* RESULTS */}
        {view === "results" && (
          <PageTransition>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {result !== null && (
                <Results
                  score={result}
                  onRetake={handleRetake}
                  onViewPlaybook={handleViewPlaybook}
                />
              )}

              {result === null && (
                <div style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => {
                      setShowPlaybook(false);
                      setView("landing");
                    }}
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
                <div
                  ref={playbookRef}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div style={{ textAlign: "center" }}></div>
                  <IncidentPlaybook />
                </div>
              )}
            </div>
          </PageTransition>
        )}
      </div>
    {/* Incomplete Answers Modal */}
    {showIncompleteModal && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: COLORS.bgOverlay,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
        onClick={() => setShowIncompleteModal(false)}
      >
        <div
          style={{
            backgroundColor: COLORS.white,
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: COLORS.errorLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                margin: "0 auto 16px auto",
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "24px", color: COLORS.error }}></i>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: COLORS.textPrimary, marginBottom: "8px" }}>
              Submit Incomplete Assessment?
            </h3>
            <p style={{ fontSize: "14px", color: COLORS.textSecondary, lineHeight: "1.5" }}>
              {questions.length - Object.values(answers).filter((v) => Number.isInteger(v) && v >= 1 && v <= 4).length} question(s) unanswered. Unanswered questions will count as 0.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowIncompleteModal(false)}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderLight}`,
                background: COLORS.bgSecondary,
                color: COLORS.textPrimary,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => {
                setShowIncompleteModal(false);
                submitAndScore();
              }}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: `1px solid ${COLORS.primary}`,
                background: COLORS.primary,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Submit Anyway
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
