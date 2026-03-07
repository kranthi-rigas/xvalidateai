import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import { useContextElement } from "@/context/Context";
import "./SubscriptionSuccess.css";

const MAX_POLLS = 10; // try up to 10 times
const POLL_INTERVAL = 3000; // every 3 seconds

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshUserPlan } = useContextElement();
  const pollCount = useRef(0);
  const [statusMsg, setStatusMsg] = useState("Activating your plan...");

  useEffect(() => {
    // Read the plan that existed BEFORE payment so we can detect a change
    let planBeforePayment = "free";
    try {
      const userInfo = localStorage.getItem("user_info");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        planBeforePayment = parsed?.plan?.plan_type?.toLowerCase() || "free";
      }
    } catch (_) {}

    const poll = async () => {
      pollCount.current += 1;
      setStatusMsg(
        `Checking activation... (${pollCount.current}/${MAX_POLLS})`,
      );

      try {
        await refreshUserPlan();

        // Re-read localStorage AFTER refresh to see if plan changed
        let newPlan = "free";
        let newCredits = 0;
        try {
          const userInfo = localStorage.getItem("user_info");
          if (userInfo) {
            const parsed = JSON.parse(userInfo);
            newPlan = parsed?.plan?.plan_type?.toLowerCase() || "free";
            newCredits =
              parsed?.plan?.credits_remaining ??
              parsed?.subscription?.credits_remaining ??
              0;
          }
        } catch (_) {}

        const planUpgraded = newPlan !== planBeforePayment;
        const creditsGranted = newCredits > 0;

        if (planUpgraded || creditsGranted) {
          // Plan confirmed — go to pricing
          setStatusMsg("Plan activated! Redirecting...");
          setTimeout(() => {
            navigate("/dashboard/pricing", { state: { status: "success" } });
          }, 1500);
          return; // stop polling
        }
      } catch (err) {
        console.error("Poll error:", err);
      }

      if (pollCount.current < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL);
      } else {
        // Give up after MAX_POLLS — navigate anyway
        setStatusMsg("Taking longer than expected. Redirecting...");
        setTimeout(() => {
          navigate("/dashboard/pricing", { state: { status: "success" } });
        }, 2000);
      }
    };

    // Start first poll after a short delay (give PayPal webhook time to fire)
    const initialDelay = setTimeout(poll, 3000);
    return () => clearTimeout(initialDelay);
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

        <p className="redirect-text">{statusMsg}</p>

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
