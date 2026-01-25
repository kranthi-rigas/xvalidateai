import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, fetchUserProfile } from "../../apiIntegration/auth.js";
import AwsButton from "@/components/common/AwsButton";
import { GoogleLoginButton } from "../commonComponents";
import useToast from "../../hooks/useToast";
import { GOOGLE_OAUTH_CONFIG } from "@/data/oauth";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const show = useToast();

  //Refresh helper
  useLayoutEffect(() => {
    // Reset browser scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reset auth containers
    document.querySelector(".main-content")?.scrollTo(0, 0);
    document.querySelector(".image-styles")?.scrollTo(0, 0);
    document.querySelector(".form-page__content")?.scrollTo(0, 0);
  }, []);

  //Refresh helper
  useLayoutEffect(() => {
    // Reset browser scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reset auth containers
    document.querySelector(".main-content")?.scrollTo(0, 0);
    document.querySelector(".image-styles")?.scrollTo(0, 0);
    document.querySelector(".form-page__content")?.scrollTo(0, 0);
  }, []);

  // 🔐 OAuth Configuration
  const generateState = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // 🔹 Google OAuth Handler (LOGIN)
  const handleGoogleLogin = () => {
    setLoading(true); // 👈 login uses setLoading

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

  // Handle Redirect After OAuth
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

  // Manual login (for username/password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(formData);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      const userData = await fetchUserProfile(res.access_token);
      localStorage.setItem("user_info", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login failed:", err.message);
      show(err.message || "Login failed. Please try again.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="form-page__content">
      <div className="container flex items-end">
        <div className="auth-form px-50 py-50 md:px-25 md:py-25 bg-white shadow-1">
          <h2 className="login-title text-center">Login</h2>

          {/* Manual Login Form */}
          <form
            className="contact-form respondForm__form row y-gap-20 pt-30"
            onSubmit={handleSubmit}
          >
            <div className="col-12">
              <label className="text-16 lh-1 fw-500 text-dark-1 mb-10 ">
                Email
              </label>
              <input
                required
                type="text"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="col-12">
              <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingRight: "40px" }}
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
            <div className="col-12">
              <AwsButton
                type="submit"
                label="Login"
                isLoading={loading}
                fullWidth
              />
            </div>
          </form>

          <div className="lh-12 text-dark-1 fw-500 text-center mt-20">
            Or sign in using
          </div>

          {/* Google OAuth Button */}
          <div className="d-flex justify-center pt-20">
            <GoogleLoginButton onClick={handleGoogleLogin} loading={loading} />
          </div>

          <div className="auth-footer">
            <Link
              to="/auth?mode=signup"
              className={`footer-links ${loading ? "disabled-link" : ""}`}
            >
              Sign up for free
            </Link>

            <Link
              to="/forgot-password"
              className={`footer-links ${loading ? "disabled-link" : ""}`}
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
