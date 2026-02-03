import React from "react";
import ComplianceCard from "./ComplianceCard";

export default function AuthBackgroundElements() {
  return (
    <>
      {/* Background Base */}
      <div className="auth-background"></div>

      {/* Background Elements Container */}
      <div className="auth-background-elements">
        {/* Grid Pattern */}
        <div className="auth-grid-pattern"></div>

        {/* Corner Accents */}
        <div className="auth-corner-accent auth-corner-accent--top-left"></div>
        <div className="auth-corner-accent auth-corner-accent--top-right"></div>
        <div className="auth-corner-accent auth-corner-accent--bottom-left"></div>
        <div className="auth-corner-accent auth-corner-accent--bottom-right"></div>

        {/* Gradient Orbs */}
        <div className="auth-gradient-orb auth-gradient-orb--primary"></div>
        <div className="auth-gradient-orb auth-gradient-orb--secondary auth-float-animation" style={{ animationDelay: "1s" }}></div>

        {/* Compliance Cards */}
        <ComplianceCard type="gdpr" animationDelay="0.5s" />
        <ComplianceCard type="ccpa" animationDelay="1.5s" />
        <ComplianceCard type="score" animationDelay="0.8s" />
        <ComplianceCard type="risk" animationDelay="1.2s" />
      </div>
    </>
  );
}
