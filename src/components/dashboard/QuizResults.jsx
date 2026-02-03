import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function QuizResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);

  // keep track which section is open: "correct" | "wrong" | "unattempt" | null
  const [openSection, setOpenSection] = useState(null);

  // refs to scroll into view & for animation targets
  const summaryRef = useRef(null);
  const sectionRefs = {
    correct: useRef(null),
    wrong: useRef(null),
    unattempt: useRef(null),
  };

  // load results from navigation state or fallback to localStorage
  useEffect(() => {
    const s = location.state;
    if (s) {
      setResults(s);
      try {
        localStorage.setItem("quiz-results", JSON.stringify(s));
      } catch {}
    } else {
      const stored = localStorage.getItem("quiz-results");
      if (stored) {
        try {
          setResults(JSON.parse(stored));
        } catch {
          setResults(null);
        }
      }
    }

    // remove any quiz fullscreen classes and hide sidebar for this page
    document.body.classList.remove("quiz-active");
    const sidebar = document.getElementById("dashboardOpenClose");
    sidebar?.classList.add("-is-sidebar-hidden");
    document.body.classList.add("results-expanded"); // small helper if needed

    return () => {
      sidebar?.classList.remove("-is-sidebar-hidden");
      document.body.classList.remove("results-expanded");
    };
  }, [location.state]);

  // lazy load / infinite scroll observer
  const loaderRef = useRef(null);
  useEffect(() => {
    if (!results) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((v) => Math.min(v + 15, results.questions.length));
      }
    });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [results]);

  if (!results) {
    return (
      <div className="dashboard__main p-40">
        <h1 className="text-30 fw-700 mb-20">Invalid Results</h1>
        <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
          The page was refreshed or opened without quiz data.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const {
    exam,
    questions = [],
    answers = [],
    timeTakenPerQ = [],
    totalTime = 0,
  } = results;

  const formatTime = (s = 0) => `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`;

  // categorize
  const correctQs = [];
  const wrongQs = [];
  const unattemptedQs = [];

  questions.forEach((q, i) => {
    const correct = q.options?.find((o) => o.name === q.correct_option)?.value;
    const user = answers[i];
    if (user === null || typeof user === "undefined")
      unattemptedQs.push({ q, i, correct });
    else if (user === correct) correctQs.push({ q, i, correct });
    else wrongQs.push({ q, i, correct });
  });

  const totalMarks = questions.length;
  const obtained = correctQs.length;
  const percentage = ((obtained / totalMarks) * 100).toFixed(2);

  // toggles - only one section open at a time
  // replace existing toggleSection with this
  const toggleSection = (name) => {
    // willOpen = true when we're opening the requested section
    const willOpen = openSection !== name;

    // set state (open only one at a time)
    setOpenSection(willOpen ? name : null);

    // small delay so DOM expands/collapses and layout stabilizes
    setTimeout(() => {
      if (willOpen) {
        // scroll to the section's own header (collapsible toggle)
        const container = sectionRefs[name]?.current;
        if (container) {
          // prefer the header toggle element inside the collapsible
          const header =
            container.querySelector?.(".qr-collapsible-toggle") || container;
          if (header) {
            // account for sticky summary / header height so header is visible below them
            const stickyEl =
              document.querySelector(".sticky-summary") ||
              document.querySelector(".header");
            const stickyOffset = stickyEl?.offsetHeight
              ? Math.max(80, stickyEl.offsetHeight)
              : 100;
            const top =
              header.getBoundingClientRect().top +
              window.scrollY -
              stickyOffset -
              12;
            window.scrollTo({ top, behavior: "smooth" });
          }
        }
      } else {
        // We closed the section — scroll summary into center view
        const el = document.querySelector(".results-summary-card");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 180);
  };

  // single card renderer
  const renderCard = ({ q, i, correct }) => {
    const user = answers[i];
    return (
      <article key={i} className="qr-card">
        <h4 className="qr-question">
          Q{i + 1}. {q.question}
        </h4>

        <ul className="qr-options">
          {(q.options || []).map((op, idx) => (
            <li
              key={idx}
              className={
                op.value === correct ? "qr-option correct" : "qr-option"
              }
            >
              {op.value}
            </li>
          ))}
        </ul>

        <p className={`qr-your ${user === correct ? "ok" : "bad"}`}>
          Your Answer: {user ?? "Not Attempted"}
        </p>

        <p className="qr-correct">Correct Answer: {correct}</p>

        <p className="qr-time">
          Time Taken: {formatTime(timeTakenPerQ[i] || 0)}
        </p>

        {q.solution && (
          <div className="qr-solution">
            <strong>Solution:</strong>
            <p>{q.solution}</p>
          </div>
        )}
      </article>
    );
  };

  return (
    <main className="quiz-results-page">
      <header className="qr-header">
        <h1 className="qr-title">{exam?.title} – Results</h1>
      </header>

      {/* SUMMARY (sticky) */}
      <section
        ref={summaryRef}
        className="results-summary-card sticky-summary"
        aria-label="Quiz summary"
      >
        <h2 className="summary-title">Summary</h2>

        <div className="summary-grid">
          <div>
            <p>
              Total Questions: <strong>{questions.length}</strong>
            </p>
            <p>
              Correct:{" "}
              <strong className="text-green">{correctQs.length}</strong>
            </p>
            <p>
              Wrong: <strong className="text-red">{wrongQs.length}</strong>
            </p>
            <p>
              Unattempted: <strong>{unattemptedQs.length}</strong>
            </p>
          </div>

          <div>
            <p>
              Total Marks: <strong>{totalMarks}</strong>
            </p>
            <p>
              Marks Obtained: <strong className="text-green">{obtained}</strong>
            </p>
            <p>
              Percentage: <strong>{percentage}%</strong>
            </p>
            <p>
              Total Time Taken: <strong>{formatTime(totalTime)}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* collapsible sections container */}
      <section
        className="results-sections"
        style={{ maxWidth: 980, width: "100%", margin: "5px auto 20px" }}
      >
        <Collapsible
          ref={sectionRefs.correct}
          id="correct"
          label="Correct Questions"
          count={correctQs.length}
          open={openSection === "correct"}
          onToggle={() => toggleSection("correct")}
        >
          {correctQs.length === 0 ? (
            <p className="muted">No correct questions.</p>
          ) : (
            correctQs.map(renderCard)
          )}
        </Collapsible>

        <Collapsible
          ref={sectionRefs.wrong}
          id="wrong"
          label="Wrong Questions"
          count={wrongQs.length}
          open={openSection === "wrong"}
          onToggle={() => toggleSection("wrong")}
        >
          {wrongQs.length === 0 ? (
            <p className="muted">No wrong questions.</p>
          ) : (
            wrongQs.map(renderCard)
          )}
        </Collapsible>

        <Collapsible
          ref={sectionRefs.unattempt}
          id="unattempt"
          label="Unattempted Questions"
          count={unattemptedQs.length}
          open={openSection === "unattempt"}
          onToggle={() => toggleSection("unattempt")}
        >
          {unattemptedQs.length === 0 ? (
            <p className="muted">No unattempted questions.</p>
          ) : (
            unattemptedQs.map(renderCard)
          )}
        </Collapsible>

        {/* loader for infinite scroll */}
        {visibleCount < questions.length && (
          <div ref={loaderRef} style={{ textAlign: "center", padding: 16 }}>
            <div className="spinner-border text-primary" />
          </div>
        )}
      </section>

      {/* Dashboard Button – same width as dropdowns */}
      <div
        style={{
          maxWidth: 980,
          width: "100%",
          margin: "20px auto 40px",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            width: "100%",
            background: "#6C42F5",
            border: "none",
            padding: "18px 0",
            borderRadius: "10px",
            color: "white",
            fontSize: "18px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}

/* Collapsible component - forwarded ref (so parent can scroll to it) */
const Collapsible = React.forwardRef(function Collapsible(
  { id, label, count, open, onToggle, children },
  ref
) {
  const [visibleCount, setVisibleCount] = useState(10);
  const innerRef = useRef(null);
  const loaderRef = useRef(null);

  // Convert children to proper array ALWAYS
  const items = React.Children.toArray(children);

  // Reset visible count when closing
  useEffect(() => {
    if (!open) {
      setVisibleCount(10);

      // ⭐ RESET PANEL SCROLL TO TOP WHEN CLOSING
      const panel = ref.current?.querySelector(".qr-collapse-panel");
      if (panel) panel.scrollTop = 0;
    }
  }, [open]);

  // Lazy load inside panel
  useEffect(() => {
    if (!open || items.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((v) => Math.min(v + 10, items.length));
      }
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [open, items]);

  // ⭐ TRUE Back To Top (inside dropdown)
  const scrollToTopOfDropdown = () => {
    const panel = ref.current?.querySelector(".qr-collapse-panel");
    if (!panel) return;
    panel.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`qr-collapsible ${open ? "open" : ""}`}
      ref={ref}
      style={{ marginTop: 5 }}
    >
      {/* Toggle Header */}
      <button
        type="button"
        className="qr-collapsible-toggle"
        aria-expanded={open ? "true" : "false"}
        onClick={onToggle}
      >
        <span
          className="qr-toggle-icon"
          style={{
            color:
              id === "correct"
                ? "#22c55e" // Green
                : id === "wrong"
                ? "#ef4444" // Red
                : "#6b7280", // Grey
          }}
        >
          {open ? "−" : "+"}
        </span>

        <span className="qr-toggle-label">{label}</span>
        <span className="qr-toggle-count">({count})</span>
      </button>

      {/* Panel */}
      <div
        className="qr-collapse-panel"
        aria-hidden={!open}
        style={{
          maxHeight: open ? "60vh" : "0px",
          overflowY: open ? "auto" : "hidden",
          transition: "max-height 0.3s ease",
          padding: open ? "12px 0 20px" : "0",
        }}
      >
        <div ref={innerRef}>
          {items.slice(0, visibleCount)}

          {visibleCount < items.length && (
            <div ref={loaderRef} style={{ textAlign: "center", padding: 12 }}>
              <div className="spinner-border text-primary"></div>
            </div>
          )}

          {/* ⭐ TRUE WORKING BACK TO TOP */}
          {open && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={scrollToTopOfDropdown}
              >
                ⬆ Back to First Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
