import { API_BASE_URL, fetchWithAuth } from "./auth";

const NEWSLETTER_ENDPOINT = `${API_BASE_URL}/newsletter/subscribe`;
const NEWSLETTER_STATUS_ENDPOINT = `${API_BASE_URL}/newsletter/subscriptions/status`;

/**
 * The programmes the newsletter accepts sign-ups for. Sign-up is tracked per
 * programme, so asking to hear about one says nothing about the other.
 */
export const NEWSLETTER_PROGRAMS = {
  CAIO: "CAIO",
  AI_READY_TEACHER: "AI_READY_TEACHER",
};

/**
 * Subscribe or unsubscribe the signed-in user from one programme's newsletter.
 * The account comes from the auth token, so only the programme is sent.
 * @param {string} program - A NEWSLETTER_PROGRAMS value, e.g. "CAIO".
 * @param {boolean} optedIn - true to subscribe, false to unsubscribe.
 */
export async function subscribeToProgram(program, optedIn = true) {
  const res = await fetchWithAuth(NEWSLETTER_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ program, opted_in: optedIn }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to subscribe to newsletter");
  }

  return res.json();
}

/**
 * Which programmes the current user has signed up for.
 *
 * A user who has signed up for nothing gets back `{ "opted_in": false }` with
 * no programme list at all, so every field is defaulted here and callers can
 * read `subscribedPrograms` without guarding.
 *
 * @returns {Promise<{
 *   optedIn: boolean,
 *   subscribedPrograms: string[],
 *   programs: Array<{ program: string, program_name: string, opted_in: boolean,
 *                     subscribed_at: number|null, updated_at?: number }>,
 * }>}
 */
export async function getNewsletterStatus() {
  const res = await fetchWithAuth(NEWSLETTER_STATUS_ENDPOINT, {
    method: "GET",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to fetch newsletter status");
  }

  const data = await res.json();
  const programs = Array.isArray(data?.programs) ? data.programs : [];

  // `subscribed_programs` is the source of truth when present; the programme
  // list is the fallback, since one of them is missing in some responses.
  const subscribedPrograms = Array.isArray(data?.subscribed_programs)
    ? data.subscribed_programs
    : programs.filter((p) => p?.opted_in === true).map((p) => p.program);

  return {
    optedIn: data?.opted_in === true,
    subscribedPrograms,
    programs,
  };
}

/** An empty status, for unblocking the UI when the status call fails. */
export const EMPTY_NEWSLETTER_STATUS = {
  optedIn: false,
  subscribedPrograms: [],
  programs: [],
};
