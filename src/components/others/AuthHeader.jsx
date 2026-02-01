import React from "react";

export default function AuthHeader() {
  return (
    <header className="auth-header">
      <div className="auth-header-content">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <span className="auth-logo-text">
            XVALIDATE<span>AI</span>
          </span>
        </div>
      </div>
    </header>
  );
}
