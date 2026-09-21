/**
 * Single source of truth for enrollment bands, bundle pricing and the mapping
 * from a subscription record to the bundle it represents.
 *
 * Both the Pricing page and the Settings > Subscription tab read from here.
 * They previously kept separate copies, which is how the subscription tab came
 * to show a hardcoded $3,000 for every "business" subscriber regardless of the
 * band they actually bought.
 */

export const ENROLLMENT_TIERS = [
  { id: "small", label: "Small", detail: "Under 300 students" },
  { id: "medium", label: "Medium", detail: "300 - 750 students" },
  { id: "large", label: "Large", detail: "750+ students" },
];

export const TIER_PRICING = {
  platform: { small: 1200, medium: 2000, large: 3000 },
  caio: { small: 2000, medium: 3500, large: 5000 },
  caio_teacher: { small: 3000, medium: 5200, large: 7500 },
};

export const creditsFor = (price) => Math.round(price / 10);

/** Bundle labels, keyed by the card id used across the pricing UI. */
export const BUNDLE_LABEL = {
  platform: "Platform",
  caio: "Platform + CAIO",
  caio_teacher: "Platform + CAIO + AI-Ready Teacher",
};

/**
 * The profile's plan.component names the bundle actually purchased. It is the
 * only field that distinguishes Platform + CAIO from the full bundle, since
 * both carry the "business" entitlement.
 */
export const COMPONENT_TO_PLAN_ID = {
  PLATFORM: "platform",
  CAIO: "caio",
  CAIO_TEACHER: "caio_teacher",
  TEACHER: "caio_teacher",
  COMPLETE: "caio_teacher",
  COMPLETE_PROGRAM: "caio_teacher",
};

export function normalizeComponent(component) {
  const key = (component || "")
    .toString()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return COMPONENT_TO_PLAN_ID[key] || null;
}

export function normalizeTier(tier) {
  const value = (tier || "").toString().toLowerCase();
  return ENROLLMENT_TIERS.some((t) => t.id === value) ? value : null;
}

export function tierLabel(tier) {
  return ENROLLMENT_TIERS.find((t) => t.id === normalizeTier(tier))?.label || null;
}

export function tierDetail(tier) {
  return ENROLLMENT_TIERS.find((t) => t.id === normalizeTier(tier))?.detail || null;
}

/**
 * Annual price for a subscription, or null when the bundle or band is unknown.
 * Returning null rather than a guess matters here: a wrong number on a billing
 * screen is worse than an absent one.
 */
export function annualPrice(component, tier) {
  const bundle = normalizeComponent(component);
  const band = normalizeTier(tier);
  if (!bundle || !band) return null;
  return TIER_PRICING[bundle]?.[band] ?? null;
}

export function formatPrice(amount) {
  return amount == null ? null : `$${amount.toLocaleString("en-US")}`;
}

/**
 * Everything the UI needs about one subscription, derived from the profile's
 * plan object.
 */
export function describeSubscription(plan) {
  if (!plan) return null;

  const bundle = normalizeComponent(plan.component);
  const band = normalizeTier(plan.tier);
  const price = annualPrice(plan.component, plan.tier);

  return {
    bundle,
    band,
    price,
    priceLabel: formatPrice(price),
    // The backend's plan_name is already the full commercial description, so
    // it wins over anything reassembled here when present.
    name: plan.plan_name || (bundle ? BUNDLE_LABEL[bundle] : null),
    bundleLabel: bundle ? BUNDLE_LABEL[bundle] : null,
    tierLabel: tierLabel(plan.tier),
    tierDetail: tierDetail(plan.tier),
  };
}
