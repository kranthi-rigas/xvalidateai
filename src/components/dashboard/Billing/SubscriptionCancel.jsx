import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import "./SubscriptionSuccess.css";

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard/pricing", {
        replace: true, // Replace history entry
        state: { status: "cancelled", ts: Date.now() }, // Unique key forces remount detection
      });
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        {/* Cancel Icon */}
        <div className="error-icon">
          <i className="fa-solid fa-circle-xmark"></i>
        </div>

        <h2>Payment Cancelled</h2>

        <p className="subtitle">Your transaction was not completed.</p>

        <div className="cancel-message">
          No charges were made to your account.
          <br />
          You can try again or choose a different plan.
        </div>

        {/* Action Buttons */}
        <div className="cancel-actions">
          <button
            className="cancel-primary"
            onClick={() => navigate("/dashboard/pricing", { replace: true })}
          >
            Back to Pricing
          </button>

          <button
            className="cancel-secondary"
            onClick={() => navigate("/dashboard/pricing", { replace: true })}
          >
            Try Again
          </button>
        </div>

        {/* Payment Icons */}
        <div className="payment-icons">
          <img
            src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
            alt="PayPal"
          />
          <i className="fa-brands fa-cc-visa"></i>
          <i className="fa-brands fa-cc-mastercard"></i>
          <i className="fa-brands fa-cc-amex"></i>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
};

export default SubscriptionCancel;
