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
        state: { status: "cancelled" },
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        <div className="error-icon">✖</div>
        <h2>Subscription Cancelled</h2>
        <p>Your payment was cancelled.</p>
        <p>Redirecting to pricing page...</p>
      </div>

      <AuthFooter />
    </div>
  );
};

export default SubscriptionCancel;
