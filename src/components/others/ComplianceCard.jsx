import React from "react";

/**
 * ComplianceCard - Floating compliance/status cards for auth page background
 * @param {string} type - Card type: 'gdpr' | 'ccpa' | 'score' | 'risk'
 * @param {string} animationDelay - CSS animation delay (e.g., '0.5s')
 */
export default function ComplianceCard({ type = "gdpr", animationDelay = "0s" }) {
  const cardConfigs = {
    gdpr: {
      positionClass: "auth-compliance-card--gdpr",
      title: "GDPR",
      description: "Full compliance with EU data protection regulations",
      status: "Certified",
    },
    ccpa: {
      positionClass: "auth-compliance-card--ccpa",
      title: "CCPA",
      description: "California Consumer Privacy Act compliant",
      status: "Verified",
    },
    score: {
      positionClass: "auth-compliance-card--score",
      isScoreCard: true,
      value: "98.5%",
      change: "+2.3% this week",
    },
    risk: {
      positionClass: "auth-compliance-card--risk",
      isRiskCard: true,
      value: "3",
      risks: [
        { level: "Critical", count: 1, color: "var(--auth-destructive, #ef4444)" },
        { level: "Medium", count: 2, color: "var(--auth-accent, #64748B)" },
      ],
    },
  };

  const config = cardConfigs[type];
  const scanlineDelay = type === "ccpa" || type === "risk" ? "1s" : "0s";

  if (config.isScoreCard) {
    return (
      <div
        className={`auth-scanline-container auth-float-animation auth-compliance-card ${config.positionClass}`}
        style={{ animationDelay }}
      >
        <div className="auth-scanline"></div>
        <div className="auth-compliance-card-inner">
          <div className="auth-compliance-card-header">
            <span className="auth-compliance-card-label">Compliance Score</span>
            <div className="auth-status-dot auth-status-dot--warning auth-pulse-glow"></div>
          </div>
          <div className="auth-compliance-card-value">{config.value}</div>
          <div className="auth-compliance-card-change">
            <i className="fa-solid fa-arrow-up"></i>
            <span>{config.change}</span>
          </div>
        </div>
      </div>
    );
  }

  if (config.isRiskCard) {
    return (
      <div
        className={`auth-scanline-container auth-float-animation auth-compliance-card ${config.positionClass}`}
        style={{ animationDelay }}
      >
        <div className="auth-scanline" style={{ animationDelay: scanlineDelay }}></div>
        <div className="auth-compliance-card-inner">
          <div className="auth-compliance-card-header">
            <span className="auth-compliance-card-label">Risk Alerts</span>
            <div className="auth-status-dot auth-status-dot--error auth-pulse-glow"></div>
          </div>
          <div className="auth-compliance-card-value">{config.value}</div>
          <div className="auth-risk-items">
            {config.risks.map((risk, index) => (
              <div key={index} className="auth-risk-item">
                <div
                  className="auth-risk-item-dot"
                  style={{ background: risk.color }}
                ></div>
                <span>{risk.level}: {risk.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: GDPR/CCPA style card
  return (
    <div
      className={`auth-scanline-container auth-float-animation auth-compliance-card ${config.positionClass}`}
      style={{ animationDelay }}
    >
      <div className="auth-scanline" style={{ animationDelay: scanlineDelay }}></div>
      <div className="auth-compliance-card-inner">
        <div className="auth-compliance-card-header">
          <div className="auth-compliance-card-title">
            <i className="fa-solid fa-shield-check"></i>
            <span>{config.title}</span>
          </div>
          <div className="auth-status-dot auth-status-dot--success auth-pulse-glow"></div>
        </div>
        <div className="auth-compliance-card-description">{config.description}</div>
        <div className="auth-compliance-card-status">
          <i className="fa-solid fa-check-circle"></i>
          <span>{config.status}</span>
        </div>
      </div>
    </div>
  );
}
