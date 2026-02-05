import React, { useEffect, useState } from "react";
import { COLORS } from "../../styles/colors";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../apiIntegration/auth";
import AwsButton from "../common/AwsButton";
import HeaderAuth from "../layout/headers/HeaderAuth";
import AuthFooter from "../../components/others/AuthFooter";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification link.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        const msg = typeof res === "string" ? res : res?.message || "";

        if (msg.toLowerCase().includes("already")) {
          setStatus("already_verified");
        } else {
          setStatus("success");
        }

        setTimeout(() => {
          navigate("/");
        }, 5000);
      })
      .catch((err) => {
        const msg = err?.message || "";

        if (msg.toLowerCase().includes("already")) {
          setStatus("already_verified");

          setTimeout(() => {
            navigate("/");
          }, 5000);
          return;
        }

        setStatus("error");
        setMessage(
          msg ||
            "This verification link has expired. Please request a new one.",
        );
      });
  }, [navigate, searchParams]);

  return (
    <>
      {/* ✅ Reusable Header */}
      <HeaderAuth />

      {/* ✅ Background */}
      <section className="auth-bg">
        {/* ✅ Glass Card */}
        <div className="email-form">
          {status === "loading" && (
            <>
              <div className="redirect-loader">
                <span className="spinner" />
                <h3 className="text-center mb-10">Verifying your email</h3>
                <p className="text-center">Please wait…</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <h3
                className="text-center mb-10"
                style={{ color: COLORS.success }}
              >
                Email verified successfully
              </h3>

              <p className="text-center mb-10">
                Your email address has been verified.
              </p>

              {/* 🔄 Loader */}
              <div className="redirect-loader">
                <span className="spinner" />
                <p className="redirect-text">Redirecting to login…</p>
              </div>

              <div
                className="text-center mt-15"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                <AwsButton label="Go to Login" onClick={() => navigate("/")} />
              </div>
            </>
          )}

          {status === "already_verified" && (
            <>
              <h3
                className="text-center mb-10"
                style={{ color: COLORS.primary }}
              >
                Email already verified
              </h3>

              <p className="text-center mb-10">
                Your email address has already been verified. You can log in
                directly.
              </p>

              <div className="redirect-loader">
                <span className="spinner" />
                <p className="redirect-text">Redirecting to login…</p>
              </div>

              <div
                className="text-center mt-15"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                <AwsButton label="Go to Login" onClick={() => navigate("/")} />
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <h3 className="text-center mb-10 error">
                Verification link expired
              </h3>

              <p className="auth-error-text">
                {message || "Invalid or expired token"}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
              >
                <AwsButton
                  label="Back to Login"
                  onClick={() => navigate("/")}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ✅ Reused Footer */}
      <AuthFooter />
    </>
  );
}
