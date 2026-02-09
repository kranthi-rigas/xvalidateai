import React from "react";

/**
 * AuthHeroSection - Left column hero content for auth pages
 * Displays headline, description, stats grid, and certification badges
 */
export default function AuthHeroSection() {
  return (
    <section className="auth-hero">
      <div className="auth-hero-content">
        {/* Badge */}
        <span className="auth-hero-badge">
          Enterprise Grade Compliance
        </span>

        {/* Headline */}
        <h1 className="auth-hero-title">
          Automate Risk <br />
          <span className="auth-gradient-text">with Precision.</span>
        </h1>

        {/* Description */}
        <p className="auth-hero-description">
          The next generation of AI-powered validation for complex regulatory
          environments. Monitor, analyze, and certify your enterprise
          infrastructure in real-time.
        </p>

        {/* Stats Grid */}
        <div className="auth-hero-stats">
          <div className="auth-hero-stat glass">
            <div className="auth-hero-stat-value">99.9%</div>
            <div className="auth-hero-stat-label">Accuracy Rate</div>
          </div>
          <div className="auth-hero-stat glass">
            <div className="auth-hero-stat-value">24/7</div>
            <div className="auth-hero-stat-label">Active Monitoring</div>
          </div>
        </div>

        {/* Certification Badges */}
        <div className="auth-hero-certifications glass">
          <div className="auth-hero-cert">
            <i className="fa-solid fa-certificate"></i>
            <span>SOC2 Type II</span>
          </div>
          <div className="auth-hero-cert">
            <i className="fa-solid fa-lock"></i>
            <span>ISO 27001</span>
          </div>
          <div className="auth-hero-cert">
            <i className="fa-solid fa-shield-check"></i>
            <span>GDPR Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
