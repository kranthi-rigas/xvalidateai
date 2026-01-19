import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { v4 as uuid } from "uuid";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import PageLoader from "@/components/common/PageLoader";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Assignment() {
  const [pageLoading, setPageLoading] = useState(true);
  const [quiz, setQuiz] = useState({
    title: "New Quiz",
    status: "DRAFT",
    questions: [],
  });
  const [uiStep, setUiStep] = useState("UPLOAD");
  const [banner, setBanner] = useState(null);

  const STEP_ORDER = ["UPLOAD", "EDITING", "SUBMITTED", "PUBLISHED"];

  /* ================= LANDING PAGE LOADER ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  /* ================= LOAD / SAVE ================= */
  useEffect(() => {
    const saved = localStorage.getItem("quiz_draft");
    if (saved) setQuiz(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("quiz_draft", JSON.stringify(quiz));
  }, [quiz]);

  /* ================= SAFE LOADER RETURN ================= */
  if (pageLoading) {
    return <PageLoader loading />;
  }

  /* ================= FILE HANDLING ================= */
  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files[0]);
  };

  const handleFile = (e) => {
    processFile(e.target.files[0]);
  };

  const processFile = async (file) => {
    if (!file) return;

    localStorage.removeItem("quiz_draft");

    let text = "";
    if (file.type === "application/pdf") {
      text = await parsePDF(file);
    } else if (file.name.endsWith(".docx")) {
      text = await parseDOCX(file);
    } else {
      alert("Only PDF or DOCX supported");
      return;
    }

    setQuiz((q) => ({
      ...q,
      questions: extractQuestions(text),
    }));

    setUiStep("EDITING");
  };

  /* ================= PARSING ================= */
  const parsePDF = async (file) => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(buffer).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach((i) => (text += i.str + "\n"));
    }
    return text;
  };

  const parseDOCX = async (file) => {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  };

  const extractQuestions = (text) => {
    const normalized = text
      .replace(/\r/g, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/\s+\n/g, "\n");

    const QUESTION_REGEX = /(Q\d+\.|\d+\.)\s*([\s\S]*?)(?=(Q\d+\.|\d+\.|$))/g;
    const OPTION_REGEX = /^[A-Da-d][\.\)]?\s*(.+)$/;

    return [...normalized.matchAll(QUESTION_REGEX)].map((match) => {
      const lines = match[2]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const questionText = lines.shift();

      const options = lines
        .filter((l) => OPTION_REGEX.test(l))
        .map((l) => ({
          id: uuid(),
          text: l.replace(OPTION_REGEX, "$1"),
          isCorrect: false,
        }));

      return {
        id: uuid(),
        type: "MCQ",
        text: questionText,
        options,
      };
    });
  };

  /* ================= EDITING ================= */
  const updateQuestion = (id, text) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((ques) =>
        ques.id === id ? { ...ques, text } : ques,
      ),
    }));

  const updateOption = (qid, oid, text) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((ques) =>
        ques.id === qid
          ? {
              ...ques,
              options: ques.options.map((o) =>
                o.id === oid ? { ...o, text } : o,
              ),
            }
          : ques,
      ),
    }));

  const markCorrect = (qid, oid) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((ques) =>
        ques.id === qid
          ? {
              ...ques,
              options: ques.options.map((o) => ({
                ...o,
                isCorrect: o.id === oid,
              })),
            }
          : ques,
      ),
    }));

  function StepItem({ label, step, uiStep, onClick, tooltip }) {
    const STEP_ORDER = ["UPLOAD", "EDITING", "SUBMITTED", "PUBLISHED"];
    const currentIndex = STEP_ORDER.indexOf(uiStep);
    const stepIndex = STEP_ORDER.indexOf(step);

    let state = "idle";
    if (stepIndex < currentIndex) state = "completed";
    if (stepIndex === currentIndex) state = "active";

    return (
      <div className="step-wrapper" title={tooltip} onClick={onClick}>
        <span className={`step-label ${state}`}>{label}</span>

        <div className={`step-circle ${state}`}>
          {state === "completed" && <span className="tick">✓</span>}
        </div>
      </div>
    );
  }

  function StepLine({ completed }) {
    return <div className={`step-line ${completed ? "completed" : ""}`} />;
  }

  /* ---------- UI ---------- */
  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        {banner && (
          <div className={`banner ${banner.type}`}>{banner.message}</div>
        )}

        <div className="page">
          <header className="assignment-header">
            <div className="header-left">
              <h1 className="quiz-title">{quiz.title}</h1>
              <span className={`status-pill ${quiz.status.toLowerCase()}`}>
                {quiz.status}
              </span>
            </div>
          </header>

          <div className="stepper">
            <div className="stepper">
              <StepItem
                label="Upload"
                step="UPLOAD"
                uiStep={uiStep}
                onClick={() => setUiStep("UPLOAD")}
                tooltip="Upload assignment file"
              />

              <StepLine completed={STEP_ORDER.indexOf(uiStep) > 0} />

              <StepItem
                label="Editing"
                step="EDITING"
                uiStep={uiStep}
                onClick={() => uiStep !== "UPLOAD" && setUiStep("EDITING")}
                tooltip="Review and edit questions"
              />

              <StepLine completed={STEP_ORDER.indexOf(uiStep) > 1} />

              <StepItem
                label="Publish"
                step="PUBLISHED"
                uiStep={uiStep}
                onClick={() => uiStep === "SUBMITTED" && setUiStep("PUBLISHED")}
                tooltip="Publish quiz"
              />
            </div>
          </div>

          {uiStep === "UPLOAD" && (
            <div
              className="dropzone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <p>Drag & drop PDF or DOCX here</p>
              <label className="upload-btn">
                Upload File
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    handleFile(e);
                    e.target.value = null;
                  }}
                />
              </label>
            </div>
          )}

          {uiStep === "EDITING" &&
            quiz.questions.map((q, idx) => (
              <div className="question-card" key={q.id}>
                <div className="question-header">Question {idx + 1}</div>

                <textarea
                  className="question-input"
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, e.target.value)}
                />

                {q.options.map((o) => (
                  <div className="option-row" key={o.id}>
                    <input
                      type="radio"
                      checked={o.isCorrect}
                      onChange={() => markCorrect(q.id, o.id)}
                    />
                    <input
                      className="option-input"
                      value={o.text}
                      onChange={(e) => updateOption(q.id, o.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ))}

          {uiStep === "SUBMITTED" && (
            <div className="publish-summary">
              <p>
                To publish your assignment click on the publish button below. If
                you would like to make changes, go back to the editing step. By
                clicking on the editing step.
              </p>
            </div>
          )}

          <footer className="actions">
            <button
              className="secondary"
              onClick={() => {
                setQuiz((q) => ({ ...q, status: "SUBMITTED" }));
                setUiStep("SUBMITTED");

                setBanner({
                  type: "success",
                  message: "Assignment submitted successfully 🎉",
                });

                setTimeout(() => setBanner(null), 3000);
              }}
            >
              Submit
            </button>

            <button
              className="primary"
              disabled={uiStep !== "SUBMITTED"}
              onClick={() => {
                setQuiz((q) => ({ ...q, status: "PUBLISHED" }));
                setUiStep("PUBLISHED");
                setBanner({
                  type: "success",
                  message: "Assignment published successfully 🚀",
                });
                setTimeout(() => setBanner(null), 3000);
              }}
            >
              Publish
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
