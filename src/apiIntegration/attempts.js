import { API_BASE_URL, fetchWithAuth } from "./auth";

/* ----------------------------------------------------
   Fetch All Attempts
---------------------------------------------------- */
export async function fetchAllAttemptsByExamId(exam_id) {
  try {
    const res = await fetch(`${API_BASE_URL}/exam/${exam_id}/attempt`,
      {
        method: "GET",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch attempts");

    return await res.json();
  } catch (err) {
    console.error("fetchAllAttemptsByExamId Error:", err);
    throw err;
  }
}

export async function createAttempt(exam_id, attemptData) {
  const accessToken = localStorage.getItem("access_token");
  try {
    const res = await fetch(`${API_BASE_URL}/exam/${exam_id}/attempt`,
      {
        method: "POST",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "Content-Type": "application/json",
        },
        body: attemptData ? JSON.stringify(attemptData) : null,
      }
    );
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to create attempt");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ createAttempt Error:", err);
    throw err;
  }
}


export async function fetchAttemptResultsForAnalyticsById(exam_id) {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/exam/${exam_id}/attempt-view`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch attempt");
    return await res.json();
  } catch (err) {
    console.error("fetchAttemptById Error:", err);
    throw err;
  }
}