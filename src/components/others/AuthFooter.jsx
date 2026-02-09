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
            <a
              href="https://myacademy51.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            <a
              href="https://myacademy51.com/terms-of-use/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
            <a href="mailto:support@academy51.com?subject=Support Request - XVALIDATEAI">
              Trust Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
