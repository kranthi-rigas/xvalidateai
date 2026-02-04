import React from "react";

export default function PricingCardHeader({ type, price, period, isYearly, variant = "dark" }) {
  const calculatePrice = () => {
    if (price === 0 || !price) return "Free";
    if (isYearly) {
      return `$${(price * 12 * 0.7).toFixed(2)}`;
    }
    return `$${price}`;
  };

  const getPeriodText = () => {
    if (price === 0 || !price) return period;
    return isYearly ? "per year" : period;
  };

  return (
    <div className={`pricing-card__header pricing-card__header--${variant}`}>
      <div className="pricing-card__type">{type}</div>
      <div className="pricing-card__price">{calculatePrice()}</div>
      <div className="pricing-card__period">{getPeriodText()}</div>
    </div>
  );
}
