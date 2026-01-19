import { API_BASE_URL, fetchWithAuth } from "./auth";

const EXAMS = `${API_BASE_URL}/exams`;
const QUESTIONS = `${API_BASE_URL}/questions`;

/* ----------------------------------------------------
   Fetch All Exams
---------------------------------------------------- */
export async function fetchAllExams() {
  const res = await fetchWithAuth(EXAMS, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch exams");
  return res.json();
}

/* ----------------------------------------------------
   Create Exam
---------------------------------------------------- */
export async function createExam(payload) {
  const res = await fetchWithAuth(EXAMS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to create exam");
  }

  return res.json();
}

/* ----------------------------------------------------
   Fetch Questions by Exam
---------------------------------------------------- */
export async function fetchQuestionsByExamId(examId) {
  const res = await fetchWithAuth(`${EXAMS}/${examId}/questions`, {
    method: "GET",
  });

  if (!res.ok) throw new Error("Failed to fetch exam questions");
  return res.json();
}

/* ----------------------------------------------------
   Filter Questions
---------------------------------------------------- */
export async function fetchFilteredQuestions(filters) {
  const res = await fetchWithAuth(`${QUESTIONS}/filters/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters }),
  });

  if (!res.ok) throw new Error("Failed to fetch filtered questions");
  return res.json();
}

/* ----------------------------------------------------
   Create / Update Question
---------------------------------------------------- */
export async function saveQuestion({
  examId,
  questionId,
  payload,
  isEdit,
}) {
  const url = isEdit
    ? `${EXAMS}/${examId}/questions/${questionId}`
    : QUESTIONS;

  const method = isEdit ? "PUT" : "POST";

  const res = await fetchWithAuth(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Question save failed");
  }

  return res.json();
}

/* ----------------------------------------------------
   Delete Question
---------------------------------------------------- */
export async function deleteQuestion(questionId) {
  const res = await fetchWithAuth(`${QUESTIONS}/${questionId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete question");
}

/* ----------------------------------------------------
   Save Draft Questions
---------------------------------------------------- */
export async function saveDraftQuestions(examId, questions) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const res = await fetchWithAuth(`${EXAMS}/${examId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: examId,
        question_id: q.question_id,
        sequence_number: i + 1,
        marks: q.marks ?? 1,
        negative_marks: q.negative_marks ?? 0,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Failed to save question ${i + 1}`);
    }
  }
}

/* ----------------------------------------------------
   Publish Exam
---------------------------------------------------- */
export async function publishExam(examId) {
  const res = await fetchWithAuth(`${EXAMS}/${examId}/publish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam_id: examId }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to publish exam");
  }

  return res.json();
}
/* ----------------------------------------------------
   Fetch Question Filter Options (Exam / Subject / Category)
---------------------------------------------------- */
export async function fetchQuestionFilterOptions() {
  const res = await fetchWithAuth(`${QUESTIONS}/filters/all`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch question filters");
  }

  return res.json();
}

