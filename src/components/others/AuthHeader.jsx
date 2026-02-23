import React from "react";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <header className="auth-header frosted-nav">
      <div className="auth-header-content">
        {/* Logo */}
        <div className="auth-logo">
          <Link 
          to="/dashboard" 
          className="lg:hidden absolute left-1/2 -translate-x-1/2"
          
          >
            <img
              src="/assets/img/logo/xvalidateai-logo.svg"
              alt="XVALIDATEAI Logo"
              style={{
                height: "40px",
                width: "auto",
              }}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
