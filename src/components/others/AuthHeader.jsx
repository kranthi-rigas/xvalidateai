import React from "react";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  const isLoggedIn = !!localStorage.getItem("access_token");

  return (
    <header className="auth-header frosted-nav">
      <div className="auth-header-content">
        {/* Logo */}
        <div className="auth-logo">
          {isLoggedIn ? (
            <Link to="/dashboard">
              <img
                src="/assets/img/logo/xvalidateai-logo.svg"
                alt="XVALIDATEAI Logo"
                className="auth-logo-img"
              />
            </Link>
          ) : (
            <a href="https://xvalidateai.com/">
              <img
                src="/assets/img/logo/xvalidateai-logo.svg"
                alt="XVALIDATEAI Logo"
                className="auth-logo-img"
              />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
