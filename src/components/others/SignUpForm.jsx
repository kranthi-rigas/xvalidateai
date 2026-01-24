import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signup } from "../../apiIntegration/auth";
import { useCountryPhone } from "../../data/useCountryPhone";
import CountrySelect from "../common/CountrySelect";
import PhoneInput from "../common/PhoneInput";
import AwsButton from "@/components/common/AwsButton";
import { GoogleLoginButton } from "../commonComponents";
import useToast from "../../hooks/useToast";
import { GOOGLE_OAUTH_CONFIG } from "@/data/oauth";

export default function SignUpForm() {
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get("email");

  console.log("✅ invitedEmail:", invitedEmail);

  const [emailLocked, setEmailLocked] = useState(false);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  //country dropdown helper
  const {
    countries,
    selectedCountry,
    phone,
    phoneCode,
    setPhone,
    onCountryChange,
    validatePhone,
  } = useCountryPhone();

  const onPhoneChange = (e) => {
    setError("");
    const value = e.target.value.replace(/\D/g, "");

    // India → max 10 digits
    if (selectedCountry?.label === "India" && value.length > 10) return;

    // Other countries → max 15 digits
    if (value.length > 15) return;

    setPhone(value);
  };

  // Check if passwords match
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;
  const passwordsMismatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password !== formData.confirmPassword;

  // Manual Signup form handler
  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //Refresh helper
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document.querySelector(".main-content")?.scrollTo(0, 0);
    document.querySelector(".image-styles")?.scrollTo(0, 0);
    document.querySelector(".form-page__content")?.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const show = useToast();

  //Prefill email for invitation user
  useEffect(() => {
    if (invitedEmail && isValidEmail(invitedEmail)) {
      setFormData((prev) => ({
        ...prev,
        email: decodeURIComponent(invitedEmail),
      }));
      setEmailLocked(true);
    }
  }, [invitedEmail]);

  // 🔐 OAuth Configuration

  // Generate random state (for CSRF protection)
  const generateState = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // 🔹 Google OAuth Handler
  const handleGoogleSignup = () => {
    setIsLoading(true);
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

  // 🔹 Handle Redirect After OAuth
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");
    const state = params.get("state");

    if (accessToken && idToken) {
      const savedState = sessionStorage.getItem("oauth_state");
      if (state === savedState) {
        // Decode ID Token (JWT) to get user info
        const userInfo = decodeJWT(idToken);
        console.log("✅ Google user info:", userInfo);
        localStorage.setItem("user_info", JSON.stringify(userInfo));
        navigate("/dashboard");
      } else {
        console.error("❌ Invalid OAuth state");
      }
    }
  }, [navigate]);

  // Decode JWT token (client-side only for displaying)
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

  // Manual Signup form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Phone validation
    const phoneError = validatePhone();
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        phone: `${phoneCode}${phone}`,
        country: selectedCountry?.label,
      });

      setMessage("✅ Account created! Check your email.");
      show("Account created! Check your email.", { type: "success" });

      setTimeout(() => {
        navigate("/auth?mode=login");
      }, 2000);
    } catch (err) {
      show(err.message || "Signup failed", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page__content">
      <div className="container flex items-end">
        <div className="row justify-end items-center">
          <div className="col-xl-8 col-lg-9 px-20 py-20">
            <div className="sign-up auth-card px-50 py-50 md:px-25 md:py-25 bg-white shadow-1 rounded-16">
              <h2 className="signup-text lh-13 text-center">Sign Up</h2>

              {/* Regular Signup Form */}
              <form
                className="contact-form respondForm__form row y-gap-20 pt-30"
                onSubmit={handleSubmit}
              >
                <div className="col-lg-6">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    First Name *
                  </label>
                  <input
                    required
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-lg-6">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    Last Name *
                  </label>
                  <input
                    required
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-lg-6">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    Email Address *
                  </label>

                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    readOnly={emailLocked}
                    onChange={(e) => {
                      if (emailLocked) return; // 🔐 block manual edits
                      handleChange(e);
                    }}
                    style={{
                      backgroundColor: emailLocked ? "#F3F4F6" : "#FFFFFF",
                      cursor: emailLocked ? "not-allowed" : "text",
                    }}
                  />

                  {emailLocked && (
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                      Email prefilled from invitation
                    </p>
                  )}
                </div>

                <div className="col-lg-6">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-view"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                <div className="col-lg-6">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    Confirm Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={{
                        borderColor: passwordsMismatch
                          ? "#dc3545"
                          : passwordsMatch
                            ? "#28a745"
                            : "",
                      }}
                    />
                    {/* Tick mark when passwords match */}
                    {passwordsMatch && (
                      <span className="password-match" title="Passwords match">
                        ✓
                      </span>
                    )}
                    {/* X mark when passwords don't match */}
                    {passwordsMismatch && (
                      <span
                        className="password-miss-match"
                        title="Passwords don't match"
                      >
                        ✕
                      </span>
                    )}
                  </div>
                  {passwordsMismatch && (
                    <p
                      style={{
                        color: "#dc3545",
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      Passwords do not match
                    </p>
                  )}
                </div>

                <div className="col-lg-6">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    Country *
                  </label>

                  <CountrySelect
                    countries={countries}
                    value={selectedCountry}
                    onChange={onCountryChange}
                  />
                </div>

                {/* ✅ PHONE — FULL WIDTH */}
                <div className="col-12">
                  <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                    Phone Number *
                  </label>

                  <PhoneInput
                    phone={phone}
                    phoneCode={phoneCode}
                    onChange={onPhoneChange}
                    error={error}
                  />
                </div>

                <div className="col-12">
                  <AwsButton
                    type="submit"
                    label="Register"
                    isLoading={loading}
                    fullWidth
                  />
                </div>
              </form>
              <div className="col-12">
                <p className="text-13 text-center mt-10 lh-14 text-dark-1">
                  By creating an account, you agree to our{" "}
                  <a
                    href="https://myacademy51.com/terms-of-use/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`footer-links ${loading ? "disabled-link" : ""}`}
                  >
                    Terms of Use
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://myacademy51.com/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`footer-links ${loading ? "disabled-link" : ""}`}
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <p className="text-13 text-center mt-10 lh-14 text-dark-1">
                Already have an account?{" "}
                <Link
                  to="/auth?mode=login"
                  className={`footer-links ${loading ? "disabled-link" : ""}`}
                >
                  Log in
                </Link>
              </p>

              {message && (
                <p className="text-center mt-20 fw-500 text-dark-1">
                  {message}
                </p>
              )}

              <div className="lh-12 text-dark-1 fw-500 text-center mt-20">
                Or sign in using
              </div>
              <div className="d-flex justify-center pt-20">
                <GoogleLoginButton
                  onClick={handleGoogleSignup}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
