import { useNavigate, Link, useLocation } from "react-router-dom";
import { PLAN_HIERARCHY } from "@/utils/planAccess";
import { useContextElement } from "@/context/Context";
import { SHOW_CREDITS } from "@/config/features";
import { COLORS } from "@/styles/colors";
import AwsButton from "@/components/common/AwsButton";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react";
import {
  ENROLLMENT_TIERS,
  TIER_PRICING,
  BUNDLE_LABEL,
  creditsFor,
  normalizeComponent,
  normalizeTier,
  tierLabel,
} from "@/data/planPricing";

// Pricing is modular and tiered by enrollment: a school picks its enrollment
// band, then one of three component bundles.
//
// Credits follow price / 10. That is not an invented rule - it is what the
// previous plans already were (Premium $1,000 -> 100 credits, Business $3,000
// -> 300), so the matrix extends the existing relationship rather than
// introducing a new one.

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

// Feature groups, composed cumulatively below. Higher plans list everything
// the plans beneath them include and then their own additions, so a buyer sees
// the full picture instead of an "Everything in X" shorthand. Cards list only
// what a plan includes - no crossed-out rows - so every line is something the
// buyer gets.
const inc = (text) => ({ text, included: true });

const PLATFORM_FEATURES = [
  "AI tool compliance assessments",
  "Evidence & verification reports",
  "Downloadable reports",
  "Continuous monitoring",
  "Create organizations",
  "Audit Trail",
];
const CAIO_FEATURES = [
  "Chief AI Officer (CAIO) programme",
  "Tool report",
  "Priority support",
];
const TEACHER_FEATURES = ["AI-Ready Teacher enablement programme"];

const pricingPlans = [
  {
    id: "platform",
    planId: "premium",
    name: "Platform",
    description: "The compliance platform on its own",
    icon: "fa-solid fa-microchip",
    iconColor: COLORS.primary,
    period: "Annually",
    popular: false,
    buttonText: "Choose this plan",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [...PLATFORM_FEATURES.map(inc)],
  },
  {
    id: "caio",
    planId: "business",
    name: "Platform + CAIO",
    description: "Platform plus the Chief AI Officer programme",
    icon: "fa-solid fa-star",
    iconColor: COLORS.primary,
    period: "Annually",
    popular: false,
    buttonText: "Choose this plan",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [...PLATFORM_FEATURES.map(inc), ...CAIO_FEATURES.map(inc)],
  },
  {
    id: "caio_teacher",
    planId: "business",
    name: "Platform + CAIO + AI-Ready Teacher",
    description: "The full bundle: CAIO programme plus teacher enablement",
    icon: "fa-solid fa-building",
    iconColor: COLORS.success,
    period: "Annually",
    popular: false,
    buttonText: "Choose this plan",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [
      ...PLATFORM_FEATURES.map(inc),
      ...CAIO_FEATURES.map(inc),
      ...TEACHER_FEATURES.map(inc),
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

  // The profile arrives on whichever context or storage shape happens to carry
  // it, so look through all of them once and read both the bundle and the
  // enrollment band off the same record.
  const findPlanRecord = () => {
    for (const c of [user, userData, userProfile, profile]) {
      if (c?.plan) return c.plan;
    }
    try {
      return (
        JSON.parse(localStorage.getItem("user_info") || "{}")?.plan || null
      );
    } catch {
      return null;
    }
  };

  // The subscriber's exact bundle (platform / caio / caio_teacher). Two bundles
  // share the "business" entitlement, so this is what distinguishes them.
  // normalizeComponent also tolerates the other spellings the backend has used
  // (CAIO_TEACHER / TEACHER / COMPLETE) rather than only an exact match.
  const getCurrentComponent = () =>
    normalizeComponent(findPlanRecord()?.component);

  // A subscriber's own enrollment band is the only correct starting point -
  // showing a Large school Medium prices misstates what they pay. Medium stays
  // the default only for visitors with no subscription, where it anchors the
  // range better than either extreme.
  const [selectedTier, setSelectedTier] = useState(
    () => normalizeTier(findPlanRecord()?.tier) || "medium",
  );
  // Set once the profile arrives, unless the visitor has already chosen a band
  // themselves - their click must not be overwritten by a later profile load.
  const [tierTouched, setTierTouched] = useState(false);

  useEffect(() => {
    if (tierTouched) return;
    const tier = normalizeTier(findPlanRecord()?.tier);
    if (tier && tier !== selectedTier) setSelectedTier(tier);
  }, [userPlan, user, userData, userProfile, profile, tierTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  // A card's price and credits depend on the chosen enrollment band. Free has
  // neither, so it passes through untouched.
  const resolvePlan = (plan) => {
    const price = TIER_PRICING[plan.id]?.[selectedTier];
    if (price === undefined) return plan;
    // tier travels with the plan: without it checkout cannot tell a $1,200
    // Platform subscription from a $3,000 one.
    return { ...plan, price, credits: creditsFor(price), tier: selectedTier };
  };

  // The page opens on a single call to action; the bands and the plan cards
  // come in once the person says they are shopping. Arriving from an upgrade
  // link is already that decision, so it skips the gate.
  const [plansOpen, setPlansOpen] = useState(
    Boolean(location.state?.highlightPlan),
  );

  // Navigating to Pricing again — the sidebar link, even from this very page —
  // is a fresh visit, so it returns to the call to action. location.key changes
  // on every navigation, including one to the URL already showing.
  useEffect(() => {
    setPlansOpen(Boolean(location.state?.highlightPlan));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // The cards carry AOS attributes, and AOS only knows about elements that
  // existed when it last refreshed — without this they reveal as blank.
  useEffect(() => {
    if (!plansOpen) return undefined;
    const timer = setTimeout(() => AOS.refreshHard(), 50);
    return () => clearTimeout(timer);
  }, [plansOpen]);

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

  // The exact bundle the user is on. The profile now carries the component the
  // subscriber bought; when it is present it identifies the plan unambiguously.
  // If it is absent (a subscription created before the component was stored, or
  // a free user), fall back to the entitlement: premium -> platform, business
  // -> caio, so at most one card is ever marked current.
  const currentComponent =
    getCurrentComponent() ||
    (currentPlan === "premium"
      ? "platform"
      : currentPlan === "business"
        ? "caio"
        : currentPlan === "free"
          ? "free"
          : null);

  // What the visitor is on today, for the landing's status chip.
  const currentBundleLabel = BUNDLE_LABEL[currentComponent] || null;
  const currentTierLabel = tierLabel(findPlanRecord()?.tier);

  const isCurrentPlan = (id) => id === currentComponent;

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
    /* Same full-height panel the My Documents page uses, so the white card
       reaches the bottom of the viewport instead of stopping under a short
       empty state. */
    /* A flex column all the way down to the panel: percentage heights cannot
       resolve here (no ancestor has a definite height), so the panel stretches
       with flex instead — the same height whether the page shows the intro or
       the plan cards. */
    <div
      className="spicy-y"
      style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
    >
      <div className="row y-gap-30" style={{ flex: 1 }}>
        <div
          className="col-12"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            /* No h-100: the template pins it to height:100% !important, so a
               taller page left the last line outside the white background.
               minHeight fills the viewport; the box still grows with content. */
            className="rounded-16 bg-white -dark-bg-dark-1 shadow-4"
            style={{ flex: 1, boxSizing: "border-box" }}
          >
            {/* py-20 / py-30 resolve to 10px !important in the template, so the
                panel's own vertical padding is set here — otherwise the help
                line sits on the panel's bottom border. */}
            <div
              className="px-15 md:px-30"
              style={{ paddingTop: 32, paddingBottom: 32 }}
            >
              {!plansOpen ? (
                /* Nothing to compare until someone asks to compare it — but
                   the landing still has to answer "what is on offer and what
                   am I on now" before the click. */
                <div
                  style={{
                    minHeight: "62vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "32px 16px",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: COLORS.primaryLighter,
                      color: COLORS.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 18,
                    }}
                  >
                    <i
                      className="fa-solid fa-tags"
                      data-fa-i2svg="false"
                      aria-hidden="true"
                      style={{ fontSize: 20 }}
                    ></i>
                  </div>

                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      marginBottom: 10,
                    }}
                  >
                    Find the right plan for your school
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: COLORS.textSecondary,
                      maxWidth: 440,
                      margin: "0 auto",
                    }}
                  >
                    Pricing is tiered by school enrollment. Pick your band, then
                    the bundle that fits.
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: COLORS.textMuted,
                      marginTop: 6,
                      marginBottom: 0,
                    }}
                  >
                    Every plan is billed annually.
                  </p>

                  {/* Where they stand today, so the page is useful to a
                      subscriber and not only to a shopper. */}
                  {currentBundleLabel && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "8px 16px",
                        borderRadius: 999,
                        background: COLORS.bgTertiary,
                        border: `1px solid ${COLORS.borderLight}`,
                        fontSize: 13,
                        color: COLORS.textSecondary,
                      }}
                    >
                      You are on{" "}
                      <strong style={{ color: COLORS.textPrimary }}>
                        {currentBundleLabel}
                      </strong>
                      {currentTierLabel ? ` · ${currentTierLabel} band` : ""}
                    </div>
                  )}

                  <div style={{ marginTop: 26 }}>
                    <AwsButton
                      label="Choose your plan"
                      variant="primary"
                      size="lg"
                      onClick={() => setPlansOpen(true)}
                    />
                  </div>

                  {/* Same treatment as the support line under the plan
                      cards, so the two read as one page. */}
                  <p
                    className="text-14 text-light-1"
                    style={{ marginTop: 28, marginBottom: 0 }}
                  >
                    Enterprise or a question about bands?{" "}
                    <a
                      href="mailto:support@xvalidateai.com"
                      className="text-purple-1 fw-500"
                    >
                      support@xvalidateai.com
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  {/* Enrollment tier selector. Pricing is tiered by school
                  enrollment, so the band has to be chosen before any price on
                  this page means anything. */}
                  <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <p
                      className="text-light-1"
                      style={{ fontSize: 14, marginBottom: 12 }}
                    >
                      Pricing is tiered by school enrollment. Select your band
                      to see your prices.
                    </p>
                    <div
                      style={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        gap: 8,
                        justifyContent: "center",
                      }}
                    >
                      {ENROLLMENT_TIERS.map((tier) => {
                        const active = selectedTier === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => {
                              setTierTouched(true);
                              setSelectedTier(tier.id);
                            }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 2,
                              padding: "8px 22px",
                              borderRadius: 10,
                              lineHeight: 1.2,
                              cursor: "pointer",
                              minWidth: 160,
                              border: `1px solid ${active ? COLORS.primary : COLORS.borderLight}`,
                              background: active
                                ? COLORS.primary
                                : COLORS.bgPrimary,
                              color: active ? "#fff" : COLORS.textPrimary,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                lineHeight: 1.2,
                              }}
                            >
                              {tier.label}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                lineHeight: 1.2,
                                color: active
                                  ? "rgba(255,255,255,0.85)"
                                  : COLORS.textMuted,
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
                      const isCurrent = isCurrentPlan(plan.id);

                      return (
                        <div
                          className="col-12 col-sm-12 col-md-6 col-lg-4"
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
                                : undefined,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-8px)";
                              e.currentTarget.style.boxShadow =
                                "0 20px 40px rgba(0,0,0,0.12)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "";
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

                            {/* py-30 is not 30px: the template defines it as
                                10px !important, which is why the last feature
                                sat on the card's edge and an inline override
                                did nothing. The vertical padding is set here
                                instead, and px-25 keeps the sides. */}
                            <div
                              className="priceCard__content px-25"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                paddingTop: 18,
                                paddingBottom: 18,
                              }}
                            >
                              {/* Plan Icon & Name */}
                              <div className="d-flex gap-3 mb-3">
                                <div
                                  className="d-flex items-center justify-center rounded-12 flex-shrink-0"
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
                                {/* Reserved height for a two-line description:
                                    without it the longest card pushes its
                                    price and button below the other two. */}
                                <div style={{ minHeight: 76 }}>
                                  <div className="text-20 fw-600 text-dark-1">
                                    {plan.name}
                                  </div>
                                  <div
                                    className="text-14 mt-5 text-light-1"
                                    style={{ minHeight: 42 }}
                                  >
                                    {plan.description}
                                  </div>
                                </div>
                              </div>

                              {/* Price - paid plans show a dash instead of the
                              amount; the period is hidden with it so the card
                              doesn't read "- /yearly". The plan data still
                              carries the real price for checkout. */}
                              <div
                                className="mt-25"
                                style={{ minHeight: "50px" }}
                              >
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

                              {/* Credits Badge — hidden while credits are off, and
                              the reserved strip goes with it so the cards do
                              not keep an empty gap. */}
                              {SHOW_CREDITS && (
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
                              )}

                              {/* CTA Button */}
                              <div className="mt-25">
                                {isCurrent ? (
                                  <button
                                    disabled
                                    className="button w-100 fw-500 rounded-8"
                                    style={{
                                      padding: "12px 24px",
                                      lineHeight: 1.4,
                                      minHeight: 44,
                                      backgroundColor: "#9e9e9e",
                                      color: "#F0F8FF",
                                      cursor: "not-allowed",
                                      border: "none",
                                    }}
                                  >
                                    Current Plan
                                  </button>
                                ) : plan.id === "free" ? (
                                  <div className=" py-25 "></div>
                                ) : (
                                  <button
                                    onClick={() => handlePlanClick(plan)}
                                    className={`button w-100 fw-500 rounded-8 ${plan.buttonStyle}`}
                                    style={{
                                      transition: "all 0.2s ease",
                                      padding: "12px 24px",
                                      lineHeight: 1.4,
                                      minHeight: 44,
                                    }}
                                  >
                                    {plan.buttonText}
                                  </button>
                                )}
                              </div>

                              {/* Features List */}
                              <div className="mt-20" style={{ flex: 1 }}>
                                <div
                                  className="fw-500 text-dark-1"
                                  style={{ fontSize: 13, marginBottom: 10 }}
                                >
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
                                            width: "18px",
                                            height: "18px",
                                            minWidth: "18px",
                                            fontSize: "10px",
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
                                        className={
                                          feature.included
                                            ? "text-dark-1"
                                            : "text-light-1"
                                        }
                                        style={{
                                          fontSize: 13,
                                          lineHeight: 1.4,
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

                    {/* A column of the cards' own row, so the line sits below
                        the cards and shares their exact left and right edges
                        rather than the panel's. */}
                    <div className="col-12">
                      <p
                        className="text-14 text-light-1 text-center"
                        style={{ margin: 0 }}
                      >
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
