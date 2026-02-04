import React from "react";
import { useLocation } from "react-router-dom";
import HeaderTitle from "./HeaderTitle";
import HeaderSearch from "./HeaderSearch";
import HeaderNotifications from "./HeaderNotifications";
import { useHeaderContent } from "./hooks/useHeaderContent";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const headerContent = useHeaderContent(location.pathname);

  return (
    <header
      id="header"
      className="h-20 bg-card border-b border-border flex items-center justify-between px-8 z-10 sticky top-0"
    >
      <HeaderTitle 
        title={headerContent.title} 
        description={headerContent.description} 
      />
      <div className="flex items-center space-x-4">
        {/* <HeaderSearch /> */}
        <HeaderNotifications hasUnread={true} />
      </div>
    </header>
  );
}