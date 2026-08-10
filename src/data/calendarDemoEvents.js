/**
 * Hardcoded demo calendar event.
 *
 * The calendar falls back to this when GET /calendar-events returns nothing -
 * either because the endpoint has not been deployed yet or because the
 * organization has no events stored. Shaped exactly like an API event so the
 * component maps both through the same converter.
 *
 * This is placeholder data, not a real customer or a real deadline.
 */

// Mid-month of whatever month is being viewed first, so the demo event is
// always visible on load rather than drifting into the past.
function midCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 15);
}

export const DEMO_CALENDAR_EVENTS = [
  {
    event_id: "demo-school-ai-review",
    title: "Springfield School District — AI tool review",
    start_time: midCurrentMonth().toISOString(),
    all_day: true,
  },
];
