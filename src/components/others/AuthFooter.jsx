import React from "react";
import { Link } from "react-router-dom";

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
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms of Service</Link>
            <a href="#">Support</a>
          </div>
          <div className="auth-page-footer-copyright">
            © 2026 XVALIDATEAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
