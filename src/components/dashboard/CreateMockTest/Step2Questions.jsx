import React, { useState, useEffect } from "react";
import { fetchQuestionFilterOptions } from "../../../apiIntegration/mockTests";

export default function Step2Questions({
  questions,
  filter,
  setFilter,
  saveNewQuestion,
  handleDelete,
  handleEdit,
  finalizeMock,
  showModal,
  setShowModal,
  setStep,
  newQ,
  setNewQ,
  editingQuestion,
  setEditingQuestion,
  fetchFilteredQuestions,
  isFetchingQuestions,
  saveDraftQuestions,
  selectedQuestions,
  setSelectedQuestions,
  isSavingDraft,
}) {
  /* ----------------------------------------------------
      LOCAL STATES
  ---------------------------------------------------- */
  const [selectAll, setSelectAll] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    exams: [],
    subjects: [],
    categories: [],
  });

  /* ----------------------------------------------------
      LOAD FILTER OPTIONS (API LAYER)
  ---------------------------------------------------- */
  const loadFilterOptions = async () => {
    try {
      const data = await fetchQuestionFilterOptions();

      setFilterOptions({
        exams: data.filter?.exam || [],
        subjects: data.filter?.subject || [],
        categories: data.filter?.category || [],
      });
    } catch (e) {
      console.error("Filter API error:", e);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  /* ----------------------------------------------------
      CHECK SCROLL BUTTON VISIBILITY
  ---------------------------------------------------- */
  const checkScrollNeeded = () => {
    const box = document.getElementById("questionScrollBox");
    if (!box) return;
    setShowScrollButtons(box.scrollHeight > box.clientHeight);
  };

  useEffect(() => {
    checkScrollNeeded();
  }, [questions]);

  /* Create a fresh question on Add */
  const makeEmptyQuestion = () => ({
    subject: "",
    topic: "",
    type: "radio-button",
    marks: 1,
    negative: 0,
    difficulty: "Medium",
    question: "",
    options: ["", "", "", ""],
    correct: "",
    solution: "",
  });

  /* ----------------------------------------------------
      MAIN RETURN (UI UNCHANGED)
  ---------------------------------------------------- */
  return (
    <div className="dashboard__content" style={{ padding: "40px 20px" }}>
      {/* BACK BUTTON */}
      <button
        className="btn-base btn-secondary"
        style={{ marginBottom: 20 }}
        onClick={() => setStep(1)}
      >
        ← Back
      </button>

      <h3
        className="section-subtitle"
        style={{ textAlign: "center", marginTop: -10 }}
      >
        📝 Prepare Your Test
      </h3>

      {/* ----------------------------------------------------
          FILTERS
      ---------------------------------------------------- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {/* Exam Type */}
        <select
          className="cq-input"
          value={filter.examType}
          onChange={(e) => {
            const updated = { ...filter, examType: e.target.value };
            setFilter(updated);
            fetchFilteredQuestions(updated);
          }}
        >
          <option value="">Select Exam Type</option>
          {filterOptions.exams.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>

        {/* Subject */}
        <select
          className="cq-input"
          value={filter.subject}
          onChange={(e) => {
            const updated = { ...filter, subject: e.target.value };
            setFilter(updated);
            fetchFilteredQuestions(updated);
          }}
        >
          <option value="">Select Subject</option>
          {filterOptions.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          className="cq-input"
          value={filter.category}
          onChange={(e) => {
            const updated = { ...filter, category: e.target.value };
            setFilter(updated);
            fetchFilteredQuestions(updated);
          }}
        >
          <option value="">Select Question Type</option>
          {filterOptions.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* ----------------------------------------------------
          ADD QUESTION
      ---------------------------------------------------- */}
      <button
        className="btn-primary"
        style={{ marginBottom: 12, width: "100%" }}
        onClick={() => {
          setEditingQuestion(null);
          setNewQ(makeEmptyQuestion());
          setShowModal(true);
        }}
      >
        + Add Question
      </button>

      {/* ----------------------------------------------------
          QUESTIONS HEADER
      ---------------------------------------------------- */}
      <div style={{ marginTop: "30px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "20px" }}>📘</span>
          <h3
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#222" }}
          >
            Questions ({questions.length})
          </h3>
        </div>

        {questions.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              marginLeft: 34,
            }}
          >
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelectAll(checked);
                setSelectedQuestions(
                  checked ? questions.map((q) => q.question_id) : []
                );
              }}
            />

            <span style={{ fontSize: 14, color: "#555", fontWeight: 500 }}>
              Select All • Selected: {selectedQuestions.length}
            </span>
          </div>
        )}
      </div>

      <hr
        style={{
          width: "100%",
          margin: "0 0 10px 0",
          borderTop: "1px solid #ddd",
        }}
      />

      {/* ----------------------------------------------------
          QUESTIONS LIST
      ---------------------------------------------------- */}
      <div style={{ position: "relative" }}>
        <div
          id="questionScrollBox"
          onScroll={checkScrollNeeded}
          style={{
            maxHeight: "620px",
            overflowY: "auto",
            paddingRight: "10px", // FIX RIGHT GAP
            paddingLeft: "5px", // FIX LEFT GAP
            marginTop: "10px",
            borderRadius: "12px",
          }}
        >
          {questions.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#6B7280",
                fontSize: 16,
                fontWeight: 600,
                marginTop: 20,
              }}
            >
              ⚠ No questions found.
            </p>
          ) : (
            questions.map((q, i) => {
              const correct = q.correct_option;

              return (
                <div
                  key={q.question_id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: 20,
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q.question_id)}
                    onChange={(e) => {
                      let updated = [...selectedQuestions];
                      if (e.target.checked) updated.push(q.question_id);
                      else
                        updated = updated.filter((id) => id !== q.question_id);

                      setSelectedQuestions(updated);
                      setSelectAll(updated.length === questions.length);
                    }}
                    style={{
                      width: 18,
                      height: 18,
                      marginTop: 6,
                      cursor: "pointer",
                    }}
                  />

                  {/* QUESTION CARD */}
                  <div
                    style={{
                      flex: 1,
                      background: "#f8faff",
                      border: "1px solid #e2e8f0",
                      borderLeft: "5px solid #4f46e5",
                      padding: "14px 16px",
                      borderRadius: 10,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* TITLE ROW */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div
                          style={{
                            background: "#4f46e5",
                            color: "white",
                            padding: "6px 15px",
                            borderRadius: 8,
                            fontWeight: 700,
                          }}
                        >
                          Q{i + 1}
                        </div>

                        <div
                          dangerouslySetInnerHTML={{ __html: q.question }}
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: "#1e293b",
                            lineHeight: 1.5,
                            maxWidth: "90%",
                          }}
                        />
                      </div>

                      {/* EDIT / DELETE */}
                      {q.isNew && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <span
                            title="Edit"
                            onClick={() => handleEdit(q)}
                            style={{
                              cursor: "pointer",
                              background: "#e0e7ff",
                              padding: "5px 7px",
                              borderRadius: 6,
                            }}
                          >
                            ✏️
                          </span>

                          <span
                            title="Delete"
                            onClick={() => handleDelete(q.question_id)}
                            style={{
                              cursor: "pointer",
                              background: "#fee2e2",
                              padding: "5px 7px",
                              borderRadius: 6,
                            }}
                          >
                            🗑
                          </span>
                        </div>
                      )}
                    </div>

                    {/* OPTIONS */}
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {q.options.map((opt, idx) => {
                        const isCorrect = opt.name === correct;

                        return (
                          <li
                            key={idx}
                            style={{
                              background: isCorrect ? "#e7fbe9" : "#f5f6f8",
                              padding: "8px 12px",
                              marginBottom: 6,
                              borderRadius: 6,
                              border: isCorrect
                                ? "1px solid #38b000"
                                : "1px solid #d9dce1",
                              fontWeight: isCorrect ? 600 : 500,
                            }}
                          >
                            <b>{opt.name}.</b> {opt.value}
                          </li>
                        );
                      })}
                    </ul>

                    {/* CORRECT ANSWER */}
                    <div
                      style={{
                        background: "#eef6ff",
                        padding: 10,
                        borderRadius: 6,
                        border: "1px solid #cfe1ff",
                        marginTop: 10,
                      }}
                    >
                      <b>Correct Answer:</b>{" "}
                      {q.options.find((o) => o.name === correct)?.value || "—"}
                    </div>

                    {/* SOLUTION */}
                    <div
                      style={{
                        background: "#faf5ff",
                        padding: 10,
                        borderRadius: 6,
                        border: "1px solid #e9d5ff",
                        marginTop: 10,
                        color: "#5b21b6",
                      }}
                    >
                      <b>Solution:</b> {q.solution}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SCROLL BUTTONS */}
        {showScrollButtons && (
          <>
            <button
              onClick={() =>
                document.getElementById("questionScrollBox").scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              style={scrollBtnStyle("top")}
            >
              ⬆
            </button>

            <button
              onClick={() =>
                document.getElementById("questionScrollBox").scrollTo({
                  top: document.getElementById("questionScrollBox")
                    .scrollHeight,
                  behavior: "smooth",
                })
              }
              style={scrollBtnStyle("bottom")}
            >
              ⬇
            </button>
          </>
        )}
      </div>

      {/* ----------------------------------------------------
          MODAL WINDOW (YOUR OLD WORKING VERSION)
      ---------------------------------------------------- */}
      {showModal && (
        <div className="modal-overlay" style={modalOverlayStyle()}>
          <div className="modal-box" style={modalBoxStyle()}>
            <div
              style={{
                padding: "20px 25px",
                borderBottom: "1px solid #eee",
                position: "sticky",
                top: 0,
                background: "white",
                zIndex: 10,
              }}
            >
              <h3 className="modal-title" style={{ margin: 0 }}>
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </h3>
            </div>

            <div
              style={{
                maxHeight: "65vh",
                overflowY: "auto",
                padding: "20px 25px 40px",
                overflowX: "visible",
              }}
            >
              {/* ----------- ALL FIELDS (unchanged) ----------- */}

              <label>Subject *</label>
              <select
                className="cq-input"
                value={newQ.subject}
                onChange={(e) => setNewQ({ ...newQ, subject: e.target.value })}
              >
                <option value="">Select Subject</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Maths">Maths</option>
              </select>

              <label>Topic</label>
              <input
                type="text"
                className="cq-input"
                placeholder="Topic"
                value={newQ.topic}
                onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })}
                style={{
                  marginBottom: "15px",
                  height: "48px", // FIX
                  overflow: "visible", // FIX
                }}
              />

              <label>Type *</label>
              <select
                className="cq-input"
                value={newQ.type}
                onChange={(e) => setNewQ({ ...newQ, type: e.target.value })}
              >
                <option value="radio-button">Radio Button</option>
                <option value="check-box">Check Box</option>
              </select>

              <label>Marks *</label>
              <select
                className="cq-input"
                value={newQ.marks}
                onChange={(e) =>
                  setNewQ({ ...newQ, marks: Number(e.target.value) })
                }
              >
                <option value={1}>1</option>
              </select>

              <label>Negative Marks *</label>
              <select
                className="cq-input"
                value={newQ.negative}
                onChange={(e) =>
                  setNewQ({ ...newQ, negative: Number(e.target.value) })
                }
              >
                <option value={0}>0</option>
              </select>

              <label>Difficulty *</label>
              <select
                className="cq-input"
                value={newQ.difficulty}
                onChange={(e) =>
                  setNewQ({ ...newQ, difficulty: e.target.value })
                }
              >
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>

              <label>Question *</label>
              <textarea
                className="cq-input"
                style={{ minHeight: "110px" }} // ⬅ NEW
                value={newQ.question}
                onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
              />

              <label>Options *</label>
              {newQ.options.map((opt, index) => (
                <input
                  key={index}
                  className="cq-input"
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...newQ.options];
                    updated[index] = e.target.value;
                    setNewQ({ ...newQ, options: updated });
                  }}
                  style={{ marginBottom: 8 }}
                />
              ))}

              <label>Correct Answer *</label>
              <select
                className="cq-input"
                value={newQ.correct}
                onChange={(e) => setNewQ({ ...newQ, correct: e.target.value })}
              >
                <option value="">Select correct answer</option>
                {newQ.options.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <label>Solution *</label>
              <textarea
                className="cq-input"
                style={{ minHeight: "110px" }} // ⬅ NEW
                value={newQ.solution}
                onChange={(e) => setNewQ({ ...newQ, solution: e.target.value })}
              />
            </div>

            <div
              className="modal-footer"
              style={{
                padding: "15px 25px",
                borderTop: "1px solid #eee",
                position: "sticky",
                bottom: 0,
                background: "white",
                zIndex: 10,
              }}
            >
              <button
                className="btn-base btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-base btn-primary"
                onClick={saveNewQuestion}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          FOOTER BUTTONS
      ---------------------------------------------------- */}
      <div
        className="step2-footer"
        style={{ display: "flex", gap: 12, marginTop: 25 }}
      >
        <button
          className="btn-base btn-secondary"
          style={{ flex: 1 }}
          onClick={() => setStep(1)}
        >
          ← Previous
        </button>

        <button
          className="btn-base btn-primary"
          style={{ flex: 1, opacity: isSavingDraft ? 0.6 : 1 }}
          disabled={isSavingDraft}
          onClick={saveDraftQuestions}
        >
          {isSavingDraft ? "Saving..." : "Save"}
        </button>

        <button
          className="btn-base btn-success"
          style={{ flex: 1 }}
          onClick={finalizeMock}
        >
          Publish
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
    REUSABLE STYLES
---------------------------------------------------- */
const scrollBtnStyle = (position) => ({
  position: "absolute",
  right: 8,
  [position]: 15,
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  padding: 8,
  borderRadius: "50%",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
});

const modalOverlayStyle = () => ({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
});

const modalBoxStyle = () => ({
  width: "600px",
  maxHeight: "90vh",
  background: "white",
  borderRadius: "10px",
  overflow: "visible",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
});
