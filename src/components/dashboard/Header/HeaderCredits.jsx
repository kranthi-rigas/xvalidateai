import React, { useEffect, useState } from "react";
import { useContextElement } from "@/context/Context";
import { fetchUserProfile } from "@/apiIntegration/auth";
import { COLORS } from "@/styles/colors";

export default function HeaderCredits() {
  const { userCredits, setUserCredits } = useContextElement();
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [creditsTotal, setCreditsTotal] = useState(0);

  const loadCredits = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const userData = await fetchUserProfile(token);
        if (userData?.plan) {
          setCreditsRemaining(userData.plan.credits_remaining || 0);
          setCreditsTotal(userData.plan.credits || 0);
          // Update context as well
          if (setUserCredits) {
            setUserCredits(userData.plan.credits_remaining || 0);
          }
        }
      }
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  useEffect(() => {
    loadCredits();

    // Refetch every 30 seconds as fallback
    const interval = setInterval(loadCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for plan purchase or credits update from context
  useEffect(() => {
    if (userCredits && typeof userCredits === "number") {
      setCreditsRemaining(userCredits);
    }
  }, [userCredits]);

  return (
    <div className="flex items-center px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg border border-border bg-muted/50 flex-shrink-0">
      <i
        className="fa-solid fa-coins mr-1.5"
        style={{ color: COLORS.secondary, fontSize: "14px" }}
      />
      <div className="flex items-baseline gap-1">
        <span className="text-sm lg:text-lg font-bold" style={{ color: COLORS.secondary }}>
          {creditsRemaining}
        </span>
        <span className="text-xs text-muted-foreground">/ {creditsTotal}</span>
      </div>
      <span className="ml-1.5 text-xs text-muted-foreground font-medium hidden sm:inline">
        Credits
      </span>
    </div>
  );
}
