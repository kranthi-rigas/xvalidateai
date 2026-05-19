import React, { useEffect, useState } from "react";
import { useContextElement } from "@/context/Context";
import { fetchUserProfile } from "@/apiIntegration/auth";
import { COLORS } from "@/styles/colors";

export default function HeaderCredits() {
  const { userCredits, setUserCredits } = useContextElement();
  const [creditsTotal, setCreditsTotal] = useState(0);

  // ── Load total credits once on mount (for the denominator display) ────────
  useEffect(() => {
    const loadTotal = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Try localStorage first — instant, no API wait
        const stored = localStorage.getItem("user_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          const total = parsed?.plan?.credits ?? 0;
          if (total) {
            setCreditsTotal(total);
            return; // localStorage had it, skip API call
          }
        }

        // Fallback: fetch from API
        const userData = await fetchUserProfile(token);
        if (userData?.plan) {
          setCreditsTotal(userData.plan.credits ?? 0);
          setUserCredits(userData.plan.credits_remaining ?? 0);
        }
      } catch (error) {
        console.error("Error loading credits total:", error);
      }
    };

    loadTotal();
  }, []);

  // ── Sync total when userCredits context updates (after voucher/PayPal) ────
  // ── Sync total whenever userCredits context updates ───────────────────────
  useEffect(() => {
    if (!userCredits) return;
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        // ✅ read both fields — DashboardBilling now writes both on redemption
        const total =
          parsed?.plan?.credits ??
          parsed?.plan?.credits_remaining ??
          userCredits;
        setCreditsTotal(total);
      }
    } catch {}
  }, [userCredits]);

  return (
    <div className="flex items-center px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg border border-border bg-muted/50 flex-shrink-0">
      <i
        className="fa-solid fa-coins mr-1.5"
        style={{ color: COLORS.secondary, fontSize: "14px" }}
      />
      <div className="flex items-baseline gap-1">
        {/* ✅ userCredits from Context — updates instantly on voucher redemption */}
        <span
          className="text-sm lg:text-lg font-bold"
          style={{ color: COLORS.secondary }}
        >
          {userCredits ?? 0}
        </span>
        <span className="text-xs text-muted-foreground">/ {creditsTotal}</span>
      </div>
      <span className="ml-1.5 text-xs text-muted-foreground font-medium hidden sm:inline">
        Credits
      </span>
    </div>
  );
}
