import React, { useState } from "react";
import { COLORS } from "../../styles/colors";
import HeaderAuth from "../layout/headers/HeaderAuth";
import AwsButton from "../common/AwsButton";
import { forgotPassword } from "../../apiIntegration/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent | error
  const [error, setError] = useState("");

  // ✅ Email validation regex
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const emailIsValid = isValidEmail(email);

  const submit = async () => {
    if (!emailIsValid) return;

    try {
      setStatus("loading");
      setError("");
      await forgotPassword({ email });
      setStatus("sent");
    } catch (err) {
      setError(err.message || "Unable to send reset link");
      setStatus("error");
    }
  };

  return (
    <>
      <HeaderAuth />

      <section className="auth-bg">
        <div className="email-form">
          {status === "idle" && (
            <>
              <h3 className="text-center mb-8">Forgot Password</h3>

              <p className="text-center auth-subtext mb-24">
                Enter the email address associated with your account and we’ll
                send you a secure link to reset your password.
              </p>

              <div className="form-group">
                <label className="form-label">Email</label>

                <input
                  type="email"
                  className={`email-input ${
                    email && !emailIsValid ? "input-error" : ""
                  }`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />

                {/* 🔴 Inline validation message */}
                {email && !emailIsValid && (
                  <p className="auth-error-text mt-8">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div
                className="text-center mt-24"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                <AwsButton
                  label="Send Reset Link"
                  onClick={submit}
                  disabled={!emailIsValid || status === "loading"}
                />
              </div>
            </>
          )}

          {status === "loading" && (
            <div className="redirect-loader">
              <span className="spinner" />
              <p className="text-center mt-8">Sending reset link…</p>
            </div>
          )}

          {status === "sent" && (
            <>
              <h3 className="text-center mb-10 text-success">
                Check your inbox
              </h3>
              <p className="text-center auth-subtext">
                If an account exists for this email, a password reset link has
                been sent.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h3 className="text-center mb-10 error">Something went wrong</h3>
              <p className="auth-error-text text-center">{error}</p>
            </>
          )}
        </div>
      </section>
      {/* ✅ REUSED FOOTER */}
      <div
        className="py-30 border-top-light-15"
        style={{ backgroundColor: COLORS.bgDark }}
      >
        <div className="row justify-center items-center text-center y-gap-20">
          <div className="col-auto">
            <div className="d-flex items-center h-100 text-white">
              MyAcademy 51 © {new Date().getFullYear()}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
