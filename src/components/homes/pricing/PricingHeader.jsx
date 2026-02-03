import React from "react";
import PricingToggle from "./PricingToggle";

export default function PricingHeader({ title, subtitle, isYearly, onToggleChange }) {
  return (
    <div className="pricing-header">
      <div className="sectionTitle">
        <h2 className="pricing-header__title">{title}</h2>
        <p className="pricing-header__subtitle">{subtitle}</p>
      </div>
      <PricingToggle isYearly={isYearly} onChange={onToggleChange} />
    </div>
  );
}
