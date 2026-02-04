import React from "react";
import { Link } from "react-router-dom";

export default function PricingButton({ variant = "primary", to = "/courses-list-1", children }) {
  return (
    <Link
      className={`pricing-button pricing-button--${variant}`}
      to={to}
    >
      {children}
    </Link>
  );
}
