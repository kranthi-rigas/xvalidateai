import React from "react";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <header className="auth-header frosted-nav">
      <div className="auth-header-content">
        {/* Logo */}
        <div className="auth-logo">
          <img
            src="/assets/img/logo/xvalidateai-logo.svg"
            alt="XVALIDATEAI Logo"
            style={{
              height: "40px",
              width: "auto",
            }}
          />
        </div>

        {/* Navigation Links */}
        <nav className="auth-nav-links">
          <Link to="/" className="auth-nav-link">
            Home
          </Link>
          <a href="#features" className="auth-nav-link">
            Features
          </a>
          <a href="#solutions" className="auth-nav-link">
            Solutions
          </a>
          <a href="#pricing" className="auth-nav-link">
            Pricing
          </a>
          <a href="mailto:support@academy51.com?subject=Contact - XVALIDATEAI" className="auth-nav-link">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
