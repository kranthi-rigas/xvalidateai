import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export default function PricingFeatureList({ features, variant = "default" }) {
  return (
    <ul className="pricing-features">
      {features.map((feature, index) => (
        <li key={index} className="pricing-features__item">
          <span className="pricing-features__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCheck} />
          </span>
          <span className="pricing-features__text">{feature}</span>
        </li>
      ))}
    </ul>
  );
}
