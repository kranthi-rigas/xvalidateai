import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "@/styles/colors";
import {
  useUpgradeNudge,
  dismissUpgradeBanner,
} from "./useUpgradeNudge";

/**
 * UpgradeBanner — a slim, dismissible strip at the top of the dashboard for
 * accounts still on the free plan. It sits above the header so it reads as
 * account chrome rather than page content, and it self-hides for paid plans and
 * on the pricing page itself.
 *
 * Dismissal lasts for the signed-in session only — it steps out of the way once
 * and returns on the next sign-in rather than nagging on every page load. It
 * never removes the way to the plans: dismissing hands off to the compact
 * Upgrade button in the header (the layout owns `dismissed`, so both agree).
 */
export default function UpgradeBanner({ dismissed, onDismiss }) {
  const navigate = useNavigate();
  const eligible = useUpgradeNudge();

  if (dismissed || !eligible) return null;

  const handleDismiss = () => {
    dismissUpgradeBanner();
    onDismiss?.();
  };

  return (
    <div
      role="region"
      aria-label="Plan upgrade"
      className="relative flex items-center justify-center gap-4 px-10 py-2.5 border-b"
      style={{
        backgroundColor: COLORS.primaryLighter,
        borderColor: COLORS.primaryLight,
        flex: "0 0 auto",
      }}
    >
      {/* Message and CTA travel together as one centred group — it keeps the
          action beside the sentence it belongs to. */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 min-w-0">
        <span
          aria-hidden="true"
          className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 text-xs text-white"
          style={{ backgroundColor: COLORS.primary }}
        >
          <i className="fa-solid fa-crown" />
        </span>
        <p className="m-0 text-[13px] leading-snug min-w-0">
          <span className="font-bold" style={{ color: COLORS.primary }}>
            You're on the Free plan.
          </span>{" "}
          <span className="hidden sm:inline text-muted-foreground">
            Upgrade to scan more of your tools for breaches, vulnerabilities
            and privacy gaps — with continuous monitoring and full evidence
            reports.
          </span>
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/pricing")}
          className="inline-flex flex-shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          <i className="fa-solid fa-arrow-up-right-dots" aria-hidden="true" />
          Upgrade
        </button>
      </div>

      {/* Dismiss stays pinned right, out of the centred group. */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        title="Dismiss"
        className="absolute top-1/2 right-3 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  );
}
