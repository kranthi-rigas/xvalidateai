import React from "react";
import PricingFeatureList from "./PricingFeatureList";
import PricingButton from "./PricingButton";

export default function PricingCardContent({ 
  description, 
  features, 
  buttonText = "Get Started Now", 
  buttonVariant = "primary",
  variant = "default" 
}) {
  return (
    <div className={`pricing-card__content ${variant === "purple" ? "pricing-card__content--purple" : ""}`}>
      <div className="pricing-card__description">{description}</div>
      <PricingFeatureList features={features} variant={variant} />
      <PricingButton variant={buttonVariant}>{buttonText}</PricingButton>
    </div>
  );
}
