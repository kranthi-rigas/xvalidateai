import { API_BASE_URL, fetchWithAuth } from "./auth";

const NEWSLETTER_ENDPOINT = `${API_BASE_URL}/newsletter/subscribe`;

/**
 * Subscribe or unsubscribe a user from the newsletter.
 * @param {string} email - The user's email address.
 * @param {boolean} optedIn - true to subscribe, false to unsubscribe.
 */
export async function subscribeToNewsletter(email, optedIn = true) {
  const res = await fetchWithAuth(NEWSLETTER_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ email, opted_in: optedIn }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to subscribe to newsletter");
  }

  return res.json();
}