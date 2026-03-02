import React from "react";
import { useLocation, Link } from "react-router-dom";
import HeaderTitle from "./HeaderTitle";
import HeaderSearch from "./HeaderSearch";
import HeaderNotifications from "./HeaderNotifications";
import HeaderCredits from "./HeaderCredits";
import { useHeaderContent } from "./hooks/useHeaderContent";
import "./Header.css";

export default function Header({ onToggleMobileSidebar }) {
  const location = useLocation();
  const headerContent = useHeaderContent(location.pathname);

  return (
    <header
      id="header"
      className="h-24 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0"
    >
      {/* Left: Hamburger (mobile) + Title (desktop) */}
      <div className="flex items-center min-w-0 flex-1 relative z-10">
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
          className="h-10 w-auto"
        />
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0 relative z-10">
        <HeaderCredits />
        {/* <HeaderSearch /> */}
        <HeaderNotifications hasUnread={true} />
      </div>
    </header>
  );
}