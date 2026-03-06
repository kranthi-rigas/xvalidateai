import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import { useContextElement } from "@/context/Context";
import "./SubscriptionSuccess.css";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshUserPlan } = useContextElement();

  useEffect(() => {
    const checkPlanUpdate = async () => {
      for (let i = 0; i < 5; i++) {
        await refreshUserPlan();

        const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

        if (userInfo?.plan?.plan_type !== "free") {
          navigate("/dashboard/pricing", {
            state: { status: "success" },
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      navigate("/dashboard/pricing");
    };

    checkPlanUpdate();
  }, [navigate, refreshUserPlan]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        {/* Success Icon */}
        <div className="success-icon">
          <i className="fa-solid fa-circle-check"></i>
        </div>

        <h2>Payment Successful</h2>
        <p className="subtitle">Your subscription is being activated.</p>

        {/* Spinner */}
        <div className="spinner"></div>

        <p className="redirect-text">
          Please wait while we activate your plan...
        </p>

        {/* Payment Gateway Icons */}
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

export default SubscriptionSuccess;
