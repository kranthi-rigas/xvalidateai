import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Step1Form({
  quizTitle,
  setQuizTitle,
  description,
  setDescription,
  examType,
  setExamType,
  duration,
  setDuration,
  questionCount,
  setQuestionCount,
  examDate,
  setExamDate,
  errors,
  setErrors,
  createExam,
  setShowCreateForm,
  isCreating,
  submitted,
  setSubmitted,
}) {
  return (
    <div className="dashboard__content">
      {/* Align with main layout */}
      <div style={{ marginLeft: "-40px", marginRight: "-40px" }}>
        <div
          className="page-container"
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            marginTop: "-14px",
            marginBottom: "-14px",
            padding: "32px",
            borderRadius: "14px",
            background: "#fff",
            border: "1px solid #E5E7EB",
            boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
          }}
        >
          {/* Back Button */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              padding: "6px 2px",
              marginBottom: "28px", // ⭐ gives space from the form
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600,
              color: "#4F46E5",
            }}
            onClick={() => {
              setSubmitted(false);
              setErrors({});
              setShowCreateForm(false);
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "#EEF2FF",
                color: "#4F46E5",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              ←
            </span>
            Back
          </button>

          {/* FORM START */}
          <div className="form-row">
            <label>Mock Test Title *</label>
            <input
              id="quizTitle"
              className={`cq-input ${
                submitted && errors.quizTitle ? "error-input" : ""
              }`}
              value={quizTitle}
              onChange={(e) => {
                setQuizTitle(e.target.value);
                if (submitted) setErrors({ ...errors, quizTitle: "" });
              }}
            />
          </div>

          <div className="form-row">
            <label>Description *</label>
            <textarea
              id="description"
              className={`cq-input ${
                submitted && errors.description ? "error-input" : ""
              }`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (submitted) setErrors({ ...errors, description: "" });
              }}
              style={{ minHeight: 90 }}
            />
          </div>

          <div className="form-row">
            <label>Exam Type *</label>
            <select
              id="examType"
              className={`cq-input ${
                submitted && errors.examType ? "error-input" : ""
              }`}
              value={examType}
              onChange={(e) => {
                setExamType(e.target.value);
                if (submitted) setErrors({ ...errors, examType: "" });
              }}
            >
              <option value="">Select Exam Type</option>
              <option>AP EAPCET</option>
              <option>TS EAPCET</option>
              <option>JEE Main</option>
              <option>JEE Adavanced</option>
              <option>NEET</option>
            </select>
          </div>

          {/* 3 Column Grid */}
          <div
            className="three-input-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "25px",
              marginTop: 20,
            }}
          >
            {/* Date */}
            <div className="input-col">
              <label>Exam Date *</label>
              <DatePicker
                id="examDate"
                selected={examDate}
                onChange={(date) => {
                  setExamDate(date);
                  if (submitted) setErrors({ ...errors, examDate: "" });
                }}
                dateFormat="dd-MM-yyyy"
                className={`cq-input ${
                  submitted && errors.examDate ? "error-input" : ""
                }`}
              />
            </div>

            {/* Duration */}
            <div className="input-col">
              <label>Duration (mins) *</label>
              <input
                id="duration"
                type="number"
                className={`cq-input ${
                  submitted && errors.duration ? "error-input" : ""
                }`}
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  if (submitted) setErrors({ ...errors, duration: "" });
                }}
              />
            </div>

            {/* Question Count */}
            <div className="input-col">
              <label>No. of Questions *</label>
              <input
                id="questionCount"
                type="number"
                className={`cq-input ${
                  submitted && errors.questionCount ? "error-input" : ""
                }`}
                value={questionCount}
                onChange={(e) => {
                  setQuestionCount(e.target.value);
                  if (submitted) setErrors({ ...errors, questionCount: "" });
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="btn-primary"
            style={{
              marginTop: 30,
              width: 160,
              opacity: isCreating ? 0.7 : 1,
              cursor: isCreating ? "not-allowed" : "pointer",
            }}
            onClick={createExam}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                Creating…
                <span className="button-spinner"></span>
              </>
            ) : (
              "Next →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
