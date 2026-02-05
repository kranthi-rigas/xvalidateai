import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import HeaderAuth from "../layout/headers/HeaderAuth";
import AwsButton from "../common/AwsButton";
import { resetPassword } from "../../apiIntegration/auth";
import { FiEye, FiEyeOff } from "react-icons/fi";
import AuthFooter from "../../components/others/AuthFooter";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* 🔐 Real-time validation */
  const validatePasswords = (pwd, confirmPwd) => {
    if (!pwd || !confirmPwd) {
      setPasswordError("");
      return false;
    }

    if (pwd !== confirmPwd) {
      setPasswordError("Passwords do not match");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePasswords(value, confirm);
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirm(value);
    validatePasswords(password, value);
  };

  const submit = async () => {
    if (!password || !confirm) {
      setPasswordError("Please enter and confirm your password");
      return;
    }

    if (password !== confirm) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setStatus("loading");
      await resetPassword({ token, new_password: password });
      setStatus("success");
      setTimeout(() => navigate("/"), 5000);
    } catch (err) {
      setError(err.message || "Unable to reset password");
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
              <h3 className="text-center mb-8">Reset Password</h3>

              <p className="text-center auth-subtext mb-24">
                Choose a strong password to secure your account.
              </p>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="email-input"
                    placeholder="Enter new password"
                    value={password}
                    onChange={handlePasswordChange}
                  />

                  <span
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#6B7280",
                    }}
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group mt-16">
                <label className="form-label">Confirm Password</label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="email-input"
                    placeholder="Re-enter new password"
                    value={confirm}
                    onChange={handleConfirmChange}
                  />

                  <span
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#6B7280",
                    }}
                  >
                    {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </span>
                </div>
              </div>

              {/* Password mismatch error */}
              {passwordError && (
                <p className="auth-error-text text-center mt-12">
                  {passwordError}
                </p>
              )}

              <div
                className="text-center mt-24"
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <AwsButton
                  label="Reset Password"
                  onClick={submit}
                  disabled={!password || !confirm || password !== confirm}
                />
              </div>
            </>
          )}

          {status === "loading" && (
            <div className="redirect-loader">
              <span className="spinner" />
              <p className="text-center mt-8">Updating password…</p>
            </div>
          )}

          {status === "success" && (
            <>
              <h3 className="text-center text-success mb-10">
                Password updated successfully
              </h3>

              <div className="redirect-loader">
                <span className="spinner" />
                <p className="redirect-text">Redirecting to login…</p>
              </div>

              <div
                className="text-center mt-20"
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <AwsButton label="Go to Login" onClick={() => navigate("/")} />
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <h3 className="text-center mb-10 error">Reset failed</h3>
              <p className="auth-error-text text-center">{error}</p>
            </>
          )}
        </div>
      </section>
      {/* ✅ REUSED FOOTER */}
      <AuthFooter />
    </>
  );
}
