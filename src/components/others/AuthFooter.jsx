import React from "react";

export default function AuthFooter() {
  return (
    <footer className="auth-page-footer">
      <div className="auth-page-footer-content">
        <div className="auth-page-footer-inner">
          <div className="auth-page-footer-logo">
            <div className="auth-page-footer-logo-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <span className="auth-page-footer-logo-text">
              XVALIDATE<span>AI</span>
            </span>
          </div>
          <div className="auth-page-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
          <div className="auth-page-footer-copyright">
            © 2024 XVALIDATEAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
