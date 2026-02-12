import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import "./SubscriptionSuccess.css";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          navigate("/dashboard/pricing", {
            state: { status: "success" },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [navigate]);

  return (
    <div className="subscription-page">
      <AuthHeader />

      <div className="subscription-container">
        <div className="success-icon">✔</div>
        <h2>Success 🎉</h2>
        <p>Your subscription is being activated.</p>
        <p>Redirecting in {secondsLeft} seconds...</p>
      </div>

      <AuthFooter />
    </div>
  );
};

export default SubscriptionSuccess;
