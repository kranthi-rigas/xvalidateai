import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import HeaderTitle from "./HeaderTitle";
import HeaderSearch from "./HeaderSearch";
import HeaderNotifications from "./HeaderNotifications";
import HeaderCredits from "./HeaderCredits";
import { useHeaderContent } from "./hooks/useHeaderContent";
import { useUpgradeNudge } from "../useUpgradeNudge";
import { COLORS } from "@/styles/colors";
import "./Header.css";

export default function Header({ onToggleMobileSidebar, showUpgradeCta }) {
  const location = useLocation();
  const navigate = useNavigate();
  const headerContent = useHeaderContent(location.pathname);
  const upgradeEligible = useUpgradeNudge();

  return (
    <header
      id="header"
      className="h-20 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0"
    >
      {/* Left: Hamburger (mobile) + Title (desktop) */}
      <div className="flex items-center min-w-0 flex-1">
        {/* Hamburger — mobile only */}
        <button
          className="lg:hidden mr-2 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          onClick={onToggleMobileSidebar}
          title="Toggle navigation"
          aria-label="Toggle navigation"
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        {/* Page title — desktop only */}
        <div className="hidden lg:block min-w-0">
          <HeaderTitle
            title={headerContent.title}
            description={headerContent.description}
          />
        </div>
      </div>

      {/* Center: App logo — mobile only */}
      <Link to="/dashboard" className="lg:hidden absolute left-1/2 -translate-x-1/2">
        <img
          src="/assets/img/logo/xvalidateai-logo.svg"
          alt="App Logo"
          className="h-8 w-auto"
        />
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
        {/* Upgrade — only once the strip above has been dismissed, so a free
            account that waved the pitch away keeps one visible way to the
            plans. Same eligibility rule as the strip itself. */}
        {showUpgradeCta && upgradeEligible && (
          <button
            type="button"
            onClick={() => navigate("/dashboard/pricing")}
            title="You're on the Free plan — see what the paid plans include"
            aria-label="Upgrade your plan"
            className="flex items-center gap-2 h-9 px-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: COLORS.primary }}
          >
            <i className="fa-solid fa-crown text-xs" aria-hidden="true" />
            {/* On a narrow header the crown alone carries it — the title and
                aria-label keep the meaning. */}
            <span className="leading-none hidden sm:inline">Upgrade</span>
          </button>
        )}
        <HeaderCredits />
        {/* <HeaderSearch /> */}
        <HeaderNotifications hasUnread={true} />
      </div>
    </header>
  );
}