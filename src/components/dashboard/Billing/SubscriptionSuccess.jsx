import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import "./SubscriptionSuccess.css";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard/pricing", {
        state: { status: "success" },
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        <div className="success-icon">✔</div>
        <h2>Success 🎉</h2>
        <p>Your subscription has been successfully activated.</p>
        <p>Redirecting to pricing page...</p>
      </div>

      <AuthFooter />
    </div>
  );
};

export default SubscriptionSuccess;
