import React from "react";

/**
 * SocialLoginButtons - Google and Microsoft OAuth buttons
 * @param {function} onGoogleClick - Google login handler
 * @param {function} onMicrosoftClick - Microsoft login handler (optional)
 * @param {boolean} loading - Whether buttons should be disabled
 */
export default function SocialLoginButtons({
  onGoogleClick,
  onMicrosoftClick,
  loading = false,
}) {
  return (
    <>
      {/* Divider */}
      <div className="auth-divider">
        <div className="auth-divider-line"></div>
        <div className="auth-divider-text">
          <span>Or continue with</span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="auth-social-buttons">
        <button
          type="button"
          onClick={onGoogleClick}
          disabled={loading}
          className="auth-social-btn auth-social-btn--google"
        >
          <i className="fa-brands fa-google"></i>
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={onMicrosoftClick}
          disabled={loading}
          className="auth-social-btn auth-social-btn--microsoft"
        >
          <i className="fa-brands fa-microsoft"></i>
          <span>Microsoft</span>
        </button>
      </div>
    </>
  );
}
