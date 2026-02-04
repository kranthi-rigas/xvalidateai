import React, { useState } from "react";
import { pricingData } from "../../../data/pricing";
import PricingHeader from "./PricingHeader";
import PricingCard from "./PricingCard";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  
  const handleToggleChange = (event) => {
    setIsYearly(event.target.checked);
  };

  const getPlanVariant = (index) => {
    // Middle plan (index 1) is featured
    return index === 1 ? "featured" : "default";
  };

  return (
    <section className="pricing-section">
      <div className="pricing-section__container">
        <div className="row justify-center text-center">
          <div className="col-auto">
            <PricingHeader
              title="Simple Pricing"
              subtitle="Lorem ipsum dolor sit amet, consectetur."
              isYearly={isYearly}
              onToggleChange={handleToggleChange}
            />
          </div>
        </div>

        <div className="pricing-cards">
          {pricingData.map((plan, index) => (
            <div key={index} className="pricing-cards__item">
              <PricingCard
                plan={plan}
                isYearly={isYearly}
                variant={getPlanVariant(index)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
