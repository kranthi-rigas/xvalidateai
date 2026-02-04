import React from "react";

export default function AuthSecurityBadges() {
  const badges = [
    { icon: "fa-shield-check", text: "SOC 2 Certified" },
    { icon: "fa-lock", text: "256-bit Encryption" },
    { icon: "fa-check-double", text: "GDPR Compliant" },
  ];

  return (
    <div className="auth-security-badges">
      {badges.map((badge, index) => (
        <div key={index} className="auth-security-badge">
          <i className={`fa-solid ${badge.icon}`}></i>
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
