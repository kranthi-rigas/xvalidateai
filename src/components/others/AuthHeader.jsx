import React from "react";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <header className="auth-header frosted-nav" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="auth-header-content">
        {/* Logo */}
        <div className="auth-logo">
          <Link to="/dashboard">
            <img
              src="/assets/img/logo/xvalidateai-logo.svg"
              alt="XVALIDATEAI Logo"
              className="auth-logo-img"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
