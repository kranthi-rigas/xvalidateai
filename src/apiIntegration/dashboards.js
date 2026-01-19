import { API_BASE_URL, fetchWithAuth } from "./auth";

export async function fetchDashboardAnalytics(period = "month") {
  try {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/dashboard?period=${period}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch dashboard analytics");
    }

    return await res.json();
  } catch (err) {
    console.error("fetchDashboardAnalytics Error:", err);
    throw err;
  }
}
