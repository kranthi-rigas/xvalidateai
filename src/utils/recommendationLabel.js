/**
 * Display-only relabelling for the assessment recommendation.
 *
 * The API still sends "Approved" / "Approved with limitations". The UI shows
 * the recommendation vocabulary instead, so the positive verdicts read
 * consistently against "Not Recommended" and don't get confused with the
 * separate human approval workflow (approved_for_scan / approved_for_usage).
 *
 * Never send these strings back to the API — they are for rendering only.
 */
export const RECOMMENDATION_DISPLAY_NAMES = {
  approved: "Recommended",
  "approved with limitations": "Recommended with limitations",
};

export function recommendationLabel(recommendation) {
  const key = (recommendation || "").toLowerCase().trim();
  return RECOMMENDATION_DISPLAY_NAMES[key] || recommendation;
}

/**
 * While a tool is waiting on (or was refused) a scan, any recommendation on
 * the row belongs to a previous scan and is stale. Returns the label to show
 * instead, or null when the recommendation itself should be shown.
 */
export function scanStatusRecommendationLabel(status) {
  const key = (status || "").toLowerCase().trim();
  if (key === "rejected_for_scan") return "Scan Rejected";
  if (key === "requested" || key === "requested_for_scan") return "Pending Review";
  return null;
}
