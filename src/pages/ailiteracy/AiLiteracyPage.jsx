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
import PdfViewerModal from "./PdfViewerModal";
import { useContextElement } from "@/context/Context";
import { hasAccess } from "@/utils/planAccess";
import {
  subscribeToNewsletter,
  getNewsletterStatus,
} from "../../apiIntegration/newsletter";
import PageLoader from "@/components/common/PageLoader";
import usePageLoader from "@/data/usePageLoader";

const PD_DOCS = [
  {
    id: "ai_resilient",
    file: "ai_resilient_assessments_PD.pdf",
    title: "AI-Resilient Assessments",
    description:
      "Strategies and frameworks for designing assessments that remain meaningful and valid in an AI-enabled environment.",
    icon: "fa-solid fa-shield-halved",
    color: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    id: "ai_tools_landscape",
    file: "ai_tools_landscape_PD.pdf",
    title: "AI Tools Landscape",
    description:
      "A curated overview of current AI tools relevant to education — capabilities, risks, and guidance for responsible use.",
    icon: "fa-solid fa-layer-group",
    color: "#0891b2",
    bg: "#e0f2fe",
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

const PD_MODULES = [
  {
    id: "understanding_ai",
    title: "Understanding AI",
    icon: "fa-solid fa-microchip",
    color: "#0891b2",
    bg: "#e0f2fe",
    docs: [
      PD_DOCS.find((d) => d.id === "how_ai_works"),
      PD_DOCS.find((d) => d.id === "ai_tools_landscape"),
    ],
  },
  {
    id: "teaching_practice",
    title: "Teaching Practice",
    icon: "fa-solid fa-chalkboard-user",
    color: "#198038",
    bg: "#e8f5e9",
    docs: [
      PD_DOCS.find((d) => d.id === "teaching_ai_responsible"),
      PD_DOCS.find((d) => d.id === "prompt_literacy"),
    ],
  },
  {
    id: "assessment_resilience",
    title: "Assessment & Resilience",
    icon: "fa-solid fa-shield-halved",
    color: "#7c3aed",
    bg: "#ede9fe",
    docs: [PD_DOCS.find((d) => d.id === "ai_resilient")],
  },
];

const PLAYBOOK_ITEMS = [
  {
    id: "assessment",
    title: "AI Literacy Assessment",
    description:
      "Rate 16 statements across four pillars to receive a score and your organisation's AI literacy level.",
    icon: "fa-solid fa-graduation-cap",
    color: "#0F3357",
    bg: "#e3edfd",
    actionTitle: "Start Assessment",
  },
  {
    id: "incident_playbook",
    title: "Incident Response Playbook",
    description:
      "A step-by-step guide for detecting, containing, and resolving AI-related incidents in your organisation.",
    icon: "fa-solid fa-book-open",
    color: "#198038",
    bg: "#e8f5e9",
    actionTitle: "View Playbook",
  },
  {
    id: "incident_flowchart",
    title: "Incident Response Flowchart",
    description:
      "Visualise the full end-to-end AI incident response process from detection through to resolution.",
    icon: "fa-solid fa-diagram-project",
    color: "#ea580c",
    bg: "#fff7ed",
    actionTitle: "View Flowchart",
  },
  {
    id: "incident_exercise",
    title: "Incident Response Exercise",
    description:
      "Complete the interactive playbook template to design your school's AI incident response process.",
    icon: "fa-solid fa-pen-to-square",
    color: "#7c3aed",
    bg: "#ede9fe",
    actionTitle: "Start Exercise",
  },
];

const PLAYBOOK_MODULES = [
  {
    id: "ai_literacy",
    title: "AI Literacy",
    icon: "fa-solid fa-graduation-cap",
    color: "#0F3357",
    bg: "#e3edfd",
    items: [PLAYBOOK_ITEMS.find((i) => i.id === "assessment")],
  },
  {
    id: "incident_response",
    title: "Incident Response",
    icon: "fa-solid fa-shield-halved",
    color: "#198038",
    bg: "#e8f5e9",
    items: [
      PLAYBOOK_ITEMS.find((i) => i.id === "incident_playbook"),
      PLAYBOOK_ITEMS.find((i) => i.id === "incident_flowchart"),
      PLAYBOOK_ITEMS.find((i) => i.id === "incident_exercise"),
    ],
  },
];
function NotifyButton({ showToast, enrolled, setEnrolled }) {
  const [submitting, setSubmitting] = React.useState(false);

  const handleNotify = async () => {
    const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
    const email = userInfo?.email || "";

    if (!email) {
      showToast("Could not find your email. Please log in again.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await subscribeToNewsletter(email, true);
      setEnrolled(true);
      showToast("You're on the list! We'll notify you at launch.", "success");
    } catch (err) {
      showToast(
        err?.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (enrolled) {
    return (
      <button
        disabled
        style={{
          marginTop: 4,
          padding: "11px 32px",
          fontSize: 14,
          fontWeight: 600,
          color: "#198038",
          background: "#e8f5e9",
          border: "1px solid #a5d6a7",
          borderRadius: 8,
          cursor: "not-allowed",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }} />
        You're Enrolled
      </button>
    );
  }

  return (
    <button
      onClick={handleNotify}
      disabled={submitting}
      style={{
        marginTop: 4,
        padding: "11px 32px",
        fontSize: 14,
        fontWeight: 600,
        color: "#fff",
        background: submitting ? "#6b8cb8" : "#0F3357",
        border: "none",
        borderRadius: 8,
        cursor: submitting ? "not-allowed" : "pointer",
        transition: "background 0.2s ease",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
      onMouseOver={(e) => {
        if (!submitting) e.currentTarget.style.background = "#1a5276";
      }}
      onMouseOut={(e) => {
        if (!submitting) e.currentTarget.style.background = "#0F3357";
      }}
    >
      {submitting ? (
        <>
          <i
            className="fa-solid fa-circle-notch fa-spin"
            style={{ fontSize: 13 }}
          />
          Sending...
        </>
      ) : (
        <>
          <i className="fa-solid fa-bell" style={{ fontSize: 13 }} />
          Notify Me
        </>
      )}
    </button>
  );
}
export default function AiLiteracyPage() {
  const location = useLocation();
  const [view, setView] = useState("landing"); // "landing" | "questionnaire" | "results"
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const showToast = useToast();
  const { userPlan } = useContextElement();
  const canDownload = hasAccess("business", userPlan);
  const topRef = useRef(null);
  const playbookRef = useRef(null);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pdfViewerDoc, setPdfViewerDoc] = useState(null);
  const [newsletterStatus, setNewsletterStatus] = useState(null); // null = not yet fetched
  const pageLoading = usePageLoader([newsletterStatus]);

  useEffect(() => {
    getNewsletterStatus()
      .then((isEnrolled) => setNewsletterStatus(isEnrolled))
      .catch(() => setNewsletterStatus(false)); // unblock loader on error
  }, []);

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

  const handleViewPD = () => {
    setView("pd");
  };

  const handlePlaybookItemAction = (item) => {
    if (item.id === "assessment") {
      setView("questionnaire");
    } else if (item.id === "incident_playbook") {
      setShowPlaybook(true);
      setView("results");
      setResult(null);
    } else if (item.id === "incident_flowchart") {
      setView("flowchart");
    } else if (item.id === "incident_exercise") {
      setView("exercise");
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const organizationName = userInfo?.organization?.name || "XVALIDATEAI";
      await downloadPdfWithWatermark(
        `/documents/${doc.file}`,
        doc.file,
        organizationName,
      );
    } catch (err) {
      showToast("Failed to download document. Please try again.", "error");
    }
  };

  const headings = {
    landing: {
      title: "Programs",
      subtitle:
        "Programs, assessments, playbooks, and professional development resources for your organisation.",
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
    pd: {
      title: "Professional Development Modules",
      subtitle:
        "Curated resources for educator professional development across AI literacy topics.",
    },
    playbook: {
      title: "AI Literacy Playbook",
      subtitle:
        "Assessments, incident response playbooks, flowcharts, and exercises for your organisation.",
    },
  };

  const currentHeading = headings[view] ?? headings.landing;

  if (pageLoading) return <PageLoader loading={true} />;

  return (
    <div ref={topRef} className="spicy-y" style={{ height: "100%" }}>
      {/* minHeight keeps the white panel filling the viewport now that the
          landing holds only two cards - without it the card sized to its
          content and the page read as half-rendered. Set here rather than on
          .dashboard-body, which eight other dashboard pages share. */}
      <div
        className="dashboard-body"
        style={{ minHeight: "100%", boxSizing: "border-box" }}
      >
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
                // 340px min gives a 2x2 grid inside the 900px container, so the
                // four cards balance instead of leaving one orphaned on row two.
                // Collapses to a single column on narrow screens.
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 24,
                maxWidth: 900,
                margin: "0 auto",
                alignItems: "stretch",
              }}
            >
              {/* ── Chief AI Officer Program Card ── */}
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
                {/* Coming Soon badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#fff",
                    background: "#0F3357",
                    padding: "3px 9px",
                    borderRadius: 20,
                    textTransform: "uppercase",
                  }}
                >
                  Coming Soon
                </span>

                {/* Icon */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#e3edfd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-user-tie"
                    style={{ fontSize: 22, color: "#0F3357" }}
                  />
                </div>

                {/* Text */}
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Chief AI Officer (CAIO) Program
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Be the first to know when our Chief AI Officer Program
                    launches. We'll notify you as soon as it's available.
                  </p>
                </div>

                {/* Spacer to push button to bottom like other cards */}
                <div style={{ flex: 1 }} />

                <NotifyButton
                  showToast={showToast}
                  enrolled={newsletterStatus === true}
                  setEnrolled={(val) => setNewsletterStatus(val)}
                />
              </div>

              {/* ── AI-Ready Teacher Program Card ── */}
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
                {/* Coming Soon badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#fff",
                    background: "#0F3357",
                    padding: "3px 9px",
                    borderRadius: 20,
                    textTransform: "uppercase",
                  }}
                >
                  Coming Soon
                </span>

                {/* Icon */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#e3edfd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-chalkboard-user"
                    style={{ fontSize: 22, color: "#0F3357" }}
                  />
                </div>

                {/* Text */}
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    AI-Ready Teacher Program
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.textMuted,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Be the first to know when our AI-Ready Teacher Program
                    launches. We'll notify you as soon as it's available.
                  </p>
                </div>

                {/* Spacer to push button to bottom like other cards */}
                <div style={{ flex: 1 }} />

                <NotifyButton
                  showToast={showToast}
                  enrolled={newsletterStatus === true}
                  setEnrolled={(val) => setNewsletterStatus(val)}
                />
              </div>
            </div>
          </PageTransition>
        )}

        {/* AI LITERACY PLAYBOOK */}
        {view === "playbook" && (
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
                maxWidth: 900,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              {PLAYBOOK_MODULES.map((mod) => (
                <div key={mod.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: mod.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={mod.icon}
                        style={{ fontSize: 15, color: mod.color }}
                      />
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {mod.title}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: mod.color,
                        background: mod.bg,
                        padding: "3px 10px",
                        borderRadius: 20,
                        marginLeft: 4,
                      }}
                    >
                      {mod.items.length}{" "}
                      {mod.items.length === 1 ? "resource" : "resources"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {mod.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: 12,
                          padding: "16px 20px",
                          background: COLORS.bgPrimary,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: item.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i
                            className={item.icon}
                            style={{ fontSize: 16, color: item.color }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: COLORS.textPrimary,
                              marginBottom: 2,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: COLORS.textMuted,
                              lineHeight: 1.45,
                            }}
                          >
                            {item.description}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => handlePlaybookItemAction(item)}
                            title={item.actionTitle}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: `1px solid ${COLORS.borderLight}`,
                              background: COLORS.bgPrimary,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: item.color,
                              fontSize: 14,
                              transition: "all 0.15s",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = item.bg;
                              e.currentTarget.style.borderColor = item.color;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background =
                                COLORS.bgPrimary;
                              e.currentTarget.style.borderColor =
                                COLORS.borderLight;
                            }}
                          >
                            <i className="fa-solid fa-arrow-right" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PageTransition>
        )}

        {/* QUESTIONNAIRE */}
        {view === "questionnaire" && (
          <PageTransition>
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setView("playbook")}
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
            <IncidentResponseExercise onBack={() => setView("playbook")} />
          </PageTransition>
        )}

        {/* FLOWCHART */}
        {view === "flowchart" && (
          <PageTransition>
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setView("playbook")}
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

        {/* PROFESSIONAL DEVELOPMENT */}
        {view === "pd" && (
          <PageTransition>
            <button
              onClick={() => setView("landing")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "0 auto 24px",
                padding: "10px 20px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${COLORS.borderLight}`,
                background: COLORS.bgPrimary,
                color: COLORS.textMuted,
              }}
            >
              <i className="fa-solid fa-arrow-left" />
              Back to Overview
            </button>
            <div
              style={{
                maxWidth: 900,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              {PD_MODULES.map((mod) => (
                <div key={mod.id}>
                  {/* Module heading */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: mod.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={mod.icon}
                        style={{ fontSize: 15, color: mod.color }}
                      />
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {mod.title}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: mod.color,
                        background: mod.bg,
                        padding: "3px 10px",
                        borderRadius: 20,
                        marginLeft: 4,
                      }}
                    >
                      {mod.docs.length}{" "}
                      {mod.docs.length === 1 ? "resource" : "resources"}
                    </span>
                  </div>

                  {/* Document cards */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {mod.docs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: 12,
                          padding: "16px 20px",
                          background: COLORS.bgPrimary,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
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
                            style={{ fontSize: 16, color: doc.color }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: COLORS.textPrimary,
                              marginBottom: 2,
                            }}
                          >
                            {doc.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: COLORS.textMuted,
                              lineHeight: 1.45,
                            }}
                          >
                            {doc.description}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => setPdfViewerDoc(doc)}
                            title="View document"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: `1px solid ${COLORS.borderLight}`,
                              background: COLORS.bgPrimary,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: mod.color,
                              fontSize: 14,
                              transition: "all 0.15s",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = mod.bg;
                              e.currentTarget.style.borderColor = mod.color;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background =
                                COLORS.bgPrimary;
                              e.currentTarget.style.borderColor =
                                COLORS.borderLight;
                            }}
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          {canDownload ? (
                            <button
                              onClick={() => handleDownloadDoc(doc)}
                              title="Download with watermark"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                border: `1px solid ${COLORS.borderLight}`,
                                background: COLORS.bgPrimary,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: COLORS.textMuted,
                                fontSize: 14,
                                transition: "all 0.15s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background =
                                  COLORS.bgSecondary;
                                e.currentTarget.style.borderColor =
                                  COLORS.textMuted;
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background =
                                  COLORS.bgPrimary;
                                e.currentTarget.style.borderColor =
                                  COLORS.borderLight;
                              }}
                            >
                              <i className="fa-solid fa-download" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Upgrade to Business or Enterprise to download"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                border: `1px solid ${COLORS.borderLight}`,
                                background: COLORS.bgSecondary,
                                cursor: "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: COLORS.borderLight,
                                fontSize: 14,
                              }}
                            >
                              <i className="fa-solid fa-lock" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                      setView("playbook");
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
      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfViewerDoc !== null}
        onClose={() => setPdfViewerDoc(null)}
        doc={pdfViewerDoc}
        onDownload={canDownload ? handleDownloadDoc : null}
      />

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
                <i
                  className="fa-solid fa-triangle-exclamation"
                  style={{ fontSize: "24px", color: COLORS.error }}
                ></i>
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: COLORS.textPrimary,
                  marginBottom: "8px",
                }}
              >
                Submit Incomplete Assessment?
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: COLORS.textSecondary,
                  lineHeight: "1.5",
                }}
              >
                {questions.length -
                  Object.values(answers).filter(
                    (v) => Number.isInteger(v) && v >= 1 && v <= 4,
                  ).length}{" "}
                question(s) unanswered. Unanswered questions will count as 0.
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
