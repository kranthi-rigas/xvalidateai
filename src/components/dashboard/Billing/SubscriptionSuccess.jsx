import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import { useContextElement } from "@/context/Context";
import "./SubscriptionSuccess.css";

const MAX_POLLS = 10;
const POLL_INTERVAL = 3000;

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshUserPlan } = useContextElement();
  const pollCount = useRef(0);
  const [statusMsg, setStatusMsg] = useState("Activating your plan...");

  useEffect(() => {
    // Snapshot BOTH plan AND credits before payment — so we can detect real change
    let planBeforePayment = "free";
    let creditsBeforePayment = 0;
    try {
      const userInfo = localStorage.getItem("user_info");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        planBeforePayment = parsed?.plan?.plan_type?.toLowerCase() ?? "free";
        creditsBeforePayment =
          parsed?.plan?.credits_remaining ??
          parsed?.subscription?.credits_remaining ??
          0;
      }
    } catch (_) {}

    console.log(
      "⏳ Polling start — plan before:",
      planBeforePayment,
      "credits before:",
      creditsBeforePayment,
    );

    const poll = async () => {
      pollCount.current += 1;
      setStatusMsg(
        `Checking activation... (${pollCount.current}/${MAX_POLLS})`,
      );

      try {
        await refreshUserPlan();

        // Re-read localStorage AFTER refresh
        let newPlan = "free";
        let newCredits = 0;
        try {
          const userInfo = localStorage.getItem("user_info");
          if (userInfo) {
            const parsed = JSON.parse(userInfo);
            newPlan = parsed?.plan?.plan_type?.toLowerCase() ?? "free";
            newCredits =
              parsed?.plan?.credits_remaining ??
              parsed?.subscription?.credits_remaining ??
              0;
          }
        } catch (_) {}

        console.log(
          "🔄 Poll",
          pollCount.current,
          "— newPlan:",
          newPlan,
          "newCredits:",
          newCredits,
        );

        // ✅ Only redirect if plan ACTUALLY changed from what it was before payment
        // This prevents early redirect when free user already had credits > 0
        const planUpgraded = newPlan !== planBeforePayment;
        const creditsIncreased = newCredits > creditsBeforePayment;

        if (planUpgraded || creditsIncreased) {
          console.log("✅ Plan activation confirmed! Redirecting...");
          setStatusMsg("Plan activated! Redirecting...");
          setTimeout(() => {
            navigate("/dashboard/pricing", {
              state: { status: "success", showPlans: true },
            });
          }, 1500);
          return;
        }
      } catch (err) {
        console.error("Poll error:", err);
      }

      if (pollCount.current < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL);
      } else {
        console.warn("⚠️ Max polls reached — redirecting anyway");
        setStatusMsg("Taking longer than expected. Redirecting...");
        setTimeout(() => {
          navigate("/dashboard/pricing", {
            state: { status: "success", showPlans: true },
          });
        }, 2000);
      }
    };

    const initialDelay = setTimeout(poll, 3000);
    return () => clearTimeout(initialDelay);
  }, [navigate, refreshUserPlan]);

  return (
    <div className="subscription-page">
      <AuthHeader />
      <div className="subscription-container">
        <div className="success-icon">
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h2>Payment Successful</h2>
        <p className="subtitle">Your subscription is being activated.</p>
        <div className="spinner"></div>
        <p className="redirect-text">{statusMsg}</p>
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
