import { useNavigate, Link, useLocation } from "react-router-dom";
import { PLAN_HIERARCHY } from "@/utils/planAccess";
import { useContextElement } from "@/context/Context";
import { COLORS } from "@/styles/colors";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react";

// Pricing is modular and tiered by enrollment: a school picks its enrollment
// band, then one of three component bundles.
//
// Credits follow price / 10. That is not an invented rule - it is what the
// previous plans already were (Premium $1,000 -> 100 credits, Business $3,000
// -> 300), so the matrix extends the existing relationship rather than
// introducing a new one.
const ENROLLMENT_TIERS = [
  { id: "small", label: "Small", detail: "Under 300 students" },
  { id: "medium", label: "Medium", detail: "300 – 750 students" },
  { id: "large", label: "Large", detail: "750+ students" },
];

const TIER_PRICING = {
  platform: { small: 1200, medium: 2000, large: 3000 },
  caio: { small: 2000, medium: 3500, large: 5000 },
  caio_teacher: { small: 3000, medium: 5200, large: 7500 },
};

const creditsFor = (price) => Math.round(price / 10);

// planId is the ENTITLEMENT key and is deliberately unchanged. "premium" and
// "business" drive PLAN_HIERARCHY, the sidebar's requiredPlan gating,
// PlanStatusBadge and the backend subscription record. Renaming them to match
// the new commercial packaging would silently drop paying customers to level 0
// and remove features they are entitled to.
//
// Note for review: + CAIO and + CAIO + Teacher both map to "business" today,
// so the full bundle currently unlocks nothing the CAIO bundle does not. If
// they are meant to differ, that needs a new entitlement level rather than a
// pricing change.

const pricingPlans = [
  {
    id: "free",
    planId: "free",
    name: "Free",
    description: "Perfect for getting started",
    icon: "fa-solid fa-rocket",
    iconColor: COLORS.secondary,
    price: 0,
    period: "yearly",
    credits: 20,
    popular: false,
    features: [
      { text: "2 Scans included(20 Credits)", included: true },
      { text: "Single User", included: true },
      { text: "Basic Report", included: true },
      { text: "Downloadable Report", included: false },
      { text: "Priority support", included: false },
      { text: "Create organizations", included: false },
      { text: "AI Analytics", included: false },
      { text: "Business workflow", included: false },
      { text: "Customizability", included: false },
      { text: "Audit Trail", included: false },
    ],
  },
  {
    id: "platform",
    planId: "premium",
    name: "Platform Only",
    description: "The compliance platform on its own",
    icon: "fa-solid fa-microchip",
    iconColor: COLORS.primary,
    period: "Annually",
    popular: false,
    buttonText: "Choose Platform",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [
      { text: "AI tool compliance assessments", included: true },
      { text: "Downloadable reports", included: true },
      { text: "Continuous monitoring", included: true },
      { text: "Create organizations", included: true },
      { text: "Audit Trail", included: true },
      { text: "Chief AI Officer (CAIO) programme", included: false },
      { text: "Teacher enablement", included: false },
    ],
  },
  {
    id: "caio",
    planId: "business",
    name: "+ Chief AI Officer (CAIO)",
    description: "Platform plus the Chief AI Officer programme",
    icon: "fa-solid fa-star",
    iconColor: COLORS.primary,
    period: "Annually",
    popular: true,
    buttonText: "Choose Chief AI Officer",
    buttonStyle: "-purple-1 text-white",
    features: [
      { text: "Everything in Platform Only", included: true },
      { text: "Chief AI Officer (CAIO) programme", included: true },
      { text: "AI Analytics", included: true },
      { text: "Priority support", included: true },
      { text: "Teacher enablement", included: false },
    ],
  },
  {
    id: "caio_teacher",
    planId: "business",
    name: "+ Chief AI Officer + Teacher",
    description: "The full bundle: CAIO programme plus teacher enablement",
    icon: "fa-solid fa-building",
    iconColor: COLORS.success,
    period: "Annually",
    popular: false,
    buttonText: "Choose Full Bundle",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [
      { text: "Everything in + Chief AI Officer", included: true },
      { text: "Teacher enablement", included: true },
      { text: "Business workflow", included: true },
      { text: "Customizability", included: true },
    ],
  },
];

function formatExpiryDate(unixTimestamp) {
  if (!unixTimestamp) return null;
  try {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function isExpiringSoon(unixTimestamp) {
  if (!unixTimestamp) return false;
  const now = Date.now();
  const expiry = unixTimestamp * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return expiry - now > 0 && expiry - now <= thirtyDays;
}

function isExpired(unixTimestamp) {
  if (!unixTimestamp) return false;
  return Date.now() > unixTimestamp * 1000;
}

export default function DashboardPricing({ expiresAtOverride = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUserPlan } = useContextElement();

  const { userPlan, user, userData, userProfile, profile } =
    useContextElement();
  const currentPlan = userPlan || "free";

  // Default to Medium: the middle band is the most common school size and
  // anchors the range better than either extreme.
  const [selectedTier, setSelectedTier] = useState("medium");

  // A card's price and credits depend on the chosen enrollment band. Free has
  // neither, so it passes through untouched.
  const resolvePlan = (plan) => {
    const price = TIER_PRICING[plan.id]?.[selectedTier];
    if (price === undefined) return plan;
    return { ...plan, price, credits: creditsFor(price) };
  };

  // ── Business card highlight state (set when Premium user clicks Upgrade) ──
  const [highlightBusiness, setHighlightBusiness] = useState(
    location.state?.highlightPlan === "business",
  );

  useEffect(() => {
    if (!highlightBusiness) return;
    const t = setTimeout(() => setHighlightBusiness(false), 3000);
    return () => clearTimeout(t);
  }, [highlightBusiness]);

  // ── Robustly find expires_at across all common storage/context patterns ──
  function getExpiresAt() {
    const contextCandidates = [user, userData, userProfile, profile];
    for (const candidate of contextCandidates) {
      const ts = candidate?.plan?.expires_at ?? candidate?.expires_at ?? null;
      if (ts) return ts;
    }

    const lsKeys = [
      "user_info",
      "user",
      "userProfile",
      "profile",
      "currentUser",
      "authUser",
      "userData",
    ];
    for (const key of lsKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const ts = parsed?.plan?.expires_at ?? parsed?.expires_at ?? null;
        if (ts) {
          console.log(
            `🔍 DashboardPricing: expires_at found in localStorage["${key}"]`,
            ts,
          );
          return ts;
        }
      } catch {
        // malformed JSON skip
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw[0] !== "{") continue;
        const parsed = JSON.parse(raw);
        const ts = parsed?.plan?.expires_at ?? null;
        if (ts) {
          console.log(
            `🔍 DashboardPricing: expires_at found via full scan in ["${key}"]`,
            ts,
          );
          return ts;
        }
      } catch {
        // skip
      }
    }

    return null;
  }

  const expiresAt = expiresAtOverride ?? getExpiresAt();
  const formattedExpiry = formatExpiryDate(expiresAt);
  const expiringSoon = isExpiringSoon(expiresAt);
  const expired = isExpired(expiresAt);

  console.log("🔍 DashboardPricing: userPlan from context:", userPlan);
  console.log("🔍 DashboardPricing: currentPlan resolved to:", currentPlan);
  console.log("🔍 DashboardPricing: context user object:", user);
  console.log(
    "🔍 DashboardPricing: expires_at found:",
    expiresAt,
    "→",
    formattedExpiry,
  );

  const isPlanBelowCurrent = (planId) => {
    const currentLevel = PLAN_HIERARCHY[currentPlan] || 0;
    const planLevel = PLAN_HIERARCHY[planId] || 0;
    return planLevel < currentLevel;
  };

  const isCurrentPlan = (planId) => planId === currentPlan;

  useEffect(() => {
    AOS.init({
      once: true,
      disable: () => window.innerWidth < 1024,
    });
    const timer = setTimeout(() => {
      AOS.refreshHard();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    refreshUserPlan();
  }, [refreshUserPlan]);

  const handlePlanClick = (plan) => {
    if (plan.id === "free") {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/pricing/billing", { state: { plan } });
    }
  };

  return (
    <div className="spicy-y">
      <style>{`
        @keyframes pulse-business {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-6px) scale(1.02); }
        }
      `}</style>

      <div className="col-auto"></div>

      <div className="row y-gap-30">
        <div className="col-12">
          <div
            className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100"
            style={{ padding: "1rem" }}
          >
            <div className="py-20 px-15 md:py-30 md:px-30">
              {/* Enrollment tier selector. Pricing is tiered by school
                  enrollment, so the band has to be chosen before any price on
                  this page means anything. */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <p className="text-light-1" style={{ fontSize: 14, marginBottom: 12 }}>
                  Pricing is tiered by school enrollment. Select your band to see
                  your prices.
                </p>
                <div
                  style={{
                    display: "inline-flex", flexWrap: "wrap", gap: 8,
                    justifyContent: "center",
                  }}
                >
                  {ENROLLMENT_TIERS.map((tier) => {
                    const active = selectedTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier.id)}
                        style={{
                          display: "flex", flexDirection: "column",
                          alignItems: "center", gap: 2,
                          padding: "10px 22px", borderRadius: 10,
                          cursor: "pointer", minWidth: 160,
                          border: `1px solid ${active ? COLORS.primary : COLORS.borderLight}`,
                          background: active ? COLORS.primary : COLORS.bgPrimary,
                          color: active ? "#fff" : COLORS.textPrimary,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                          {tier.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: active ? "rgba(255,255,255,0.85)" : COLORS.textMuted,
                          }}
                        >
                          {tier.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="row y-gap-30">
                {pricingPlans.map((rawPlan, index) => {
                  const plan = resolvePlan(rawPlan);
                  const isCurrent = isCurrentPlan(plan.planId);
                  const isBelowCurrent = isPlanBelowCurrent(plan.id);
                  const isHighlighted = highlightBusiness && plan.id === "business";

                  return (
                    <div
                      className="col-12 col-sm-12 col-md-6 col-lg-3"
                      key={plan.id}
                      data-aos="fade-up"
                      data-aos-delay={index * 100}
                    >
                      <div
                        className="priceCard -type-1 rounded-16 h-100 bg-white border-light shadow-2"
                        style={{
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          transform: "scale(1)",
                          display: "flex",
                          flexDirection: "column",
                          border: isCurrent
                            ? `2px solid ${COLORS.primary}`
                            : isHighlighted
                            ? `2px solid ${COLORS.success}`
                            : undefined,
                          boxShadow: isHighlighted
                            ? `0 0 0 4px ${COLORS.success}30, 0 20px 40px rgba(0,0,0,0.12)`
                            : undefined,
                          animation: isHighlighted
                            ? "pulse-business 1s ease-in-out 3"
                            : undefined,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-8px)";
                          e.currentTarget.style.boxShadow =
                            "0 20px 40px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = isHighlighted
                            ? `0 0 0 4px ${COLORS.success}30, 0 20px 40px rgba(0,0,0,0.12)`
                            : "";
                        }}
                      >
                        {/* Current Plan Badge */}
                        {isCurrent && (
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              backgroundColor: COLORS.primary,
                              color: "#fff",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            Your Plan
                          </div>
                        )}

                        {/* Recommended Badge for Business when Premium user */}
                        {isHighlighted && (
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              backgroundColor: COLORS.success,
                              color: "#fff",
                              padding: "4px 12px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            Recommended
                          </div>
                        )}

                        <div
                          className="priceCard__content py-30 px-25"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                          }}
                        >
                          {/* Plan Icon & Name */}
                          <div className="d-flex items-center gap-3 mb-3">
                            <div
                              className="d-flex items-center justify-center rounded-12"
                              style={{
                                width: "48px",
                                height: "48px",
                                backgroundColor: `${plan.iconColor}15`,
                              }}
                            >
                              <i
                                className={plan.icon}
                                style={{
                                  fontSize: "24px",
                                  color: plan.iconColor,
                                }}
                              ></i>
                            </div>
                            <div>
                              <div className="text-20 fw-600 text-dark-1">
                                {plan.name}
                              </div>
                              <div className="text-14 mt-5 text-light-1">
                                {plan.description}
                              </div>
                            </div>
                          </div>

                          {/* Price - paid plans show a dash instead of the
                              amount; the period is hidden with it so the card
                              doesn't read "- /yearly". The plan data still
                              carries the real price for checkout. */}
                          <div className="mt-25" style={{ minHeight: "50px" }}>
                            <span className="text-40 fw-700 lh-11 text-dark-1">
                              {plan.price === 0
                                ? "Free"
                                : `$${plan.price.toLocaleString()}`}
                            </span>
                            {plan.price > 0 && plan.period && (
                              <span className="text-14 text-light-1">
                                {" "}
                                /{plan.period.toLowerCase()}
                              </span>
                            )}
                          </div>

                          {/* Credits Badge */}
                          <div
                            style={{
                              minHeight: "45px",
                              display: "flex",
                              alignItems: "flex-start",
                            }}
                          >
                            {plan.credits && (
                              <div
                                className="d-inline-block mt-15 px-15 py-8 rounded-8"
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  backgroundColor: `${plan.iconColor}15`,
                                  color: plan.iconColor,
                                }}
                              >
                                <i className="fa-solid fa-coins mr-1"></i>
                                {plan.credits} Credits included
                              </div>
                            )}
                          </div>

                          {/* CTA Button */}
                          <div className="mt-25">
                            {isCurrent ? (
                              <button
                                disabled
                                className="button w-100 py-15 fw-500 rounded-8"
                                style={{
                                  padding: "12px 24px",
                                  backgroundColor: "#9e9e9e",
                                  color: "#F0F8FF",
                                  cursor: "not-allowed",
                                  border: "none",
                                }}
                              >
                                Current Plan
                              </button>
                            ) : isBelowCurrent ? (
                              <button
                                disabled
                                className="button w-100 py-15 fw-500 rounded-8"
                                style={{
                                  padding: "12px 24px",
                                  backgroundColor: "#e0e0e0",
                                  color: "#9e9e9e",
                                  cursor: "not-allowed",
                                  border: "none",
                                }}
                              >
                                {plan.id === "free"
                                  ? "Free Plan"
                                  : plan.buttonText}
                              </button>
                            ) : plan.id === "free" ? (
                              <div className=" py-25 "></div>
                            ) : (
                              <button
                                onClick={() => handlePlanClick(plan)}
                                className={`button w-100 py-15 fw-500 rounded-8 ${plan.buttonStyle}`}
                                style={{
                                  transition: "all 0.2s ease",
                                  padding: "12px 24px",
                                }}
                              >
                                {plan.buttonText}
                              </button>
                            )}
                          </div>

                          {/* Features List */}
                          <div className="mt-25" style={{ flex: 1 }}>
                            <div className="text-14 fw-500 mb-15 text-dark-1">
                              What's included:
                            </div>
                            <div className="y-gap-10">
                              {plan.features.map((feature, i) => (
                                <div
                                  key={i}
                                  className="d-flex items-center"
                                  style={{
                                    opacity: feature.included ? 1 : 0.5,
                                  }}
                                >
                                  {feature.included ? (
                                    <span
                                      className="d-flex items-center justify-center rounded-full mr-12 text-white"
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        minWidth: "20px",
                                        fontSize: "11px",
                                        backgroundColor: COLORS.success,
                                      }}
                                    >
                                      ✓
                                    </span>
                                  ) : (
                                    <span
                                      className="d-flex items-center justify-center rounded-full mr-12 text-light-1"
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        minWidth: "20px",
                                        fontSize: "11px",
                                        backgroundColor: "#e5e5e5",
                                      }}
                                    >
                                      ✕
                                    </span>
                                  )}
                                  <span
                                    className={`text-14 ${
                                      feature.included
                                        ? "text-dark-1"
                                        : "text-light-1"
                                    }`}
                                    style={{
                                      textDecoration: feature.included
                                        ? "none"
                                        : "line-through",
                                    }}
                                  >
                                    {feature.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Help Section */}
              <div className="row justify-center text-center mt-30">
                <div className="col-auto">
                  <p className="text-14 text-light-1">
                    For any questions or enterprise inquiries, contact us at{" "}
                    <a
                      href="mailto:support@xvalidateai.com"
                      className="text-purple-1 fw-500"
                    >
                      support@xvalidateai.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
