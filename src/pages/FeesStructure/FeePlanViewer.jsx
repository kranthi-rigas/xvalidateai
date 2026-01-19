import { useEffect, useState } from "react";

import { getFeePlans } from "../../apiIntegration/feesPlans";

export default function FeePlansViewer() {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await getFeePlans();
        setPlans(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load fee plans", err);
        setError("Unable to load pricing plans. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="layout-pt-lg layout-pb-md text-center">
        Loading plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="layout-pt-lg layout-pb-md text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <section className="layout-pt-lg layout-pb-md">
      <div className="container">
        <div className="row justify-center text-center">
          <div className="col-auto">
            <div className="sectionTitle">
              <h2 className="sectionTitle__title">Choose Your Plan</h2>
              <p className="sectionTitle__text">
                Affordable learning for everyone
              </p>
            </div>

            <div className="d-flex justify-center items-center pt-md-4 lg:pt-40">
              <div className="text-14 text-dark-1">Monthly</div>
              <div className="form-switch px-20">
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={isYearly}
                    onChange={(e) => setIsYearly(e.target.checked)}
                  />
                  <span className="switch__slider"></span>
                </div>
              </div>
              <div className="text-14 text-dark-1">
                Annually <span className="text-purple-1">Save up to 15%</span>
              </div>
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-10">
            No plans available at the moment.
          </div>
        ) : (
          <div className="row y-gap-30 justify-between pt-60 lg:pt-40">
            {plans.map((plan) => (
              <div className="col-lg-4 col-md-6" key={plan.planId}>
                <div className="priceCard -type-1 rounded-16 bg-white shadow-2">
                  <div className="priceCard__content py-40 px-55 xl:px-40 text-center">
                    <div className="priceCard__type text-18 lh-11 fw-500 text-dark-1">
                      {plan.name}
                    </div>
                    <div className="priceCard__price text-45 lh-11 fw-700 text-dark-1 mt-15">
                      ₹{isYearly ? plan.annualAmount : plan.monthlyAmount}
                    </div>
                    <div className="priceCard__period">
                      {isYearly ? "per year" : "per month"}
                    </div>

                    <div className="priceCard__text text-left pr-15 mt-40">
                      {plan.description}
                    </div>

                    <div className="text-left y-gap-15 mt-35">
                      {plan.features.map((feature, i) => (
                        <div key={i}>
                          <i className="text-purple-1 fa fa-check pr-8"></i>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="d-inline-block mt-30">
                      <button
                        onClick={() => {
                          // TODO: Later → go to payment or enrollment
                          alert(`You selected: ${plan.name}`);
                        }}
                        className="button px-40 py-20 fw-500 -purple-3 text-purple-1"
                      >
                        Select Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
