import { API_BASE_URL, fetchWithAuth } from "./auth";

const ENDPOINT = `${API_BASE_URL}/calendar-events`;

/**
 * GET /calendar-events - events for the caller's organization.
 * The backend defaults to a +/- 90 day window when no range is given.
 */
export async function getCalendarEvents(filters = {}) {
  const { start_time, end_time, limit } = filters;

  const params = new URLSearchParams();
  if (start_time) params.append("start_time", start_time);
  if (end_time) params.append("end_time", end_time);
  if (limit) params.append("limit", limit);

  const queryString = params.toString();
  const url = queryString ? `${ENDPOINT}?${queryString}` : ENDPOINT;

  const res = await fetchWithAuth(url, { method: "GET" });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.error || error?.message || "Failed to fetch calendar events",
    );
  }

  return res.json();
}
