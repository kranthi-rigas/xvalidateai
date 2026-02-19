import React from "react";

export default function AuthFooter() {
  return (
    <footer className="auth-page-footer frosted-nav">
      <div className="auth-page-footer-content">
        <div className="auth-page-footer-inner">
          <div className="auth-page-footer-copyright">
            © {new Date().getFullYear()} XVALIDATEAI INC. ALL RIGHTS RESERVED.
          </div>
          <div className="auth-page-footer-links">
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            <a href="mailto:support@xvalidateai.com?subject=Support Request - XVALIDATEAI">
            <i className="fa-solid fa-envelope" style={{ marginRight: "0.5rem" }}></i>
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
