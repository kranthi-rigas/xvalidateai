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

const NEWSLETTER_STATUS_ENDPOINT = `${API_BASE_URL}/newsletter/subscriptions/status`;

/**
 * Check if the current user is already subscribed to the newsletter.
 * @returns {Promise<boolean>} - true if opted in, false otherwise.
 */
export async function getNewsletterStatus() {
  const res = await fetchWithAuth(NEWSLETTER_STATUS_ENDPOINT, { method: "GET" });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to fetch newsletter status");
  }

  const data = await res.json();
  return data.opted_in === true;
}