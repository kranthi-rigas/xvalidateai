import React from "react";

/**
 * AuthHeroSection - Left column hero content for auth pages
 * Displays headline, description, stats grid, and certification badges
 * @param {string} mode - "login" or "signup" to display appropriate content
 */
export default function AuthHeroSection({ mode = "login" }) {
  const isSignup = mode === "signup";

  return (
    <section className="auth-hero">
      <div className="auth-hero-content">
        {/* Badge */}
        <span className="auth-hero-badge">
          Enterprise Grade Compliance
        </span>

        {/* Headline */}
        <h1 className="auth-hero-title">
          {isSignup ? (
            <>
              Transform Technology Uncertainty <br />
              <span className="auth-gradient-text">into Organizational Confidence</span>
            </>
          ) : (
            <>
              Compliance, <br />
              <span className="auth-gradient-text">Verified</span>
            </>
          )}
        </h1>

        {/* Description */}
        <p className="auth-hero-description">
          {isSignup
            ? "Join forward-thinking organizations that assess, validate, and deploy technology tools with complete compliance assurance."
            : "Access your compliance assessments and make data-informed decisions about technology adoption."}
        </p>

        {/* Value Propositions / Stats Grid */}
        {isSignup ? (
          <div className="auth-hero-value-props">
            <div className="auth-hero-value-prop glass">
              <div className="auth-hero-value-icon">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <div className="auth-hero-value-title">Comprehensive Assessment</div>
              <div className="auth-hero-value-desc">
                Evaluate technology tools across governance, privacy, operational impact, usability, and data quality
              </div>
            </div>
            <div className="auth-hero-value-prop glass">
              <div className="auth-hero-value-icon">
                <i className="fa-solid fa-lightbulb"></i>
              </div>
              <div className="auth-hero-value-title">Actionable Insights</div>
              <div className="auth-hero-value-desc">
                Receive detailed compliance reports with clear recommendations and usage guidelines
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}
