import { useNavigate, Link } from "react-router-dom";
import { PLAN_HIERARCHY } from "@/utils/planAccess";
import { useContextElement } from "@/context/Context";
import { COLORS } from "@/styles/colors";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const pricingPlans = [
  {
    id: "free",
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
      { text: "Basic Report", included: true },
      { text: "Downloadable Report", included: false },
      { text: "Priority support", included: false },
      { text: "Create organizations", included: false },
      { text: "AI Analytics", included: false },
      { text: "Business workflow", included: false },
      { text: "Customizability", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Best for growing learners",
    icon: "fa-solid fa-star",
    iconColor: COLORS.primary,
    price: 1000,
    period: "Annually",
    credits: 100,
    popular: true,
    buttonText: "Get Premium",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [
      { text: "10 Scans included(100 Credits)", included: true },
      { text: "Downloadable Report", included: true },
      { text: "Basic Report", included: true },
      { text: "Priority support", included: true },
      { text: "Create organizations", included: false },
      { text: "AI Analytics", included: false },
      { text: "Business workflow", included: false },
      { text: "Customizability", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For organizations",
    icon: "fa-solid fa-building",
    iconColor: COLORS.success,
    price: 3000,
    period: "Annually",
    credits: 300,
    popular: false,
    buttonText: "Get Business",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [
      { text: "30 Scans included(300 Credits)", included: true },
      { text: "Downloadable Report", included: true },
      { text: "Basic Report", included: true },
      { text: "Priority support", included: true },
      { text: "Create organizations", included: true },
      { text: "AI Analytics", included: true },
      { text: "Business workflow", included: true },
      { text: "Customizability", included: true },
    ],
  },
];

export default function DashboardPricing() {
  const navigate = useNavigate();

  // Use userPlan from Context for reactive updates after checkout
  const { userPlan } = useContextElement();
  const currentPlan = userPlan || "free";

  // Debug logging to help identify issues
  console.log("🔍 DashboardPricing: userPlan from context:", userPlan);
  console.log("🔍 DashboardPricing: currentPlan resolved to:", currentPlan);

  // Helper to check if a plan is below current plan
  const isPlanBelowCurrent = (planId) => {
    const currentLevel = PLAN_HIERARCHY[currentPlan] || 0;
    const planLevel = PLAN_HIERARCHY[planId] || 0;
    return planLevel < currentLevel;
  };

  // Helper to check if this is the current plan
  const isCurrentPlan = (planId) => {
    return planId === currentPlan;
  };

  const getPrice = (price) => {
    return price;
  };
  useEffect(() => {
    AOS.refresh();
  }, []);

  const handlePlanClick = (plan) => {
    // Navigate to billing page with plan data, or dashboard for free plan
    if (plan.id === "free") {
      navigate("/dashboard");
    } else {
      navigate("/dashboard/pricing/billing", { state: { plan } });
    }
  };

  return (
    <div className="spicy-y">
      <div className="col-auto">
        {/* <h1 className="text-30 lh-12 fw-700">Pricing Plans</h1> */}
        {/* <h3 >Pricing Plans</h3> */}
        {/* <div className="mt-10">
            Choose the plan that fits your learning journey
          </div> */}
      </div>

      <div className="row y-gap-30">
        <div className="col-12">
          <div
            className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100"
            style={{ padding: "1rem" }}
          >
            <div className="py-20 px-15 md:py-30 md:px-30">
              {/* Pricing Cards */}
              <div className="row y-gap-30">
                {pricingPlans.map((plan, index) => (
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
                        border: isCurrentPlan(plan.id)
                          ? `2px solid ${COLORS.primary}`
                          : undefined,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 40px rgba(0,0,0,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      {/* Current Plan Badge */}
                      {isCurrentPlan(plan.id) && (
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

                        {/* Price */}
                        <div className="mt-25" style={{ minHeight: "50px" }}>
                          {plan.price === 0 ? (
                            <span className="text-40 fw-700 lh-11 text-dark-1">
                              Free
                            </span>
                          ) : plan.price === null ? (
                            <>
                              <span className="text-40 fw-700 lh-11 text-dark-1">
                                N/A
                              </span>
                              <span className="text-14 text-light-1">
                                {" "}
                                /{plan.period}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-40 fw-700 lh-11 text-dark-1">
                                ${getPrice(plan.price)}
                              </span>
                              <span className="text-14 text-light-1">
                                {" "}
                                /{plan.period}
                              </span>
                            </>
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
                          {isCurrentPlan(plan.id) ? (
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
                          ) : isPlanBelowCurrent(plan.id) ? (
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
                ))}
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
