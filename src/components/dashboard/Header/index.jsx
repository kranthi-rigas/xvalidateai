import React from "react";
import { useLocation } from "react-router-dom";
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
      className="h-20 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0"
    >
      <div className="flex items-center">
        {/* Hamburger — mobile only */}
        <button
          className="lg:hidden mr-2 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          onClick={onToggleMobileSidebar}
          title="Toggle navigation"
          aria-label="Toggle navigation"
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        <HeaderTitle
          title={headerContent.title}
          description={headerContent.description}
        />
      </div>
      <div className="flex items-center space-x-4">
        <HeaderCredits />
        {/* <HeaderSearch /> */}
        <HeaderNotifications hasUnread={true} />
      </div>
    </header>
  );
}