const pricingPlans = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    period: "one-time",
    credits: 20,
    popular: false,
    buttonText: "Get Started Free",
    buttonStyle: "-outline-purple-1 text-purple-1",
    features: [
      { text: "20 credits included", included: true },
      { text: "Priority support", included: false },
      { text: "Create organizations", included: false },
      { text: "Download content", included: false },
      { text: "Share content", included: false },
      { text: "AI Analytics", included: false },
      { text: "Business workflow", included: false },
      { text: "Customizability", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Best for growing learners",
    price: 2000,
    period: "one-time",
    credits: null,
    popular: true,
    buttonText: "Start Premium",
    buttonStyle: "-purple-1 text-white",
    features: [
      { text: "Priority support", included: true },
      { text: "Create organizations", included: true },
      { text: "Download content", included: false },
      { text: "Share content", included: false },
      { text: "AI Analytics", included: false },
      { text: "Business workflow", included: false },
      { text: "Customizability", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For teams and organizations",
    price: 4000,
    period: "one-time",
    credits: null,
    popular: false,
    buttonText: "Contact Sales",
    buttonStyle: "-outline-dark-1 text-dark-1",
    features: [
      { text: "Priority support", included: true },
      { text: "Create organizations", included: true },
      { text: "Download content", included: true },
      { text: "Share content", included: true },
      { text: "AI Analytics", included: true },
      { text: "Business workflow", included: true },
      { text: "Customizability", included: true },
    ],
  },
];

export default function PricingCards() {
  const getPrice = (price) => {
    return price;
  };

  return (
    <section className="layout-pt-lg layout-pb-lg">
      <div className="container">
        {/* Header */}
        <div className="row justify-center text-center">
          <div className="col-xl-8 col-lg-10">
            <div className="sectionTitle">
              <h2 className="sectionTitle__title" data-aos="fade-up">
                Simple, transparent pricing
              </h2>
              <p
                className="sectionTitle__text mt-10"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                Choose the plan that fits your learning journey. One-time
                payment, lifetime access.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="row y-gap-30 pt-60 lg:pt-40">
          {pricingPlans.map((plan, index) => (
            <div
              className="col-lg-4 col-md-6"
              key={plan.id}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div
                className={`priceCard -type-1 rounded-16 h-100 ${
                  plan.popular
                    ? "bg-purple-1"
                    : "bg-white border-light shadow-2"
                }`}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  transform: plan.popular ? "scale(1.02)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  if (!plan.popular) {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(0,0,0,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.popular) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "";
                  }
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div
                    className="text-center py-10 fw-500"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontSize: "13px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ✨ Most Popular
                  </div>
                )}

                <div
                  className={`priceCard__content py-40 px-40 xl:px-30 ${
                    plan.popular ? "text-white" : ""
                  }`}
                >
                  {/* Plan Name */}
                  <div
                    className={`text-20 fw-600 ${
                      plan.popular ? "text-white" : "text-dark-1"
                    }`}
                  >
                    {plan.name}
                  </div>
                  <div
                    className={`text-14 mt-5 ${
                      plan.popular ? "text-white" : "text-light-1"
                    }`}
                    style={{ opacity: plan.popular ? 0.9 : 1 }}
                  >
                    {plan.description}
                  </div>

                  {/* Price */}
                  <div className="mt-25">
                    {plan.price === 0 ? (
                      <span
                        className={`text-48 fw-700 lh-11 ${
                          plan.popular ? "text-white" : "text-dark-1"
                        }`}
                      >
                        Free
                      </span>
                    ) : (
                      <>
                        <span
                          className={`text-48 fw-700 lh-11 ${
                            plan.popular ? "text-white" : "text-dark-1"
                          }`}
                        >
                          ${getPrice(plan.price)}
                        </span>
                        <span
                          className={`text-14 ${
                            plan.popular ? "text-white" : "text-light-1"
                          }`}
                          style={{ opacity: plan.popular ? 0.9 : 1 }}
                        >
                          {" "}
                          one-time
                        </span>
                      </>
                    )}
                  </div>

                  {/* Credits Badge */}
                  {plan.credits && (
                    <div
                      className={`d-inline-block mt-20 px-15 py-8 rounded-8 ${
                        plan.popular
                          ? "bg-white text-purple-1"
                          : "bg-purple-3 text-purple-1"
                      }`}
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      $ {plan.credits} credits included
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="mt-30">
                    <button
                      className={`button w-100 py-20 fw-500 rounded-8 ${
                        plan.popular
                          ? "bg-white text-purple-1"
                          : plan.buttonStyle
                      }`}
                      style={{
                        transition: "all 0.2s ease",
                        border: plan.popular ? "none" : undefined,
                      }}
                    >
                      {plan.buttonText}
                    </button>
                  </div>

                  {/* Features List */}
                  <div className="mt-30">
                    <div
                      className={`text-14 fw-500 mb-15 ${
                        plan.popular ? "text-white" : "text-dark-1"
                      }`}
                    >
                      What's included:
                    </div>
                    <div className="y-gap-12">
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
                              className={`d-flex items-center justify-center rounded-full mr-12 ${
                                plan.popular
                                  ? "bg-white text-purple-1"
                                  : "bg-green-1 text-white"
                              }`}
                              style={{
                                width: "20px",
                                height: "20px",
                                minWidth: "20px",
                                fontSize: "11px",
                              }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              className={`d-flex items-center justify-center rounded-full mr-12 ${
                                plan.popular ? "text-white" : "text-light-1"
                              }`}
                              style={{
                                width: "20px",
                                height: "20px",
                                minWidth: "20px",
                                fontSize: "11px",
                                backgroundColor: plan.popular
                                  ? "rgba(255,255,255,0.2)"
                                  : "#e5e5e5",
                              }}
                            >
                              ✕
                            </span>
                          )}
                          <span
                            className={`text-14 ${
                              plan.popular
                                ? "text-white"
                                : feature.included
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

        {/* FAQ Link */}
        <div
          className="row justify-center text-center mt-60"
          data-aos="fade-up"
        >
          <div className="col-auto">
            <p className="text-14 text-light-1">
              Have questions?{" "}
              <a href="/help-center" className="text-purple-1 underline fw-500">
                Check our FAQ
              </a>{" "}
              or{" "}
              <a href="/contact-1" className="text-purple-1 underline fw-500">
                contact our team
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
