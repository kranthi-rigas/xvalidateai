import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import { useContextElement } from "@/context/Context";
import "./SubscriptionSuccess.css";

const SubscriptionSuccess = () => {
  const { refreshUserPlan } = useContextElement();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState(
    "Processing your subscription with PayPal...",
  );
  const navigate = useNavigate();

  useEffect(() => {
    const confirmSubscription = async () => {
      const params = new URLSearchParams(window.location.search);
      const subscriptionId = params.get("subscription_id");

      if (!subscriptionId) {
        setStatus("failed");
        setMessage("Invalid subscription request.");
        setTimeout(() => navigate("/dashboard/pricing"), 3000);
        return;
      }

      try {
        await confirmPaypalSubscription(subscriptionId);
        await refreshUserPlan();

        setStatus("success");
        setMessage(
          "🎉 Your selected plan has been successfully activated using PayPal!",
        );

        setTimeout(() => {
          navigate("/dashboard/pricing", {
            state: { status: "success" },
          });
        }, 3000);
      } catch (error) {
        setStatus("failed");
        setMessage(
          "❌ Plan activation failed. Please contact support if payment was deducted.",
        );

        setTimeout(() => {
          navigate("/dashboard/pricing", {
            state: { status: "failed" },
          });
        }, 3000);
      }
    };

    confirmSubscription();
  }, [navigate]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        {status === "processing" && (
          <>
            <div className="spinner"></div>
            <h2>Processing...</h2>
            <p>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon">✔</div>
            <h2>Success 🎉</h2>
            <p>{message}</p>
            <p>Redirecting to pricing page...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="error-icon">✖</div>
            <h2>Subscription Failed</h2>
            <p>{message}</p>
            <p>Redirecting to pricing page...</p>
          </>
        )}
      </div>

      <AuthFooter />
    </div>
  );
};

export default SubscriptionSuccess;
