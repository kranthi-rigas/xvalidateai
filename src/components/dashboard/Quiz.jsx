// src/components/dashboard/Quiz.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  fetchExamDetails,
  fetchExamQuestions,
} from "../../apiIntegration/quiz";
import { useNavigate, useSearchParams } from "react-router-dom";

import { createAttempt } from "@/apiIntegration/attempts";

export default function Quiz() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const examId = params.get("exam_id");
  const autoStart = params.get("autostart") === "true";

  // data
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);

  // UI state
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // timing
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTakenState, setTimeTakenState] = useState([]); // for rendering
  const timeTakenRef = useRef([]); // authoritative per-question seconds
  const currentQuestionRef = useRef(0);
  const startedRef = useRef(false);
  const QUESTIONS_PER_PAGE = 10;
  const [pageIndex, setPageIndex] = useState(0);

  // helpers for fullscreen with safe checks
  const enterFullscreen = async () => {
    try {
      // Prefer document.documentElement fullscreen
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      // else ignore
    } catch (err) {
      // permission or other error: swallow
      console.warn("enterFullscreen failed:", err?.message || err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      // swallow permission errors
      console.warn("exitFullscreen failed:", err?.message || err);
    }
  };

  const detailsFetched = useRef(false);
  const questionsFetched = useRef(false);

  // ------------- Load exam & questions (hooks always run) -------------
  useEffect(() => {
    if (!examId) return;
    if (detailsFetched.current) return; //prevents second call
    detailsFetched.current = true;

    fetchExamDetails(examId)
      .then((d) => setExam(d))
      .catch(() => {});
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    if (questionsFetched.current) return; //prevents second call
    questionsFetched.current = true;

    fetchExamQuestions(examId)
      .then((data) => {
        const qs = data.questions || [];
        setQuestions(qs);
        // autostart: start quiz immediately
        if (autoStart) setStarted(true);
      })
      .catch(() => {});
  }, [examId, autoStart]);

  // ------------- initialize timer values when exam/questions load -------------
  const durationMinutes =
    exam?.duration && !isNaN(Number(exam.duration))
      ? Number(exam.duration)
      : 180;

  useEffect(() => {
    // always call (hooks still run)
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    const newPage = Math.floor(currentQuestion / QUESTIONS_PER_PAGE);
    if (newPage !== pageIndex) {
      setPageIndex(newPage);
    }
  }, [currentQuestion]);

  // initialize answers + selectedOptions + timeTaken when questions change
  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(Array(questions.length).fill(null));
      setSelectedOptions({});
      timeTakenRef.current = Array(questions.length).fill(0);
      setTimeTakenState([...timeTakenRef.current]);
    } else {
      setAnswers([]);
      setSelectedOptions({});
      timeTakenRef.current = [];
      setTimeTakenState([]);
    }
    currentQuestionRef.current = 0;
    setCurrentQuestion(0);
  }, [questions]);

  // keep refs in sync
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  // ------------- Start / stop fullscreen and hide sidebar when started -------------
  useEffect(() => {
    const sidebar = document.getElementById("dashboardOpenClose");

    if (started) {
      enterFullscreen();
      document.body.classList.add("quiz-active");
      sidebar?.classList.add("-is-sidebar-hidden");
    } else {
      exitFullscreen();
      document.body.classList.remove("quiz-active");
      sidebar?.classList.remove("-is-sidebar-hidden");
    }

    return () => {
      exitFullscreen();
      document.body.classList.remove("quiz-active");
      sidebar?.classList.remove("-is-sidebar-hidden");
    };
  }, [started]);

  // ------------- per-second timer (increment current question time and decrement timeLeft) -------------
  useEffect(() => {
    const tick = () => {
      if (!startedRef.current || questions.length === 0) return;
      // increment time for current question index held in ref
      const idx = currentQuestionRef.current;
      // increment in ref
      timeTakenRef.current[idx] = (timeTakenRef.current[idx] || 0) + 1;
      // reflect to UI (one small array copy)
      setTimeTakenState([...timeTakenRef.current]);

      // reduce time left
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [questions.length]);

  const formatTimeFull = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ------------- User actions -------------
  const handleAnswerSelect = (optionIndex) => {
    const currentQ = questions[currentQuestionRef.current];
    if (!currentQ) return;

    const optionValue = currentQ.options[optionIndex]?.value;

    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentQuestionRef.current] = optionValue;
      return copy;
    });

    setSelectedOptions((prev) => {
      const updated = { ...prev };
      updated[currentQ.question_id] = optionIndex + 1; // Store 1, 2, 3, 4...
      return updated;
    });
  };

  const handleNext = () => {
    setCurrentQuestion((c) => Math.min(questions.length - 1, c + 1));
  };
  const handlePrevious = () => {
    setCurrentQuestion((c) => Math.max(0, c - 1));
  };

  // open quiz (Start button or navigating with autostart)
  // you might have a UI button that sets started=true. For autostart we set it on load.

  // Submit flow — show modal (no browser alert). On confirm we navigate with state.
  const handleOpenSubmitConfirm = async () => {
    setLoadingSubmit(true);
    try {
      const attemptData = {
        question_ids: questions.map((q) => q.question_id),
        results_chosen: selectedOptions,
        time_taken: durationMinutes * 60 - timeLeft,
        start_time: exam?.start_time ?? new Date().toISOString(),
        end_time: exam?.end_time ?? new Date().toISOString(),
      };

      let response = await createAttempt(examId, attemptData);
      console.log("Attempt created:", response);
      confirmSubmit();
    } catch (err) {
      console.error("Submit attempt failed", err);
      alert("Failed to submit attempt. Try again.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const confirmSubmit = async () => {
    const resultsData = {
      exam,
      questions,
      answers,
      timeTakenPerQ: timeTakenRef.current,
      totalTime: durationMinutes * 60 - timeLeft,
    };

    // store in localStorage as backup
    localStorage.setItem("quiz-results", JSON.stringify(resultsData));

    // send via state
    navigate("/dashboard/quizresults", { state: resultsData });
  };

  // If you also want a quick cancel-submit fallback:
  const cancelSubmit = () => setShowSubmitConfirm(false);

  // progress %
  const progress =
    questions.length > 0
      ? Math.round(
          (answers.filter((x) => x !== null).length / questions.length) * 100
        )
      : 0;

  /* -----------------------------
        PAGINATION COLORS
  ------------------------------ */
  const getButtonColor = (index) => {
    if (index === currentQuestion) return "#4a75ff";
    const questionId = questions[index]?.question_id;
    if (selectedOptions[questionId] !== undefined) return "#32c671";
    return "#ddd"; // GRAY
  };

  const getTextColor = (index) => {
    if (index === currentQuestion) return "#fff";
    const questionId = questions[index]?.question_id;
    if (selectedOptions[questionId] !== undefined) return "#fff";
    return "#444";
  };

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  const startIndex = pageIndex * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length);

  const visibleQuestions = questions.slice(startIndex, endIndex);

  // ------------- UI render -------------
  // (Hooks are all declared above — no early return before hooks)
  return (
    <>
      {loadingSubmit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            textAlign: "center",
          }}
        >
          <div className="spinner" style={{ width: 64, height: 64 }} />

          {/* Loading Message */}
          <div style={{ marginTop: 18, fontSize: 22, fontWeight: "600" }}>
            Loading Results…
          </div>
          <div style={{ marginTop: 5, fontSize: 15, opacity: 0.8 }}>
            Please wait while we prepare your scorecard
          </div>
        </div>
      )}

      <div className="dashboard__main quiz-full" style={{ minHeight: "100vh" }}>
        <div className="dashboard__content bg-light-4">
          <h1 className="text-28 fw-700 mb-30">{exam?.title ?? "Quiz"}</h1>

          <div className="row y-gap-30">
            {/* LEFT */}
            <div className="col-xl-9">
              <div className="rounded-16 bg-white shadow-4 p-4">
                <h4 className="text-18 fw-600 mb-20">
                  Question {currentQuestion + 1} / {questions.length}
                </h4>

                <div className="border-light rounded-8">
                  <div className="py-20 px-20 bg-dark-5 rounded-8 mb-20">
                    <h5 className="text-white text-18 fw-500">
                      {questions[currentQuestion]?.question ?? "Loading..."}
                    </h5>

                    {questions[currentQuestion]?.answer_images?.map(
                      (img, idx) => (
                        <img
                          key={idx}
                          src={`https://dev-api.academy51.com/${img}`}
                          alt="question"
                          style={{ width: "100%", marginTop: 15 }}
                        />
                      )
                    )}
                  </div>

                  <div className="px-20">
                    {(questions[currentQuestion]?.options || []).map(
                      (opt, i) => {
                        const isChecked =
                          answers[currentQuestion] === opt.value;
                        return (
                          <label
                            key={i}
                            className="form-radio d-flex items-center mt-15 cursor-pointer"
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <input
                              type="radio"
                              name={`q${currentQuestion}`}
                              checked={isChecked}
                              onChange={() => handleAnswerSelect(i)}
                            />
                            <span style={{ marginLeft: 12 }}>{opt.value}</span>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 20,
                    padding: "25px 0",
                    marginTop: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      background: currentQuestion === 0 ? "#eee" : "#fff",
                      border: "1px solid #ccc",
                      fontWeight: 600,
                      cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    ← Previous
                  </button>

                  {/* Numbered buttons */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* Pagination: Prev Page */}
                    <button
                      onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                      disabled={pageIndex === 0}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: pageIndex === 0 ? "#eee" : "#fff",
                        border: "1px solid #ccc",
                        cursor: pageIndex === 0 ? "not-allowed" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      «
                    </button>

                    {/* Visible Question Numbers */}
                    {visibleQuestions.map((_, idx) => {
                      const questionIndex = startIndex + idx;
                      return (
                        <button
                          key={questionIndex}
                          onClick={() => setCurrentQuestion(questionIndex)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            border: "none",
                            background: getButtonColor(questionIndex),
                            color: getTextColor(questionIndex),
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {questionIndex + 1}
                        </button>
                      );
                    })}

                    {/* Pagination: Next Page */}
                    <button
                      onClick={() =>
                        setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={pageIndex === totalPages - 1}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background:
                          pageIndex === totalPages - 1 ? "#eee" : "#fff",
                        border: "1px solid #ccc",
                        cursor:
                          pageIndex === totalPages - 1
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      »
                    </button>
                  </div>

                  {/* Next */}
                  <button
                    onClick={handleNext}
                    disabled={currentQuestion === questions.length - 1}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      background:
                        currentQuestion === questions.length - 1
                          ? "#eee"
                          : "#4a75ff",
                      border: "none",
                      fontWeight: 600,
                      color:
                        currentQuestion === questions.length - 1
                          ? "#888"
                          : "#fff",
                      cursor:
                        currentQuestion === questions.length - 1
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-xl-3">
              <div className="rounded-16 bg-white shadow-4 p-3">
                <h5 className="text-17 mb-10">Time Left</h5>
                <div className="timer-value">{formatTimeFull(timeLeft)}</div>
              </div>

              <div className="rounded-16 bg-white shadow-4 p-3 mt-20">
                <h5 className="text-17 mb-20">Progress</h5>
                <div
                  className="progress-bar w-1/1"
                  style={{ height: 8, background: "#f1f1f1", borderRadius: 6 }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: 6,
                      background: "#6c4dfd",
                    }}
                  />
                </div>

                <div style={{ marginTop: 10, fontWeight: 600 }}>
                  {progress}%
                </div>

                <button
                  className="btn btn-success mt-20 w-1/1"
                  onClick={handleOpenSubmitConfirm}
                  style={{ width: "100%", marginTop: 12 }}
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit confirm modal (no browser alert) */}
        {showSubmitConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: "white",
                padding: 28,
                borderRadius: 12,
                width: 420,
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: 12 }}>
                Some questions are unanswered!
              </h3>
              <p style={{ marginBottom: 20 }}>
                Are you sure you want to submit the quiz?
              </p>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  onClick={confirmSubmit}
                  style={{
                    background: "#ff4d4d",
                    color: "#fff",
                    padding: "8px 18px",
                    borderRadius: 8,
                  }}
                >
                  Yes, Submit
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  style={{
                    padding: "8px 18px",
                    background: "#ddd",
                    borderRadius: 8,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
