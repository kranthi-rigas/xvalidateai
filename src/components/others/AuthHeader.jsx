import React from "react";

export default function AuthHeader() {
  return (
    <header className="auth-header">
      <div className="auth-header-content">
        <div className="auth-logo">
          <img 
            src="/assets/img/logo/xvalidateai-logo.svg" 
            alt="XVALIDATEAI Logo" 
            style={{
              height: "40px",
              width: "auto"
            }}
          />
        </div>
      </div>
    </header>
  );
}
