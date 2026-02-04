import React from "react";

export default function PricingToggle({ isYearly, onChange }) {
  return (
    <div className="pricing-toggle">
      <div className="pricing-toggle__label">Monthly</div>
      <div className="pricing-toggle__switch">
        <div className="form-switch px-20">
          <div className="switch" data-switch=".js-switch-content">
            <input
              checked={isYearly}
              onChange={onChange}
              type="checkbox"
            />
            <span className="switch__slider"></span>
          </div>
        </div>
      </div>
      <div className="pricing-toggle__label">
        Annually <span className="pricing-toggle__save-badge">Save 30%</span>
      </div>
    </div>
  );
}
