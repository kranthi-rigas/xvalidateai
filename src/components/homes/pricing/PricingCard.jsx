import React from "react";
import PricingCardHeader from "./PricingCardHeader";
import PricingCardContent from "./PricingCardContent";

export default function PricingCard({ plan, isYearly, variant = "default" }) {
  const getHeaderVariant = () => {
    if (variant === "featured") return "purple";
    return "dark";
  };

  const getButtonVariant = () => {
    if (variant === "featured") return "white";
    return "primary";
  };

  const getContentVariant = () => {
    if (variant === "featured") return "purple";
    return "default";
  };

  return (
    <div className={`pricing-card ${variant === "featured" ? "pricing-card--featured" : ""}`}>
      <PricingCardHeader
        type={plan.type}
        price={plan.price}
        period={plan.period}
        isYearly={isYearly}
        variant={getHeaderVariant()}
      />
      <PricingCardContent
        description="Standard listing submission, active for 30 dayss"
        features={plan.features}
        buttonVariant={getButtonVariant()}
        variant={getContentVariant()}
      />
    </div>
  );
}
