import React from "react";
import { useNavigate } from "react-router-dom";
import "./notfound.css";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="error-page-wrapper">
      <div className="error-page-container">
        {/* Decorative background illustration */}
        <div className="error-illustration">
          <div className="illustration-object">
            {/* You can add SVG illustration here if needed */}
          </div>
        </div>

        {/* 404 Numbers */}
        <div className="error-numbers">
          <div className="error-number-4-left">4</div>
          <div className="error-number-0">0</div>
          <div className="error-number-4-right">4</div>
        </div>

        {/* Error Content */}
        <div className="error-content">
          <h1 className="error-title">uh-oh! Page not found</h1>
          <p className="error-description">
            Sorry, the page you requested could not be found. Please go back to
            homepage and try again later
          </p>
          <button className="error-cta-button" onClick={handleGoHome}>
            <span>Start Learning</span>
          </button>
        </div>
      </div>
    </div>
  );
}