import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelPaypalSubscription } from "@/apiIntegration/vouchers";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import { useContextElement } from "@/context/Context";
import "./SubscriptionSuccess.css";

const SubscriptionCancel = () => {
  const { refreshUserPlan } = useContextElement();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState(
    "Cancelling your PayPal subscription...",
  );
  const navigate = useNavigate();

  useEffect(() => {
    const cancelSubscription = async () => {
      try {
        await cancelPaypalSubscription("User cancelled on PayPal page");
        await refreshUserPlan();

        setStatus("success");
        setMessage("Payment was cancelled. You are still on the Free plan.");

        setTimeout(() => {
          navigate("/dashboard/pricing", {
            state: { status: "cancelled" },
          });
        }, 3000);
      } catch (error) {
        setStatus("failed");
        setMessage("Something went wrong while cancelling the subscription.");

        setTimeout(() => {
          navigate("/dashboard/pricing", {
            state: { status: "failed" },
          });
        }, 3000);
      }
    };

    cancelSubscription();
  }, [navigate]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        {status === "processing" && (
          <>
            <div className="spinner"></div>
            <h2>Processing Cancellation...</h2>
            <p>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="error-icon">✖</div>
            <h2>Subscription Cancelled</h2>
            <p>{message}</p>
            <p>Redirecting to pricing page...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="error-icon">✖</div>
            <h2>Cancellation Failed</h2>
            <p>{message}</p>
            <p>Redirecting to pricing page...</p>
          </>
        )}
      </div>

      <AuthFooter />
    </div>
  );
};

export default SubscriptionCancel;
