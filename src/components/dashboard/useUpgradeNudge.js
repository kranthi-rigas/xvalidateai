import { useLocation } from "react-router-dom";
import { useContextElement } from "@/context/Context";

const UPGRADE_BANNER_DISMISSED_KEY = "xv_upgrade_banner_dismissed";

/** Was the banner waved away earlier in this signed-in session? */
export function isUpgradeBannerDismissed() {
  try {
    return sessionStorage.getItem(UPGRADE_BANNER_DISMISSED_KEY) === "1";
  } catch {
    // Storage unavailable — treat as not dismissed. Dismissible again next
    // load beats hiding it forever or throwing here.
    return false;
  }
}

/** Remember the dismissal for the rest of this signed-in session. */
export function dismissUpgradeBanner() {
  try {
    sessionStorage.setItem(UPGRADE_BANNER_DISMISSED_KEY, "1");
  } catch {
    /* nothing to remember it in — the banner simply returns next load */
  }
}

/**
 * useUpgradeNudge — the single answer to "should this user be pitched the paid
 * plans right now?", shared by the strip above the page (UpgradeBanner) and the
 * compact Upgrade button in the header. Both must agree: the moment the strip is
 * dismissed the button takes over, so a rule only one of them applied would
 * either leave a paid account with an Upgrade button or a free account with no
 * way back to the plans.
 *
 * Nothing is pitched until the plan is *known*. `userPlan` starts as "free"
 * before /profile answers, and reading that as a real answer would flash
 * "You're on the Free plan" across a paying customer's dashboard on every load.
 *
 * @returns {boolean} true when the plan is known to be free and we are not
 *   already on the page that sells it.
 */
export function useUpgradeNudge() {
  const location = useLocation();
  const { userPlan, planKnown } = useContextElement();

  // Don't repeat the pitch on the pages that already sell the plan.
  const onPricingSurface = location.pathname.startsWith("/dashboard/pricing");

  return planKnown && userPlan === "free" && !onPricingSurface;
}

export default useUpgradeNudge;
