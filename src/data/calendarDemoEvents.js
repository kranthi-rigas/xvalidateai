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

// Mid-month of the current month, so the demo event is always visible on load
// rather than drifting into the past.
function midCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 15);
}

export const DEMO_CALENDAR_EVENTS = [
  {
    event_id: "demo-school-ai-review",
    title: "Springfield School District — AI tool review",
    description:
      "Quarterly review of the AI tools requested by the district. Walk through each pending assessment, confirm the recommendation, and record the approval decision before the board meeting.",
    start_time: midCurrentMonth().toISOString(),
    all_day: true,
    assigned_to: [
      { first_name: "Priya", last_name: "Raman", email: "priya.raman@example.edu" },
      { first_name: "Daniel", last_name: "Okafor", email: "daniel.okafor@example.edu" },
    ],
  },
];
