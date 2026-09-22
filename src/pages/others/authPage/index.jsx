import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login, signup, fetchUserProfile } from "@/apiIntegration/auth.js";
import useToast from "@/hooks/useToast";
import { GOOGLE_OAUTH_CONFIG } from "@/data/oauth";
import { useCountryPhone } from "@/data/useCountryPhone";
import MetaComponent from "@/components/common/MetaComponent";
import CountrySelect from "@/components/common/CountrySelect";
import AwsButton from "@/components/common/AwsButton";
import PasswordStrength from "@/components/common/PasswordStrength";
import {
  getPasswordChecks,
  describeMissingRules,
  confirmationClass,
} from "@/utils/password";
import { useContextElement } from "@/context/Context";

// Auth Components
import AuthHeader from "@/components/others/AuthHeader";
import AuthFooter from "@/components/others/AuthFooter";
import AuthHeroSection from "@/components/others/AuthHeroSection";
import AuthFormInput from "@/components/others/AuthFormInput";
import SocialLoginButtons from "@/components/others/SocialLoginButtons";

// CSS is loaded via public/assets/css/dashboard-styles/AuthPages.css

export default function AuthPage() {
  const [emailLocked, setEmailLocked] = useState(false);
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get("email");
  const mode = searchParams.get("mode") || "login";
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    confirm_password: "",
    country: "",
    phone: "",
  });
  const navigate = useNavigate();
  const show = useToast();
  const { loadUserPlanFromStorage } = useContextElement();

  // Live confirmation feedback — waiting until submit to say "they don't match"
  // makes people retype both fields. Same helper on all three password forms.
  const confirmClass = confirmationClass(
    formData.password,
    formData.confirm_password,
  );

  // Country and phone hook for signup
  const {
    countries,
    selectedCountry,
    phone,
    phoneCode,
    setPhone,
    onCountryChange,
    validatePhone,
  } = useCountryPhone();

  const metadata = {
    title: mode === "login" ? "Login - XVALIDATEAI" : "Sign up - XVALIDATEAI",
    description: "XVALIDATEAI authentication page",
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  //Prefill email for invitation user
  useEffect(() => {
    if (invitedEmail && isValidEmail(invitedEmail)) {
      setFormData((prev) => ({
        ...prev,
        email: invitedEmail,
      }));
      setEmailLocked(true);
    }
  }, [invitedEmail]);

  // ⭐ SCROLL TO TOP - Watch mode changes
  useLayoutEffect(() => {
    const scrollToTop = () => {
      // Scroll main window
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Scroll all potential containers
      const selectors = [
        ".auth-page",
        ".auth-main",
        ".auth-form-section",
        ".auth-form-container",
        "main",
        "#root",
      ];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        });
      });
    };

    // Execute immediately
    scrollToTop();

    // Execute after render
    const timeouts = [
      setTimeout(scrollToTop, 0),
      setTimeout(scrollToTop, 10),
      setTimeout(scrollToTop, 50),
      setTimeout(scrollToTop, 100),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [mode]);

  // Error mapper helper
  const getLoginErrorMessage = (err) => {
    const status = err?.status;
    if (status === 401) {
      return "The email or password you entered is incorrect. Please try again.";
    }
    if (status === 403) {
      return "Please verify your email before logging in.";
    }
    if (status >= 500) {
      return "We're having trouble signing you in right now. Please try again later.";
    }
    if (!status) {
      return "Unable to connect. Please check your internet connection.";
    }
    return "Login failed. Please try again.";
  };

  // OAuth Configuration
  const generateState = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Google OAuth Handler
  const handleGoogleLogin = () => {
    setLoading(true);
    const state = generateState();
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_CONFIG.REDIRECT_URI,
      response_type: GOOGLE_OAUTH_CONFIG.RESPONSE_TYPE,
      scope: GOOGLE_OAUTH_CONFIG.SCOPE,
      state,
      include_granted_scopes: "true",
      prompt: "select_account",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Handle OAuth Redirect
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");
    const state = params.get("state");

    if (accessToken && idToken) {
      const savedState = sessionStorage.getItem("oauth_state");
      if (state === savedState) {
        const userInfo = decodeJWT(idToken);
        localStorage.setItem("user_info", JSON.stringify(userInfo));

        // Update Context state with new user's plan
        loadUserPlanFromStorage();

        navigate("/dashboard");
      } else {
        console.error("❌ Invalid OAuth state");
      }
    }
  }, [navigate, loadUserPlanFromStorage]);

  // Decode JWT token
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding JWT:", e);
      return null;
    }
  };

  // Manual login/signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        // Validate passwords match
        if (formData.password !== formData.confirm_password) {
          show("Passwords do not match", { type: "error", duration: 4000 });
          setLoading(false);
          return;
        }

        // Validate password strength — the same rules the checklist under the
        // field shows while typing.
        if (!getPasswordChecks(formData.password).requiredMet) {
          show(describeMissingRules(formData.password), {
            type: "error",
            duration: 4000,
          });
          setLoading(false);
          return;
        }

        // Validate phone number
        const phoneError = validatePhone();
        if (phoneError) {
          show(phoneError, { type: "error", duration: 4000 });
          setLoading(false);
          return;
        }

        // Sign up
        const signupData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          country: selectedCountry?.label || "",
          phone: phone,
        };

        await signup(signupData);
        show(
          "Account created successfully! Please check your email to verify your account.",
          { type: "success", duration: 6000 },
        );

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/auth?mode=login");
        }, 2000);
      } else {
        // Login
        const res = await login({
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        const userData = await fetchUserProfile(res.access_token);
        localStorage.setItem("user_info", JSON.stringify(userData));

        // Update Context state with new user's plan
        loadUserPlanFromStorage();

        navigate("/dashboard");
      }
    } catch (err) {
      console.error(
        `❌ ${mode === "signup" ? "Signup" : "Login"} failed:`,
        err,
      );
      const message =
        mode === "signup"
          ? err.message || "Sign up failed. Please try again."
          : getLoginErrorMessage(err);
      show(message, { type: "error", duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <MetaComponent meta={metadata} />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="auth-page auth-page-container" data-mode={mode}>
        {/* Header */}
        <AuthHeader />

        {/* Main Content - 2 Column Layout */}
        <main className="auth-main auth-main-2col">
          {/* Background Elements */}
          <div className="auth-bg-gradient"></div>
          <div className="auth-bg-orb auth-bg-orb--1"></div>
          <div className="auth-bg-orb auth-bg-orb--2"></div>

          {/* Left Column - Hero Section */}
          <AuthHeroSection mode={mode} />

          {/* Right Column - Form Section */}
          <section className="auth-form-section">
            <div className="auth-form-container">
              {/* Login Card */}
              <div className="auth-login-card glass-card">
                {/* Form Header */}
                <div className="auth-form-header">
                  <h2 className="auth-form-title">
                    {mode === "signup" ? "Create Account" : "Welcome Back"}
                  </h2>
                  <p className="auth-form-subtitle">
                    {mode === "signup"
                      ? "Sign up to start your compliance journey"
                      : "Secure access to your compliance dashboard"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                  {/* Signup Only Fields */}
                  {mode === "signup" && (
                    <>
                      {/* Name Fields - Side by Side */}
                      <div className="auth-form-row">
                        <AuthFormInput
                          id="first_name"
                          name="first_name"
                          type="text"
                          label="First Name"
                          placeholder="First Name"
                          value={formData.first_name}
                          onChange={handleChange}
                          icon="fa-user"
                        />
                        <AuthFormInput
                          id="last_name"
                          name="last_name"
                          type="text"
                          label="Last Name"
                          placeholder="Last Name"
                          value={formData.last_name}
                          onChange={handleChange}
                          icon="fa-user"
                        />
                      </div>
                    </>
                  )}

                  {/* Email Field */}
                  <AuthFormInput
                    id="email"
                    name="email"
                    type="email"
                    label="Work Email"
                    placeholder="name@company.com"
                    value={formData.email}
                    readOnly={emailLocked}
                    onChange={(e) => {
                      if (emailLocked) return; // 🔐 block manual edits
                      handleChange(e);
                    }}
                    icon="fa-envelope"
                  />

                  {/* Password Fields - Side by Side for Signup */}
                  {mode === "signup" ? (
                    <div className="auth-form-row">
                      <AuthFormInput
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        icon="fa-key"
                        className={confirmClass}
                      >
                        <PasswordStrength
                          password={formData.password}
                          show={passwordFocused}
                        />
                      </AuthFormInput>
                      <AuthFormInput
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        label="Confirm Password"
                        placeholder="••••••••"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        icon="fa-lock"
                        className={confirmClass}
                      />
                    </div>
                  ) : (
                    <AuthFormInput
                      id="password"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      icon="fa-key"
                    />
                  )}

                  {/* Country & Phone - Separate Fields (Signup Only) */}
                  {mode === "signup" && (
                    <>
                      {/* Country Selection */}
                      <div className="auth-input-group">
                        <label className="auth-input-label">Country</label>
                        <div className="auth-input-wrapper">
                          <CountrySelect
                            countries={countries}
                            value={selectedCountry}
                            onChange={onCountryChange}
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="auth-input-group">
                        <label className="auth-input-label">Phone Number</label>
                        <div className="auth-phone-group">
                          <div className="auth-country-code">
                            {phoneCode || "+--"}
                          </div>
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              setPhone(value);
                            }}
                            className="auth-input auth-phone-input"
                            style={{ paddingLeft: "1rem" }}
                            disabled={!selectedCountry}
                          />
                        </div>
                      </div>
                    </>
                  )}


                  {/* Forgot Password (Login Only) */}
                  {mode === "login" && (
                    <div className="auth-form-options">
                      <div></div>
                      <Link
                        to="/forgot-password"
                        className="auth-forgot-password"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}


                  {/* Submit Button */}
                  <AwsButton
                    type="submit"
                    disabled={loading}
                    size="lg"
                    loading={loading}
                    label={
                      loading
                        ? mode === "signup"
                          ? "Creating Account..."
                          : "Signing In..."
                        : mode === "signup"
                          ? "Create Account"
                          : "Sign In"
                    }
                    variant="primary"
                  >
                    {!loading && (
                      <i className="fa-solid fa-arrow-right"></i>
                    )}
                  </AwsButton>

                  {/* Terms Agreement (Signup Only) */}
                  {mode === "signup" && (
                    <div className="auth-terms-agreement">
                      <p>
                        By creating an account, you agree to our
                        <br />
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`auth-switch-link ${loading ? "disabled-link" : ""}`}
                        >
                          Terms&nbsp;of&nbsp;Service&nbsp;
                        </a>
                        {"  "}and{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`auth-switch-link ${loading ? "disabled-link" : ""}`}
                        >
                          &nbsp;Privacy&nbsp;Policy
                        </a>
                        .
                      </p>
                    </div>
                  )}

                  {/* Social Login Buttons */}
                  <SocialLoginButtons
                    onGoogleClick={handleGoogleLogin}
                    loading={loading}
                  />

                  {/* Switch Mode Link */}
                  <div className="auth-switch-mode">
                    <p>
                      {mode === "signup" ? (
                        <>
                          Already have an account?{" "}
                          <Link
                            to="/auth?mode=login"
                            className="auth-switch-link"
                          >
                            Sign in
                          </Link>
                        </>
                      ) : (
                        <>
                          Don't have an account?{" "}
                          <Link
                            to="/auth?mode=signup"
                            className="auth-switch-link"
                          >
                            Sign up
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <AuthFooter />
      </div>
    </>
  );
}
