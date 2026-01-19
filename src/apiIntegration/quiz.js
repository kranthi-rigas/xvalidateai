import { API_BASE_URL, fetchWithAuth } from "./auth";

const ENDPOINT = `${API_BASE_URL}`;

/* ----------------------------
   Get Exam Details
----------------------------- */
export async function fetchExamDetails(examId) {
  const res = await fetchWithAuth(`${ENDPOINT}/exams/${examId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to load exam details");
  }

  return res.json();
}

/* ----------------------------
   Get Exam Questions
----------------------------- */
export async function fetchExamQuestions(examId) {
  const res = await fetchWithAuth(
    `${ENDPOINT}/exams/${examId}/questions`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to load exam questions");
  }

  return res.json();
}
